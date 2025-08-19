const express = require('express');
const router = express.Router();

const Portfolio = require('../models/Portfolio');
const { protect, checkOwnership } = require('../middleware/auth');
const { validate, portfolioSchemas, paramSchemas } = require('../middleware/validation');

// @desc    Get all portfolios for user
// @route   GET /api/portfolio
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {
      owner: req.user._id,
      isActive: true
    };

    if (type) {
      query.type = type;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const portfolios = await Portfolio.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('owner', 'username email')
      .lean();

    const total = await Portfolio.countDocuments(query);

    // Calculate portfolio summaries
    const portfoliosWithSummary = portfolios.map(portfolio => ({
      ...portfolio,
      stockCount: portfolio.stocks.length,
      totalInvested: portfolio.stocks.reduce((sum, stock) => sum + (stock.quantity * stock.purchasePrice), 0),
      currentValue: portfolio.performance.totalValue || 0,
      totalReturn: portfolio.performance.totalReturn || 0,
      returnPercentage: portfolio.performance.totalReturnPercent || 0
    }));

    res.json({
      success: true,
      count: portfolios.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: portfoliosWithSummary
    });
  } catch (error) {
    console.error('Get portfolios error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting portfolios'
    });
  }
});

// @desc    Get single portfolio
// @route   GET /api/portfolio/:id
// @access  Private
router.get('/:id', protect, validate(paramSchemas.mongoId, 'params'), async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'sharedWith.user': req.user._id }
      ]
    })
      .populate('owner', 'username email firstName lastName')
      .populate('sharedWith.user', 'username email');

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Check if user has access
    const hasAccess = portfolio.owner._id.toString() === req.user._id.toString() ||
      portfolio.sharedWith.some(share => share.user._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting portfolio'
    });
  }
});

// @desc    Get portfolio holdings (stocks)
// @route   GET /api/portfolios/:id/holdings
// @access  Private
router.get('/:id/holdings', protect, validate(paramSchemas.mongoId, 'params'), async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'sharedWith.user': req.user._id }
      ]
    }).populate('stocks.symbol', 'name currentPrice dayChange dayChangePercent');

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Check if user has access
    const hasAccess = portfolio.owner._id.toString() === req.user._id.toString() ||
      portfolio.sharedWith.some(share => share.user._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Calculate holdings with current values
    const holdings = portfolio.stocks.map(stock => {
      const currentPrice = stock.currentPrice || 0;
      const currentValue = stock.quantity * currentPrice;
      const investedValue = stock.quantity * stock.purchasePrice;
      const gainLoss = currentValue - investedValue;
      const gainLossPercent = investedValue > 0 ? ((gainLoss / investedValue) * 100) : 0;

      return {
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        quantity: stock.quantity,
        purchasePrice: stock.purchasePrice,
        purchaseDate: stock.purchaseDate,
        currentPrice: currentPrice,
        currentValue: currentValue,
        investedValue: investedValue,
        gainLoss: gainLoss,
        gainLossPercent: gainLossPercent,
        dayChange: stock.dayChange || 0,
        dayChangePercent: stock.dayChangePercent || 0
      };
    });

    res.json({
      success: true,
      data: holdings
    });
  } catch (error) {
    console.error('Get portfolio holdings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting portfolio holdings'
    });
  }
});

// @desc    Create new portfolio
// @route   POST /api/portfolio
// @access  Private
router.post('/', protect, validate(portfolioSchemas.create), async (req, res) => {
  try {
    const portfolioData = {
      ...req.body,
      owner: req.user._id
    };

    const portfolio = await Portfolio.create(portfolioData);

    res.status(201).json({
      success: true,
      message: 'Portfolio created successfully',
      data: portfolio
    });
  } catch (error) {
    console.error('Create portfolio error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating portfolio'
    });
  }
});

