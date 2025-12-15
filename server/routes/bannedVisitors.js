const express = require('express');
const { body, validationResult } = require('express-validator');
const BannedVisitor = require('../models/BannedVisitor');
const Activity = require('../models/Activity');
const ActivityAlert = require('../models/ActivityAlert');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/banned-visitors
// @desc    Get banned visitors for a site
// @access  Private (Admin, Site Manager)
router.get('/', auth, authorize('admin', 'site_manager'), async (req, res) => {
  try {
    const { siteId, page = 1, limit = 10, search } = req.query;
    const user = req.user;

    // Determine site ID
    const targetSiteId = siteId || user.assignedSite;
    if (!targetSiteId) {
      return res.status(400).json({ message: 'Site ID is required' });
    }

    // Build query
    const query = { site: targetSiteId, isActive: true };
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get banned visitors with pagination
    const bannedVisitors = await BannedVisitor.find(query)
      .populate('bannedBy', 'fullName email')
      .populate('reviewedBy', 'fullName email')
      .sort({ bannedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BannedVisitor.countDocuments(query);

    res.json({
      bannedVisitors,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get banned visitors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/banned-visitors
// @desc    Add visitor to banned list
// @access  Private (Admin, Site Manager)
router.post('/', auth, authorize('admin', 'site_manager'), [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('reason').notEmpty().withMessage('Ban reason is required'),
  body('site').isMongoId().withMessage('Valid site ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      fullName,
      email,
      phone,
      company,
      reason,
      description,
      site,
      incidentReport,
      evidence
    } = req.body;

    // Check if visitor is already banned
    const existingBan = await BannedVisitor.findOne({
      $or: [
        { fullName: { $regex: fullName, $options: 'i' } },
        { email: email }
      ],
      site,
      isActive: true
    });

    if (existingBan) {
      return res.status(400).json({ message: 'Visitor is already banned' });
    }

    const bannedVisitor = new BannedVisitor({
      fullName,
      email,
      phone,
      company,
      reason,
      description,
      site,
      bannedBy: req.user._id,
      incidentReport,
      evidence
    });

    await bannedVisitor.save();

    await bannedVisitor.populate('bannedBy', 'fullName email');

    // Create activity record for banned visitor
    try {
      const activity = new Activity({
        type: 'security_alert',
        title: 'Visitor Banned',
        description: `${fullName} from ${company || 'Unknown Company'} has been added to the banned list. Reason: ${reason}`,
        site: site,
        performedBy: req.user._id,
        metadata: {
          visitorName: fullName,
          visitorCompany: company,
          banReason: reason,
          banDescription: description
        },
        priority: 'high'
      });
      await activity.save();

      // Create alert for all users at the site
      await ActivityAlert.createSystemAlert(
        'Visitor Banned',
        `${fullName} from ${company || 'Unknown Company'} has been banned. Reason: ${reason}`,
        site,
        'warning',
        ['admin', 'site_manager', 'security_guard', 'receptionist']
      );
    } catch (activityError) {
      console.error('Error creating banned visitor activity:', activityError);
    }

    // Emit realtime update for reports
    try {
      const io = req.app.get('io');
      if (io) {
        const siteId = bannedVisitor.site ? bannedVisitor.site.toString() : site;
        io.emit('banned_changed', { action: 'created', siteId, bannedVisitorId: bannedVisitor._id.toString() });
        if (siteId) {
          io.to(`site_${siteId}`).emit('banned_changed', { action: 'created', siteId, bannedVisitorId: bannedVisitor._id.toString() });
          io.to(`site_${siteId}`).emit('reports_refresh', { siteId, reason: 'banned_created' });
        }
      }
    } catch (e) {
      console.error('Realtime emit error (banned created):', e);
    }

    res.status(201).json({
      message: 'Visitor added to banned list successfully',
      bannedVisitor
    });
  } catch (error) {
    console.error('Add banned visitor error:', error);
    res.status(500).json({ message: 'Server error during ban creation' });
  }
});

// @route   GET /api/banned-visitors/:id
// @desc    Get banned visitor details
// @access  Private (Admin, Site Manager)
router.get('/:id', auth, authorize('admin', 'site_manager'), async (req, res) => {
  try {
    const bannedVisitor = await BannedVisitor.findById(req.params.id)
      .populate('bannedBy', 'fullName email')
      .populate('reviewedBy', 'fullName email')
      .populate('site', 'name address');

    if (!bannedVisitor) {
      return res.status(404).json({ message: 'Banned visitor not found' });
    }

    res.json({ bannedVisitor });
  } catch (error) {
    console.error('Get banned visitor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/banned-visitors/:id
// @desc    Update banned visitor
// @access  Private (Admin, Site Manager)
router.put('/:id', auth, authorize('admin', 'site_manager'), [
  body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('reason').optional().notEmpty().withMessage('Reason cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bannedVisitor = await BannedVisitor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('bannedBy', 'fullName email')
    .populate('reviewedBy', 'fullName email');

    if (!bannedVisitor) {
      return res.status(404).json({ message: 'Banned visitor not found' });
    }

    // Emit realtime update for reports
    try {
      const io = req.app.get('io');
      if (io) {
        const siteId = bannedVisitor.site ? bannedVisitor.site.toString() : undefined;
        io.emit('banned_changed', { action: 'updated', siteId, bannedVisitorId: bannedVisitor._id.toString() });
        if (siteId) {
          io.to(`site_${siteId}`).emit('banned_changed', { action: 'updated', siteId, bannedVisitorId: bannedVisitor._id.toString() });
          io.to(`site_${siteId}`).emit('reports_refresh', { siteId, reason: 'banned_updated' });
        }
      }
    } catch (e) {
      console.error('Realtime emit error (banned updated):', e);
    }

    res.json({
      message: 'Banned visitor updated successfully',
      bannedVisitor
    });
  } catch (error) {
    console.error('Update banned visitor error:', error);
    res.status(500).json({ message: 'Server error during update' });
  }
});

// @route   DELETE /api/banned-visitors/:id
// @desc    Remove visitor from banned list
// @access  Private (Admin, Site Manager)
router.delete('/:id', auth, authorize('admin', 'site_manager'), async (req, res) => {
  try {
    const bannedVisitor = await BannedVisitor.findById(req.params.id);
    if (!bannedVisitor) {
      return res.status(404).json({ message: 'Banned visitor not found' });
    }

    // Soft delete by setting isActive to false
    bannedVisitor.isActive = false;
    await bannedVisitor.save();

    // Emit realtime update for reports
    try {
      const io = req.app.get('io');
      if (io) {
        const siteId = bannedVisitor.site ? bannedVisitor.site.toString() : undefined;
        io.emit('banned_changed', { action: 'removed', siteId, bannedVisitorId: bannedVisitor._id.toString() });
        if (siteId) {
          io.to(`site_${siteId}`).emit('banned_changed', { action: 'removed', siteId, bannedVisitorId: bannedVisitor._id.toString() });
          io.to(`site_${siteId}`).emit('reports_refresh', { siteId, reason: 'banned_removed' });
        }
      }
    } catch (e) {
      console.error('Realtime emit error (banned removed):', e);
    }

    res.json({ message: 'Visitor removed from banned list successfully' });
  } catch (error) {
    console.error('Remove banned visitor error:', error);
    res.status(500).json({ message: 'Server error during removal' });
  }
});

// @route   POST /api/banned-visitors/:id/review
// @desc    Review banned visitor
// @access  Private (Admin, Site Manager)
router.post('/:id/review', auth, authorize('admin', 'site_manager'), [
  body('reviewNotes').notEmpty().withMessage('Review notes are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reviewNotes } = req.body;

    const bannedVisitor = await BannedVisitor.findByIdAndUpdate(
      req.params.id,
      {
        reviewDate: new Date(),
        reviewedBy: req.user._id,
        reviewNotes
      },
      { new: true, runValidators: true }
    )
    .populate('reviewedBy', 'fullName email');

    if (!bannedVisitor) {
      return res.status(404).json({ message: 'Banned visitor not found' });
    }

    // Emit realtime update for reports
    try {
      const io = req.app.get('io');
      if (io) {
        const siteId = bannedVisitor.site ? bannedVisitor.site.toString() : undefined;
        io.emit('banned_changed', { action: 'reviewed', siteId, bannedVisitorId: bannedVisitor._id.toString() });
        if (siteId) {
          io.to(`site_${siteId}`).emit('banned_changed', { action: 'reviewed', siteId, bannedVisitorId: bannedVisitor._id.toString() });
          io.to(`site_${siteId}`).emit('reports_refresh', { siteId, reason: 'banned_reviewed' });
        }
      }
    } catch (e) {
      console.error('Realtime emit error (banned reviewed):', e);
    }

    res.json({
      message: 'Banned visitor reviewed successfully',
      bannedVisitor
    });
  } catch (error) {
    console.error('Review banned visitor error:', error);
    res.status(500).json({ message: 'Server error during review' });
  }
});

// @route   GET /api/banned-visitors/stats/dashboard
// @desc    Get banned visitor statistics
// @access  Private (Admin, Site Manager)
router.get('/stats/dashboard', auth, authorize('admin', 'site_manager'), async (req, res) => {
  try {
    const { siteId } = req.query;
    const user = req.user;
    const targetSiteId = siteId || user.assignedSite;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalBanned,
      bansThisMonth,
      pendingReview,
      uniqueReasons
    ] = await Promise.all([
      BannedVisitor.countDocuments({ site: targetSiteId, isActive: true }),
      BannedVisitor.countDocuments({ 
        site: targetSiteId, 
        bannedDate: { $gte: thisMonth },
        isActive: true 
      }),
      BannedVisitor.countDocuments({ 
        site: targetSiteId, 
        reviewDate: { $exists: false },
        isActive: true 
      }),
      BannedVisitor.distinct('reason', { site: targetSiteId, isActive: true })
    ]);

    res.json({
      totalBanned,
      bansThisMonth,
      pendingReview,
      uniqueReasons: uniqueReasons.length
    });
  } catch (error) {
    console.error('Get banned visitor stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

