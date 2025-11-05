const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password')
      .populate('subscription', 'plan status endDate memberLimit');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    
    // Add subscription info to user object
    if (user.subscription) {
      user.subscription = {
        plan: user.subscription.plan,
        status: user.subscription.status,
        endDate: user.subscription.endDate,
        memberLimit: user.subscription.memberLimit
      };
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Normalize role comparison (trim and lowercase)
    const userRole = req.user.role ? req.user.role.toString().trim().toLowerCase() : '';
    const normalizedRoles = roles.map(role => role.toString().trim().toLowerCase());
    
    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}` 
      });
    }

    console.log('Authorization successful for role:', req.user.role);
    next();
  };
};

// Site access authorization
const authorizeSite = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const user = req.user;

    // Admin can access all sites
    if (user.role === 'admin') {
      return next();
    }

    // Site managers and staff can only access their assigned site
    if (user.assignedSite && user.assignedSite.toString() === siteId) {
      return next();
    }

    // Check if user manages this site (for admins with managed sites)
    if (user.managedSites && user.managedSites.includes(siteId)) {
      return next();
    }

    res.status(403).json({ message: 'Access denied to this site' });
  } catch (error) {
    res.status(500).json({ message: 'Authorization error' });
  }
};

module.exports = { auth, authorize, authorizeSite };

