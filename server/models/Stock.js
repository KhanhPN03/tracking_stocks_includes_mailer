const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  open: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  close: { type: Number, required: true },
  volume: { type: Number, required: true },
  adjustedClose: Number,
  timestamp: { type: Date, default: Date.now }
});

const technicalIndicatorSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  sma_20: Number,
  sma_50: Number,
  sma_200: Number,
  ema_12: Number,
  ema_26: Number,
  rsi: Number,
  macd: Number,
  macdSignal: Number,
  macdHistogram: Number,
  bollinger_upper: Number,
  bollinger_middle: Number,
  bollinger_lower: Number,
  stochastic_k: Number,
  stochastic_d: Number
});

const fundamentalDataSchema = new mongoose.Schema({
  marketCap: Number,
  peRatio: Number,
  pbRatio: Number,
  epsQuarterly: Number,
  epsAnnual: Number,
  dividendYield: Number,
  bookValuePerShare: Number,
  priceToBook: Number,
  priceToSales: Number,
  returnOnEquity: Number,
  returnOnAssets: Number,
  debtToEquity: Number,
  currentRatio: Number,
  quickRatio: Number,
  grossMargin: Number,
  operatingMargin: Number,
  netMargin: Number,
  beta: Number,
  week52High: Number,
  week52Low: Number,
  avgVolume: Number,
  sharesOutstanding: Number,
  floatShares: Number,
  insiderOwnership: Number,
  institutionalOwnership: Number,
  foreignOwnership: Number, // Vietnam-specific
  lastUpdated: { type: Date, default: Date.now }
});

const corporateActionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['dividend', 'stock_dividend', 'stock_split', 'rights_issue', 'agm', 'spin_off', 'merger'],
    required: true
  },
  announcementDate: Date,
  exDate: Date,
  recordDate: Date,
  paymentDate: Date,
  description: String,
  value: Number, // dividend amount, split ratio, etc.
  ratio: String, // for stock splits, rights issues
  status: {
    type: String,
    enum: ['announced', 'approved', 'executed', 'cancelled'],
    default: 'announced'
  }
});

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Stock symbol is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  exchange: {
    type: String,
    enum: ['HOSE', 'HNX', 'UPCOM'],
    required: true
  },
  sector: {
    type: String,
    enum: [
      'Banking', 'Real Estate', 'Oil & Gas', 'Food & Beverages',
      'Construction & Materials', 'Chemicals', 'Technology',
      'Healthcare', 'Retail', 'Transportation', 'Utilities',
      'Telecommunications', 'Mining', 'Agriculture', 'Textiles',
      'Steel', 'Insurance', 'Securities', 'Other'
    ]
  },
  industry: String,
  description: String,
  website: String,
  employees: Number,
  founded: Date,
  headquarters: {
    address: String,
    city: String,
    country: { type: String, default: 'Vietnam' }
  },
  
  // Current market data
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  previousClose: Number,
  dayChange: Number,
  dayChangePercent: Number,
  volume: Number,
  averageVolume: Number,
  marketCap: Number,
  
  // Trading information
  lotSize: { type: Number, default: 100 },
  tickSize: { type: Number, default: 100 },
  ceilingPrice: Number,
  floorPrice: Number,
  referencePrice: Number,
  
  // Foreign ownership (Vietnam-specific)
  foreignOwnership: {
    current: Number,
    limit: Number,
    available: Number
  },
  
  // Historical data
  priceHistory: [priceHistorySchema],
  technicalIndicators: [technicalIndicatorSchema],
  fundamentalData: fundamentalDataSchema,
  corporateActions: [corporateActionSchema],
  
  // Market status
  isActive: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },
  suspensionReason: String,
  lastTradingDay: Date,
  
  // Data source tracking
  lastPriceUpdate: { type: Date, default: Date.now },
  dataSource: { type: String, default: 'DNSE' },
  
  // News and events
  recentNews: [{
    title: String,
    summary: String,
    url: String,
    publishDate: Date,
    source: String,
    sentiment: { type: String, enum: ['positive', 'negative', 'neutral'] }
  }],
  
  // Analyst coverage
  analystRatings: [{
    firm: String,
    analyst: String,
    rating: { type: String, enum: ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell'] },
    targetPrice: Number,
    date: Date,
    report: String
  }],
  
  // Risk metrics
  riskMetrics: {
    beta: Number,
    volatility: Number,
    sharpeRatio: Number,
    maxDrawdown: Number,
    var_95: Number, // Value at Risk 95%
    lastCalculated: Date
  },
  
  // Vietnam-specific data
  vnData: {
    stateOwnership: Number,
    parValue: { type: Number, default: 10000 }, // VND 10,000 typical
    listedShares: Number,
    isIndex: { type: Boolean, default: false },
    indexWeights: {
      vnIndex: Number,
      vn30: Number,
      hnxIndex: Number
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
stockSchema.index({ symbol: 1 });
stockSchema.index({ exchange: 1 });
stockSchema.index({ sector: 1 });
stockSchema.index({ isActive: 1 });
stockSchema.index({ lastPriceUpdate: 1 });
stockSchema.index({ 'priceHistory.date': 1 });

// Virtual for price change
stockSchema.virtual('priceChange').get(function() {
  return this.currentPrice - (this.previousClose || this.currentPrice);
});

// Virtual for price change percentage
stockSchema.virtual('priceChangePercent').get(function() {
  const previousClose = this.previousClose || this.currentPrice;
  return previousClose > 0 ? ((this.currentPrice - previousClose) / previousClose) * 100 : 0;
});

// Virtual for market cap in billions
stockSchema.virtual('marketCapBillions').get(function() {
  return this.marketCap ? (this.marketCap / 1000000000).toFixed(2) : null;
});

// Method to update current price
stockSchema.methods.updatePrice = function(priceData) {
  this.previousClose = this.currentPrice;
  this.currentPrice = priceData.price;
  this.volume = priceData.volume;
  this.dayChange = priceData.change;
  this.dayChangePercent = priceData.changePercent;
  this.lastPriceUpdate = new Date();
  
  // Add to price history if it's a new trading day
  const today = new Date().toDateString();
  const lastHistoryDate = this.priceHistory.length > 0 ? 
    this.priceHistory[this.priceHistory.length - 1].date.toDateString() : '';
  
  if (today !== lastHistoryDate && priceData.ohlcv) {
    this.priceHistory.push({
      date: new Date(),
      open: priceData.ohlcv.open,
      high: priceData.ohlcv.high,
      low: priceData.ohlcv.low,
      close: priceData.price,
      volume: priceData.volume
    });
    
    // Keep only last 365 days of history
    if (this.priceHistory.length > 365) {
      this.priceHistory = this.priceHistory.slice(-365);
    }
  }
  
  return this.save();
};

// Method to calculate technical indicators
stockSchema.methods.calculateTechnicalIndicators = function() {
  if (this.priceHistory.length < 20) return;
  
  const prices = this.priceHistory.map(p => p.close);
  const volumes = this.priceHistory.map(p => p.volume);
  
  // Simple Moving Averages
  const sma20 = this.calculateSMA(prices, 20);
  const sma50 = this.calculateSMA(prices, 50);
  const sma200 = this.calculateSMA(prices, 200);
  
  // RSI
  const rsi = this.calculateRSI(prices, 14);
  
  const today = new Date();
  const existingIndicator = this.technicalIndicators.find(
    ti => ti.date.toDateString() === today.toDateString()
  );
  
  if (existingIndicator) {
    existingIndicator.sma_20 = sma20;
    existingIndicator.sma_50 = sma50;
    existingIndicator.sma_200 = sma200;
    existingIndicator.rsi = rsi;
  } else {
    this.technicalIndicators.push({
      date: today,
      sma_20: sma20,
      sma_50: sma50,
      sma_200: sma200,
      rsi: rsi
    });
  }
  
  // Keep only last 365 days
  if (this.technicalIndicators.length > 365) {
    this.technicalIndicators = this.technicalIndicators.slice(-365);
  }
  
  return this.save();
};

// Helper method for SMA calculation
stockSchema.methods.calculateSMA = function(prices, period) {
  if (prices.length < period) return null;
  const recent = prices.slice(-period);
  return recent.reduce((sum, price) => sum + price, 0) / period;
};

// Helper method for RSI calculation
stockSchema.methods.calculateRSI = function(prices, period = 14) {
  if (prices.length < period + 1) return null;
  
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);
  
  const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
  const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// Method to add corporate action
stockSchema.methods.addCorporateAction = function(actionData) {
  this.corporateActions.push(actionData);
  return this.save();
};

// Method to check if stock is in trading hours
stockSchema.methods.isInTradingHours = function() {
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
  const hour = vietnamTime.getHours();
  const minute = vietnamTime.getMinutes();
  const dayOfWeek = vietnamTime.getDay();
  
  // Check if it's a weekday (Monday = 1, Friday = 5)
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  
  // Trading hours: 9:00 - 15:00 ICT
  const startTime = 9 * 60; // 9:00 in minutes
  const endTime = 15 * 60;  // 15:00 in minutes
  const currentTime = hour * 60 + minute;
  
  return currentTime >= startTime && currentTime < endTime;
};

// Static method to get market indices symbols
stockSchema.statics.getMarketIndices = function() {
  return ['VNINDEX', 'VN30', 'HNXINDEX', 'UPCOMINDEX'];
};

// Static method to find stocks by sector
stockSchema.statics.findBySector = function(sector) {
  return this.find({ sector: sector, isActive: true });
};

// Pre-save middleware
stockSchema.pre('save', function(next) {
  // Calculate day change if not provided
  if (this.currentPrice && this.previousClose) {
    this.dayChange = this.currentPrice - this.previousClose;
    this.dayChangePercent = (this.dayChange / this.previousClose) * 100;
  }
  
  next();
});

module.exports = mongoose.model('Stock', stockSchema);
