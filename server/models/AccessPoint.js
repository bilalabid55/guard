const mongoose = require('mongoose');

const accessPointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Access point name is required'],
    trim: true
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  type: {
    type: String,
    enum: ['main_gate', 'side_entrance', 'loading_dock', 'emergency_exit', 'restricted_area'],
    default: 'main_gate'
  },
  location: {
    building: String,
    floor: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  accessLevel: {
    type: String,
    enum: ['public', 'restricted', 'vip_only', 'staff_only'],
    default: 'public'
  },
  requiredPPE: [{
    type: String,
    enum: ['hard_hat', 'safety_vest', 'safety_shoes', 'gloves', 'safety_glasses', 'hearing_protection']
  }],
  operatingHours: {
    start: {
      type: String,
      default: '06:00'
    },
    end: {
      type: String,
      default: '18:00'
    },
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  assignedStaff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  qrCode: {
    type: String
  },
  description: {
    type: String
  },
  capacity: {
    type: Number,
    default: 50
  },
  currentOccupancy: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
accessPointSchema.index({ site: 1, isActive: 1 });
accessPointSchema.index({ type: 1 });

// Update current occupancy when visitors check in/out
accessPointSchema.methods.updateOccupancy = async function() {
  const Visitor = mongoose.model('Visitor');
  const currentVisitors = await Visitor.countDocuments({
    accessPoint: this._id,
    status: 'checked_in'
  });
  
  this.currentOccupancy = currentVisitors;
  await this.save();
};

module.exports = mongoose.model('AccessPoint', accessPointSchema);

