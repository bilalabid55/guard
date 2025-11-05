const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Incident title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Incident description is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['safety', 'security', 'property_damage', 'injury', 'environmental', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  status: {
    type: String,
    enum: ['reported', 'investigating', 'resolved', 'closed'],
    default: 'reported'
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  location: {
    accessPoint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AccessPoint'
    },
    building: String,
    floor: String,
    specificLocation: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedDate: {
    type: Date,
    default: Date.now
  },
  incidentDate: {
    type: Date,
    required: true
  },
  // People involved in the incident
  peopleInvolved: [{
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['visitor', 'staff', 'contractor', 'other']
    },
    company: String,
    contactInfo: {
      phone: String,
      email: String
    },
    isInjured: {
      type: Boolean,
      default: false
    },
    injuryDescription: String
  }],
  // Witnesses
  witnesses: [{
    name: String,
    contactInfo: {
      phone: String,
      email: String
    },
    statement: String
  }],
  // Investigation details
  investigation: {
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startDate: Date,
    endDate: Date,
    findings: String,
    recommendations: String,
    correctiveActions: [String]
  },
  // Follow-up actions
  followUpActions: [{
    action: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    completedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'overdue'],
      default: 'pending'
    },
    notes: String
  }],
  // Documentation
  evidence: [{
    type: {
      type: String,
      enum: ['photo', 'video', 'document', 'audio']
    },
    fileName: String,
    fileUrl: String,
    description: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // External reporting
  externalReporting: {
    reportedToAuthorities: {
      type: Boolean,
      default: false
    },
    authorityContact: {
      name: String,
      agency: String,
      phone: String,
      email: String
    },
    reportNumber: String,
    reportDate: Date
  },
  // Resolution
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedDate: Date,
    resolutionNotes: String,
    lessonsLearned: String
  },
  // Tags for categorization
  tags: [String],
  // Related incidents
  relatedIncidents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
incidentSchema.index({ site: 1, status: 1 });
incidentSchema.index({ type: 1, severity: 1 });
incidentSchema.index({ reportedDate: -1 });
incidentSchema.index({ incidentDate: -1 });

// Virtual for days since incident
incidentSchema.virtual('daysSinceIncident').get(function() {
  return Math.floor((Date.now() - this.incidentDate) / (1000 * 60 * 60 * 24));
});

// Check if incident is overdue
incidentSchema.methods.isOverdue = function() {
  if (this.status === 'resolved' || this.status === 'closed') return false;
  
  const daysSince = this.daysSinceIncident;
  const severityThresholds = {
    critical: 1,
    high: 3,
    medium: 7,
    low: 14
  };
  
  return daysSince > severityThresholds[this.severity];
};

module.exports = mongoose.model('Incident', incidentSchema);

