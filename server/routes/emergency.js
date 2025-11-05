const express = require('express');
const { body, validationResult } = require('express-validator');
const Visitor = require('../models/Visitor');
const Activity = require('../models/Activity');
const ActivityAlert = require('../models/ActivityAlert');
const User = require('../models/User');
const Site = require('../models/Site');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Twilio SMS client (optional)
let twilioClient = null;
try {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    twilioClient = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
} catch (e) {
  console.error('Failed to initialize Twilio client:', e);
}

const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER;

async function sendSmsBatch(phoneNumbers, body) {
  if (!twilioClient || !TWILIO_FROM) {
    return { sent: 0, failures: phoneNumbers.map(p => ({ to: p, error: 'Twilio not configured' })) };
  }
  const tasks = phoneNumbers.map(async (to) => {
    try {
      if (!to) throw new Error('Missing destination number');
      const msg = await twilioClient.messages.create({ from: TWILIO_FROM, to, body });
      return { to, sid: msg.sid };
    } catch (err) {
      return { to, error: err.message || String(err) };
    }
  });
  const results = await Promise.all(tasks);
  const failures = results.filter(r => r.error);
  const successes = results.filter(r => !r.error);
  return { sent: successes.length, failures };
}

// @route   GET /api/emergency/visitors
// @desc    Get all currently on-site visitors for emergency purposes
// @access  Private
router.get('/visitors', auth, async (req, res) => {
  try {
    const { siteId } = req.query;
    const user = req.user;
    
    let targetSiteId = siteId || user.assignedSite;
    if (!targetSiteId && user.role === 'admin') {
      const Site = require('../models/Site');
      const firstSite = await Site.findOne().sort({ createdAt: 1 });
      if (firstSite) {
        targetSiteId = firstSite._id;
      }
    }
    
    if (!targetSiteId) {
      return res.status(400).json({ message: 'Site ID is required' });
    }

    const visitors = await Visitor.find({
      site: targetSiteId,
      status: 'checked_in'
    })
    .populate('accessPoint', 'name type')
    .populate('checkedInBy', 'fullName')
    .sort({ checkInTime: -1 });

    res.json({ visitors });
  } catch (error) {
    console.error('Get emergency visitors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/emergency/contacts
// @desc    Get emergency contacts for a site
// @access  Private
router.get('/contacts', auth, async (req, res) => {
  try {
    const { siteId } = req.query;
    const user = req.user;
    
    let targetSiteId = siteId || user.assignedSite;
    if (!targetSiteId && user.role === 'admin') {
      const Site = require('../models/Site');
      const firstSite = await Site.findOne().sort({ createdAt: 1 });
      if (firstSite) {
        targetSiteId = firstSite._id;
      }
    }
    
    if (!targetSiteId) {
      return res.status(400).json({ message: 'Site ID is required' });
    }

    // Get all users at the site who can be emergency contacts
    const emergencyContacts = await User.find({
      assignedSite: targetSiteId,
      isActive: true,
      role: { $in: ['admin', 'site_manager', 'security_guard'] }
    }).select('fullName email phone role');

    res.json({ emergencyContacts });
  } catch (error) {
    console.error('Get emergency contacts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/emergency/activate
// @desc    Activate emergency mode and send alerts
// @access  Private (All authenticated users)
router.post('/activate', auth, [
  body('type').isIn(['evacuation', 'lockdown', 'medical', 'security', 'fire']).withMessage('Invalid emergency type'),
  body('message').notEmpty().withMessage('Emergency message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, message, location } = req.body;
    const user = req.user;
    
    let targetSiteId = user.assignedSite;
    if (!targetSiteId && user.role === 'admin') {
      const Site = require('../models/Site');
      const firstSite = await Site.findOne().sort({ createdAt: 1 });
      if (firstSite) {
        targetSiteId = firstSite._id;
      }
    }
    
    if (!targetSiteId) {
      return res.status(400).json({ message: 'Site ID is required' });
    }

    // Create emergency activity record
    const activity = new Activity({
      type: 'incident',
      title: `Emergency Alert: ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      description: `Emergency ${type} activated by ${user.fullName}. ${message}`,
      site: targetSiteId,
      performedBy: user._id,
      metadata: {
        emergencyType: type,
        emergencyMessage: message,
        emergencyLocation: location,
        activatedBy: user.fullName,
        activatedAt: new Date()
      },
      priority: 'critical'
    });
    await activity.save();

    // Create critical alert for all users at the site
    await ActivityAlert.createSystemAlert(
      `EMERGENCY: ${type.toUpperCase()}`,
      `Emergency ${type} activated. ${message}${location ? ` Location: ${location}` : ''}`,
      targetSiteId,
      'critical',
      ['admin', 'site_manager', 'security_guard', 'receptionist']
    );

    // Send real-time emergency notification
    try {
      const io = req.app.get('io');
      if (io) {
        const emergencyData = {
          type: 'emergency',
          emergencyType: type,
          message,
          location,
          activatedBy: user.fullName,
          timestamp: new Date(),
          siteId: targetSiteId
        };
        
        // Emit to all clients
        io.emit('emergency_alert', emergencyData);
        // Emit specifically to site
        io.to(`site_${targetSiteId}`).emit('emergency_activated', emergencyData);
      }
    } catch (socketError) {
      console.error('Error sending real-time emergency notification:', socketError);
    }

    // SMS blast to site contacts if phone available
    try {
      const contacts = await User.find({
        assignedSite: targetSiteId,
        isActive: true,
        role: { $in: ['admin', 'site_manager', 'security_guard', 'receptionist'] },
        phone: { $exists: true, $ne: '' }
      }).select('phone fullName');
      const uniquePhones = Array.from(new Set(contacts.map(c => c.phone))).filter(Boolean);
      const smsBody = `EMERGENCY: ${type.toUpperCase()} - ${message}${location ? ` | Location: ${location}` : ''}`;
      const smsResult = await sendSmsBatch(uniquePhones, smsBody);
      res.json({
        message: 'Emergency activated successfully',
        activity,
        emergencyType: type,
        sms: { sent: smsResult.sent, failures: smsResult.failures }
      });
    } catch (smsErr) {
      console.error('Emergency SMS send error:', smsErr);
      res.json({
        message: 'Emergency activated successfully (SMS sending failed)',
        activity,
        emergencyType: type,
        sms: { sent: 0, failures: [{ error: smsErr.message || String(smsErr) }] }
      });
    }
  } catch (error) {
    console.error('Activate emergency error:', error);
    res.status(500).json({ message: 'Server error during emergency activation' });
  }
});

// @route   POST /api/emergency/deactivate
// @desc    Deactivate emergency mode
// @access  Private (All authenticated users)
router.post('/deactivate', auth, [
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const { notes } = req.body;
    const user = req.user;
    
    let targetSiteId = user.assignedSite;
    if (!targetSiteId && user.role === 'admin') {
      const Site = require('../models/Site');
      const firstSite = await Site.findOne().sort({ createdAt: 1 });
      if (firstSite) {
        targetSiteId = firstSite._id;
      }
    }
    
    if (!targetSiteId) {
      return res.status(400).json({ message: 'Site ID is required' });
    }

    // Create emergency deactivation activity record
    const activity = new Activity({
      type: 'incident',
      title: 'Emergency Deactivated',
      description: `Emergency mode deactivated by ${user.fullName}${notes ? `. Notes: ${notes}` : ''}`,
      site: targetSiteId,
      performedBy: user._id,
      metadata: {
        emergencyType: 'deactivation',
        deactivatedBy: user.fullName,
        deactivatedAt: new Date(),
        notes: notes
      },
      priority: 'high'
    });
    await activity.save();

    // Create alert for emergency deactivation
    await ActivityAlert.createSystemAlert(
      'Emergency Deactivated',
      `Emergency mode has been deactivated by ${user.fullName}`,
      targetSiteId,
      'info',
      ['admin', 'site_manager', 'security_guard', 'receptionist']
    );

    // Send real-time deactivation notification
    try {
      const io = req.app.get('io');
      if (io) {
        const deactivationData = {
          type: 'emergency_deactivated',
          deactivatedBy: user.fullName,
          timestamp: new Date(),
          notes,
          siteId: targetSiteId
        };
        
        // Emit to all clients
        io.emit('emergency_deactivated', deactivationData);
        // Emit specifically to site
        io.to(`site_${targetSiteId}`).emit('emergency_deactivated', deactivationData);
      }
    } catch (socketError) {
      console.error('Error sending real-time deactivation notification:', socketError);
    }

    res.json({
      message: 'Emergency deactivated successfully',
      activity
    });
  } catch (error) {
    console.error('Deactivate emergency error:', error);
    res.status(500).json({ message: 'Server error during emergency deactivation' });
  }
});

// @route   POST /api/emergency/notify
// @desc    Send emergency notification to specific contacts
// @access  Private
router.post('/notify', auth, [
  body('recipients').isArray().withMessage('Recipients must be an array'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['sms', 'email', 'both']).withMessage('Invalid notification type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipients, message, type } = req.body;
    const user = req.user;

    // Log the emergency notification
    const activity = new Activity({
      type: 'incident',
      title: 'Emergency Notification Sent',
      description: `Emergency notification sent by ${user.fullName} to ${recipients.length} recipients via ${type}`,
      site: user.assignedSite,
      performedBy: user._id,
      metadata: {
        notificationType: type,
        recipientCount: recipients.length,
        message: message,
        sentBy: user.fullName
      },
      priority: 'high'
    });
    await activity.save();

    // Prepare phone recipients from provided array (strings or objects)
    const phones = recipients
      .map(r => (typeof r === 'string' ? r : (r?.phone || r?.to)))
      .filter(Boolean);

    let smsResult = { sent: 0, failures: [] };
    if (type === 'sms' || type === 'both') {
      smsResult = await sendSmsBatch(phones, message);
    }

    res.json({
      message: 'Emergency notification sent successfully',
      recipientCount: recipients.length,
      type,
      sms: smsResult
    });
  } catch (error) {
    console.error('Send emergency notification error:', error);
    res.status(500).json({ message: 'Server error during notification' });
  }
});

// @route   GET /api/emergency/status
// @desc    Get current emergency status for a site
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const { siteId } = req.query;
    const user = req.user;
    
    let targetSiteId = siteId || user.assignedSite;
    if (!targetSiteId && user.role === 'admin') {
      const Site = require('../models/Site');
      const firstSite = await Site.findOne().sort({ createdAt: 1 });
      if (firstSite) {
        targetSiteId = firstSite._id;
      }
    }
    
    if (!targetSiteId) {
      return res.status(400).json({ message: 'Site ID is required' });
    }

    // Check for recent emergency activations (within last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentEmergencies = await Activity.find({
      site: targetSiteId,
      type: 'incident',
      'metadata.emergencyType': { $exists: true, $ne: 'deactivation' },
      timestamp: { $gte: twentyFourHoursAgo }
    }).sort({ timestamp: -1 }).limit(1);

    const recentDeactivations = await Activity.find({
      site: targetSiteId,
      type: 'incident',
      'metadata.emergencyType': 'deactivation',
      timestamp: { $gte: twentyFourHoursAgo }
    }).sort({ timestamp: -1 }).limit(1);

    let isEmergencyActive = false;
    let activeEmergency = null;

    if (recentEmergencies.length > 0) {
      const lastEmergency = recentEmergencies[0];
      const lastDeactivation = recentDeactivations.length > 0 ? recentDeactivations[0] : null;
      
      // Emergency is active if there's no deactivation after the last emergency
      if (!lastDeactivation || lastEmergency.timestamp > lastDeactivation.timestamp) {
        isEmergencyActive = true;
        activeEmergency = lastEmergency;
      }
    }

    res.json({
      isEmergencyActive,
      activeEmergency,
      recentEmergencies: recentEmergencies.slice(0, 5),
      recentDeactivations: recentDeactivations.slice(0, 5)
    });
  } catch (error) {
    console.error('Get emergency status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
