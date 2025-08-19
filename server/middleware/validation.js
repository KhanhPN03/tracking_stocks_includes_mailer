const Joi = require('joi');

// Generic validation middleware
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorDetails
      });
    }

    req[property] = value;
    next();
  };
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username must only contain alphanumeric characters',
        'string.min': 'Username must be at least 3 characters',
        'string.max': 'Username cannot exceed 30 characters'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    password: Joi.string()
      .min(6)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }),
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
    address: Joi.object({
      street: Joi.string().max(200).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      zipCode: Joi.string().max(20).optional()
    }).optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
      .min(6)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .required()
  }),

  resetPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  confirmResetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string()
      .min(6)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .required()
  }),

  updatePreferences: Joi.object({
    currency: Joi.string().valid('VND', 'USD').optional(),
    language: Joi.string().valid('vi', 'en').optional(),
    timezone: Joi.string().optional(),
    theme: Joi.string().valid('light', 'dark', 'auto').optional(),
    notifications: Joi.object({
      email: Joi.object({
        priceAlerts: Joi.boolean().optional(),
        weeklyReports: Joi.boolean().optional(),
        marketNews: Joi.boolean().optional(),
        systemUpdates: Joi.boolean().optional()
      }).optional(),
      push: Joi.object({
        priceAlerts: Joi.boolean().optional(),
        marketNews: Joi.boolean().optional()
      }).optional()
    }).optional(),
    dashboard: Joi.object({
      defaultView: Joi.string().valid('overview', 'list', 'chart').optional(),
      showMarketIndices: Joi.boolean().optional(),
      showWatchlist: Joi.boolean().optional(),
      autoRefresh: Joi.boolean().optional(),
      refreshInterval: Joi.number().min(10).max(300).optional()
    }).optional()
  })
};

// Portfolio validation schemas
const portfolioSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
    currency: Joi.string().valid('VND', 'USD').default('VND'),
    type: Joi.string().valid('personal', 'demo', 'shared').default('personal'),
    riskProfile: Joi.string().valid('conservative', 'moderate', 'aggressive').default('moderate')
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(500).optional(),
    currency: Joi.string().valid('VND', 'USD').optional(),
    riskProfile: Joi.string().valid('conservative', 'moderate', 'aggressive').optional(),
    tags: Joi.array().items(Joi.string().max(30)).optional()
  }),

  addStock: Joi.object({
    symbol: Joi.string()
      .pattern(/^[A-Z]{3}$/)
      .required()
      .messages({
        'string.pattern.base': 'Stock symbol must be 3 uppercase letters'
      }),
    quantity: Joi.number().positive().required(),
    purchasePrice: Joi.number().positive().required(),
    purchaseDate: Joi.date().max('now').optional(),
    targetPrice: Joi.number().positive().optional(),
    stopLoss: Joi.number().positive().optional(),
    notes: Joi.string().max(500).optional(),
    fees: Joi.number().min(0).optional()
  }),

  updateStock: Joi.object({
    quantity: Joi.number().positive().optional(),
    purchasePrice: Joi.number().positive().optional(),
    targetPrice: Joi.number().positive().optional(),
    stopLoss: Joi.number().positive().optional(),
    notes: Joi.string().max(500).optional()
  }),

  sellStock: Joi.object({
    quantity: Joi.number().positive().required(),
    salePrice: Joi.number().positive().required(),
    saleDate: Joi.date().max('now').optional(),
    fees: Joi.number().min(0).optional(),
    notes: Joi.string().max(500).optional()
  })
};

// Watchlist validation schemas
const watchlistSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(300).optional(),
    category: Joi.string().valid(
      'general', 'dividend', 'growth', 'value', 'tech', 
      'banking', 'realestate', 'custom'
    ).default('general'),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
    isPublic: Joi.boolean().default(false)
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(300).optional(),
    category: Joi.string().valid(
      'general', 'dividend', 'growth', 'value', 'tech', 
      'banking', 'realestate', 'custom'
    ).optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
    isPublic: Joi.boolean().optional(),
    sortBy: Joi.string().valid('symbol', 'name', 'price', 'change', 'volume', 'addedAt').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  }),

  addStock: Joi.object({
    symbol: Joi.string()
      .pattern(/^[A-Z]{3}$/)
      .required()
      .messages({
        'string.pattern.base': 'Stock symbol must be 3 uppercase letters'
      }),
    notes: Joi.string().max(200).optional(),
    targetPrice: Joi.number().positive().optional(),
    alertEnabled: Joi.boolean().default(false),
    alertPrice: Joi.number().positive().optional(),
    alertCondition: Joi.string().valid('above', 'below').default('above'),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    tags: Joi.array().items(Joi.string().max(30)).optional()
  })
};

