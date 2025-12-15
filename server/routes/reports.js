const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Visitor = require('../models/Visitor');
const Incident = require('../models/Incident');
const BannedVisitor = require('../models/BannedVisitor');
const Site = require('../models/Site');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

const toObjectId = (v) => {
  if (!v) return null;
  if (v instanceof mongoose.Types.ObjectId) return v;
  const s = String(v);
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
};

const resolveSiteScope = async (user, siteId) => {
  const userSite = toObjectId(user.assignedSite) || user.assignedSite || null;

  if (siteId) {
    const requested = toObjectId(siteId);
    if (!requested) {
      return { error: { status: 400, message: 'Invalid site ID' } };
    }

    if (user.role === 'admin') {
      const managed = await Site.find({ admin: user._id }).select('_id');
      const managedIds = managed.map((s) => s._id.toString());
      if (!managedIds.includes(requested.toString())) {
        return { error: { status: 403, message: 'Access denied to this site' } };
      }
      return { siteIds: [requested] };
    }

    if (!userSite || String(userSite) !== requested.toString()) {
      return { error: { status: 403, message: 'Access denied to this site' } };
    }

    return { siteIds: [requested] };
  }

  if (user.role === 'admin') {
    const managed = await Site.find({ admin: user._id }).select('_id').sort({ createdAt: 1 });
    const ids = managed.map((s) => s._id).filter(Boolean);
    if (!ids.length) {
      return { error: { status: 400, message: 'Site ID is required' } };
    }
    return { siteIds: ids };
  }

  if (!userSite) {
    return { error: { status: 400, message: 'Site ID is required' } };
  }

  return { siteIds: [toObjectId(userSite) || userSite] };
};

const buildSiteMatch = (siteIds) => {
  const ids = (siteIds || []).filter(Boolean);
  const values = ids.flatMap((id) => [id, id.toString()]);
  return { $in: values };
};

