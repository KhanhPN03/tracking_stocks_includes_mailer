const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'News title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  summary: {
    type: String,
    maxlength: [500, 'Summary cannot exceed 500 characters']
  },
  content: {
    type: String,
    required: [true, 'News content is required']
  },
  url: {
    type: String,
    required: [true, 'News URL is required'],
    unique: true
  },
  imageUrl: String,
  publishDate: {
    type: Date,
    required: [true, 'Publish date is required'],
    index: true
  },
  source: {
    name: {
      type: String,
      required: [true, 'Source name is required']
    },
    domain: String,
    credibility: {
      type: Number,
      min: 0,
      max: 5,
      default: 3
    }
  },
  author: {
    name: String,
    email: String
  },
  category: {
    type: String,
    enum: [
      'market-news', 'company-news', 'economic-data', 'policy-regulation',
      'earnings', 'dividends', 'mergers-acquisitions', 'ipo',
      'analyst-reports', 'market-analysis', 'sector-news', 'global-markets'
    ],
    required: true
  },
  symbols: [{
    type: String,
    uppercase: true,
    trim: true
  }],
  sectors: [{
    type: String,
    enum: [
      'Banking', 'Real Estate', 'Oil & Gas', 'Food & Beverages',
      'Construction & Materials', 'Chemicals', 'Technology',
      'Healthcare', 'Retail', 'Transportation', 'Utilities',
      'Telecommunications', 'Mining', 'Agriculture', 'Textiles',
      'Steel', 'Insurance', 'Securities'
    ]
  }],
  tags: [String],
  keywords: [String],
  
  // Language and localization
  language: {
    type: String,
    enum: ['vi', 'en'],
    default: 'vi'
  },
  
  // Sentiment analysis
  sentiment: {
    score: {
      type: Number,
      min: -1,
      max: 1,
      default: 0
    },
    label: {
      type: String,
      enum: ['very-negative', 'negative', 'neutral', 'positive', 'very-positive'],
      default: 'neutral'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    }
  },
  
  // Importance and impact
  importance: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  marketImpact: {
    type: String,
    enum: ['none', 'low', 'medium', 'high'],
    default: 'low'
  },
  
  // Content metrics
  readTime: Number, // estimated read time in minutes
  wordCount: Number,
  
  // Engagement metrics
  metrics: {
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 }
  },
  
  // User interactions
  userInteractions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['view', 'like', 'share', 'bookmark', 'comment'] },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Content analysis
  analysis: {
    // Financial metrics mentioned
    priceTargets: [{
      symbol: String,
      target: Number,
      analyst: String,
      timeframe: String
    }],
    
    // Key financial figures
    financialData: [{
      metric: String,
      value: Number,
      period: String,
      symbol: String
    }],
    
    // Event extraction
    events: [{
      type: { type: String, enum: ['earnings', 'dividend', 'meeting', 'launch', 'merger'] },
      date: Date,
      description: String,
      symbols: [String]
    }]
  },
  
  // Related content
  relatedNews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News'
  }],
  
  // Processing status
  status: {
    type: String,
    enum: ['draft', 'processing', 'published', 'archived'],
    default: 'published'
  },
  
  // Data quality
  quality: {
    isVerified: { type: Boolean, default: false },
    hasDuplicates: { type: Boolean, default: false },
    confidenceScore: { type: Number, min: 0, max: 1, default: 0.5 },
    flags: [String] // quality issues
  },
  
  // SEO and metadata
  seo: {
    metaTitle: String,
    metaDescription: String,
    slug: String
  },
  
  // Expiration and archiving
  expiresAt: Date,
  isArchived: { type: Boolean, default: false },
  archivedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
newsSchema.index({ publishDate: -1 });
newsSchema.index({ symbols: 1, publishDate: -1 });
newsSchema.index({ category: 1, publishDate: -1 });
newsSchema.index({ sectors: 1, publishDate: -1 });
newsSchema.index({ source: 1 });
newsSchema.index({ sentiment: 1 });
newsSchema.index({ importance: 1 });
newsSchema.index({ status: 1 });
newsSchema.index({ keywords: 1 });
newsSchema.index({ tags: 1 });
newsSchema.index({ url: 1 }, { unique: true });

// Text search index
newsSchema.index({
  title: 'text',
  summary: 'text',
  content: 'text',
  keywords: 'text'
});

// Virtual for age of news
newsSchema.virtual('age').get(function() {
  return new Date() - this.publishDate;
});

