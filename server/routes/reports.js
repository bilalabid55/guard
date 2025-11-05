const express = require('express');
const { body, validationResult } = require('express-validator');
const Visitor = require('../models/Visitor');
const Incident = require('../models/Incident');
const BannedVisitor = require('../models/BannedVisitor');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/visitor-summary
// @desc    Get visitor summary report
// @access  Private (Admin, Site Manager)
router.get('/visitor-summary', auth, authorize('admin', 'site_manager'), async (req, res) => {
  try {
    const { siteId, startDate, endDate } = req.query;
    const user = req.user;
    const targetSiteId = siteId || user.assignedSite;

    if (!targetSiteId) {
      return res.status(400).json({ message: 'Site ID is required' });
    }

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get visitor statistics
    const [
      totalVisitors,
      currentlyOnSite,
      checkedOut,
      overstayed,
      visitorsByCompany,
      visitorsByHour,
      averageDuration
    ] = await Promise.all([
      Visitor.countDocuments({ 
        site: targetSiteId, 
        checkInTime: { $gte: start, $lte: end } 
      }),
      Visitor.countDocuments({ 
        site: targetSiteId, 
        status: 'checked_in' 
      }),
      Visitor.countDocuments({ 
        site: targetSiteId, 
        status: 'checked_out',
        checkInTime: { $gte: start, $lte: end }
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
      Visitor.aggregate([
        { $match: { site: targetSiteId, checkInTime: { $gte: start, $lte: end } } },
        { $group: { _id: '$company', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Visitor.aggregate([
        { $match: { site: targetSiteId, checkInTime: { $gte: start, $lte: end } } },
        { $group: { 
          _id: { $hour: '$checkInTime' }, 
          count: { $sum: 1 } 
        }},
        { $sort: { _id: 1 } }
      ]),
      Visitor.aggregate([
        { 
          $match: { 
            site: targetSiteId, 
            status: 'checked_out',
            checkInTime: { $gte: start, $lte: end }
          } 
        },
        {
          $addFields: {
            duration: {
              $divide: [
                { $subtract: ['$checkOutTime', '$checkInTime'] },
                1000 * 60 * 60 // Convert to hours
              ]
            }
          }
        },
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
      ])
    ]);

    res.json({
      summary: {
        totalVisitors,
        currentlyOnSite,
        checkedOut,
        overstayed,
        averageDuration: averageDuration[0]?.avgDuration || 0
      },
      visitorsByCompany,
      visitorsByHour,
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('Get visitor summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/incident-summary
// @desc    Get incident summary report
// @access  Private (Admin, Site Manager)
router.get('/incident-summary', auth, authorize('admin', 'site_manager'), async (req, res) => {
  try {
    const { siteId, startDate, endDate } = req.query;
    const user = req.user;
    const targetSiteId = siteId || user.assignedSite;

    if (!targetSiteId) {
      return res.status(400).json({ message: 'Site ID is required' });
    }

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get incident statistics
    const [
      totalIncidents,
      incidentsByType,
      incidentsBySeverity,
      incidentsByStatus,
      resolvedIncidents,
      averageResolutionTime
    ] = await Promise.all([
      Incident.countDocuments({ 
        site: targetSiteId, 
        reportedDate: { $gte: start, $lte: end } 
      }),
      Incident.aggregate([
        { $match: { site: targetSiteId, reportedDate: { $gte: start, $lte: end } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Incident.aggregate([
        { $match: { site: targetSiteId, reportedDate: { $gte: start, $lte: end } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Incident.aggregate([
        { $match: { site: targetSiteId, reportedDate: { $gte: start, $lte: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Incident.countDocuments({ 
        site: targetSiteId, 
        status: 'resolved',
        reportedDate: { $gte: start, $lte: end }
      }),
      Incident.aggregate([
        { 
          $match: { 
            site: targetSiteId, 
            status: 'resolved',
            reportedDate: { $gte: start, $lte: end }
          } 
        },
        {
          $addFields: {
            resolutionTime: {
              $divide: [
                { $subtract: ['$resolution.resolvedDate', '$reportedDate'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            }
          }
        },
        { $group: { _id: null, avgResolutionTime: { $avg: '$resolutionTime' } } }
      ])
    ]);

    res.json({
      summary: {
        totalIncidents,
        resolvedIncidents,
        averageResolutionTime: averageResolutionTime[0]?.avgResolutionTime || 0
      },
      incidentsByType,
      incidentsBySeverity,
      incidentsByStatus,
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('Get incident summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/security-summary
// @desc    Get security summary report
// @access  Private (Admin, Site Manager)
router.get('/security-summary', auth, authorize('admin', 'site_manager'), async (req, res) => {
  try {
    const { siteId, startDate, endDate } = req.query;
    const user = req.user;
    const targetSiteId = siteId || user.assignedSite;

    if (!targetSiteId) {
      return res.status(400).json({ message: 'Site ID is required' });
    }

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get security statistics
    const [
      totalBanned,
      bannedThisPeriod,
      bannedByCompany,
      bannedByReason,
      bannedAttempts
    ] = await Promise.all([
      BannedVisitor.countDocuments({ 
        site: targetSiteId, 
        isActive: true 
      }),
      BannedVisitor.countDocuments({ 
        site: targetSiteId, 
        bannedDate: { $gte: start, $lte: end },
        isActive: true 
      }),
      BannedVisitor.aggregate([
        { $match: { site: targetSiteId, isActive: true } },
        { $group: { _id: '$company', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      BannedVisitor.aggregate([
        { $match: { site: targetSiteId, isActive: true } },
        { $group: { _id: '$reason', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // This would need to be tracked separately in a real implementation
      0
    ]);

    res.json({
      summary: {
        totalBanned,
        bannedThisPeriod,
        bannedAttempts
      },
      bannedByCompany,
      bannedByReason,
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('Get security summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/export
// @desc    Export report data
// @access  Private (Admin, Site Manager)
router.get('/export', auth, authorize('admin', 'site_manager'), async (req, res) => {
  try {
    const { siteId, type, format = 'json', startDate, endDate } = req.query;
    const user = req.user;
    const targetSiteId = siteId || user.assignedSite;

    if (!targetSiteId) {
      return res.status(400).json({ message: 'Site ID is required' });
    }

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    let data = {};

    switch (type) {
      case 'visitors':
        const visitors = await Visitor.find({
          site: targetSiteId,
          checkInTime: { $gte: start, $lte: end }
        })
        .populate('accessPoint', 'name type')
        .populate('checkedInBy', 'fullName')
        .populate('checkedOutBy', 'fullName')
        .sort({ checkInTime: -1 });

        data = { visitors };
        break;

      case 'incidents':
        const incidents = await Incident.find({
          site: targetSiteId,
          reportedDate: { $gte: start, $lte: end }
        })
        .populate('reportedBy', 'fullName email')
        .populate('investigation.assignedTo', 'fullName email')
        .sort({ reportedDate: -1 });

        data = { incidents };
        break;

      case 'banned':
        const bannedVisitors = await BannedVisitor.find({
          site: targetSiteId,
          bannedDate: { $gte: start, $lte: end }
        })
        .populate('bannedBy', 'fullName email')
        .sort({ bannedDate: -1 });

        data = { bannedVisitors };
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    if (format === 'csv') {
      // In a real implementation, you would convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.csv"`);
      res.send(JSON.stringify(data, null, 2));
    } else {
      res.json(data);
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Server error during export' });
  }
});

module.exports = router;

