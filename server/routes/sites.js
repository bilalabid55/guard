const express = require('express');
const { body, validationResult } = require('express-validator');
const Site = require('../models/Site');
const User = require('../models/User');
const AccessPoint = require('../models/AccessPoint');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/sites
// @desc    Get all sites for admin or specific site for others
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = req.user;

    let sites;
    if (user.role === 'admin') {
      // Admin can see all sites they manage
      sites = await Site.find({ admin: user._id })
        .populate('admin', 'fullName email')
        .populate('siteManagers', 'fullName email')
        .populate('securityGuards', 'fullName email')
        .populate('receptionists', 'fullName email');
    } else {
      // Other users can only see their assigned site
      sites = await Site.find({ _id: user.assignedSite })
        .populate('admin', 'fullName email')
        .populate('siteManagers', 'fullName email')
        .populate('securityGuards', 'fullName email')
        .populate('receptionists', 'fullName email');
    }

    res.json({ sites });
  } catch (error) {
    console.error('Get sites error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/sites
// @desc    Create a new site
// @access  Private (Admin only)
router.post('/', auth, authorize('admin'), [
  body('name').notEmpty().withMessage('Site name is required'),
  body('address').notEmpty().withMessage('Site address is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('zipCode').notEmpty().withMessage('Zip code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      address,
      city,
      state,
      zipCode,
      country,
      contactInfo,
      settings
    } = req.body;

    const site = new Site({
      name,
      address,
      city,
      state,
      zipCode,
      country: country || 'USA',
      admin: req.user._id,
      contactInfo,
      settings
    });

    await site.save();

    // Create default access points
    const defaultAccessPoints = [
      { name: 'Main Gate', type: 'main_gate', site: site._id },
      { name: 'Side Entrance', type: 'side_entrance', site: site._id },
      { name: 'Loading Dock', type: 'loading_dock', site: site._id }
    ];

    for (const accessPointData of defaultAccessPoints) {
      const accessPoint = new AccessPoint(accessPointData);
      await accessPoint.save();
    }

    res.status(201).json({
      message: 'Site created successfully',
      site
    });
  } catch (error) {
    console.error('Create site error:', error);
    res.status(500).json({ message: 'Server error during site creation' });
  }
});

// @route   GET /api/sites/:id
// @desc    Get site details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id)
      .populate('admin', 'fullName email')
      .populate('siteManagers', 'fullName email phone')
      .populate('securityGuards', 'fullName email phone')
      .populate('receptionists', 'fullName email phone');

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check if user has access to this site
    const user = req.user;
    if (user.role !== 'admin' && user.assignedSite?.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied to this site' });
    }

    res.json({ site });
  } catch (error) {
    console.error('Get site error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/sites/:id
// @desc    Update site
// @access  Private (Admin, Site Manager)
router.put('/:id', auth, authorize('admin', 'site_manager'), [
  body('name').optional().notEmpty().withMessage('Site name cannot be empty'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check if user has access to this site
    const user = req.user;
    if (user.role === 'site_manager' && user.assignedSite?.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied to this site' });
    }

    const updatedSite = await Site.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('admin', 'fullName email')
    .populate('siteManagers', 'fullName email')
    .populate('securityGuards', 'fullName email')
    .populate('receptionists', 'fullName email');

    res.json({
      message: 'Site updated successfully',
      site: updatedSite
    });
  } catch (error) {
    console.error('Update site error:', error);
    res.status(500).json({ message: 'Server error during site update' });
  }
});

// @route   DELETE /api/sites/:id
// @desc    Delete site
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Check if user owns this site
    if (site.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Site.findByIdAndDelete(req.params.id);

    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Delete site error:', error);
    res.status(500).json({ message: 'Server error during site deletion' });
  }
});

// @route   GET /api/sites/:id/access-points
// @desc    Get access points for a site
// @access  Private
router.get('/:id/access-points', auth, async (req, res) => {
  try {
    const accessPoints = await AccessPoint.find({ 
      site: req.params.id,
      isActive: true 
    });

    res.json({ accessPoints });
  } catch (error) {
    console.error('Get access points error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sites/:id/stats
// @desc    Get site statistics
// @access  Private
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const Visitor = require('../models/Visitor');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalVisitors,
      currentlyOnSite,
      todaysVisitors,
      overstayedVisitors
    ] = await Promise.all([
      Visitor.countDocuments({ site: req.params.id }),
      Visitor.countDocuments({ site: req.params.id, status: 'checked_in' }),
      Visitor.countDocuments({ 
        site: req.params.id, 
        checkInTime: { $gte: today, $lt: tomorrow } 
      }),
      Visitor.countDocuments({ 
        site: req.params.id, 
        status: 'checked_in',
        $expr: {
          $gt: [
            { $divide: [{ $subtract: [new Date(), '$checkInTime'] }, 1000 * 60 * 60] },
            '$expectedDuration'
          ]
        }
      })
    ]);

    res.json({
      totalVisitors,
      currentlyOnSite,
      todaysVisitors,
      overstayedVisitors
    });
  } catch (error) {
    console.error('Get site stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

