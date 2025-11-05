const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

// @route   POST /api/subscriptions
// @desc    Create or update subscription
// @access  Private (Admin)
router.post('/', [
  auth,
  authorize('admin'),
  [
    check('plan', 'Plan is required').isIn(['starter', 'professional', 'enterprise']),
    check('durationMonths', 'Duration is required').isInt({ min: 1 })
  ]
], async (req, res) => {
  try {
    const { plan, durationMonths } = req.body;
    
    // Set member limits based on plan
    const memberLimits = {
      starter: 5,
      professional: 25,
      enterprise: 1000 // Effectively unlimited
    };

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + parseInt(durationMonths));

    // Update or create subscription
    const subscription = await Subscription.findOneAndUpdate(
      { adminId: req.user._id },
      {
        plan,
        memberLimit: memberLimits[plan],
        startDate,
        endDate,
        status: 'active'
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Update user's subscription reference
    await User.findByIdAndUpdate(req.user._id, { subscription: subscription._id });

    res.json({
      message: 'Subscription updated successfully',
      subscription
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/subscriptions/admin
// @desc    Get admin's subscription
// @access  Private (Admin)
router.get('/admin', auth, authorize('admin'), async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ adminId: req.user._id });
    
    if (!subscription) {
      return res.json({
        hasSubscription: false,
        message: 'No active subscription'
      });
    }

    const userCount = await User.countDocuments({ 
      adminId: req.user._id,
      role: { $nin: ['admin', 'super_admin'] }
    });

    res.json({
      hasSubscription: true,
      subscription: {
        ...subscription.toObject(),
        currentUsers: userCount
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/subscriptions/all
// @desc    Get all subscriptions (Super Admin only)
// @access  Private (Super Admin)
router.get('/all', auth, authorize('super_admin'), async (req, res) => {
  try {
    // Get all subscriptions with admin details
    let subscriptions = await Subscription.find()
      .populate('adminId', 'fullName name email role isActive')
      .sort({ createdAt: -1 });
    
    // Add current user count for each subscription
    subscriptions = await Promise.all(subscriptions.map(async (sub) => {
      const userCount = await User.countDocuments({ 
        $or: [
          { _id: sub.adminId?._id },
          { adminId: sub.adminId?._id }
        ],
        role: { $nin: ['super_admin', 'admin'] }
      });
      
      return {
        ...sub.toObject(),
        currentUsers: userCount
      };
    }));
    
    res.json(subscriptions);
  } catch (error) {
    console.error('Get all subscriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/subscriptions/:id/status
// @desc    Update subscription status (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id/status', [
  auth,
  authorize('super_admin'),
  [
    check('status', 'Status is required').isIn(['active', 'canceled', 'expired'])
  ]
], async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json({
      message: 'Subscription status updated',
      subscription
    });
  } catch (error) {
    console.error('Update subscription status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
