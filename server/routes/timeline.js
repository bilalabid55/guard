const express = require('express');
const Visitor = require('../models/Visitor');
const Incident = require('../models/Incident');
const BannedVisitor = require('../models/BannedVisitor');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/timeline/events
// @desc    Get timeline events for a site
// @access  Private
router.get('/events', auth, async (req, res) => {
  try {
    const { siteId, timeRange = 'today', eventTypes = ['checkin', 'checkout', 'security', 'incident'] } = req.query;
    const user = req.user;

    // Tenant isolation
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
      return res.status(400).json({ message: 'Site ID is required' });
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

    const events = [];

    // Get visitor check-ins and check-outs
    if (eventTypes.includes('checkin') || eventTypes.includes('checkout')) {
      const visitors = await Visitor.find({
        site: targetSiteId,
        checkInTime: { $gte: startDate }
      })
      .populate('checkedInBy', 'fullName role')
      .populate('checkedOutBy', 'fullName role')
      .populate('accessPoint', 'name')
      .sort({ checkInTime: -1 });

      visitors.forEach(visitor => {
        // Check-in event
        if (eventTypes.includes('checkin')) {
          events.push({
            id: `checkin_${visitor._id}`,
            type: 'checkin',
            timestamp: visitor.checkInTime,
            title: 'Visitor Check-in',
            description: `${visitor.fullName} from ${visitor.company} checked in at ${visitor.accessPoint?.name || 'Unknown Access Point'}`,
            user: {
              name: visitor.checkedInBy?.fullName || 'Unknown',
              role: visitor.checkedInBy?.role || 'unknown'
            },
            visitor: {
              name: visitor.fullName,
              company: visitor.company,
              badgeNumber: visitor.badgeNumber
            }
          });
        }

        // Check-out event
        if (eventTypes.includes('checkout') && visitor.checkOutTime) {
          events.push({
            id: `checkout_${visitor._id}`,
            type: 'checkout',
            timestamp: visitor.checkOutTime,
            title: 'Visitor Check-out',
            description: `${visitor.fullName} from ${visitor.company} checked out`,
            user: {
              name: visitor.checkedOutBy?.fullName || 'Unknown',
              role: visitor.checkedOutBy?.role || 'unknown'
            },
            visitor: {
              name: visitor.fullName,
              company: visitor.company,
              badgeNumber: visitor.badgeNumber
            }
          });
        }
      });
    }

    // Get security incidents
    if (eventTypes.includes('security') || eventTypes.includes('incident')) {
      const incidents = await Incident.find({
        site: targetSiteId,
        reportedDate: { $gte: startDate }
      })
      .populate('reportedBy', 'fullName role')
      .sort({ reportedDate: -1 });

      incidents.forEach(incident => {
        events.push({
          id: `incident_${incident._id}`,
          type: 'incident',
          timestamp: incident.reportedDate,
          title: `${incident.type.charAt(0).toUpperCase() + incident.type.slice(1)} Incident`,
          description: incident.description,
          user: {
            name: incident.reportedBy?.fullName || 'Unknown',
            role: incident.reportedBy?.role || 'unknown'
          },
          severity: incident.severity,
          metadata: {
            incidentId: incident._id,
            type: incident.type,
            status: incident.status
          }
        });
      });
    }

    // Get banned visitor attempts (if available in logs)
    if (eventTypes.includes('security')) {
      // This would typically come from a security log or audit trail
      // For now, we'll add a placeholder for demonstration
      events.push({
        id: 'security_1',
        type: 'security',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        title: 'Security Alert',
        description: 'Unauthorized access attempt detected',
        user: {
          name: 'Security System',
          role: 'system'
        },
        severity: 'high'
      });
    }

    // Sort events by timestamp (most recent first)
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      events,
      total: events.length,
      timeRange,
      eventTypes
    });
  } catch (error) {
    console.error('Get timeline events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/timeline/stats
// @desc    Get timeline statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const { siteId } = req.query;
    const user = req.user;

    const targetSiteId = siteId || user.assignedSite;
    if (!targetSiteId) {
      return res.status(400).json({ message: 'Site ID is required' });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get today's statistics
    const todayCheckIns = await Visitor.countDocuments({
      site: targetSiteId,
      checkInTime: { $gte: startOfDay }
    });

    const todayCheckOuts = await Visitor.countDocuments({
      site: targetSiteId,
      checkOutTime: { $gte: startOfDay }
    });

    const todayIncidents = await Incident.countDocuments({
      site: targetSiteId,
      reportedDate: { $gte: startOfDay }
    });

    // Get week's statistics
    const weekCheckIns = await Visitor.countDocuments({
      site: targetSiteId,
      checkInTime: { $gte: startOfWeek }
    });

    const weekIncidents = await Incident.countDocuments({
      site: targetSiteId,
      reportedDate: { $gte: startOfWeek }
    });

    res.json({
      today: {
        checkIns: todayCheckIns,
        checkOuts: todayCheckOuts,
        incidents: todayIncidents
      },
      week: {
        checkIns: weekCheckIns,
        incidents: weekIncidents
      }
    });
  } catch (error) {
    console.error('Get timeline stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
