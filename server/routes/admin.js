const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Site = require('../models/Site');

// @route   GET /api/admin/admins
// @desc    Get all admins with their subscription details (Super Admin only)
// @access  Private (Super Admin)
router.get('/admins', [auth, authorize('super_admin')], async (req, res) => {
  try {
    // Find all admin users
    const admins = await User.find({ role: 'admin' })
      .select('fullName name email isActive createdAt updatedAt')
      .lean();

    if (!admins || admins.length === 0) {
      return res.json([]);
    }

    // Always lookup subscriptions by adminId for all admins
    const adminIds = admins.map(a => a._id);
    const subs = await Subscription.find({ adminId: { $in: adminIds } })
      .select('plan status startDate endDate memberLimit adminId createdAt updatedAt')
      .lean();

    const subByAdmin = new Map(subs.map(s => [String(s.adminId), s]));

    // Assemble response
    const result = admins.map(a => ({
      _id: a._id,
      fullName: a.fullName || a.name,
      email: a.email,
      isActive: a.isActive,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      subscription: (() => {
        const sub = subByAdmin.get(String(a._id));
        if (!sub) return undefined;
        // Normalize endDate to one month from startDate for all packages
        const start = new Date(sub.startDate);
        const normalizedEnd = new Date(start);
        normalizedEnd.setMonth(normalizedEnd.getMonth() + 1);
        return {
          plan: sub.plan,
          status: sub.status,
          startDate: start,
          endDate: normalizedEnd,
          memberLimit: sub.memberLimit,
        };
      })(),
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/:id/details
// @desc    Get admin details with subscription and first managed site
// @access  Private (Super Admin)
router.get('/:id/details', [auth, authorize('super_admin')], async (req, res) => {
  try {
    const admin = await User.findById(req.params.id)
      .select('fullName email role isActive createdAt updatedAt');
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const subscription = await Subscription.findOne({ adminId: admin._id })
      .select('plan status startDate endDate memberLimit');

    const site = await Site.findOne({ admin: admin._id })
      .select('name address city state zipCode country');

    res.json({
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      },
      subscription,
      site
    });
  } catch (error) {
    console.error('Error fetching admin details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/:id/activate
// @desc    Activate/deactivate an admin user (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id/activate', [auth, authorize('super_admin')], async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'admin') return res.status(400).json({ message: 'Target user is not an admin' });
    if (user._id.toString() === req.user.id) return res.status(400).json({ message: 'Cannot change your own status' });

    user.isActive = !!isActive;
    await user.save();
    res.json({ message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Error toggling admin status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/register-admin
// @desc    Register a new admin (Super Admin only)
// @access  Private (Super Admin)
router.post('/register-admin', [
  auth,
  authorize('super_admin'),
  [
    check('fullName', 'Full name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('plan', 'Please select a valid plan').isIn(['starter', 'professional', 'enterprise'])
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullName, email, password, plan } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    user = new User({
      fullName,
      email,
      password, // let pre-save hook hash this
      role: 'admin',
      isActive: true,
      emailVerified: true
    });

    // Save user
    await user.save();

    // Set member limits based on plan
    const memberLimits = {
      starter: 5,
      professional: 25,
      enterprise: 1000 // Effectively unlimited
    };

    // Create subscription
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // All packages valid for 1 month

    const subscription = new Subscription({
      plan,
      status: 'active',
      startDate,
      endDate,
      memberLimit: memberLimits[plan],
      adminId: user._id
    });

    await subscription.save();

    // Update user with subscription reference
    user.subscription = subscription._id;
    await user.save();

    // Create a default site for this admin to enable tenant context and access points
    const defaultSite = await Site.create({
      name: `${fullName.split(' ')[0]}'s Site`,
      address: 'Address not provided',
      city: 'N/A',
      state: 'N/A',
      zipCode: '00000',
      country: 'USA',
      admin: user._id
    });

    // Create default access points for the site
    const AccessPoint = require('../models/AccessPoint');
    const defaultAccessPoints = [
      { name: 'Main Gate', type: 'main_gate', site: defaultSite._id },
      { name: 'Side Entrance', type: 'side_entrance', site: defaultSite._id },
      { name: 'Loading Dock', type: 'loading_dock', site: defaultSite._id }
    ];
    for (const ap of defaultAccessPoints) {
      await new AccessPoint(ap).save();
    }

    // Link site to admin's managedSites
    user.managedSites = [defaultSite._id];
    await user.save();

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      message: 'Admin created successfully',
      user: userObj,
      subscription
    });

  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Super Admin only)
// @access  Private (Super Admin)
router.delete('/:id', [auth, authorize('super_admin')], async (req, res) => {
  try {
    // Don't allow deleting the main super admin
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Find and delete the user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deleting other super admins
    if (user.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot delete other super admins' });
    }

    // Delete the user's subscription if it exists
    if (user.subscription) {
      await Subscription.findByIdAndDelete(user.subscription);
    }

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/subscription/activate-by-email
// @desc    Force-activate or create a subscription for an admin by email (Super Admin only)
// @access  Private (Super Admin)
router.post('/subscription/activate-by-email', [auth, authorize('super_admin')], async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const admin = await User.findOne({ email: normalizedEmail, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    let subscription = await Subscription.findOne({ adminId: admin._id });
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 12);

    if (!subscription) {
      subscription = new Subscription({
        plan: 'enterprise',
        status: 'active',
        startDate,
        endDate,
        memberLimit: 1000,
        adminId: admin._id
      });
    } else {
      subscription.status = 'active';
      if (!subscription.startDate) subscription.startDate = startDate;
      subscription.endDate = endDate;
      if (!subscription.plan) subscription.plan = 'enterprise';
      if (!subscription.memberLimit) subscription.memberLimit = 1000;
    }

    await subscription.save();

    // Link on user if missing
    if (!admin.subscription || String(admin.subscription) !== String(subscription._id)) {
      admin.subscription = subscription._id;
      await admin.save();
    }

    res.json({ message: 'Subscription activated successfully', subscription });
  } catch (error) {
    console.error('Error activating subscription by email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/:id/subscription
// @desc    Get an admin's subscription (Super Admin only)
// @access  Private (Super Admin)
router.get('/:id/subscription', [auth, authorize('super_admin')], async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    const subscription = await Subscription.findOne({ adminId: admin._id });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    res.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/:id/subscription
// @desc    Create/update an admin's subscription (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id/subscription', [auth, authorize('super_admin')], async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    const { plan, status, startDate, endDate, memberLimit } = req.body || {};

    const allowedPlans = ['starter', 'professional', 'enterprise'];
    const update = {};
    if (plan) {
      if (!allowedPlans.includes(String(plan))) {
        return res.status(400).json({ message: 'Invalid plan' });
      }
      update.plan = plan;
    }
    if (status) {
      if (!['active', 'inactive', 'paused'].includes(String(status))) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      update.status = status;
    }
    if (memberLimit !== undefined) {
      const num = Number(memberLimit);
      if (!Number.isFinite(num) || num < 0) return res.status(400).json({ message: 'Invalid memberLimit' });
      update.memberLimit = num;
    }
    if (startDate) {
      const sd = new Date(startDate);
      if (isNaN(sd.getTime())) return res.status(400).json({ message: 'Invalid startDate' });
      update.startDate = sd;
    }
    if (endDate) {
      const ed = new Date(endDate);
      if (isNaN(ed.getTime())) return res.status(400).json({ message: 'Invalid endDate' });
      update.endDate = ed;
    }

    let subscription = await Subscription.findOne({ adminId: admin._id });
    if (!subscription) {
      subscription = new Subscription({
        adminId: admin._id,
        plan: update.plan || 'starter',
        status: update.status || 'active',
        startDate: update.startDate || new Date(),
        endDate: update.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        memberLimit: update.memberLimit ?? 5
      });
    } else {
      Object.assign(subscription, update);
    }
    await subscription.save();

    if (!admin.subscription || String(admin.subscription) !== String(subscription._id)) {
      admin.subscription = subscription._id;
      await admin.save();
    }

    res.json({ message: 'Subscription saved', subscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
