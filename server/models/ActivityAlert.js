const mongoose = require('mongoose');

const activityAlertSchema = new mongoose.Schema({
  // Alert Type
  type: {
    type: String,
    enum: ['visitor_checkin', 'visitor_checkout', 'overstay', 'banned_visitor', 'security_breach', 'system'],
    required: true
  },
  
  // Alert Details
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  
  // Related Entities
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  },
  visitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor'
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  accessPoint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccessPoint'
  },
  
  // Alert Metadata
  metadata: {
    visitorName: String,
    visitorCompany: String,
    performedByName: String,
    performedByRole: String,
    accessPointName: String,
    timestamp: Date,
    ipAddress: String,
    additionalInfo: mongoose.Schema.Types.Mixed
  },
  
  // Priority/Severity
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  },
  
  // Alert Status
  status: {
    type: String,
    enum: ['unread', 'read', 'acknowledged', 'dismissed'],
    default: 'unread'
  },
  
  // Recipients
  targetRoles: [{
    type: String,
    enum: ['admin', 'site_manager', 'security_guard', 'receptionist']
  }],
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Read/Acknowledgment tracking
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  acknowledgedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  
  // Auto-dismiss settings
  autoDismiss: {
    type: Boolean,
    default: false
  },
  dismissAt: {
    type: Date
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
activityAlertSchema.index({ site: 1, createdAt: -1 });
activityAlertSchema.index({ type: 1, status: 1 });
activityAlertSchema.index({ severity: 1, status: 1 });
activityAlertSchema.index({ targetRoles: 1, status: 1 });
activityAlertSchema.index({ targetUsers: 1, status: 1 });
activityAlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance methods
activityAlertSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({ user: userId });
    if (this.status === 'unread') {
      this.status = 'read';
    }
  }
  return this.save();
};

activityAlertSchema.methods.acknowledge = function(userId, note) {
  const existingAck = this.acknowledgedBy.find(a => a.user.toString() === userId.toString());
  if (!existingAck) {
    this.acknowledgedBy.push({ user: userId, note });
    this.status = 'acknowledged';
  }
  return this.save();
};

activityAlertSchema.methods.dismiss = function() {
  this.status = 'dismissed';
  return this.save();
};

// Static methods
activityAlertSchema.statics.createVisitorAlert = async function(type, visitor, user, accessPoint, additionalInfo = {}) {
  let title, message, severity;
  
  switch (type) {
    case 'visitor_checkin':
      title = 'Visitor Check-in';
      message = `${visitor.fullName} from ${visitor.company} checked in at ${accessPoint.name}`;
      severity = 'info';
      break;
    case 'visitor_checkout':
      title = 'Visitor Check-out';
      message = `${visitor.fullName} from ${visitor.company} checked out`;
      severity = 'info';
      break;
    case 'overstay':
      title = 'Visitor Overstay Alert';
      message = `${visitor.fullName} has exceeded expected visit duration`;
      severity = 'warning';
      break;
    case 'banned_visitor':
      title = 'Banned Visitor Alert';
      message = `Banned visitor ${visitor.fullName} attempted to check in`;
      severity = 'critical';
      break;
    default:
      title = 'Visitor Activity';
      message = `Activity for ${visitor.fullName}`;
      severity = 'info';
  }
  
  const alert = new this({
    type,
    title,
    message,
    visitor: visitor._id,
    site: visitor.site,
    accessPoint: accessPoint._id,
    severity,
    targetRoles: ['admin', 'site_manager', 'security_guard'],
    metadata: {
      visitorName: visitor.fullName,
      visitorCompany: visitor.company,
      performedByName: user.fullName,
      performedByRole: user.role,
      accessPointName: accessPoint.name,
      timestamp: new Date(),
      additionalInfo
    }
  });
  
  return await alert.save();
};

activityAlertSchema.statics.createSystemAlert = async function(title, message, siteId, severity = 'info', targetRoles = ['admin']) {
  const alert = new this({
    type: 'system',
    title,
    message,
    site: siteId,
    severity,
    targetRoles,
    metadata: {
      timestamp: new Date()
    }
  });
  
  return await alert.save();
};

// Get unread alerts count for a user
activityAlertSchema.statics.getUnreadCount = async function(userId, userRole, siteId) {
  const query = {
    site: siteId,
    status: { $in: ['unread', 'read'] },
    $or: [
      { targetRoles: userRole },
      { targetUsers: userId }
    ],
    'readBy.user': { $ne: userId }
  };
  
  return await this.countDocuments(query);
};

module.exports = mongoose.model('ActivityAlert', activityAlertSchema);