// @desc    Update portfolio
// @route   PUT /api/portfolio/:id
// @access  Private
router.put('/:id', protect, validate(paramSchemas.mongoId, 'params'), validate(portfolioSchemas.update), async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    res.json({
      success: true,
      message: 'Portfolio updated successfully',
      data: portfolio
    });
  } catch (error) {
    console.error('Update portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating portfolio'
    });
  }
});

// @desc    Delete portfolio
// @route   DELETE /api/portfolio/:id
// @access  Private
router.delete('/:id', protect, validate(paramSchemas.mongoId, 'params'), async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    res.json({
      success: true,
      message: 'Portfolio deleted successfully'
    });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting portfolio'
    });
  }
});

// @desc    Add stock to portfolio
// @route   POST /api/portfolio/:id/stocks
// @access  Private
router.post('/:id/stocks', protect, validate(paramSchemas.mongoId, 'params'), validate(portfolioSchemas.addStock), async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Check if stock already exists
    const existingStock = portfolio.stocks.find(
      stock => stock.symbol === req.body.symbol.toUpperCase()
    );

    if (existingStock) {
      // Add to purchases for averaging
      existingStock.purchases.push({
        quantity: req.body.quantity,
        price: req.body.purchasePrice,
        date: req.body.purchaseDate || new Date(),
        fees: req.body.fees || 0,
        notes: req.body.notes
      });
    } else {
      // Add new stock
      portfolio.stocks.push({
        ...req.body,
        symbol: req.body.symbol.toUpperCase(),
        addedAt: new Date()
      });
    }

    await portfolio.save();

    res.status(201).json({
      success: true,
      message: 'Stock added to portfolio successfully',
      data: portfolio
    });
  } catch (error) {
    console.error('Add stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding stock to portfolio'
    });
  }
});

// @desc    Update stock in portfolio
// @route   PUT /api/portfolio/:id/stocks/:symbol
// @access  Private
router.put('/:id/stocks/:symbol', protect, validate(paramSchemas.mongoId, 'params'), validate(portfolioSchemas.updateStock), async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    const stock = portfolio.stocks.find(
      stock => stock.symbol === req.params.symbol.toUpperCase()
    );

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found in portfolio'
      });
    }

    // Update stock fields
    Object.assign(stock, req.body);

    await portfolio.save();

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: stock
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating stock'
    });
  }
});

// @desc    Sell stock (partial or full)
// @route   POST /api/portfolio/:id/stocks/:symbol/sell
// @access  Private
router.post('/:id/stocks/:symbol/sell', protect, validate(paramSchemas.mongoId, 'params'), validate(portfolioSchemas.sellStock), async (req, res) => {
  try {
    const { quantity, salePrice, saleDate, fees, notes } = req.body;

    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    const stock = portfolio.stocks.find(
      stock => stock.symbol === req.params.symbol.toUpperCase()
    );

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found in portfolio'
      });
    }

    // Check if enough quantity to sell
    if (stock.currentQuantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient quantity to sell'
      });
    }

    // Add sale record
    stock.sales.push({
      quantity,
      price: salePrice,
      date: saleDate || new Date(),
      fees: fees || 0,
      notes
    });

    await portfolio.save();

    res.json({
      success: true,
      message: 'Stock sale recorded successfully',
      data: {
        stock,
        saleDetails: {
          quantity,
          salePrice,
          totalAmount: quantity * salePrice,
          fees: fees || 0,
          netAmount: (quantity * salePrice) - (fees || 0)
        }
      }
    });
  } catch (error) {
    console.error('Sell stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error recording stock sale'
    });
  }
});

// @desc    Remove stock from portfolio
// @route   DELETE /api/portfolio/:id/stocks/:symbol
// @access  Private
router.delete('/:id/stocks/:symbol', protect, validate(paramSchemas.mongoId, 'params'), async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    const stockIndex = portfolio.stocks.findIndex(
      stock => stock.symbol === req.params.symbol.toUpperCase()
    );

    if (stockIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found in portfolio'
      });
    }

    portfolio.stocks.splice(stockIndex, 1);
    await portfolio.save();

    res.json({
      success: true,
      message: 'Stock removed from portfolio successfully'
    });
  } catch (error) {
    console.error('Remove stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing stock from portfolio'
    });
  }
});

