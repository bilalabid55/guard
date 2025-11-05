const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Site name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Site address is required']
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'USA'
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  siteManagers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  securityGuards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  receptionists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  subscription: {
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'past_due'],
      default: 'inactive'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    plan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic'
    }
  },
  settings: {
    allowPreRegistration: {
      type: Boolean,
      default: true
    },
    requirePPE: {
      type: Boolean,
      default: true
    },
    requireSafetyInduction: {
      type: Boolean,
      default: true
    },
    maxVisitorsPerDay: {
      type: Number,
      default: 100
    },
    visitorBadgeExpiryHours: {
      type: Number,
      default: 8
    },
    emergencyContacts: [{
      name: String,
      phone: String,
      email: String,
      role: String
    }],
    termsAndConditions: {
      type: String,
      default: 'By entering this construction site, you agree to follow all safety protocols and regulations.'
    }
  },
  contactInfo: {
    phone: String,
    email: String,
    emergencyPhone: String
  }
}, {
  timestamps: true
});

// Index for better query performance
siteSchema.index({ admin: 1 });
siteSchema.index({ isActive: 1 });

module.exports = mongoose.model('Site', siteSchema);

