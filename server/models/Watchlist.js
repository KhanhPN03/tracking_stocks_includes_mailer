const mongoose = require('mongoose');

const watchlistItemSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Stock symbol is required'],
    uppercase: true,
    trim: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  },
  targetPrice: {
    type: Number,
    min: [0, 'Target price cannot be negative']
  },
  alertEnabled: {
    type: Boolean,
    default: false
  },
  alertPrice: {
    type: Number,
    min: [0, 'Alert price cannot be negative']
  },
  alertCondition: {
    type: String,
    enum: ['above', 'below'],
    default: 'above'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [String]
});

const watchlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Watchlist name is required'],
    trim: true,
    maxlength: [100, 'Watchlist name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Watchlist owner is required']
  },
  items: [watchlistItemSchema],
  isDefault: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['general', 'dividend', 'growth', 'value', 'tech', 'banking', 'realestate', 'custom'],
    default: 'general'
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  sortBy: {
    type: String,
    enum: ['symbol', 'name', 'price', 'change', 'volume', 'addedAt'],
    default: 'addedAt'
  },
  sortOrder: {
    type: String,
    enum: ['asc', 'desc'],
    default: 'desc'
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  followers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    totalItems: {
      type: Number,
      default: 0
    },
    avgPrice: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    },
    dayChange: {
      type: Number,
      default: 0
    },
    dayChangePercent: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  },
  alerts: {
    priceAlerts: {
      type: Boolean,
      default: true
    },
    volumeAlerts: {
      type: Boolean,
      default: false
    },
    newsAlerts: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
watchlistSchema.index({ owner: 1, name: 1 });
watchlistSchema.index({ owner: 1, isActive: 1 });
watchlistSchema.index({ isPublic: 1 });
watchlistSchema.index({ category: 1 });
watchlistSchema.index({ 'items.symbol': 1 });

// Virtual for items count
watchlistSchema.virtual('itemCount').get(function() {
  return this.items.length;
});

// Virtual populate for stock details
watchlistSchema.virtual('stockDetails', {
  ref: 'Stock',
  localField: 'items.symbol',
  foreignField: 'symbol'
});

// Method to add stock to watchlist
watchlistSchema.methods.addStock = function(stockData) {
  // Check if stock already exists
  const existingItem = this.items.find(item => item.symbol === stockData.symbol.toUpperCase());
  
  if (existingItem) {
    throw new Error('Stock already exists in watchlist');
  }
  
  this.items.push({
    ...stockData,
    symbol: stockData.symbol.toUpperCase(),
    addedAt: new Date()
  });
  
  this.stats.totalItems = this.items.length;
  return this.save();
};

// Method to remove stock from watchlist
watchlistSchema.methods.removeStock = function(symbol) {
  this.items = this.items.filter(item => item.symbol !== symbol.toUpperCase());
  this.stats.totalItems = this.items.length;
  return this.save();
};

// Method to update stock in watchlist
watchlistSchema.methods.updateStock = function(symbol, updateData) {
  const item = this.items.find(item => item.symbol === symbol.toUpperCase());
  
  if (!item) {
    throw new Error('Stock not found in watchlist');
  }
  
  Object.assign(item, updateData);
  return this.save();
};

// Method to reorder stocks
watchlistSchema.methods.reorderStocks = function(newOrder) {
  // newOrder should be an array of symbols in the desired order
  const reorderedItems = [];
  
  newOrder.forEach(symbol => {
    const item = this.items.find(item => item.symbol === symbol.toUpperCase());
    if (item) {
      reorderedItems.push(item);
    }
  });
  
  // Add any remaining items that weren't in the new order
  this.items.forEach(item => {
    if (!newOrder.includes(item.symbol)) {
      reorderedItems.push(item);
    }
  });
  
  this.items = reorderedItems;
  return this.save();
};

// Method to calculate watchlist statistics
watchlistSchema.methods.calculateStats = function(priceData) {
  if (this.items.length === 0) {
    this.stats = {
      totalItems: 0,
      avgPrice: 0,
      totalValue: 0,
      dayChange: 0,
      dayChangePercent: 0,
      lastUpdated: new Date()
    };
    return this.save();
  }
  
  let totalValue = 0;
  let totalChange = 0;
  let validPrices = 0;
  
  this.items.forEach(item => {
    const stockPrice = priceData[item.symbol];
    if (stockPrice) {
      totalValue += stockPrice.currentPrice || 0;
      totalChange += stockPrice.dayChange || 0;
      validPrices++;
    }
  });
  
  const avgPrice = validPrices > 0 ? totalValue / validPrices : 0;
  const avgChange = validPrices > 0 ? totalChange / validPrices : 0;
  const avgChangePercent = avgPrice > 0 ? (avgChange / (avgPrice - avgChange)) * 100 : 0;
  
  this.stats = {
    totalItems: this.items.length,
    avgPrice: avgPrice,
    totalValue: totalValue,
    dayChange: totalChange,
    dayChangePercent: avgChangePercent,
    lastUpdated: new Date()
  };
  
  return this.save();
};

// Method to get stocks with alerts
watchlistSchema.methods.getStocksWithAlerts = function() {
  return this.items.filter(item => item.alertEnabled);
};

// Method to share watchlist
watchlistSchema.methods.shareWith = function(userId, permission = 'view') {
  // Check if already shared with this user
  const existingShare = this.sharedWith.find(share => 
    share.user.toString() === userId.toString()
  );
  
  if (existingShare) {
    existingShare.permission = permission;
  } else {
    this.sharedWith.push({
      user: userId,
      permission: permission
    });
  }
  
  return this.save();
};

// Method to unshare watchlist
watchlistSchema.methods.unshareWith = function(userId) {
  this.sharedWith = this.sharedWith.filter(share => 
    share.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to add follower
watchlistSchema.methods.addFollower = function(userId) {
  const existingFollower = this.followers.find(follower => 
    follower.user.toString() === userId.toString()
  );
  
  if (!existingFollower) {
    this.followers.push({ user: userId });
    return this.save();
  }
  
  return this;
};

// Method to remove follower
watchlistSchema.methods.removeFollower = function(userId) {
  this.followers = this.followers.filter(follower => 
    follower.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to get top performers
watchlistSchema.methods.getTopPerformers = function(priceData, limit = 5) {
  const itemsWithPrices = this.items.map(item => {
    const stockPrice = priceData[item.symbol];
    return {
      ...item.toObject(),
      currentPrice: stockPrice?.currentPrice || 0,
      dayChange: stockPrice?.dayChange || 0,
      dayChangePercent: stockPrice?.dayChangePercent || 0
    };
  });
  
  return itemsWithPrices
    .sort((a, b) => b.dayChangePercent - a.dayChangePercent)
    .slice(0, limit);
};

// Method to get worst performers
watchlistSchema.methods.getWorstPerformers = function(priceData, limit = 5) {
  const itemsWithPrices = this.items.map(item => {
    const stockPrice = priceData[item.symbol];
    return {
      ...item.toObject(),
      currentPrice: stockPrice?.currentPrice || 0,
      dayChange: stockPrice?.dayChange || 0,
      dayChangePercent: stockPrice?.dayChangePercent || 0
    };
  });
  
  return itemsWithPrices
    .sort((a, b) => a.dayChangePercent - b.dayChangePercent)
    .slice(0, limit);
};

// Static method to find public watchlists
watchlistSchema.statics.findPublicWatchlists = function(category = null) {
  const query = { isPublic: true, isActive: true };
  if (category) {
    query.category = category;
  }
  return this.find(query).populate('owner', 'username').sort({ createdAt: -1 });
};

// Static method to find popular watchlists
watchlistSchema.statics.findPopularWatchlists = function(limit = 10) {
  return this.aggregate([
    { $match: { isPublic: true, isActive: true } },
    { $addFields: { followerCount: { $size: '$followers' } } },
    { $sort: { followerCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
        pipeline: [{ $project: { username: 1, email: 1 } }]
      }
    }
  ]);
};

// Pre-save middleware
watchlistSchema.pre('save', function(next) {
  // Update total items count
  this.stats.totalItems = this.items.length;
  
  // Set isDefault to false for other watchlists if this one is being set as default
  if (this.isDefault && this.isModified('isDefault')) {
    this.constructor.updateMany(
      { owner: this.owner, _id: { $ne: this._id } },
      { isDefault: false }
    ).exec();
  }
  
  next();
});

// Ensure user has only one default watchlist
watchlistSchema.index({ owner: 1, isDefault: 1 }, { 
  unique: true, 
  partialFilterExpression: { isDefault: true } 
});

module.exports = mongoose.model('Watchlist', watchlistSchema);
