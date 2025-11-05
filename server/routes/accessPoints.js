const express = require('express');
const { body, validationResult } = require('express-validator');
const AccessPoint = require('../models/AccessPoint');
const Activity = require('../models/Activity');
const ActivityAlert = require('../models/ActivityAlert');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/access-points
// @desc    Get access points for user's site
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { siteId } = req.query;
    const user = req.user;
    
    // Determine site scope with tenant isolation
    let targetSiteId = null;
    if (siteId) {
      targetSiteId = siteId;
    } else if (user.role === 'admin') {
      const Site = require('../models/Site');
      const managed = await Site.find({ admin: user._id }).select('_id').sort({ createdAt: 1 });
      targetSiteId = managed[0]?._id || null;
    } else if (user.assignedSite) {
      targetSiteId = user.assignedSite;
    }
    
    if (!targetSiteId) {
      console.log('No site context for user:', { role: user.role, assignedSite: user.assignedSite });
      return res.status(400).json({ message: 'Site context is required' });
    }

    console.log('Access points - targetSiteId:', targetSiteId);

    const accessPoints = await AccessPoint.find({ 
      site: targetSiteId,
      isActive: true 
    }).sort({ name: 1 });

    res.json({ accessPoints });
  } catch (error) {
    console.error('Get access points error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/access-points
// @desc    Create new access point
// @access  Private (Admin, Site Manager)
router.post('/', auth, authorize('admin', 'site_manager'), [
  body('name').notEmpty().withMessage('Access point name is required'),
  body('site').isMongoId().withMessage('Valid site ID is required'),
  body('type').isIn(['main_gate', 'side_entrance', 'loading_dock', 'emergency_exit', 'restricted_area']).withMessage('Invalid access point type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const accessPoint = new AccessPoint(req.body);
    await accessPoint.save();

    // Create activity record for access point creation
    try {
      await Activity.createAccessPointActivity('access_point_created', accessPoint, req.user);
      
      // Create alert for admins
      await ActivityAlert.createSystemAlert(
        'New Access Point Created',
        `Access point "${accessPoint.name}" was created at site`,
        accessPoint.site,
        'info',
        ['admin', 'site_manager']
      );
    } catch (activityError) {
      console.error('Error creating access point activity:', activityError);
    }

    res.status(201).json({
      message: 'Access point created successfully',
      accessPoint
    });
  } catch (error) {
    console.error('Create access point error:', error);
    res.status(500).json({ message: 'Server error during access point creation' });
  }
});

// @route   GET /api/access-points/:id
// @desc    Get access point details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const accessPoint = await AccessPoint.findById(req.params.id)
      .populate('site', 'name address')
      .populate('assignedStaff', 'fullName email role');

    if (!accessPoint) {
      return res.status(404).json({ message: 'Access point not found' });
    }

    res.json({ accessPoint });
  } catch (error) {
    console.error('Get access point error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/access-points/:id
// @desc    Update access point
// @access  Private (Admin, Site Manager)
router.put('/:id', auth, authorize('admin', 'site_manager'), [
  body('name').optional().notEmpty().withMessage('Access point name cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const accessPoint = await AccessPoint.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!accessPoint) {
      return res.status(404).json({ message: 'Access point not found' });
    }

    // Create activity record for access point update
    try {
      await Activity.createAccessPointActivity('access_point_updated', accessPoint, req.user);
      
      // Create alert for admins if significant changes were made
      const significantFields = ['name', 'type', 'accessLevel', 'isActive'];
      const hasSignificantChanges = Object.keys(req.body).some(field => significantFields.includes(field));
      
      if (hasSignificantChanges) {
        await ActivityAlert.createSystemAlert(
          'Access Point Updated',
          `Access point "${accessPoint.name}" was updated`,
          accessPoint.site,
          'info',
          ['admin', 'site_manager']
        );
      }
    } catch (activityError) {
      console.error('Error creating access point update activity:', activityError);
    }

    res.json({
      message: 'Access point updated successfully',
      accessPoint
    });
  } catch (error) {
    console.error('Update access point error:', error);
    res.status(500).json({ message: 'Server error during access point update' });
  }
});

// @route   DELETE /api/access-points/:id
// @desc    Delete access point
// @access  Private (Admin, Site Manager)
router.delete('/:id', auth, authorize('admin', 'site_manager'), async (req, res) => {
  try {
    const accessPoint = await AccessPoint.findById(req.params.id);
    if (!accessPoint) {
      return res.status(404).json({ message: 'Access point not found' });
    }

    // Check if access point has active visitors
    const Visitor = require('../models/Visitor');
    const activeVisitors = await Visitor.countDocuments({
      accessPoint: req.params.id,
      status: 'checked_in'
    });

    if (activeVisitors > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete access point with active visitors' 
      });
    }

    await AccessPoint.findByIdAndDelete(req.params.id);

    res.json({ message: 'Access point deleted successfully' });
  } catch (error) {
    console.error('Delete access point error:', error);
    res.status(500).json({ message: 'Server error during access point deletion' });
  }
});

// @route   PUT /api/access-points/:id/assign-staff
// @desc    Assign staff to access point
// @access  Private (Admin, Site Manager)
router.put('/:id/assign-staff', auth, authorize('admin', 'site_manager'), [
  body('staffIds').isArray().withMessage('Staff IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { staffIds } = req.body;

    const accessPoint = await AccessPoint.findByIdAndUpdate(
      req.params.id,
      { assignedStaff: staffIds },
      { new: true, runValidators: true }
    ).populate('assignedStaff', 'fullName email role');

    if (!accessPoint) {
      return res.status(404).json({ message: 'Access point not found' });
    }

    res.json({
      message: 'Staff assigned successfully',
      accessPoint
    });
  } catch (error) {
    console.error('Assign staff error:', error);
    res.status(500).json({ message: 'Server error during staff assignment' });
  }
});

module.exports = router;

