const Subscription = require('../models/Subscription');
const User = require('../models/User');

const checkSubscriptionLimit = async (req, res, next) => {
  try {
    // Skip check for super admin
    if (req.user.role === 'super_admin' || req.user.email === 'admin@acsoguard.com') {
      return next();
    }

    const adminId = req.user.role === 'admin' ? req.user._id : req.user.adminId;
    const subscription = await Subscription.findOne({ 
      adminId,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (!subscription) {
      return res.status(403).json({ 
        message: 'No active subscription found' 
      });
    }

    const userCount = await User.countDocuments({ 
      adminId,
      role: { $nin: ['admin', 'super_admin'] } // Don't count admin users
    });

    if (userCount >= subscription.memberLimit) {
      return res.status(403).json({ 
        message: `Member limit of ${subscription.memberLimit} reached. Please upgrade your plan.` 
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { checkSubscriptionLimit };