// @desc    Get portfolio performance
// @route   GET /api/portfolio/:id/performance
// @access  Private
router.get('/:id/performance', protect, validate(paramSchemas.mongoId, 'params'), async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'sharedWith.user': req.user._id }
      ]
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Calculate performance metrics
    let totalInvested = 0;
    let currentValue = 0;
    let totalDividends = 0;
    const stockPerformance = [];

    for (const stock of portfolio.stocks) {
      const stockInvested = stock.totalInvested;
      const stockCurrentValue = stock.currentQuantity * (stock.purchasePrice); // This would be updated with real-time prices
      
      const dividendsReceived = stock.dividends.reduce((sum, div) => sum + div.amount, 0);
      
      totalInvested += stockInvested;
      currentValue += stockCurrentValue;
      totalDividends += dividendsReceived;

      stockPerformance.push({
        symbol: stock.symbol,
        invested: stockInvested,
        currentValue: stockCurrentValue,
        unrealizedPnL: stockCurrentValue - stockInvested,
        unrealizedPnLPercent: stockInvested > 0 ? ((stockCurrentValue - stockInvested) / stockInvested) * 100 : 0,
        dividends: dividendsReceived,
        quantity: stock.currentQuantity,
        averagePrice: stock.averagePrice
      });
    }

    const totalReturn = currentValue - totalInvested + totalDividends;
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    const performance = {
      summary: {
        totalInvested,
        currentValue,
        totalDividends,
        unrealizedPnL: currentValue - totalInvested,
        totalReturn,
        returnPercentage,
        stockCount: portfolio.stocks.filter(s => s.currentQuantity > 0).length
      },
      stocks: stockPerformance,
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting portfolio performance'
    });
  }
});

// @desc    Share portfolio
// @route   POST /api/portfolio/:id/share
// @access  Private
router.post('/:id/share', protect, validate(paramSchemas.mongoId, 'params'), async (req, res) => {
  try {
    const { email, permission = 'view' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    // Find user to share with
    const User = require('../models/User');
    const userToShareWith = await User.findOne({ email });

    if (!userToShareWith) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already shared
    const existingShare = portfolio.sharedWith.find(
      share => share.user.toString() === userToShareWith._id.toString()
    );

    if (existingShare) {
      existingShare.permission = permission;
    } else {
      portfolio.sharedWith.push({
        user: userToShareWith._id,
        permission
      });
    }

    await portfolio.save();

    res.json({
      success: true,
      message: `Portfolio shared with ${email}`,
      data: {
        sharedWith: portfolio.sharedWith
      }
    });
  } catch (error) {
    console.error('Share portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sharing portfolio'
    });
  }
});

// @desc    Unshare portfolio
// @route   DELETE /api/portfolio/:id/share/:userId
// @access  Private
router.delete('/:id/share/:userId', protect, validate(paramSchemas.mongoId, 'params'), async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    portfolio.sharedWith = portfolio.sharedWith.filter(
      share => share.user.toString() !== req.params.userId
    );

    await portfolio.save();

    res.json({
      success: true,
      message: 'Portfolio sharing removed'
    });
  } catch (error) {
    console.error('Unshare portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing portfolio share'
    });
  }
});

// @desc    Get shared portfolios
// @route   GET /api/portfolio/shared
// @access  Private
router.get('/shared/with-me', protect, async (req, res) => {
  try {
    const portfolios = await Portfolio.find({
      'sharedWith.user': req.user._id,
      isActive: true
    })
      .populate('owner', 'username email firstName lastName')
      .populate('sharedWith.user', 'username email');

    res.json({
      success: true,
      count: portfolios.length,
      data: portfolios
    });
  } catch (error) {
    console.error('Get shared portfolios error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting shared portfolios'
    });
  }
});

module.exports = router;