// Alert validation schemas
const alertSchemas = {
  create: Joi.object({
    symbol: Joi.string()
      .pattern(/^[A-Z]{3}$/)
      .required()
      .messages({
        'string.pattern.base': 'Stock symbol must be 3 uppercase letters'
      }),
    type: Joi.string()
      .valid('price', 'volume', 'news', 'percent-change', 'technical', 'dividend')
      .required(),
    condition: Joi.string()
      .valid(
        'above', 'below', 'equals',
        'percent-change-up', 'percent-change-down',
        'volume-spike', 'volume-drop',
        'rsi-overbought', 'rsi-oversold',
        'ma-crossover', 'ma-crossunder',
        'new-high', 'new-low'
      )
      .required(),
    value: Joi.number().when('condition', {
      is: Joi.string().valid('above', 'below', 'equals', 'percent-change-up', 'percent-change-down'),
      then: Joi.number().positive().required(),
      otherwise: Joi.number().optional()
    }),
    message: Joi.string().max(200).optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    settings: Joi.object({
      email: Joi.boolean().default(true),
      push: Joi.boolean().default(true),
      sms: Joi.boolean().default(false),
      frequency: Joi.string().valid('once', 'daily', 'always').default('once'),
      cooldownMinutes: Joi.number().min(1).max(1440).default(60),
      expiresAt: Joi.date().greater('now').optional(),
      disableAfterTrigger: Joi.boolean().default(false)
    }).optional(),
    technicalParams: Joi.object({
      indicator: Joi.string().valid('rsi', 'macd', 'sma', 'ema', 'bollinger', 'stochastic').optional(),
      period: Joi.number().positive().optional(),
      threshold: Joi.number().optional()
    }).optional(),
    volumeParams: Joi.object({
      multiplier: Joi.number().positive().optional(),
      period: Joi.number().positive().optional()
    }).optional()
  }),

  update: Joi.object({
    value: Joi.number().positive().optional(),
    message: Joi.string().max(200).optional(),
    isActive: Joi.boolean().optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    settings: Joi.object({
      email: Joi.boolean().optional(),
      push: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
      frequency: Joi.string().valid('once', 'daily', 'always').optional(),
      cooldownMinutes: Joi.number().min(1).max(1440).optional(),
      expiresAt: Joi.date().greater('now').optional(),
      disableAfterTrigger: Joi.boolean().optional()
    }).optional()
  })
};

// Stock validation schemas
const stockSchemas = {
  query: Joi.object({
    exchange: Joi.string().valid('HOSE', 'HNX', 'UPCOM').optional(),
    sector: Joi.string().optional(),
    limit: Joi.number().min(1).max(100).default(20),
    page: Joi.number().min(1).default(1),
    search: Joi.string().max(50).optional(),
    sortBy: Joi.string().valid('symbol', 'name', 'price', 'change', 'volume').default('symbol'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  })
};

// Common parameter validation
const paramSchemas = {
  mongoId: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.pattern.base': 'Invalid ID format'
    })
  }),

  stockSymbol: Joi.object({
    symbol: Joi.string().pattern(/^[A-Z]{3}$/).required().messages({
      'string.pattern.base': 'Stock symbol must be 3 uppercase letters'
    })
  }),

  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20)
  })
};

// Export validation functions
module.exports = {
  validate,
  userSchemas,
  portfolioSchemas,
  watchlistSchemas,
  alertSchemas,
  stockSchemas,
  paramSchemas,
  
  // Middleware functions
  validateUserRegistration: validate(userSchemas.register),
  validateUserLogin: validate(userSchemas.login),
  validatePasswordReset: validate(userSchemas.passwordReset),
  validatePasswordChange: validate(userSchemas.passwordChange),
  validateProfileUpdate: validate(userSchemas.profileUpdate),
  validatePreferencesUpdate: validate(userSchemas.preferencesUpdate),
  
  validatePortfolio: validate(portfolioSchemas.create),
  validatePortfolioUpdate: validate(portfolioSchemas.update),
  validatePortfolioStock: validate(portfolioSchemas.addStock),
  
  validateWatchlist: validate(watchlistSchemas.create),
  validateWatchlistUpdate: validate(watchlistSchemas.update),
  
  validateAlert: validate(alertSchemas.create),
  validateAlertUpdate: validate(alertSchemas.update),
  
  validateStockQuery: validate(stockSchemas.query, 'query'),
  validateSearchQuery: validate(stockSchemas.search, 'query'),
  validateNewsQuery: validate(stockSchemas.query, 'query'),
  
  validateObjectId: validate(paramSchemas.id, 'params'),
  validatePagination: validate(paramSchemas.pagination, 'query')
};