// @route   GET /api/reports/visitor-summary
// @desc    Get visitor summary report
// @access  Private (Admin, Site Manager)
router.get('/visitor-summary', auth, authorize('admin', 'site_manager'), async (req, res) => {
  try {
    const { siteId, startDate, endDate } = req.query;
    const user = req.user;
    const resolved = await resolveSiteScope(user, siteId);
    if (resolved.error) {
      return res.status(resolved.error.status).json({ message: resolved.error.message });
    }
    const siteIds = resolved.siteIds || [];
    const siteMatch = buildSiteMatch(siteIds);

    const start = startDate ? new Date(startDate) : new Date(0);
    if (startDate) start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    if (endDate) end.setHours(23, 59, 59, 999);

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
        site: siteMatch, 
        checkInTime: { $gte: start, $lte: end } 
      }),
      Visitor.countDocuments({ 
        site: siteMatch, 
        status: 'checked_in' 
      }),
      Visitor.countDocuments({ 
        site: siteMatch, 
        status: 'checked_out',
        checkInTime: { $gte: start, $lte: end }
      }),
      Visitor.countDocuments({ 
        site: siteMatch, 
        status: 'checked_in',
        $expr: {
          $gt: [
            { $divide: [{ $subtract: [new Date(), '$checkInTime'] }, 1000 * 60 * 60] },
            '$expectedDuration'
          ]
        }
      }),
      Visitor.aggregate([
        { $match: { site: siteMatch, checkInTime: { $gte: start, $lte: end } } },
        { $group: { _id: '$company', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Visitor.aggregate([
        { $match: { site: siteMatch, checkInTime: { $gte: start, $lte: end } } },
        { $group: { 
          _id: { $hour: '$checkInTime' }, 
          count: { $sum: 1 } 
        }},
        { $sort: { _id: 1 } }
      ]),
      Visitor.aggregate([
        { 
          $match: { 
            site: siteMatch, 
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
    const resolved = await resolveSiteScope(user, siteId);
    if (resolved.error) {
      return res.status(resolved.error.status).json({ message: resolved.error.message });
    }
    const siteIds = resolved.siteIds || [];
    const siteMatch = buildSiteMatch(siteIds);

    const start = startDate ? new Date(startDate) : new Date(0);
    if (startDate) start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    if (endDate) end.setHours(23, 59, 59, 999);

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
        site: siteMatch, 
        incidentDate: { $gte: start, $lte: end } 
      }),
      Incident.aggregate([
        { $match: { site: siteMatch, incidentDate: { $gte: start, $lte: end } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Incident.aggregate([
        { $match: { site: siteMatch, incidentDate: { $gte: start, $lte: end } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Incident.aggregate([
        { $match: { site: siteMatch, incidentDate: { $gte: start, $lte: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Incident.countDocuments({ 
        site: siteMatch, 
        status: 'resolved',
        incidentDate: { $gte: start, $lte: end }
      }),
      Incident.aggregate([
        { 
          $match: { 
            site: siteMatch, 
            status: 'resolved',
            incidentDate: { $gte: start, $lte: end }
          } 
        },
        {
          $addFields: {
            resolutionTime: {
              $divide: [
                { $subtract: ['$resolution.resolvedDate', '$incidentDate'] },
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
    const resolved = await resolveSiteScope(user, siteId);
    if (resolved.error) {
      return res.status(resolved.error.status).json({ message: resolved.error.message });
    }
    const siteIds = resolved.siteIds || [];
    const siteMatch = buildSiteMatch(siteIds);

    const start = startDate ? new Date(startDate) : new Date(0);
    if (startDate) start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    if (endDate) end.setHours(23, 59, 59, 999);

    // Get security statistics
    const [
      totalBanned,
      bannedThisPeriod,
      bannedByCompany,
      bannedByReason,
      bannedAttempts
    ] = await Promise.all([
      BannedVisitor.countDocuments({ 
        site: siteMatch, 
        isActive: true 
      }),
      BannedVisitor.countDocuments({ 
        site: siteMatch, 
        bannedDate: { $gte: start, $lte: end },
        isActive: true 
      }),
      BannedVisitor.aggregate([
        { $match: { site: siteMatch, isActive: true } },
        { $group: { _id: '$company', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      BannedVisitor.aggregate([
        { $match: { site: siteMatch, isActive: true } },
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
    const resolved = await resolveSiteScope(user, siteId);
    if (resolved.error) {
      return res.status(resolved.error.status).json({ message: resolved.error.message });
    }
    const siteIds = resolved.siteIds || [];
    const siteMatch = buildSiteMatch(siteIds);

    const start = startDate ? new Date(startDate) : new Date(0);
    if (startDate) start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    if (endDate) end.setHours(23, 59, 59, 999);

    let data = {};

    switch (type) {
      case 'visitors':
        const visitors = await Visitor.find({
          site: siteMatch,
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
          site: siteMatch,
          incidentDate: { $gte: start, $lte: end }
        })
        .populate('reportedBy', 'fullName email')
        .populate('investigation.assignedTo', 'fullName email')
        .sort({ reportedDate: -1 });

        data = { incidents };
        break;

      case 'banned':
        const bannedVisitors = await BannedVisitor.find({
          site: siteMatch,
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
      // Build CSV content for requested type
      let rows = [];
      let headers = [];
      const toCsv = (items, cols) => {
        const escape = (v) => {
          if (v === null || v === undefined) return '';
          const s = String(v).replace(/"/g, '""');
          return /[",\n]/.test(s) ? `"${s}"` : s;
        };
        const head = cols.join(',');
        const body = items.map(it => cols.map(c => escape(it[c])).join(',')).join('\n');
        return head + '\n' + body + '\n';
      };

      switch (type) {
        case 'visitors': {
          const list = (data.visitors || []).map(v => ({
            name: v.name || v.fullName || '',
            company: v.company || '',
            status: v.status || '',
            checkInTime: v.checkInTime ? new Date(v.checkInTime).toISOString() : '',
            checkOutTime: v.checkOutTime ? new Date(v.checkOutTime).toISOString() : '',
            accessPoint: v.accessPoint?.name || '',
            checkedInBy: v.checkedInBy?.fullName || '',
            checkedOutBy: v.checkedOutBy?.fullName || ''
          }));
          headers = ['name','company','status','checkInTime','checkOutTime','accessPoint','checkedInBy','checkedOutBy'];
          rows = list;
          break;
        }
        case 'incidents': {
          const list = (data.incidents || []).map(i => ({
            title: i.title || '',
            type: i.type || '',
            severity: i.severity || '',
            reportedDate: i.reportedDate ? new Date(i.reportedDate).toISOString() : '',
            reportedBy: i.reportedBy?.fullName || '',
            status: i.status || ''
          }));
          headers = ['title','type','severity','reportedDate','reportedBy','status'];
          rows = list;
          break;
        }
        case 'banned': {
          const list = (data.bannedVisitors || []).map(b => ({
            name: b.name || b.fullName || '',
            reason: b.reason || '',
            bannedDate: b.bannedDate ? new Date(b.bannedDate).toISOString() : '',
            bannedBy: b.bannedBy?.fullName || ''
          }));
          headers = ['name','reason','bannedDate','bannedBy'];
          rows = list;
          break;
        }
      }

      const csv = rows.length ? toCsv(rows, headers) : headers.join(',') + '\n';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.csv"`);
      // Prepend BOM to ensure Excel opens UTF-8 correctly
      res.send('\uFEFF' + csv);
    } else {
      res.json(data);
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Server error during export' });
  }
});

module.exports = router;

