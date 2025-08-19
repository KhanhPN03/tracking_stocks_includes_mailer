const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Alert user is required']
  },
  symbol: {
    type: String,
    required: [true, 'Stock symbol is required'],
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['price', 'volume', 'news', 'percent-change', 'technical', 'dividend'],
    required: [true, 'Alert type is required']
  },
  condition: {
    type: String,
    enum: [
      'above', 'below', 'equals',
      'percent-change-up', 'percent-change-down',
      'volume-spike', 'volume-drop',
      'rsi-overbought', 'rsi-oversold',
      'ma-crossover', 'ma-crossunder',
      'new-high', 'new-low'
    ],
    required: [true, 'Alert condition is required']
  },
  value: {
    type: Number,
    required: function() {
      return ['above', 'below', 'equals', 'percent-change-up', 'percent-change-down'].includes(this.condition);
    }
  },
  message: {
    type: String,
    maxlength: [200, 'Alert message cannot exceed 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  triggered: {
    type: Boolean,
    default: false
  },
  triggeredAt: Date,
  triggeredPrice: Number,
  triggerCount: {
    type: Number,
    default: 0
  },
  lastTriggered: Date,
  
  // Alert settings
  settings: {
    // Notification methods
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    
    // Frequency settings
    frequency: {
      type: String,
      enum: ['once', 'daily', 'always'],
      default: 'once'
    },
    
    // Cooldown period to prevent spam (in minutes)
    cooldownMinutes: {
      type: Number,
      default: 60
    },
    
    // Expiration
    expiresAt: Date,
    
    // Auto-disable after trigger
    disableAfterTrigger: {
      type: Boolean,
      default: false
    }
  },
  
  // Alert metadata
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // For technical alerts
  technicalParams: {
    indicator: {
      type: String,
      enum: ['rsi', 'macd', 'sma', 'ema', 'bollinger', 'stochastic']
    },
    period: Number,
    threshold: Number
  },
  
  // For volume alerts
  volumeParams: {
    multiplier: Number, // e.g., 2x average volume
    period: Number      // average volume period (days)
  },
  
  // For news alerts
  newsParams: {
    keywords: [String],
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'any'],
      default: 'any'
    }
  },
  
  // Performance tracking
  performance: {
    accuracy: Number,
    falsePositives: { type: Number, default: 0 },
    truePositives: { type: Number, default: 0 }
  },
  
  // Related portfolio or watchlist
  source: {
    type: {
      type: String,
      enum: ['portfolio', 'watchlist', 'manual']
    },
    id: mongoose.Schema.Types.ObjectId,
    name: String
  },
  
  tags: [String],
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
alertSchema.index({ user: 1, isActive: 1 });
alertSchema.index({ symbol: 1, isActive: 1 });
alertSchema.index({ type: 1, condition: 1 });
alertSchema.index({ triggered: 1, isActive: 1 });
alertSchema.index({ 'settings.expiresAt': 1 });
alertSchema.index({ createdAt: 1 });

// Virtual for alert status
alertSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.triggered && this.settings.disableAfterTrigger) return 'completed';
  if (this.settings.expiresAt && this.settings.expiresAt < new Date()) return 'expired';
  return 'active';
});

// Virtual for time until expiration
alertSchema.virtual('timeToExpiry').get(function() {
  if (!this.settings.expiresAt) return null;
  const now = new Date();
  const expiry = new Date(this.settings.expiresAt);
  return expiry.getTime() - now.getTime();
});

// Method to check if alert should be triggered
alertSchema.methods.shouldTrigger = function(currentData) {
  if (!this.isActive || this.status !== 'active') return false;
  
  // Check cooldown period
  if (this.lastTriggered) {
    const cooldownEnd = new Date(this.lastTriggered.getTime() + (this.settings.cooldownMinutes * 60 * 1000));
    if (new Date() < cooldownEnd) return false;
  }
  
  // Check frequency settings
  if (this.settings.frequency === 'once' && this.triggered) return false;
  
  if (this.settings.frequency === 'daily' && this.lastTriggered) {
    const today = new Date().toDateString();
    const lastTriggerDate = new Date(this.lastTriggered).toDateString();
    if (today === lastTriggerDate) return false;
  }
  
  const currentPrice = currentData.currentPrice;
  const currentVolume = currentData.volume;
  const technicalData = currentData.technical;
  
  switch (this.condition) {
    case 'above':
      return currentPrice > this.value;
    
    case 'below':
      return currentPrice < this.value;
    
    case 'equals':
      return Math.abs(currentPrice - this.value) < (this.value * 0.01); // 1% tolerance
    
    case 'percent-change-up':
      const changeUp = ((currentPrice - currentData.previousClose) / currentData.previousClose) * 100;
      return changeUp >= this.value;
    
    case 'percent-change-down':
      const changeDown = ((currentData.previousClose - currentPrice) / currentData.previousClose) * 100;
      return changeDown >= this.value;
    
    case 'volume-spike':
      if (!this.volumeParams.multiplier || !currentData.averageVolume) return false;
      return currentVolume >= (currentData.averageVolume * this.volumeParams.multiplier);
    
    case 'volume-drop':
      if (!this.volumeParams.multiplier || !currentData.averageVolume) return false;
      return currentVolume <= (currentData.averageVolume / this.volumeParams.multiplier);
    
    case 'rsi-overbought':
      return technicalData?.rsi >= (this.technicalParams.threshold || 70);
    
    case 'rsi-oversold':
      return technicalData?.rsi <= (this.technicalParams.threshold || 30);
    
    case 'new-high':
      return currentPrice >= currentData.week52High;
    
    case 'new-low':
      return currentPrice <= currentData.week52Low;
    
    default:
      return false;
  }
};

