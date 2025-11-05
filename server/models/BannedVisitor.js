const mongoose = require('mongoose');

const bannedVisitorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String
  },
  company: {
    type: String,
    trim: true
  },
  reason: {
    type: String,
    required: [true, 'Ban reason is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  bannedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  incidentReport: {
    type: String
  },
  reviewDate: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: {
    type: String
  },
  // Related incident information
  relatedIncidents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  }],
  // Photo or document evidence
  evidence: [{
    type: {
      type: String,
      enum: ['photo', 'document', 'video']
    },
    fileName: String,
    fileUrl: String,
    description: String
  }],
  // Appeal information
  appealStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  appealDate: {
    type: Date
  },
  appealNotes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bannedVisitorSchema.index({ fullName: 1, email: 1 });
bannedVisitorSchema.index({ site: 1, isActive: 1 });
bannedVisitorSchema.index({ bannedDate: -1 });
bannedVisitorSchema.index({ company: 1 });

// Check if ban is expired
bannedVisitorSchema.methods.isExpired = function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
};

// Check if visitor should be banned (by name, email, or company)
bannedVisitorSchema.statics.checkVisitor = async function(visitorData) {
  const { fullName, email, company } = visitorData;
  
  const bannedVisitor = await this.findOne({
    isActive: true,
    $or: [
      { fullName: { $regex: fullName, $options: 'i' } },
      { email: email },
      { company: { $regex: company, $options: 'i' } }
    ]
  });
  
  return bannedVisitor;
};

module.exports = mongoose.model('BannedVisitor', bannedVisitorSchema);

