const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Site = require('../models/Site');
const Subscription = require('../models/Subscription');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  // Use a safe default in case JWT_SECRET is not set, to avoid hard crashes during
  // registration/login. In production you should still configure JWT_SECRET.
  const secret = process.env.JWT_SECRET || 'acso-guard-dev-secret';
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Public self-registration: creates an Admin, Site, and trial Subscription
// @access  Public
router.post('/register', [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('siteName').optional().isString(),
  body('siteAddress').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, password, phone, address, siteName, siteAddress, plan } = req.body;

    // Normalize email for uniqueness
    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new admin user (no active subscription yet)
    const user = new User({
      fullName,
      email: normalizedEmail,
      password,
      role: 'admin',
      phone,
      address
    });

    await user.save();

    // Create a default site for this admin
    const Site = require('../models/Site');
    const site = await Site.create({
      name: siteName || `${fullName}'s Site`,
      address: siteAddress || 'Address not provided',
      city: 'N/A',
      state: 'N/A',
      zipCode: '00000',
      country: 'USA',
      admin: user._id
    });
    
    // Link the newly created site to user's managedSites but DO NOT create/activate a subscription yet.
    // Subscription will be created/activated later after payment or by Super Admin.
    user.managedSites = [site._id];
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        assignedSite: user.assignedSite,
        managedSites: user.managedSites
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const rawEmail = typeof req.body.email === 'string' ? req.body.email : '';
    const email = rawEmail.trim().toLowerCase();
    const { password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // If admin, try to load subscription info and sync to site for UI, but do NOT block login
    // when there is no active subscription. Payment/activation will be handled separately.
    if (user.role === 'admin') {
      const sub = await Subscription.findOne({ adminId: user._id });

      if (sub) {
        // Sync site's embedded subscription for UI (reflect actual status)
        const adminSite = await Site.findOne({ admin: user._id });
        if (adminSite) {
          adminSite.subscription = adminSite.subscription || {};
          adminSite.subscription.status = sub.status;
          adminSite.subscription.plan = sub.plan;
          adminSite.subscription.startDate = sub.startDate;
          adminSite.subscription.endDate = sub.endDate;
          await adminSite.save();
        }
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Get site information and subscription details
    let siteInfo = null;
    let subscription = null;
    if (user.role === 'admin') {
      // For admin, show first managed site's info including subscription
      const adminSite = await Site.findOne({ admin: user._id }).select('name address subscription');
      if (adminSite) siteInfo = adminSite;
      subscription = await Subscription.findOne({ adminId: user._id }).select('plan status startDate endDate memberLimit');
    } else if (user.assignedSite) {
      siteInfo = await Site.findById(user.assignedSite).select('name address subscription');
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        assignedSite: user.assignedSite,
        siteInfo,
        subscription,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('assignedSite', 'name address')
      .populate('managedSites', 'name address')
      .select('-password');

    // Get site information with subscription for gating
    let siteInfo = null;
    let subscription = null;
    if (user.role === 'admin') {
      const adminSite = await Site.findOne({ admin: user._id }).select('name address subscription');
      if (adminSite) siteInfo = adminSite;
      subscription = await Subscription.findOne({ adminId: user._id }).select('plan status startDate endDate memberLimit');
    } else if (user.assignedSite) {
      siteInfo = await Site.findById(user.assignedSite).select('name address subscription');
    }

    const userData = user.toJSON();
    userData.siteInfo = siteInfo;
    userData.subscription = subscription;

    res.json({ user: userData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, phone, address } = req.body;
    const updateData = {};

    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;