// Method to trigger alert
alertSchema.methods.trigger = function(currentData) {
  this.triggered = true;
  this.triggeredAt = new Date();
  this.lastTriggered = new Date();
  this.triggeredPrice = currentData.currentPrice;
  this.triggerCount += 1;
  
  if (this.settings.disableAfterTrigger) {
    this.isActive = false;
  }
  
  return this.save();
};

// Method to reset alert
alertSchema.methods.reset = function() {
  this.triggered = false;
  this.triggeredAt = null;
  this.triggeredPrice = null;
  this.isActive = true;
  return this.save();
};

// Method to snooze alert
alertSchema.methods.snooze = function(minutes = 60) {
  this.lastTriggered = new Date();
  this.settings.cooldownMinutes = minutes;
  return this.save();
};

// Method to update performance metrics
alertSchema.methods.updatePerformance = function(isCorrectPrediction) {
  if (isCorrectPrediction) {
    this.performance.truePositives += 1;
  } else {
    this.performance.falsePositives += 1;
  }
  
  const total = this.performance.truePositives + this.performance.falsePositives;
  this.performance.accuracy = total > 0 ? (this.performance.truePositives / total) * 100 : 0;
  
  return this.save();
};

// Method to generate alert message
alertSchema.methods.generateMessage = function(currentData) {
  if (this.message) return this.message;
  
  const symbol = this.symbol;
  const price = currentData.currentPrice;
  const change = currentData.dayChange;
  const changePercent = currentData.dayChangePercent;
  
  switch (this.condition) {
    case 'above':
      return `${symbol} has reached ${price.toLocaleString()} VND (above your target of ${this.value.toLocaleString()} VND)`;
    
    case 'below':
      return `${symbol} has dropped to ${price.toLocaleString()} VND (below your target of ${this.value.toLocaleString()} VND)`;
    
    case 'percent-change-up':
      return `${symbol} is up ${changePercent.toFixed(2)}% today (${change > 0 ? '+' : ''}${change.toFixed(0)} VND)`;
    
    case 'percent-change-down':
      return `${symbol} is down ${Math.abs(changePercent).toFixed(2)}% today (${change.toFixed(0)} VND)`;
    
    case 'volume-spike':
      return `${symbol} volume spike detected: ${(currentData.volume / 1000000).toFixed(1)}M shares (${this.volumeParams.multiplier}x average)`;
    
    case 'new-high':
      return `${symbol} has reached a new 52-week high: ${price.toLocaleString()} VND`;
    
    case 'new-low':
      return `${symbol} has reached a new 52-week low: ${price.toLocaleString()} VND`;
    
    default:
      return `Alert triggered for ${symbol} at ${price.toLocaleString()} VND`;
  }
};

// Static method to find alerts for a user
alertSchema.statics.findUserAlerts = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }
  
  if (options.symbol) {
    query.symbol = options.symbol.toUpperCase();
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query)
    .populate('user', 'username email preferences')
    .sort({ createdAt: -1 });
};

// Static method to find active alerts for symbols
alertSchema.statics.findActiveAlertsForSymbols = function(symbols) {
  return this.find({
    symbol: { $in: symbols.map(s => s.toUpperCase()) },
    isActive: true,
    $or: [
      { 'settings.expiresAt': { $exists: false } },
      { 'settings.expiresAt': { $gt: new Date() } }
    ]
  }).populate('user', 'username email preferences');
};

// Static method to clean up expired alerts
alertSchema.statics.cleanupExpiredAlerts = function() {
  return this.updateMany(
    {
      'settings.expiresAt': { $lt: new Date() },
      isActive: true
    },
    {
      isActive: false
    }
  );
};

// Static method to get alert statistics
alertSchema.statics.getAlertStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
        triggered: { $sum: { $cond: ['$triggered', 1, 0] } },
        avgAccuracy: { $avg: '$performance.accuracy' },
        byType: {
          $push: {
            type: '$type',
            isActive: '$isActive',
            triggered: '$triggered'
          }
        }
      }
    }
  ]);
};

// Pre-save middleware
alertSchema.pre('save', function(next) {
  // Auto-disable if expired
  if (this.settings.expiresAt && this.settings.expiresAt < new Date()) {
    this.isActive = false;
  }
  
  // Ensure uppercase symbol
  if (this.symbol) {
    this.symbol = this.symbol.toUpperCase();
  }
  
  next();
});

// Pre-remove middleware to clean up related data
alertSchema.pre('remove', function(next) {
  // Could add cleanup logic here if needed
  next();
});

module.exports = mongoose.model('Alert', alertSchema);
