const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id)
        .select('-password')
        .populate('preferences');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated.'
        });
      }

      // Update last activity
      user.updateLastActivity();

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Middleware to authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

// Middleware to check premium features access
const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please login first.'
    });
  }

  if (!req.user.canAccessPremiumFeatures()) {
    return res.status(403).json({
      success: false,
      message: 'Premium subscription required to access this feature.',
      upgradeRequired: true
    });
  }

  next();
};

// Middleware for optional authentication (for public/guest access)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
          user.updateLastActivity();
        }
      } catch (error) {
        // Invalid token, but continue as guest
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Middleware to check if user owns the resource
const checkOwnership = (Model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resource = await Model.findById(req.params[paramName]);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user owns the resource
      if (resource.owner && resource.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.'
        });
      }

      // If resource has a user field instead of owner
      if (resource.user && resource.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error in ownership check'
      });
    }
  };
};

// Middleware to check API rate limits per user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (userRequests.has(userId)) {
      const requests = userRequests.get(userId).filter(time => time > windowStart);
      userRequests.set(userId, requests);
    } else {
      userRequests.set(userId, []);
    }

    const currentRequests = userRequests.get(userId);

    if (currentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    currentRequests.push(now);
    userRequests.set(userId, currentRequests);
    next();
  };
};

// Middleware to validate email verification
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please login first.'
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required to access this feature.',
      emailVerificationRequired: true
    });
  }

  next();
};

// Middleware to check subscription status
const checkSubscription = (requiredType = 'basic') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    const subscription = req.user.subscription;
    const subscriptionLevels = { free: 0, basic: 1, premium: 2 };
    const requiredLevel = subscriptionLevels[requiredType];
    const userLevel = subscriptionLevels[subscription.type];

    if (userLevel < requiredLevel || !subscription.isActive || 
        (subscription.endDate && subscription.endDate < new Date())) {
      return res.status(403).json({
        success: false,
        message: `${requiredType.charAt(0).toUpperCase() + requiredType.slice(1)} subscription required.`,
        subscriptionRequired: requiredType,
        currentSubscription: subscription.type
      });
    }

    next();
  };
};

// Middleware to log API usage
const logApiUsage = (req, res, next) => {
  if (req.user) {
    // Log API usage for analytics
    console.log(`API Usage: ${req.user.username} - ${req.method} ${req.originalUrl} at ${new Date().toISOString()}`);
  }
  next();
};

module.exports = {
  protect,
  authorize,
  requirePremium,
  optionalAuth,
  checkOwnership,
  userRateLimit,
  requireEmailVerification,
  checkSubscription,
  logApiUsage
};