// Virtual for age in human readable format
newsSchema.virtual('ageFormatted').get(function() {
  const diff = new Date() - this.publishDate;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Virtual for engagement rate
newsSchema.virtual('engagementRate').get(function() {
  const totalInteractions = this.metrics.likes + this.metrics.shares + this.metrics.comments;
  return this.metrics.views > 0 ? (totalInteractions / this.metrics.views) * 100 : 0;
});

// Method to add user interaction
newsSchema.methods.addInteraction = function(userId, action) {
  // Remove existing interaction of same type from same user
  this.userInteractions = this.userInteractions.filter(
    interaction => !(interaction.user.toString() === userId.toString() && interaction.action === action)
  );
  
  // Add new interaction
  this.userInteractions.push({
    user: userId,
    action: action,
    timestamp: new Date()
  });
  
  // Update metrics
  if (action === 'view') this.metrics.views += 1;
  else if (action === 'like') this.metrics.likes += 1;
  else if (action === 'share') this.metrics.shares += 1;
  else if (action === 'bookmark') this.metrics.bookmarks += 1;
  else if (action === 'comment') this.metrics.comments += 1;
  
  return this.save();
};

// Method to calculate sentiment
newsSchema.methods.calculateSentiment = function() {
  // Simplified sentiment analysis based on keywords
  const positiveWords = ['tăng', 'tăng trưởng', 'lợi nhuận', 'thành công', 'tích cực', 'cải thiện', 'tốt'];
  const negativeWords = ['giảm', 'lỗ', 'tiêu cực', 'khủng hoảng', 'suy thoái', 'thất bại', 'xấu'];
  
  const text = (this.title + ' ' + this.summary + ' ' + this.content).toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    const matches = text.match(new RegExp(word, 'g'));
    if (matches) positiveCount += matches.length;
  });
  
  negativeWords.forEach(word => {
    const matches = text.match(new RegExp(word, 'g'));
    if (matches) negativeCount += matches.length;
  });
  
  const totalWords = positiveCount + negativeCount;
  if (totalWords === 0) {
    this.sentiment.score = 0;
    this.sentiment.label = 'neutral';
    this.sentiment.confidence = 0.5;
  } else {
    this.sentiment.score = (positiveCount - negativeCount) / totalWords;
    
    if (this.sentiment.score > 0.3) this.sentiment.label = 'positive';
    else if (this.sentiment.score > 0.6) this.sentiment.label = 'very-positive';
    else if (this.sentiment.score < -0.3) this.sentiment.label = 'negative';
    else if (this.sentiment.score < -0.6) this.sentiment.label = 'very-negative';
    else this.sentiment.label = 'neutral';
    
    this.sentiment.confidence = Math.min(0.9, totalWords / 10);
  }
  
  return this.save();
};

// Method to extract symbols from content
newsSchema.methods.extractSymbols = function() {
  const vietnamStockPattern = /\b[A-Z]{3}\b/g;
  const matches = (this.title + ' ' + this.content).match(vietnamStockPattern);
  
  if (matches) {
    // Filter out common false positives
    const excludeWords = ['VND', 'USD', 'GDP', 'CEO', 'IPO', 'M&A'];
    this.symbols = [...new Set(matches.filter(match => !excludeWords.includes(match)))];
  }
  
  return this.save();
};

// Method to calculate read time
newsSchema.methods.calculateReadTime = function() {
  const wordsPerMinute = 200; // Average reading speed
  this.wordCount = this.content.split(' ').length;
  this.readTime = Math.ceil(this.wordCount / wordsPerMinute);
  return this.save();
};

// Static method to find news by symbol
newsSchema.statics.findBySymbol = function(symbol, limit = 10) {
  return this.find({
    symbols: symbol.toUpperCase(),
    status: 'published',
    publishDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  })
  .sort({ publishDate: -1 })
  .limit(limit);
};

// Static method to find trending news
newsSchema.statics.findTrending = function(timeframe = 24, limit = 10) {
  const since = new Date(Date.now() - timeframe * 60 * 60 * 1000);
  
  return this.find({
    publishDate: { $gte: since },
    status: 'published'
  })
  .sort({ 
    'metrics.views': -1,
    'metrics.shares': -1,
    publishDate: -1 
  })
  .limit(limit);
};

// Static method to find news by category
newsSchema.statics.findByCategory = function(category, limit = 20) {
  return this.find({
    category: category,
    status: 'published',
    publishDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
  })
  .sort({ publishDate: -1 })
  .limit(limit);
};

// Static method to find market-moving news
newsSchema.statics.findMarketMoving = function(limit = 10) {
  return this.find({
    marketImpact: { $in: ['high', 'medium'] },
    importance: { $in: ['high', 'critical'] },
    status: 'published',
    publishDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  })
  .sort({ publishDate: -1, importance: -1 })
  .limit(limit);
};

// Static method to get news analytics
newsSchema.statics.getAnalytics = function(timeframe = 7) {
  const since = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    { $match: { publishDate: { $gte: since }, status: 'published' } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        avgViews: { $avg: '$metrics.views' },
        avgEngagement: { $avg: { $add: ['$metrics.likes', '$metrics.shares', '$metrics.comments'] } },
        byCategory: {
          $push: {
            category: '$category',
            sentiment: '$sentiment.label',
            importance: '$importance'
          }
        }
      }
    }
  ]);
};

// Pre-save middleware
newsSchema.pre('save', function(next) {
  // Generate slug if not exists
  if (!this.seo.slug && this.title) {
    this.seo.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
  }
  
  // Calculate read time and word count
  if (this.isModified('content')) {
    this.calculateReadTime();
  }
  
  // Extract symbols if content changed
  if (this.isModified('content') || this.isModified('title')) {
    this.extractSymbols();
  }
  
  // Auto-archive old news
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (this.publishDate < thirtyDaysAgo && !this.isArchived) {
    this.isArchived = true;
    this.archivedAt = new Date();
  }
  
  next();
});

// Post-save middleware
newsSchema.post('save', function() {
  // Calculate sentiment asynchronously
  if (this.isModified('content') || this.isModified('title')) {
    this.calculateSentiment();
  }
});

module.exports = mongoose.model('News', newsSchema);
