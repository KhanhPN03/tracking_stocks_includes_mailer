const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['guest', 'customer', 'premium', 'admin'],
    default: 'customer'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 2592000 // 30 days
    }
  }],
  preferences: {
    currency: {
      type: String,
      enum: ['VND', 'USD'],
      default: 'VND'
    },
    language: {
      type: String,
      enum: ['vi', 'en'],
      default: 'vi'
    },
    timezone: {
      type: String,
      default: 'Asia/Ho_Chi_Minh'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    notifications: {
      email: {
        priceAlerts: { type: Boolean, default: true },
        weeklyReports: { type: Boolean, default: true },
        marketNews: { type: Boolean, default: false },
        systemUpdates: { type: Boolean, default: true }
      },
      push: {
        priceAlerts: { type: Boolean, default: true },
        marketNews: { type: Boolean, default: false }
      }
    },
    dashboard: {
      defaultView: {
        type: String,
        enum: ['overview', 'list', 'chart'],
        default: 'overview'
      },
      showMarketIndices: { type: Boolean, default: true },
      showWatchlist: { type: Boolean, default: true },
      autoRefresh: { type: Boolean, default: true },
      refreshInterval: { type: Number, default: 30 } // seconds
    }
  },
  subscription: {
    type: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true }
  },
  lastLogin: Date,
  lastActivity: Date,
  loginCount: { type: Number, default: 0 },
  avatar: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: { type: String, default: 'Vietnam' },
    zipCode: String
  },
  taxInfo: {
    taxId: String,
    taxRate: { type: Number, default: 0.1 } // 10% default tax rate in Vietnam
  },
  isActive: { type: Boolean, default: true },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'subscription.type': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// Virtual for portfolios
userSchema.virtual('portfolios', {
  ref: 'Portfolio',
  localField: '_id',
  foreignField: 'owner'
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  this.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Method to generate email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = require('crypto').randomBytes(32).toString('hex');
  
  this.emailVerificationToken = require('crypto')
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Method to check if user can access premium features
userSchema.methods.canAccessPremiumFeatures = function() {
  return this.subscription.type === 'premium' && 
         this.subscription.isActive && 
         this.subscription.endDate > new Date();
};

// Method to update last activity
userSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', userSchema);
