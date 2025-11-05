const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  // Activity Type
  type: {
    type: String,
    enum: ['checkin', 'checkout', 'incident', 'security_alert', 'access_point_created', 'access_point_updated'],
    required: true
  },
  
  // Activity Description
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Related Entities
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
  incident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  },
  
  // User who performed the action
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Activity Metadata
  metadata: {
    visitorName: String,
    visitorCompany: String,
    visitorBadgeNumber: String,
    accessPointName: String,
    checkInTime: Date,
    checkOutTime: Date,
    duration: Number, // in minutes
    ipAddress: String,
    userAgent: String
  },
  
  // Priority/Severity
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved'],
    default: 'active'
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
activitySchema.index({ site: 1, timestamp: -1 });
activitySchema.index({ type: 1, timestamp: -1 });
activitySchema.index({ performedBy: 1, timestamp: -1 });
activitySchema.index({ visitor: 1, timestamp: -1 });
activitySchema.index({ priority: 1, status: 1 });

// Static method to create visitor check-in activity
activitySchema.statics.createCheckInActivity = async function(visitor, user, accessPoint) {
  const activity = new this({
    type: 'checkin',
    title: 'Visitor Check-in',
    description: `${visitor.fullName} from ${visitor.company} checked in at ${accessPoint.name}`,
    visitor: visitor._id,
    site: visitor.site,
    accessPoint: accessPoint._id,
    performedBy: user._id,
    metadata: {
      visitorName: visitor.fullName,
      visitorCompany: visitor.company,
      visitorBadgeNumber: visitor.badgeNumber,
      accessPointName: accessPoint.name,
      checkInTime: visitor.checkInTime
    },
    priority: 'medium'
  });
  
  return await activity.save();
};

// Static method to create visitor check-out activity
activitySchema.statics.createCheckOutActivity = async function(visitor, user, accessPoint) {
  const duration = visitor.checkOutTime && visitor.checkInTime 
    ? Math.round((visitor.checkOutTime - visitor.checkInTime) / (1000 * 60)) 
    : 0;
    
  const activity = new this({
    type: 'checkout',
    title: 'Visitor Check-out',
    description: `${visitor.fullName} from ${visitor.company} checked out after ${Math.floor(duration / 60)}h ${duration % 60}m`,
    visitor: visitor._id,
    site: visitor.site,
    accessPoint: accessPoint._id,
    performedBy: user._id,
    metadata: {
      visitorName: visitor.fullName,
      visitorCompany: visitor.company,
      visitorBadgeNumber: visitor.badgeNumber,
      accessPointName: accessPoint.name,
      checkInTime: visitor.checkInTime,
      checkOutTime: visitor.checkOutTime,
      duration: duration
    },
    priority: 'medium'
  });
  
  return await activity.save();
};

// Static method to create access point activity
activitySchema.statics.createAccessPointActivity = async function(type, accessPoint, user, description) {
  const activity = new this({
    type: type,
    title: type === 'access_point_created' ? 'Access Point Created' : 'Access Point Updated',
    description: description || `Access point ${accessPoint.name} was ${type === 'access_point_created' ? 'created' : 'updated'}`,
    site: accessPoint.site,
    accessPoint: accessPoint._id,
    performedBy: user._id,
    metadata: {
      accessPointName: accessPoint.name,
      accessPointType: accessPoint.type,
      accessLevel: accessPoint.accessLevel
    },
    priority: 'low'
  });
  
  return await activity.save();
};

module.exports = mongoose.model('Activity', activitySchema);
