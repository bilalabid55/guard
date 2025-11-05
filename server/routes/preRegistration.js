const express = require('express');
const { body, validationResult } = require('express-validator');
const Visitor = require('../models/Visitor');
const Site = require('../models/Site');
const AccessPoint = require('../models/AccessPoint');
const BannedVisitor = require('../models/BannedVisitor');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { sendPreRegistrationInvitation, sendPreRegistrationConfirmation, sendBannedVisitorAlert } = require('../services/emailService');
const QRCode = require('qrcode');
const crypto = require('crypto');

const router = express.Router();

// @route   POST /api/preregistration/send-invitation
// @desc    Send pre-registration invitation to visitor
// @access  Private (All authenticated users)
router.post('/send-invitation', auth, [
  body('visitorEmail').isEmail().withMessage('Please provide a valid email'),
  body('visitorName').notEmpty().withMessage('Visitor name is required'),
  body('company').notEmpty().withMessage('Company is required'),
  body('purpose').notEmpty().withMessage('Purpose of visit is required'),
  body('accessPoint').notEmpty().withMessage('Access point is required'),
  body('expectedDuration').optional().isNumeric().withMessage('Expected duration must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      visitorEmail,
      visitorName,
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

    // Verify access point exists first and infer site from it when possible
    const accessPointDoc = await AccessPoint.findById(accessPoint).lean();
    if (!accessPointDoc || !accessPointDoc.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive access point' });
    }

    // Determine site context: prefer accessPoint.site, fallback to user's assignedSite
    const siteId = accessPointDoc.site || user.assignedSite;
    if (!siteId) {
      return res.status(400).json({ message: 'No site context available for this request' });
    }

    // Get site information
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Authorization: ensure user can act for this site
    const isSuperAdmin = user.role === 'super_admin';
    const isAdminForSite = user.role === 'admin' && String(site.admin) === String(user._id);
    const isAssignedToSite = user.assignedSite && String(user.assignedSite) === String(site._id);
    if (!(isSuperAdmin || isAdminForSite || isAssignedToSite)) {
      return res.status(403).json({ message: 'You do not have permission to pre-register visitors for this site' });
    }

    // Check if visitor is banned
    const bannedVisitor = await BannedVisitor.checkVisitor({
      fullName: visitorName,
      email: visitorEmail,
      company
    });

    if (bannedVisitor) {
      // Send alert to security and site managers
      const alertRecipients = await getAlertRecipients(site._id);
      await sendBannedVisitorAlert({
        fullName: visitorName,
        email: visitorEmail,
        company,
        purpose
      }, site, bannedVisitor, alertRecipients);

      return res.status(400).json({
        message: 'Visitor is banned',
        bannedVisitor: {
          reason: bannedVisitor.reason,
          bannedDate: bannedVisitor.bannedDate,
          bannedBy: bannedVisitor.bannedBy
        }
      });
    }

    // Generate pre-registration token
    const preRegistrationToken = crypto.randomBytes(32).toString('hex');
    const preRegistrationUrl = `${process.env.CLIENT_URL}/preregistration/${preRegistrationToken}`;

    // Create visitor record with pre-registration status
    const visitor = new Visitor({
      fullName: visitorName,
      email: visitorEmail,
      company,
      purpose,
      accessPoint,
      contactPerson,
      host,
      expectedDuration: expectedDuration || 4,
      emergencyContact,
      specialAccess: specialAccess || 'none',
      notes,
      site: site._id,
      isPreRegistered: true,
      preRegistrationToken,
      status: 'pending'
    });

    await visitor.save();

    // Send invitation email
    const emailResult = await sendPreRegistrationInvitation({
      fullName: visitorName,
      email: visitorEmail,
      company,
      purpose,
      contactPerson,
      expectedDuration: expectedDuration || 4
    }, site, preRegistrationUrl);

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      // Continue with the process even if email fails
    }

    res.status(201).json({
      message: 'Pre-registration invitation sent successfully',
      visitor: {
        id: visitor._id,
        fullName: visitor.fullName,
        email: visitor.email,
        company: visitor.company,
        preRegistrationToken: visitor.preRegistrationToken
      },
      preRegistrationUrl,
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({ message: 'Server error during invitation sending' });
  }
});

// @route   GET /api/preregistration/:token
// @desc    Get pre-registration form data
// @access  Public
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const visitor = await Visitor.findOne({ 
      preRegistrationToken: token,
      isPreRegistered: true,
      status: 'pending'
    })
    .populate('site', 'name address')
    .populate('accessPoint', 'name type location');

    if (!visitor) {
      return res.status(404).json({ message: 'Invalid or expired pre-registration link' });
    }

    // Check if pre-registration is expired (24 hours)
    const hoursSinceInvitation = (Date.now() - visitor.createdAt) / (1000 * 60 * 60);
    if (hoursSinceInvitation > 24) {
      return res.status(400).json({ message: 'Pre-registration link has expired' });
    }

    res.json({
      visitor: {
        id: visitor._id,
        fullName: visitor.fullName,
        email: visitor.email,
        company: visitor.company,
        purpose: visitor.purpose,
        accessPoint: visitor.accessPoint,
        site: visitor.site,
        contactPerson: visitor.contactPerson,
        host: visitor.host,
        expectedDuration: visitor.expectedDuration,
        emergencyContact: visitor.emergencyContact,
        specialAccess: visitor.specialAccess,
        notes: visitor.notes
      }
    });
  } catch (error) {
    console.error('Get pre-registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/preregistration/:token/complete
// @desc    Complete pre-registration
// @access  Public
router.post('/:token/complete', [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('emergencyContact.name').notEmpty().withMessage('Emergency contact name is required'),
  body('emergencyContact.phone').notEmpty().withMessage('Emergency contact phone is required'),
  body('emergencyContact.relationship').notEmpty().withMessage('Emergency contact relationship is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { phone, emergencyContact, additionalNotes } = req.body;

    const visitor = await Visitor.findOne({ 
      preRegistrationToken: token,
      isPreRegistered: true,
      status: 'pending'
    })
    .populate('site', 'name address')
    .populate('accessPoint', 'name type location');

    if (!visitor) {
      return res.status(404).json({ message: 'Invalid or expired pre-registration link' });
    }

    // Check if pre-registration is expired (24 hours)
    const hoursSinceInvitation = (Date.now() - visitor.createdAt) / (1000 * 60 * 60);
    if (hoursSinceInvitation > 24) {
      return res.status(400).json({ message: 'Pre-registration link has expired' });
    }

    // Update visitor with additional information
    visitor.phone = phone;
    visitor.emergencyContact = emergencyContact;
    if (additionalNotes) {
      visitor.notes = (visitor.notes || '') + '\n' + additionalNotes;
    }

    // Generate badge number
    visitor.badgeNumber = `V${Date.now().toString().slice(-6)}`;

    // Generate QR code
    const qrCodeData = {
      visitorId: visitor._id,
      badgeNumber: visitor.badgeNumber,
      siteId: visitor.site._id,
      preRegistrationToken: token
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData));
    visitor.qrCode = qrCode;

    await visitor.save();

    // Send confirmation email with QR code
    const emailResult = await sendPreRegistrationConfirmation({
      fullName: visitor.fullName,
      email: visitor.email,
      company: visitor.company,
      purpose: visitor.purpose,
      badgeNumber: visitor.badgeNumber,
      accessPointName: visitor.accessPoint.name,
      expectedDuration: visitor.expectedDuration
    }, visitor.site, qrCode);

    if (!emailResult.success) {
      console.error('Failed to send confirmation email:', emailResult.error);
      // Continue with the process even if email fails
    }

    res.json({
      message: 'Pre-registration completed successfully',
      visitor: {
        id: visitor._id,
        fullName: visitor.fullName,
        email: visitor.email,
        company: visitor.company,
        badgeNumber: visitor.badgeNumber,
        qrCode: qrCode,
        accessPoint: visitor.accessPoint,
        site: visitor.site
      },
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Complete pre-registration error:', error);
    res.status(500).json({ message: 'Server error during pre-registration completion' });
  }
});

// @route   POST /api/preregistration/:token/checkin
// @desc    Check in pre-registered visitor
// @access  Private (All authenticated users)
router.post('/:token/checkin', auth, async (req, res) => {
  try {
    const { token } = req.params;
    const { securityNotes } = req.body;

    const visitor = await Visitor.findOne({ 
      preRegistrationToken: token,
      isPreRegistered: true,
      status: 'pending'
    })
    .populate('accessPoint', 'name type location')
    .populate('site', 'name address');

    if (!visitor) {
      return res.status(404).json({ message: 'Pre-registered visitor not found or already checked in' });
    }

    // Update visitor status to checked in
    visitor.status = 'checked_in';
    visitor.checkInTime = new Date();
    visitor.checkedInBy = req.user._id;
    if (securityNotes) {
      visitor.securityNotes = securityNotes;
    }

    await visitor.save();

    // Update access point occupancy
    const accessPoint = await AccessPoint.findById(visitor.accessPoint._id);
    if (accessPoint) {
      await accessPoint.updateOccupancy();
    }

    res.json({
      message: 'Pre-registered visitor checked in successfully',
      visitor: {
        id: visitor._id,
        fullName: visitor.fullName,
        email: visitor.email,
        company: visitor.company,
        badgeNumber: visitor.badgeNumber,
        qrCode: visitor.qrCode,
        checkInTime: visitor.checkInTime,
        accessPoint: visitor.accessPoint,
        site: visitor.site
      }
    });
  } catch (error) {
    console.error('Pre-registration check-in error:', error);
    res.status(500).json({ message: 'Server error during check-in' });
  }
});

// @route   GET /api/preregistration/pending
// @desc    List pending pre-registrations for current user's site
// @access  Private (All authenticated users)
router.get('/pending/list', auth, async (req, res) => {
  try {
    const user = req.user;

    // Determine site scope (tenant isolation)
    let siteFilter = null;
    if (user.role === 'admin') {
      // Admin: include all managed sites
      const Site = require('../models/Site');
      const managed = await Site.find({ admin: user._id }).select('_id');
      siteFilter = managed.map(s => s._id);
    } else if (user.assignedSite) {
      // Other roles: only assigned site
      siteFilter = [user.assignedSite];
    }

    if (!siteFilter || siteFilter.length === 0) {
      return res.status(400).json({ message: 'No site context available for this user' });
    }

    const visitors = await Visitor.find({
      site: { $in: siteFilter },
      isPreRegistered: true,
      status: 'pending'
    })
      .select('fullName email company preRegistrationToken createdAt accessPoint badgeNumber site')
      .populate('accessPoint', 'name')
      .populate('site', 'name')
      .sort({ createdAt: -1 });

    res.json({ visitors });
  } catch (error) {
    console.error('List pending pre-registrations error:', error);
    res.status(500).json({ message: 'Server error while fetching pre-registrations' });
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

