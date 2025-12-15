const express = require('express');
const { body, validationResult } = require('express-validator');
const Incident = require('../models/Incident');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/incidents
// @desc    Get incidents for a site
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { siteId, status, type, severity, page = 1, limit = 10 } = req.query;
    const user = req.user;

    let targetSiteId = siteId || user.assignedSite;
    
    // If no site ID provided and user is admin, get all incidents
    if (!targetSiteId && user.role === 'admin') {
      targetSiteId = null; // Will query all sites
    } else if (!targetSiteId) {
      return res.status(400).json({ message: 'Site ID is required' });
    }

    // Build query
    const query = {};
    if (targetSiteId) {
      query.site = targetSiteId;
    }
    if (status) query.status = status;
    if (type) query.type = type;
    if (severity) query.severity = severity;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const incidents = await Incident.find(query)
      .populate('reportedBy', 'fullName email')
      .populate('investigation.assignedTo', 'fullName email')
      .populate('resolution.resolvedBy', 'fullName email')
      .sort({ reportedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Incident.countDocuments(query);

    res.json({
      incidents,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/incidents
// @desc    Create a new incident
// @access  Private
router.post('/', auth, [
  body('title').notEmpty().withMessage('Incident title is required'),
  body('description').notEmpty().withMessage('Incident description is required'),
  body('type').isIn(['safety', 'security', 'property_damage', 'injury', 'environmental', 'other']).withMessage('Invalid incident type'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  body('incidentDate').isISO8601().withMessage('Valid incident date is required'),
  body('site').isMongoId().withMessage('Valid site ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const incident = new Incident({
      ...req.body,
      reportedBy: req.user._id
    });

    await incident.save();

    await incident.populate('reportedBy', 'fullName email');

    // Emit realtime update for reports
    try {
      const io = req.app.get('io');
      if (io) {
        const siteId = incident.site ? incident.site.toString() : undefined;
        io.emit('incident_changed', { action: 'created', siteId, incidentId: incident._id.toString() });
        if (siteId) {
          io.to(`site_${siteId}`).emit('incident_changed', { action: 'created', siteId, incidentId: incident._id.toString() });
          io.to(`site_${siteId}`).emit('reports_refresh', { siteId, reason: 'incident_created' });
        }
      }
    } catch (e) {
      console.error('Realtime emit error (incident created):', e);
    }

    res.status(201).json({
      message: 'Incident reported successfully',
      incident
    });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ message: 'Server error during incident creation' });
  }
});

// @route   GET /api/incidents/:id
// @desc    Get incident details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'fullName email')
      .populate('investigation.assignedTo', 'fullName email')
      .populate('resolution.resolvedBy', 'fullName email')
      .populate('site', 'name address');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.json({ incident });
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/incidents/:id
// @desc    Update incident
// @access  Private
router.put('/:id', auth, [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('reportedBy', 'fullName email')
    .populate('investigation.assignedTo', 'fullName email');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Emit realtime update for reports
    try {
      const io = req.app.get('io');
      if (io) {
        const siteId = incident.site ? incident.site.toString() : undefined;
        io.emit('incident_changed', { action: 'updated', siteId, incidentId: incident._id.toString() });
        if (siteId) {
          io.to(`site_${siteId}`).emit('incident_changed', { action: 'updated', siteId, incidentId: incident._id.toString() });
          io.to(`site_${siteId}`).emit('reports_refresh', { siteId, reason: 'incident_updated' });
        }
      }
    } catch (e) {
      console.error('Realtime emit error (incident updated):', e);
    }

    res.json({
      message: 'Incident updated successfully',
      incident
    });
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ message: 'Server error during incident update' });
  }
});

// @route   PUT /api/incidents/:id/assign
// @desc    Assign incident for investigation
// @access  Private (Admin, Site Manager)
router.put('/:id/assign', auth, authorize('admin', 'site_manager'), [
  body('assignedTo').isMongoId().withMessage('Valid user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignedTo } = req.body;

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      {
        'investigation.assignedTo': assignedTo,
        'investigation.startDate': new Date(),
        status: 'investigating'
      },
      { new: true, runValidators: true }
    )
    .populate('investigation.assignedTo', 'fullName email');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Emit realtime update for reports
    try {
      const io = req.app.get('io');
      if (io) {
        const siteId = incident.site ? incident.site.toString() : undefined;
        io.emit('incident_changed', { action: 'assigned', siteId, incidentId: incident._id.toString() });
        if (siteId) {
          io.to(`site_${siteId}`).emit('incident_changed', { action: 'assigned', siteId, incidentId: incident._id.toString() });
          io.to(`site_${siteId}`).emit('reports_refresh', { siteId, reason: 'incident_assigned' });
        }
      }
    } catch (e) {
      console.error('Realtime emit error (incident assigned):', e);
    }

    res.json({
      message: 'Incident assigned successfully',
      incident
    });
  } catch (error) {
    console.error('Assign incident error:', error);
    res.status(500).json({ message: 'Server error during incident assignment' });
  }
});

// @route   PUT /api/incidents/:id/resolve
// @desc    Resolve incident
// @access  Private (Admin, Site Manager)
router.put('/:id/resolve', auth, authorize('admin', 'site_manager'), [
  body('resolutionNotes').notEmpty().withMessage('Resolution notes are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { resolutionNotes, lessonsLearned } = req.body;

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      {
        'resolution.resolvedBy': req.user._id,
        'resolution.resolvedDate': new Date(),
        'resolution.resolutionNotes': resolutionNotes,
        'resolution.lessonsLearned': lessonsLearned,
        status: 'resolved'
      },
      { new: true, runValidators: true }
    )
    .populate('resolution.resolvedBy', 'fullName email');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Emit realtime update for reports
    try {
      const io = req.app.get('io');
      if (io) {
        const siteId = incident.site ? incident.site.toString() : undefined;
        io.emit('incident_changed', { action: 'resolved', siteId, incidentId: incident._id.toString() });
        if (siteId) {
          io.to(`site_${siteId}`).emit('incident_changed', { action: 'resolved', siteId, incidentId: incident._id.toString() });
          io.to(`site_${siteId}`).emit('reports_refresh', { siteId, reason: 'incident_resolved' });
        }
      }
    } catch (e) {
      console.error('Realtime emit error (incident resolved):', e);
    }

    res.json({
      message: 'Incident resolved successfully',
      incident
    });
  } catch (error) {
    console.error('Resolve incident error:', error);
    res.status(500).json({ message: 'Server error during incident resolution' });
  }
});

module.exports = router;

