const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['price', 'volume', 'news', 'percent-change'],
    required: true
  },
  condition: {
    type: String,
    enum: ['above', 'below', 'percent-change-up', 'percent-change-down', 'volume-spike'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  triggered: {
    type: Boolean,
    default: false
  },
  triggeredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Stock symbol is required'],
    uppercase: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative']
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required'],
    default: Date.now
  },
  targetPrice: {
    type: Number,
    min: [0, 'Target price cannot be negative']
  },
  stopLoss: {
    type: Number,
    min: [0, 'Stop loss cannot be negative']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  alerts: [alertSchema],
  // Additional purchase records for averaging
  purchases: [{
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    fees: { type: Number, default: 0 },
    notes: String
  }],
  // Sales records
  sales: [{
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    fees: { type: Number, default: 0 },
    notes: String
  }],
  // Dividend records
  dividends: [{
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ['cash', 'stock'], default: 'cash' },
    taxRate: { type: Number, default: 0.05 }
  }],
  tags: [String],
  sector: String,
  industry: String,
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for current holding quantity (purchases - sales)
stockSchema.virtual('currentQuantity').get(function() {
  const totalPurchases = this.purchases.reduce((sum, p) => sum + p.quantity, 0) + this.quantity;
  const totalSales = this.sales.reduce((sum, s) => sum + s.quantity, 0);
  return totalPurchases - totalSales;
});

// Virtual for average purchase price
stockSchema.virtual('averagePrice').get(function() {
  const allPurchases = [...this.purchases, {
    quantity: this.quantity,
    price: this.purchasePrice,
    date: this.purchaseDate
  }];
  
  const totalValue = allPurchases.reduce((sum, p) => sum + (p.quantity * p.price), 0);
  const totalQuantity = allPurchases.reduce((sum, p) => sum + p.quantity, 0);
  
  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
});

// Virtual for total invested amount
stockSchema.virtual('totalInvested').get(function() {
  const purchaseValue = this.purchases.reduce((sum, p) => sum + (p.quantity * p.price), 0) + 
                       (this.quantity * this.purchasePrice);
  const salesValue = this.sales.reduce((sum, s) => sum + (s.quantity * s.price), 0);
  return purchaseValue - salesValue;
});

const portfolioSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Portfolio name is required'],
    trim: true,
    maxlength: [100, 'Portfolio name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Portfolio owner is required']
  },
  stocks: [stockSchema],
  type: {
    type: String,
    enum: ['personal', 'demo', 'shared'],
    default: 'personal'
  },
  visibility: {
    type: String,
    enum: ['private', 'public', 'shared'],
    default: 'private'
  },
  currency: {
    type: String,
    enum: ['VND', 'USD'],
    default: 'VND'
  },
  benchmarks: [{
    symbol: { type: String, required: true }, // VN-INDEX, VN30, etc.
    name: String,
    weight: { type: Number, default: 1 }
  }],
  riskProfile: {
    type: String,
    enum: ['conservative', 'moderate', 'aggressive'],
    default: 'moderate'
  },
  goals: [{
    type: {
      type: String,
      enum: ['target-value', 'target-return', 'retirement', 'education', 'other']
    },
    targetValue: Number,
    targetDate: Date,
    description: String,
    achieved: { type: Boolean, default: false }
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  // Performance tracking
  performance: {
    totalValue: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    totalReturn: { type: Number, default: 0 },
    totalReturnPercent: { type: Number, default: 0 },
    dayChange: { type: Number, default: 0 },
    dayChangePercent: { type: Number, default: 0 },
    lastUpdated: Date
  },
  // Sharing settings
  sharedWith: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permission: { type: String, enum: ['view', 'edit'], default: 'view' },
    sharedAt: { type: Date, default: Date.now }
  }],
  // Backup and versioning
  version: { type: Number, default: 1 },
  lastBackup: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
portfolioSchema.index({ owner: 1, name: 1 });
portfolioSchema.index({ owner: 1, isActive: 1 });
portfolioSchema.index({ type: 1 });
portfolioSchema.index({ 'stocks.symbol': 1 });
portfolioSchema.index({ tags: 1 });

// Virtual for total stocks count
portfolioSchema.virtual('stockCount').get(function() {
  return this.stocks.filter(stock => stock.currentQuantity > 0).length;
});

// Virtual for portfolio value (will be calculated with real-time prices)
portfolioSchema.virtual('currentValue').get(function() {
  // This will be populated by the service layer with real-time prices
  return this.performance.totalValue || 0;
});

// Virtual for total return
portfolioSchema.virtual('totalReturn').get(function() {
  return this.currentValue - this.totalCost;
});

// Virtual for return percentage
portfolioSchema.virtual('returnPercentage').get(function() {
  const totalCost = this.stocks.reduce((sum, stock) => sum + stock.totalInvested, 0);
  return totalCost > 0 ? ((this.currentValue - totalCost) / totalCost) * 100 : 0;
});

// Method to add stock to portfolio
portfolioSchema.methods.addStock = function(stockData) {
  const existingStock = this.stocks.find(s => s.symbol === stockData.symbol.toUpperCase());
  
  if (existingStock) {
    // Add to purchases array for averaging
    existingStock.purchases.push({
      quantity: stockData.quantity,
      price: stockData.purchasePrice,
      date: stockData.purchaseDate || new Date(),
      fees: stockData.fees || 0,
      notes: stockData.notes
    });
  } else {
    // Add new stock
    this.stocks.push({
      ...stockData,
      symbol: stockData.symbol.toUpperCase(),
      purchases: []
    });
  }
  
  this.lastModified = new Date();
  return this.save();
};

// Method to remove stock from portfolio
portfolioSchema.methods.removeStock = function(symbol) {
  this.stocks = this.stocks.filter(stock => stock.symbol !== symbol.toUpperCase());
  this.lastModified = new Date();
  return this.save();
};

// Method to update stock quantity
portfolioSchema.methods.updateStock = function(symbol, updateData) {
  const stock = this.stocks.find(s => s.symbol === symbol.toUpperCase());
  if (stock) {
    Object.assign(stock, updateData);
    this.lastModified = new Date();
    return this.save();
  }
  throw new Error('Stock not found in portfolio');
};

// Method to calculate portfolio metrics
portfolioSchema.methods.calculateMetrics = function(priceData) {
  let totalValue = 0;
  let totalCost = 0;
  
  this.stocks.forEach(stock => {
    const currentPrice = priceData[stock.symbol] || stock.purchasePrice;
    const stockValue = stock.currentQuantity * currentPrice;
    totalValue += stockValue;
    totalCost += stock.totalInvested;
  });
  
  this.performance.totalValue = totalValue;
  this.performance.totalCost = totalCost;
  this.performance.totalReturn = totalValue - totalCost;
  this.performance.totalReturnPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  this.performance.lastUpdated = new Date();
  
  return this.save();
};

// Pre-save middleware
portfolioSchema.pre('save', function(next) {
  this.lastModified = new Date();
  this.version += 1;
  next();
});

module.exports = mongoose.model('Portfolio', portfolioSchema);
