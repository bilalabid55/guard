const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  // Basic Information
  fullName: {
    type: String,
    required: [true, 'Visitor name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: false
  },
  company: {
    type: String,
    required: [true, 'Company is required'],
    trim: true
  },
  purpose: {
    type: String,
    required: [true, 'Purpose of visit is required'],
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  
  // Site and Access Information
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  accessPoint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccessPoint',
    required: true
  },
  
  // Check-in/Check-out Information
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'checked_in', 'checked_out', 'overstayed'],
    default: 'pending'
  },
  
  // Badge Information
  badgeNumber: {
    type: String,
    unique: true
  },
  qrCode: {
    type: String
  },
  
  // Safety and Compliance
  ppeVerified: {
    type: Boolean,
    default: false
  },
  safetyInductionCompleted: {
    type: Boolean,
    default: false
  },
  safetyInductionDate: {
    type: Date
  },
  
  // Emergency Information
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  
  // Special Access
  specialAccess: {
    type: String,
    enum: ['none', 'vip', 'auditor', 'inspector', 'contractor'],
    default: 'none'
  },
  specialAccessExpiry: {
    type: Date
  },
  authorizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Host Information
  host: {
    name: String,
    email: String,
    phone: String,
    department: String
  },
  
  // Expected Duration
  expectedDuration: {
    type: Number, // in hours
    default: 4
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['insurance', 'liability', 'safety_certificate', 'other']
    },
    fileName: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Pre-registration
  isPreRegistered: {
    type: Boolean,
    default: false
  },
  preRegistrationDate: {
    type: Date
  },
  preRegistrationToken: {
    type: String
  },
  
  // Notes and Comments
  notes: {
    type: String
  },
  securityNotes: {
    type: String
  },
  
  // System Information
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  checkedOutBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
visitorSchema.index({ site: 1, status: 1 });
visitorSchema.index({ checkInTime: -1 });
visitorSchema.index({ badgeNumber: 1 });
visitorSchema.index({ email: 1 });

// Generate badge number before saving
visitorSchema.pre('save', function(next) {
  if (!this.badgeNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.badgeNumber = `V${timestamp}${random}`;
  }
  next();
});

// Virtual for duration
visitorSchema.virtual('duration').get(function() {
  if (this.checkOutTime) {
    return Math.round((this.checkOutTime - this.checkInTime) / (1000 * 60 * 60 * 24 * 24)); // in hours
  }
  return Math.round((Date.now() - this.checkInTime) / (1000 * 60 * 60 * 24 * 24)); // in hours
});

// Check if visitor has overstayed
visitorSchema.methods.hasOverstayed = function() {
  if (this.status === 'checked_out') return false;
  
  const now = new Date();
  const expectedEndTime = new Date(this.checkInTime.getTime() + (this.expectedDuration * 60 * 60 * 1000));
  
  return now > expectedEndTime;
};

module.exports = mongoose.model('Visitor', visitorSchema);

