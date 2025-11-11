const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Site = require('../models/Site');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Debug route for user management
router.get('/debug/context', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Get managed sites for admin
    let managedSites = [];
    if (user.role === 'admin') {
      managedSites = await Site.find({ admin: user._id }).select('_id name');
    }
    
    // Get all non-admin users
    const allUsers = await User.find({ role: { $ne: 'admin' } })
      .select('fullName email role assignedSite')
      .limit(10);
    
    // Count users by site
    const userCounts = await User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      { $group: { _id: '$assignedSite', count: { $sum: 1 } } }
    ]);
    
    res.json({
      currentUser: {
        id: user._id.toString(),
        role: user.role,
        assignedSite: user.assignedSite ? user.assignedSite.toString() : null,
        managedSites: managedSites.map(s => ({
          id: s._id.toString(),
          name: s.name
        }))
      },
      allUsers: allUsers.map(u => ({
        name: u.fullName,
        email: u.email,
        role: u.role,
        assignedSite: u.assignedSite ? u.assignedSite.toString() : 'NULL'
      })),
      userCountsBySite: userCounts.map(c => ({
        siteId: c._id ? c._id.toString() : 'NULL',
        count: c.count
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/users/:id/reset-password
// @desc    Reset a user's password (Admin only)
// @access  Private (Admin only)
router.put('/:id/reset-password', auth, authorize('admin'), [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Do not allow resetting admin users via this route
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot reset password for admin users' });
    }

    // Verify target user belongs to the admin's managed sites
    const currentUser = req.user;
    const managedSites = await Site.find({ admin: currentUser._id }).select('_id');
    const siteIds = managedSites.map(s => s._id.toString());
    if (!user.assignedSite || !siteIds.includes(user.assignedSite.toString())) {
      return res.status(403).json({ message: 'Access denied to this user' });
    }

    user.password = newPassword; // Assume hashing via User pre-save hook
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// @route   GET /api/users
// @desc    Get all users (Admin only) or users for a site
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { siteId, role } = req.query;
    const user = req.user;

    console.log('GET /api/users - User:', {
      id: user._id.toString(),
      role: user.role,
      requestedSiteId: siteId || 'none'
    });

    let query = {
      role: { $ne: 'admin' } // Exclude all admins from user management
    };
    
    if (user.role === 'admin') {
      // Admin can only see users assigned to their managed sites
      const managedSites = await Site.find({ admin: user._id }).select('_id');
      const siteIds = managedSites.map(s => s._id);
      
      console.log('Admin managed sites:', siteIds.map(s => s.toString()));
      
      if (siteIds.length === 0) {
        console.log('⚠️ Admin has no managed sites');
        return res.json({ users: [] });
      }
      
      if (siteId) {
        // Verify the requested site belongs to this admin
        if (siteIds.some(id => id.toString() === siteId)) {
          query.assignedSite = siteId;
        } else {
          return res.status(403).json({ message: 'Access denied to this site' });
        }
      } else {
        // Show users from all managed sites
        query.assignedSite = { $in: siteIds };
      }
    } else {
      // Other users can only see users from their site
      query.assignedSite = user.assignedSite;
    }

    if (role) {
      query.role = role;
    }

    console.log('User query:', JSON.stringify(query));

    const users = await User.find(query)
      .populate('assignedSite', 'name address')
      .select('-password')
      .sort({ fullName: 1 });

    console.log('Found users:', users.length);
    
    // Debug: if no users found, check how many exist in total
    if (users.length === 0) {
      const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
      const usersWithoutSite = await User.countDocuments({ 
        role: { $ne: 'admin' },
        assignedSite: { $exists: false }
      });
      console.log('⚠️ No users found. Total non-admin users in DB:', totalUsers);
      console.log('Users without assignedSite:', usersWithoutSite);
      
      if (user.role === 'admin') {
        const sampleUser = await User.findOne({ role: { $ne: 'admin' } })
          .select('fullName email role assignedSite');
        if (sampleUser) {
          console.log('Sample user:', {
            name: sampleUser.fullName,
            role: sampleUser.role,
            assignedSite: sampleUser.assignedSite ? sampleUser.assignedSite.toString() : 'NULL'
          });
        }
      }
    }

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users
// @desc    Create a new user
// @access  Private (Admin only)
router.post('/', auth, authorize('admin'), [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['site_manager', 'security_guard', 'receptionist']).withMessage('Invalid role'),
  body('assignedSite').isMongoId().withMessage('Valid site ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, password, role, assignedSite, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Only admin can create users
    const currentUser = req.user;
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create users' });
    }

    // Verify site exists and belongs to this admin
    const site = await Site.findById(assignedSite);
    if (!site) {
      return res.status(400).json({ message: 'Site not found' });
    }

    if (site.admin.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: 'You can only create users for your own sites' });
    }

    const user = new User({
      fullName,
      email,
      password,
      role,
      assignedSite,
      phone,
      address
    });

    await user.save();

    // Add user to site's staff list
    if (role === 'site_manager') {
      site.siteManagers.push(user._id);
    } else if (role === 'security_guard') {
      site.securityGuards.push(user._id);
    } else if (role === 'receptionist') {
      site.receptionists.push(user._id);
    }
    await site.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        assignedSite: user.assignedSite
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error during user creation' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('assignedSite', 'name address')
      .populate('managedSites', 'name address')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Block viewing admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if user has access to this user's information
    const currentUser = req.user;
    if (currentUser.role === 'admin') {
      // Admin can only view users from their managed sites
      const managedSites = await Site.find({ admin: currentUser._id }).select('_id');
      const siteIds = managedSites.map(s => s._id.toString());
      if (!user.assignedSite || !siteIds.includes(user.assignedSite.toString())) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (currentUser.assignedSite?.toString() !== user.assignedSite?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/:id', auth, authorize('admin'), [
  body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Block updating admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot update admin users' });
    }

    // Only admin can update users from their managed sites
    const currentUser = req.user;
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update users' });
    }

    // Verify user belongs to admin's managed sites
    const managedSites = await Site.find({ admin: currentUser._id }).select('_id');
    const siteIds = managedSites.map(s => s._id.toString());
    if (!user.assignedSite || !siteIds.includes(user.assignedSite.toString())) {
      return res.status(403).json({ message: 'Access denied to this user' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('assignedSite', 'name address')
    .select('-password');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error during user update' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    // Verify user belongs to admin's managed sites
    const currentUser = req.user;
    const managedSites = await Site.find({ admin: currentUser._id }).select('_id');
    const siteIds = managedSites.map(s => s._id.toString());
    if (!user.assignedSite || !siteIds.includes(user.assignedSite.toString())) {
      return res.status(403).json({ message: 'Access denied to this user' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error during user deletion' });
  }
});

// @route   PUT /api/users/:id/activate
// @desc    Activate/deactivate user
// @access  Private (Admin only)
router.put('/:id/activate', auth, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Block activating/deactivating admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot activate/deactivate admin users' });
    }

    // Only admin can activate/deactivate users from their managed sites
    const currentUser = req.user;
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can activate/deactivate users' });
    }

    // Verify user belongs to admin's managed sites
    const managedSites = await Site.find({ admin: currentUser._id }).select('_id');
    const siteIds = managedSites.map(s => s._id.toString());
    if (!user.assignedSite || !siteIds.includes(user.assignedSite.toString())) {
      return res.status(403).json({ message: 'Access denied to this user' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ message: 'Server error during user activation' });
  }
});

// @route   GET /api/users/stats/dashboard
// @desc    Get user statistics
// @access  Private (Admin, Site Manager)
router.get('/stats/dashboard', auth, authorize('admin', 'site_manager'), async (req, res) => {
  try {
    const { siteId } = req.query;
    const user = req.user;
    
    // Determine site scope with tenant isolation
    let siteFilter = [];
    if (siteId) {
      siteFilter = [siteId];
    } else if (user.role === 'admin') {
      const managedSites = await Site.find({ admin: user._id }).select('_id');
      siteFilter = managedSites.map(s => s._id);
    } else if (user.assignedSite) {
      siteFilter = [user.assignedSite];
    }

    if (!siteFilter || siteFilter.length === 0) {
      return res.status(400).json({ message: 'Site context required' });
    }

    const [
      totalUsers,
      activeUsers,
      siteManagers,
      securityGuards,
      receptionists
    ] = await Promise.all([
      User.countDocuments({ assignedSite: { $in: siteFilter }, role: { $ne: 'admin' } }),
      User.countDocuments({ assignedSite: { $in: siteFilter }, role: { $ne: 'admin' }, isActive: true }),
      User.countDocuments({ assignedSite: { $in: siteFilter }, role: 'site_manager', isActive: true }),
      User.countDocuments({ assignedSite: { $in: siteFilter }, role: 'security_guard', isActive: true }),
      User.countDocuments({ assignedSite: { $in: siteFilter }, role: 'receptionist', isActive: true })
    ]);

    res.json({
      totalUsers,
      activeUsers,
      siteManagers,
      securityGuards,
      receptionists
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

