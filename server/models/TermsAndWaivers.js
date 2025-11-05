const mongoose = require('mongoose');

const termsAndWaiversSchema = new mongoose.Schema({
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Terms title is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['terms_of_access', 'liability_waiver', 'safety_agreement', 'privacy_policy', 'custom'],
    required: true
  },
  content: {
    type: String,
    required: [true, 'Terms content is required']
  },
  version: {
    type: String,
    required: true,
    default: '1.0'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Custom fields for different types of terms
  customFields: {
    // For liability waivers
    liabilityLimits: {
      type: String
    },
    insuranceRequirements: {
      type: String
    },
    // For safety agreements
    safetyRequirements: [String],
    ppeRequirements: [String],
    emergencyProcedures: {
      type: String
    },
    // For privacy policies
    dataCollection: [String],
    dataUsage: [String],
    dataSharing: [String],
    dataRetention: {
      type: String
    }
  },
  // Acceptance tracking
  acceptanceHistory: [{
    visitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visitor'
    },
    acceptedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    signature: String, // Base64 encoded signature if applicable
    version: String
  }],
  // Legal compliance
  legalCompliance: {
    jurisdiction: String,
    governingLaw: String,
    disputeResolution: String,
    lastLegalReview: Date,
    reviewedBy: String
  },
  // Notifications
  notificationSettings: {
    notifyOnAcceptance: {
      type: Boolean,
      default: false
    },
    notifyOnExpiry: {
      type: Boolean,
      default: true
    },
    notificationRecipients: [String] // Email addresses
  }
}, {
  timestamps: true
});

// Indexes for better query performance
termsAndWaiversSchema.index({ site: 1, isActive: 1 });
termsAndWaiversSchema.index({ type: 1, isActive: 1 });
termsAndWaiversSchema.index({ effectiveDate: -1 });
termsAndWaiversSchema.index({ expiryDate: 1 });

// Virtual for checking if terms are expired
termsAndWaiversSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Virtual for getting acceptance count
termsAndWaiversSchema.virtual('acceptanceCount').get(function() {
  return this.acceptanceHistory.length;
});

// Method to check if visitor has accepted these terms
termsAndWaiversSchema.methods.hasVisitorAccepted = function(visitorId) {
  return this.acceptanceHistory.some(acceptance => 
    acceptance.visitorId.toString() === visitorId.toString()
  );
};

// Method to add acceptance record
termsAndWaiversSchema.methods.addAcceptance = function(visitorId, ipAddress, userAgent, signature) {
  this.acceptanceHistory.push({
    visitorId,
    acceptedAt: new Date(),
    ipAddress,
    userAgent,
    signature,
    version: this.version
  });
  return this.save();
};

// Static method to get active terms for a site
termsAndWaiversSchema.statics.getActiveTermsForSite = function(siteId, type) {
  const query = {
    site: siteId,
    isActive: true,
    effectiveDate: { $lte: new Date() },
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: { $gt: new Date() } }
    ]
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query).sort({ effectiveDate: -1 });
};

// Pre-save middleware to update lastModifiedBy
termsAndWaiversSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModifiedBy = this.createdBy; // This should be set by the route handler
  }
  next();
});

module.exports = mongoose.model('TermsAndWaivers', termsAndWaiversSchema);

