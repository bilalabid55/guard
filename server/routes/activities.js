const express = require('express');
const Activity = require('../models/Activity');
const ActivityAlert = require('../models/ActivityAlert');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/activities/recent
// @desc    Get recent activities for a site
// @access  Private
router.get('/recent', auth, async (req, res) => {
  try {
    const { siteId, limit = 20, page = 1, type } = req.query;
    const user = req.user;

    // Tenant isolation
    let siteFilter = [];
    if (siteId) {
      siteFilter = [siteId];
    } else if (user.role === 'admin') {
      const Site = require('../models/Site');
      const managed = await Site.find({ admin: user._id }).select('_id');
      siteFilter = managed.map(s => s._id);
    } else if (user.assignedSite) {
      siteFilter = [user.assignedSite];
    }

    if (!siteFilter || siteFilter.length === 0) {
      return res.status(400).json({ message: 'Site context required' });
    }

    // Build query
    const query = { site: { $in: siteFilter } };
    if (type) {
      query.type = type;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get activities with pagination
    const activities = await Activity.find(query)
      .populate('visitor', 'fullName company badgeNumber')
      .populate('performedBy', 'fullName role')
      .populate('accessPoint', 'name type')
      .populate('site', 'name')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Activity.countDocuments(query);

    res.json({
      activities,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/activities/alerts
// @desc    Get activity alerts for a user
// @access  Private
router.get('/alerts', auth, async (req, res) => {
  try {
    const { siteId, status = 'unread', limit = 20, page = 1, severity } = req.query;
    const user = req.user;

    // Tenant isolation
    let siteFilter = [];
    if (siteId) {
      siteFilter = [siteId];
    } else if (user.role === 'admin') {
      const Site = require('../models/Site');
      const managed = await Site.find({ admin: user._id }).select('_id');
      siteFilter = managed.map(s => s._id);
    } else if (user.assignedSite) {
      siteFilter = [user.assignedSite];
    }

    if (!siteFilter || siteFilter.length === 0) {
      return res.status(400).json({ message: 'Site context required' });
    }

    // Build query based on user role and permissions
    const query = {
      site: { $in: siteFilter },
      $or: [
        { targetRoles: user.role },
        { targetUsers: user._id }
      ]
    };

    if (status && status !== 'all') {
      if (status === 'unread') {
        query.status = { $in: ['unread', 'read'] };
        query['readBy.user'] = { $ne: user._id };
      } else {
        query.status = status;
      }
    }

    if (severity) {
      query.severity = severity;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get alerts with pagination
    const alerts = await ActivityAlert.find(query)
      .populate('visitor', 'fullName company badgeNumber')
      .populate('accessPoint', 'name type')
      .populate('site', 'name')
      .populate('readBy.user', 'fullName')
      .populate('acknowledgedBy.user', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ActivityAlert.countDocuments(query);

    // Get unread count
    const unreadCount = await ActivityAlert.getUnreadCount(user._id, user.role, siteFilter[0]);

    res.json({
      alerts,
      unreadCount,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get activity alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/activities/alerts/:id/read
// @desc    Mark an alert as read
// @access  Private
router.put('/alerts/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const alert = await ActivityAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Check if user has permission to read this alert
    const hasPermission = alert.targetRoles.includes(user.role) || 
                         alert.targetUsers.some(userId => userId.toString() === user._id.toString());

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to read this alert' });
    }

    await alert.markAsRead(user._id);

    res.json({ message: 'Alert marked as read', alert });
  } catch (error) {
    console.error('Mark alert as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/activities/alerts/:id/acknowledge
// @desc    Acknowledge an alert
// @access  Private
router.put('/alerts/:id/acknowledge', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const user = req.user;

    const alert = await ActivityAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Check if user has permission to acknowledge this alert
    const hasPermission = alert.targetRoles.includes(user.role) || 
                         alert.targetUsers.some(userId => userId.toString() === user._id.toString());

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to acknowledge this alert' });
    }

    await alert.acknowledge(user._id, note);

    res.json({ message: 'Alert acknowledged', alert });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/activities/alerts/:id/dismiss
// @desc    Dismiss an alert
// @access  Private (Admin, Site Manager)
router.put('/alerts/:id/dismiss', auth, authorize('admin', 'site_manager'), async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await ActivityAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    await alert.dismiss();

    res.json({ message: 'Alert dismissed', alert });
  } catch (error) {
    console.error('Dismiss alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/activities/stats
// @desc    Get activity statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const { siteId, timeRange = 'today' } = req.query;
    const user = req.user;

    // Tenant isolation
    let siteFilter = [];
    if (siteId) {
      siteFilter = [siteId];
    } else if (user.role === 'admin') {
      const Site = require('../models/Site');
      const managed = await Site.find({ admin: user._id }).select('_id');
      siteFilter = managed.map(s => s._id);
    } else if (user.assignedSite) {
      siteFilter = [user.assignedSite];
    }

    if (!siteFilter || siteFilter.length === 0) {
      return res.status(400).json({ message: 'Site context required' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const query = {
      timestamp: { $gte: startDate },
      site: { $in: siteFilter }
    };

    // Get activity counts by type
    const activityStats = await Activity.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get alert counts by severity
    const alertQuery = {
      createdAt: { $gte: startDate },
      site: { $in: siteFilter }
    };

    const alertStats = await ActivityAlert.aggregate([
      { $match: alertQuery },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get total counts
    const totalActivities = await Activity.countDocuments(query);
    const totalAlerts = await ActivityAlert.countDocuments(alertQuery);
    const unreadAlerts = await ActivityAlert.getUnreadCount(user._id, user.role, siteFilter[0]);

    res.json({
      timeRange,
      totalActivities,
      totalAlerts,
      unreadAlerts,
      activityStats,
      alertStats
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/activities/alerts/cleanup
// @desc    Clean up old dismissed alerts
// @access  Private (Admin only)
router.delete('/alerts/cleanup', auth, authorize('admin'), async (req, res) => {
  try {
    const { olderThanDays = 30 } = req.query;
    const cutoffDate = new Date(Date.now() - parseInt(olderThanDays) * 24 * 60 * 60 * 1000);

    const result = await ActivityAlert.deleteMany({
      status: 'dismissed',
      createdAt: { $lt: cutoffDate }
    });

    res.json({
      message: `Cleaned up ${result.deletedCount} old dismissed alerts`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Cleanup alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
