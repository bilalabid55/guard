const express = require('express');
const { body, validationResult } = require('express-validator');
const Visitor = require('../models/Visitor');
const BannedVisitor = require('../models/BannedVisitor');
const AccessPoint = require('../models/AccessPoint');
const User = require('../models/User');
const Site = require('../models/Site');
const Activity = require('../models/Activity');
const ActivityAlert = require('../models/ActivityAlert');
const { auth, authorize, authorizeSite } = require('../middleware/auth');
const { sendBannedVisitorAlert } = require('../services/emailService');
const NotificationService = require('../services/notificationService');
const QRCode = require('qrcode');

const router = express.Router();

// Debug route to check user info and recent visitors
router.get('/debug/user', auth, async (req, res) => {
  try {
    // Get last 5 visitors from database
    const recentVisitors = await Visitor.find()
      .sort({ checkInTime: -1 })
      .limit(5)
      .select('fullName company site status checkInTime');

    // Get site filter that would be used
    let siteFilter = [];
    if (req.user.role === 'admin') {
      const managedSites = await Site.find({ admin: req.user._id }).select('_id');
      siteFilter = managedSites.map(s => s._id.toString());
    } else if (req.user.assignedSite) {
      siteFilter = [req.user.assignedSite.toString()];
    }

    res.json({
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        assignedSite: req.user.assignedSite ? req.user.assignedSite.toString() : null,
        isActive: req.user.isActive
      },
      siteFilter,
      recentVisitors: recentVisitors.map(v => ({
        id: v._id.toString(),
        fullName: v.fullName,
        company: v.company,
        site: v.site ? v.site.toString() : null,
        status: v.status,
        checkInTime: v.checkInTime,
        matchesFilter: siteFilter.includes(v.site ? v.site.toString() : '')
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test route without authorization
router.get('/test', auth, (req, res) => {
  res.json({ 
    message: 'Basic auth working', 
    userRole: req.user.role,
    timestamp: new Date().toISOString()
  });
});

// Debug route to check all visitors in database
router.get('/debug/all', auth, async (req, res) => {
  try {
    const allVisitors = await Visitor.find()
      .select('fullName company site status checkInTime checkOutTime')
      .sort({ checkInTime: -1 })
      .limit(10);
    
    const statusCounts = await Visitor.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      totalVisitors: allVisitors.length,
      statusCounts,
      visitors: allVisitors.map(v => ({
        id: v._id.toString(),
        fullName: v.fullName,
        company: v.company,
        site: v.site ? v.site.toString() : null,
        status: v.status,
        checkInTime: v.checkInTime,
        checkOutTime: v.checkOutTime
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/visitors
// @desc    Get all visitors for a site
// @access  Private (Admin, Site Manager, Security Guard, Receptionist)
router.get('/', auth, authorize('admin', 'site_manager', 'security_guard', 'receptionist'), async (req, res) => {
  try {
    const { siteId, status, page = 1, limit = 10, search, company, accessPoint, date } = req.query;
    const user = req.user;

    console.log('GET /api/visitors - User:', { 
      id: user._id, 
      role: user.role, 
      assignedSite: user.assignedSite ? user.assignedSite.toString() : null 
    });

    // Determine site scope with tenant isolation
    let siteFilter = [];
    if (siteId) {
      siteFilter = [siteId];
      console.log('Using siteId from query:', siteId);
    } else if (user.role === 'admin') {
      const managedSites = await Site.find({ admin: user._id }).select('_id');
      siteFilter = managedSites.map(s => s._id);
      console.log('Admin - managed sites:', siteFilter.map(s => s.toString()));
    } else if (user.assignedSite) {
      siteFilter = [user.assignedSite];
      console.log('Non-admin - using assignedSite:', user.assignedSite.toString());
    }

    if (!siteFilter || siteFilter.length === 0) {
      console.log('ERROR: No site context for user');
      return res.status(400).json({ message: 'Site context is required' });
    }

    // Build query
    const query = { site: { $in: siteFilter } };
    console.log('Query filter:', JSON.stringify({ site: { $in: siteFilter.map(s => s.toString()) } }));
    if (status) query.status = status;
    if (company) query.company = { $regex: company, $options: 'i' };
    if (accessPoint) query.accessPoint = accessPoint;
    if (date) {
      const d = new Date(date);
      d.setHours(0,0,0,0);
      const dEnd = new Date(d);
      dEnd.setDate(dEnd.getDate() + 1);
      query.checkInTime = { $gte: d, $lt: dEnd };
    }
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get visitors with pagination
    const visitors = await Visitor.find(query)
      .populate('accessPoint', 'name type')
      .populate('checkedInBy', 'fullName')
      .populate('checkedOutBy', 'fullName')
      .sort({ checkInTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Visitor.countDocuments(query);

    console.log('Query results:', { 
      visitorsCount: visitors.length, 
      total, 
      siteFilter: siteFilter.map(s => s.toString()),
      statusFilter: status || 'none (all statuses)',
      firstVisitor: visitors[0] ? {
        name: visitors[0].fullName,
        status: visitors[0].status,
        site: visitors[0].site ? visitors[0].site.toString() : null
      } : 'no visitors'
    });

    // Additional debug: check if any visitors exist at all
    if (total === 0) {
      const allVisitors = await Visitor.countDocuments({});
      const allForSite = await Visitor.countDocuments({ site: { $in: siteFilter } });
      const recentVisitor = await Visitor.findOne({ site: { $in: siteFilter } })
        .sort({ checkInTime: -1 })
        .select('site fullName status checkInTime checkOutTime');
      console.log('⚠️ No visitors found. DB stats:', {
        totalInDB: allVisitors,
        forThisSite: allForSite,
        mostRecent: recentVisitor ? {
          name: recentVisitor.fullName,
          status: recentVisitor.status,
          site: recentVisitor.site ? recentVisitor.site.toString() : null,
          checkIn: recentVisitor.checkInTime,
          checkOut: recentVisitor.checkOutTime
        } : null
      });
    }

    res.json({
      visitors,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get visitors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/visitors/current
// @desc    Get currently on-site visitors
// @access  Private
router.get('/current', auth, authorize('admin', 'site_manager', 'security_guard', 'receptionist'), async (req, res) => {
  try {
    const { siteId } = req.query;
    const user = req.user;

    console.log('GET /api/visitors/current - User:', { 
      id: user._id, 
      role: user.role, 
      assignedSite: user.assignedSite ? user.assignedSite.toString() : null 
    });

    // Determine site scope with tenant isolation
    let targetSiteId = null;
    if (siteId) {
      targetSiteId = siteId;
      console.log('Using siteId from query:', siteId);
    } else if (user.role === 'admin') {
      const managed = await Site.find({ admin: user._id }).select('_id').sort({ createdAt: 1 });
      targetSiteId = managed[0]?._id || null;
      console.log('Admin - using first managed site:', targetSiteId ? targetSiteId.toString() : null);
    } else if (user.assignedSite) {
      targetSiteId = user.assignedSite;
      console.log('Non-admin - using assignedSite:', user.assignedSite.toString());
    }

    if (!targetSiteId) {
      console.log('ERROR: No site context for current visitors');
      return res.status(400).json({ message: 'Site ID is required' });
    }

    const visitors = await Visitor.find({
      site: targetSiteId,
      status: 'checked_in'
    })
    .populate('accessPoint', 'name type')
    .populate('checkedInBy', 'fullName')
    .sort({ checkInTime: -1 });

    console.log('Current visitors result:', {
      count: visitors.length,
      targetSiteId: targetSiteId.toString(),
      firstVisitorSite: visitors[0]?.site ? visitors[0].site.toString() : 'no visitors'
    });

    // Additional debug if no visitors found
    if (visitors.length === 0) {
      const allCheckedIn = await Visitor.countDocuments({ status: 'checked_in' });
      const recentCheckedIn = await Visitor.findOne({ status: 'checked_in' }).sort({ checkInTime: -1 }).select('site fullName');
      console.log('⚠️ No current visitors for site. Total checked in visitors in DB:', allCheckedIn);
      if (recentCheckedIn) {
        console.log('Most recent checked-in visitor site:', recentCheckedIn.site ? recentCheckedIn.site.toString() : null);
      }
    }

    res.json({ visitors });
  } catch (error) {
    console.error('Get current visitors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/visitors/checkin
// @desc    Check in a visitor
// @access  Private (Security Guard, Receptionist)
router.post('/checkin', auth, authorize('admin', 'site_manager', 'security_guard', 'receptionist'), [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('company').notEmpty().withMessage('Company is required'),
  body('purpose').notEmpty().withMessage('Purpose of visit is required'),
  body('accessPoint').isMongoId().withMessage('Valid access point is required')
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
      purpose,
      accessPoint,
      contactPerson,
      host,
      expectedDuration,
      emergencyContact,
      specialAccess,
      notes
    } = req.body;

    const user = req.user;

    // Check if visitor is banned
    const bannedVisitor = await BannedVisitor.checkVisitor({
      fullName,
      email,
      company
    });

    if (bannedVisitor) {
      // Send immediate alert to security and site managers
      try {
        const site = await Site.findById(user.assignedSite);
        const alertRecipients = await getAlertRecipients(user.assignedSite);
        
        // Send email alert
        if (alertRecipients.length > 0) {
          await sendBannedVisitorAlert({
            fullName,
            email,
            company,
            purpose
          }, site, bannedVisitor, alertRecipients);
        }

        // Create activity alert for banned visitor attempt
        await ActivityAlert.createSystemAlert(
          'Banned Visitor Attempt',
          `Banned visitor ${fullName} from ${company} attempted to check in. Reason for ban: ${bannedVisitor.reason}`,
          user.assignedSite,
          'critical',
          ['admin', 'site_manager', 'security_guard']
        );

        // Send real-time notification
        const io = req.app.get('io');
        if (io) {
          const notificationService = new NotificationService(io);
          await notificationService.sendBannedVisitorAlert({
            fullName,
            email,
            company,
            purpose
          }, site, bannedVisitor, alertRecipients);

          // Also emit direct socket event for critical popup
          io.emit('banned_visitor_alert', {
            visitor: { fullName, email, company, purpose },
            bannedVisitor: bannedVisitor,
            site: site,
            timestamp: new Date().toISOString()
          });
        }
      } catch (alertError) {
        console.error('Error sending banned visitor alert:', alertError);
        // Continue with the process even if alert fails
      }

      return res.status(400).json({
        message: 'Visitor is banned',
        bannedVisitor: {
          reason: bannedVisitor.reason,
          bannedDate: bannedVisitor.bannedDate,
          bannedBy: bannedVisitor.bannedBy
        }
      });
    }

    // Verify access point exists and is active
    const accessPointDoc = await AccessPoint.findById(accessPoint);
    if (!accessPointDoc || !accessPointDoc.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive access point' });
    }

    // Determine the site for the visitor
    let visitorSite = user.assignedSite;
    
    // If user is admin and no assigned site, get the site from the access point
    if (!visitorSite && user.role === 'admin') {
      visitorSite = accessPointDoc.site;
    }
    
    if (!visitorSite) {
      console.log('No site for visitor check-in:', { userId: user._id, role: user.role, assignedSite: user.assignedSite });
      return res.status(400).json({ message: 'Site ID is required for visitor check-in' });
    }

    console.log('Checking in visitor - User:', { id: user._id, role: user.role, assignedSite: user.assignedSite, visitorSite });

    // Create visitor record
    const visitor = new Visitor({
      fullName,
      email,
      phone,
      company,
      purpose,
      accessPoint,
      contactPerson,
      host,
      expectedDuration: expectedDuration || 4,
      emergencyContact,
      specialAccess: specialAccess || 'none',
      notes,
      site: visitorSite,
      checkedInBy: user._id,
      status: 'checked_in',
      checkInTime: new Date()
    });

    await visitor.save();

    console.log('✅ Visitor saved:', { 
      id: visitor._id.toString(), 
      fullName: visitor.fullName,
      site: visitor.site ? visitor.site.toString() : null,
      status: visitor.status,
      badgeNumber: visitor.badgeNumber
    });

    // Generate QR code data (not the actual QR code image)
    const qrCodeData = {
      visitorId: visitor._id,
      badgeNumber: visitor.badgeNumber,
      siteId: visitor.site,
      checkInTime: visitor.checkInTime
    };

    // Store only the data, not the generated QR code image
    visitor.qrCode = JSON.stringify(qrCodeData);
    await visitor.save();

    // Update access point occupancy
    await accessPointDoc.updateOccupancy();

    // Create activity record
    try {
      await Activity.createCheckInActivity(visitor, user, accessPointDoc);
      
      // Create activity alert for admins and site managers
      await ActivityAlert.createVisitorAlert('visitor_checkin', visitor, user, accessPointDoc);
    } catch (activityError) {
      console.error('Error creating activity record:', activityError);
      // Continue with the process even if activity creation fails
    }

    // Populate the visitor data for response
    await visitor.populate([
      { path: 'accessPoint', select: 'name type' },
      { path: 'checkedInBy', select: 'fullName' }
    ]);
    const siteDoc = await Site.findById(visitor.site).select('name');

    // Emit realtime notifications
    try {
      const io = req.app.get('io');
      if (io) {
        const payload = {
          id: visitor._id,
          fullName: visitor.fullName,
          company: visitor.company,
          accessPoint: visitor.accessPoint,
          accessPointName: visitor.accessPoint?.name,
          site: visitor.site,
          siteName: siteDoc?.name,
          checkInTime: visitor.checkInTime
        };
        // emit to all users for global notifications
        io.emit('visitor_activity', { type: 'checkin', ...payload });
        // emit to site room for scoped listeners
        io.to(`site_${visitor.site}`).emit('visitor_checked_in', payload);
      }
    } catch (e) {
      console.error('Realtime emit error (check-in):', e);
    }

    res.status(201).json({
      message: 'Visitor checked in successfully',
      visitor,
      qrCode: qrCodeData
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error during check-in' });
  }
});

// @route   PUT /api/visitors/:id/checkout
// @desc    Check out a visitor
// @access  Private (Security Guard, Receptionist)
router.put('/:id/checkout', auth, authorize('admin', 'site_manager', 'security_guard', 'receptionist'), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const visitor = await Visitor.findById(id);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    if (visitor.status === 'checked_out') {
      return res.status(400).json({ message: 'Visitor is already checked out' });
    }

    // Update visitor
    visitor.status = 'checked_out';
    visitor.checkOutTime = new Date();
    visitor.checkedOutBy = req.user._id;
    if (notes) visitor.securityNotes = notes;

    await visitor.save();

    console.log('✅ Visitor checked out:', { 
      id: visitor._id.toString(), 
      fullName: visitor.fullName,
      site: visitor.site ? visitor.site.toString() : null,
      status: visitor.status,
      checkOutTime: visitor.checkOutTime
    });

    const siteDoc2 = await Site.findById(visitor.site).select('name');

    // Update access point occupancy
    const accessPoint = await AccessPoint.findById(visitor.accessPoint);
    if (accessPoint) {
      await accessPoint.updateOccupancy();
      
      // Create activity record
      try {
        await Activity.createCheckOutActivity(visitor, req.user, accessPoint);
        
        // Create activity alert for admins and site managers
        await ActivityAlert.createVisitorAlert('visitor_checkout', visitor, req.user, accessPoint);
      } catch (activityError) {
        console.error('Error creating checkout activity record:', activityError);
        // Continue with the process even if activity creation fails
      }
    }

    // Emit realtime notifications
    try {
      const io = req.app.get('io');
      if (io) {
        const payload = {
          id: visitor._id,
          fullName: visitor.fullName,
          company: visitor.company,
          accessPoint: visitor.accessPoint,
          accessPointName: accessPoint?.name,
          site: visitor.site,
          siteName: siteDoc2?.name,
          checkOutTime: visitor.checkOutTime
        };
        io.emit('visitor_activity', { type: 'checkout', ...payload });
        io.to(`site_${visitor.site}`).emit('visitor_checked_out', payload);
      }
    } catch (e) {
      console.error('Realtime emit error (check-out):', e);
    }

    // Populate visitor for response
    await visitor.populate([
      { path: 'accessPoint', select: 'name type' },
      { path: 'checkedInBy', select: 'fullName' },
      { path: 'checkedOutBy', select: 'fullName' }
    ]);

    res.json({
      message: 'Visitor checked out successfully',
      visitor
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error during check-out' });
  }
});

// @route   GET /api/visitors/:id
// @desc    Get visitor details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate('accessPoint', 'name type location')
      .populate('checkedInBy', 'fullName email')
      .populate('checkedOutBy', 'fullName email')
      .populate('site', 'name address');

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    res.json({ visitor });
  } catch (error) {
    console.error('Get visitor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/visitors/:id
// @desc    Update visitor information
// @access  Private (Security Guard, Site Manager)
router.put('/:id', auth, authorize('security_guard', 'site_manager'), [
  body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('company').optional().notEmpty().withMessage('Company cannot be empty'),
  body('purpose').optional().notEmpty().withMessage('Purpose cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    const visitor = await Visitor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('accessPoint', 'name type')
    .populate('checkedInBy', 'fullName');

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    res.json({
      message: 'Visitor updated successfully',
      visitor
    });
  } catch (error) {
    console.error('Update visitor error:', error);
    res.status(500).json({ message: 'Server error during update' });
  }
});

// @route   GET /api/visitors/stats/dashboard
// @desc    Get visitor statistics for dashboard
// @access  Private
router.get('/stats/dashboard', auth, authorize('admin', 'site_manager', 'security_guard', 'receptionist'), async (req, res) => {
  try {
    const { siteId } = req.query;
    const user = req.user;

    // Determine site scope with tenant isolation
    let targetSiteId = null;
    if (siteId) {
      targetSiteId = siteId;
    } else if (user.role === 'admin') {
      const managed = await Site.find({ admin: user._id }).select('_id').sort({ createdAt: 1 });
      targetSiteId = managed[0]?._id || null;
    } else if (user.assignedSite) {
      targetSiteId = user.assignedSite;
    }

    if (!targetSiteId) {
      console.log('No site context for user:', { role: user.role, assignedSite: user.assignedSite });
      return res.status(400).json({ message: 'Site context is required' });
    }

    console.log('Dashboard stats - targetSiteId:', targetSiteId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get statistics
    const [
      currentlyOnSite,
      todaysTotal,
      overstayedVisitors,
      todaysCheckIns
    ] = await Promise.all([
      Visitor.countDocuments({ site: targetSiteId, status: 'checked_in' }),
      Visitor.countDocuments({ 
        site: targetSiteId, 
        checkInTime: { $gte: today, $lt: tomorrow } 
      }),
      Visitor.countDocuments({ 
        site: targetSiteId, 
        status: 'checked_in',
        $expr: {
          $gt: [
            { $divide: [{ $subtract: [new Date(), '$checkInTime'] }, 1000 * 60 * 60] },
            '$expectedDuration'
          ]
        }
      }),
      Visitor.find({ 
        site: targetSiteId, 
        checkInTime: { $gte: today, $lt: tomorrow } 
      }).select('checkInTime')
    ]);

    // Get hourly check-ins for chart
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourStart = new Date(today);
      hourStart.setHours(hour);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour + 1);

      const count = todaysCheckIns.filter(visitor => {
        const checkInTime = new Date(visitor.checkInTime);
        return checkInTime >= hourStart && checkInTime < hourEnd;
      }).length;

      return { hour, count };
    });

    res.json({
      currentlyOnSite,
      todaysTotal,
      overstayedVisitors,
      hourlyData
    });
  } catch (error) {
    console.error('Get visitor stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to get alert recipients
const getAlertRecipients = async (siteId) => {
  try {
    const users = await User.find({
      assignedSite: siteId,
      role: { $in: ['site_manager', 'security_guard'] },
      isActive: true
    }).select('email fullName role');

    return users.map(user => user.email);
  } catch (error) {
    console.error('Error getting alert recipients:', error);
    return [];
  }
};

module.exports = router;

