const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  contactInfo: {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    contactPerson: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'USA'
    }
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  visitorCount: {
    type: Number,
    default: 0
  },
  lastVisit: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for search functionality
companySchema.index({ name: 'text', 'contactInfo.email': 'text' });

// Virtual for full address
companySchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.address.street) parts.push(this.address.street);
  if (this.address.city) parts.push(this.address.city);
  if (this.address.state) parts.push(this.address.state);
  if (this.address.zipCode) parts.push(this.address.zipCode);
  if (this.address.country) parts.push(this.address.country);
  return parts.join(', ');
});

// Method to update visitor count
companySchema.methods.updateVisitorCount = async function() {
  const Visitor = require('./Visitor');
  const count = await Visitor.countDocuments({ 
    company: this.name,
    status: { $in: ['checked_in', 'checked_out'] }
  });
  this.visitorCount = count;
  
  // Update last visit
  const lastVisitor = await Visitor.findOne({ 
    company: this.name 
  }).sort({ checkInTime: -1 });
  
  if (lastVisitor) {
    this.lastVisit = lastVisitor.checkInTime;
  }
  
  await this.save();
  return this;
};

// Static method to get company statistics
companySchema.statics.getCompanyStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalCompanies: { $sum: 1 },
        activeCompanies: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        totalVisitors: { $sum: '$visitorCount' }
      }
    }
  ]);
  
  return stats[0] || { totalCompanies: 0, activeCompanies: 0, totalVisitors: 0 };
};

module.exports = mongoose.model('Company', companySchema);





