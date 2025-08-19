const express = require('express');
const router = express.Router();

const Stock = require('../models/Stock');
const { protect, optionalAuth } = require('../middleware/auth');
const { validate, stockSchemas, paramSchemas } = require('../middleware/validation');

// @desc    Get all stocks with filtering and pagination
// @route   GET /api/stock
// @access  Public
router.get('/', validate(stockSchemas.query, 'query'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      exchange,
      sector,
      search,
      sortBy = 'symbol',
      sortOrder = 'asc',
      priceMin,
      priceMax,
      marketCapMin,
      marketCapMax,
      changeMin,
      changeMax
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (exchange) {
      query.exchange = exchange;
    }

    if (sector) {
      query.sector = sector;
    }

    if (search) {
      query.$or = [
        { symbol: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    // Price filters
    if (priceMin || priceMax) {
      query.currentPrice = {};
      if (priceMin) query.currentPrice.$gte = parseFloat(priceMin);
      if (priceMax) query.currentPrice.$lte = parseFloat(priceMax);
    }

    // Market cap filters
    if (marketCapMin || marketCapMax) {
      query.marketCap = {};
      if (marketCapMin) query.marketCap.$gte = parseFloat(marketCapMin);
      if (marketCapMax) query.marketCap.$lte = parseFloat(marketCapMax);
    }

    // Change filters
    if (changeMin || changeMax) {
      query.dayChangePercent = {};
      if (changeMin) query.dayChangePercent.$gte = parseFloat(changeMin);
      if (changeMax) query.dayChangePercent.$lte = parseFloat(changeMax);
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const stocks = await Stock.find(query)
      .select('symbol name exchange sector currentPrice previousClose dayChange dayChangePercent volume marketCap lastPriceUpdate')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Stock.countDocuments(query);

    res.json({
      success: true,
      count: stocks.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: stocks
    });
  } catch (error) {
    console.error('Get stocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting stocks'
    });
  }
});

// @desc    Get top performing stocks
// @route   GET /api/stocks/top
// @access  Public
router.get('/top', async (req, res) => {
  try {
    const { limit = 10, sortBy = 'dayChangePercent' } = req.query;
    
    // Define sorting options
    const sortOptions = {};
    if (sortBy === 'dayChangePercent') {
      sortOptions.dayChangePercent = -1; // Descending for best performers
    } else if (sortBy === 'volume') {
      sortOptions.volume = -1;
    } else if (sortBy === 'marketCap') {
      sortOptions.marketCap = -1;
    } else {
      sortOptions.dayChangePercent = -1; // Default
    }

    const stocks = await Stock.find({ 
      isActive: true,
      currentPrice: { $gt: 0 } // Only stocks with valid prices
    })
      .sort(sortOptions)
      .limit(parseInt(limit))
      .select('symbol name currentPrice previousClose dayChange dayChangePercent volume marketCap exchange sector')
      .lean();

    res.json({
      success: true,
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    console.error('Get top stocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting top stocks'
    });
  }
});

// @desc    Get stock by symbol
// @route   GET /api/stock/:symbol
// @access  Public
router.get('/:symbol', validate(paramSchemas.stockSymbol, 'params'), async (req, res) => {
  try {
    const stock = await Stock.findOne({
      symbol: req.params.symbol.toUpperCase(),
      isActive: true
    })
      .populate('recentNews')
      .lean();

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting stock'
    });
  }
});

// @desc    Get stock price history
// @route   GET /api/stock/:symbol/history
// @access  Public
router.get('/:symbol/history', optionalAuth, validate(paramSchemas.stockSymbol, 'params'), async (req, res) => {
  try {
    const { period = '1M', interval = '1d' } = req.query;

    const stock = await Stock.findOne({
      symbol: req.params.symbol.toUpperCase(),
      isActive: true
    }).select('symbol name priceHistory');

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case '1D':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '1W':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case '5Y':
        startDate.setFullYear(startDate.getFullYear() - 5);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    // Filter price history by date range
    const filteredHistory = stock.priceHistory.filter(
      entry => entry.date >= startDate
    ).sort((a, b) => a.date - b.date);

    res.json({
      success: true,
      data: {
        symbol: stock.symbol,
        name: stock.name,
        period,
        interval,
        history: filteredHistory
      }
    });
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting stock history'
    });
  }
});

// @desc    Get stock technical indicators
// @route   GET /api/stock/:symbol/technical
// @access  Public
router.get('/:symbol/technical', optionalAuth, validate(paramSchemas.stockSymbol, 'params'), async (req, res) => {
  try {
    const stock = await Stock.findOne({
      symbol: req.params.symbol.toUpperCase(),
      isActive: true
    }).select('symbol name technicalIndicators riskMetrics');

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    // Get latest technical indicators
    const latestIndicators = stock.technicalIndicators.length > 0 
      ? stock.technicalIndicators[stock.technicalIndicators.length - 1]
      : null;

    res.json({
      success: true,
      data: {
        symbol: stock.symbol,
        name: stock.name,
        latest: latestIndicators,
        historical: stock.technicalIndicators.slice(-30), // Last 30 days
        riskMetrics: stock.riskMetrics
      }
    });
  } catch (error) {
    console.error('Get technical indicators error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting technical indicators'
    });
  }
});

// @desc    Get stock fundamental data
// @route   GET /api/stock/:symbol/fundamentals
// @access  Public
router.get('/:symbol/fundamentals', optionalAuth, validate(paramSchemas.stockSymbol, 'params'), async (req, res) => {
  try {
    const stock = await Stock.findOne({
      symbol: req.params.symbol.toUpperCase(),
      isActive: true
    }).select('symbol name fundamentalData corporateActions analystRatings vnData');

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    res.json({
      success: true,
      data: {
        symbol: stock.symbol,
        name: stock.name,
        fundamentals: stock.fundamentalData,
        corporateActions: stock.corporateActions.filter(action => 
          action.status !== 'cancelled' && 
          new Date(action.announcementDate) >= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        ),
        analystRatings: stock.analystRatings.slice(-10), // Latest 10 ratings
        vietnamData: stock.vnData
      }
    });
  } catch (error) {
    console.error('Get fundamentals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting fundamental data'
    });
  }
});

// @desc    Get stock news
// @route   GET /api/stock/:symbol/news
// @access  Public
router.get('/:symbol/news', optionalAuth, validate(paramSchemas.stockSymbol, 'params'), async (req, res) => {
  try {
    const { limit = 10, days = 30 } = req.query;

    const News = require('../models/News');
    
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const news = await News.find({
      symbols: req.params.symbol.toUpperCase(),
      publishDate: { $gte: since },
      status: 'published'
    })
      .select('title summary url imageUrl publishDate source category sentiment importance')
      .sort({ publishDate: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      count: news.length,
      data: news
    });
  } catch (error) {
    console.error('Get stock news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting stock news'
    });
  }
});

// @desc    Search stocks
// @route   GET /api/stock/search/:query
// @access  Public
router.get('/search/:query', optionalAuth, async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    if (query.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 1 character'
      });
    }

    const stocks = await Stock.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { symbol: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
      .select('symbol name exchange sector currentPrice dayChange dayChangePercent')
      .sort({ symbol: 1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    console.error('Search stocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching stocks'
    });
  }
});

// @desc    Get market overview
// @route   GET /api/stock/market/overview
// @access  Public
router.get('/market/overview', optionalAuth, async (req, res) => {
  try {
    // Get market indices
    const indices = await Stock.find({
      symbol: { $in: ['VNINDEX', 'VN30', 'HNXINDEX', 'UPCOMINDEX'] },
      isActive: true
    })
      .select('symbol name currentPrice dayChange dayChangePercent volume lastPriceUpdate')
      .lean();

    // Get sector performance
    const sectorPerformance = await Stock.aggregate([
      { $match: { isActive: true, sector: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$sector',
          avgChange: { $avg: '$dayChangePercent' },
          stockCount: { $sum: 1 },
          totalVolume: { $sum: '$volume' },
          gainers: {
            $sum: {
              $cond: [{ $gt: ['$dayChangePercent', 0] }, 1, 0]
            }
          },
          losers: {
            $sum: {
              $cond: [{ $lt: ['$dayChangePercent', 0] }, 1, 0]
            }
          }
        }
      },
      { $sort: { avgChange: -1 } }
    ]);

    // Get top gainers and losers
    const topGainers = await Stock.find({
      isActive: true,
      dayChangePercent: { $gt: 0 }
    })
      .select('symbol name currentPrice dayChange dayChangePercent volume')
      .sort({ dayChangePercent: -1 })
      .limit(10)
      .lean();

    const topLosers = await Stock.find({
      isActive: true,
      dayChangePercent: { $lt: 0 }
    })
      .select('symbol name currentPrice dayChange dayChangePercent volume')
      .sort({ dayChangePercent: 1 })
      .limit(10)
      .lean();

    // Get most active by volume
    const mostActive = await Stock.find({
      isActive: true,
      volume: { $gt: 0 }
    })
      .select('symbol name currentPrice dayChange dayChangePercent volume')
      .sort({ volume: -1 })
      .limit(10)
      .lean();

    // Market statistics
    const marketStats = await Stock.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalStocks: { $sum: 1 },
          gainers: {
            $sum: {
              $cond: [{ $gt: ['$dayChangePercent', 0] }, 1, 0]
            }
          },
          losers: {
            $sum: {
              $cond: [{ $lt: ['$dayChangePercent', 0] }, 1, 0]
            }
          },
          unchanged: {
            $sum: {
              $cond: [{ $eq: ['$dayChangePercent', 0] }, 1, 0]
            }
          },
          totalVolume: { $sum: '$volume' },
          avgChange: { $avg: '$dayChangePercent' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        indices,
        sectorPerformance,
        topGainers,
        topLosers,
        mostActive,
        marketStats: marketStats[0] || {
          totalStocks: 0,
          gainers: 0,
          losers: 0,
          unchanged: 0,
          totalVolume: 0,
          avgChange: 0
        },
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Get market overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting market overview'
    });
  }
});

// @desc    Get stocks by sector
// @route   GET /api/stock/sector/:sector
// @access  Public
router.get('/sector/:sector', optionalAuth, async (req, res) => {
  try {
    const { sector } = req.params;
    const { page = 1, limit = 20, sortBy = 'dayChangePercent', sortOrder = 'desc' } = req.query;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const stocks = await Stock.find({
      sector: sector,
      isActive: true
    })
      .select('symbol name currentPrice dayChange dayChangePercent volume marketCap')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Stock.countDocuments({ sector: sector, isActive: true });

    // Sector statistics
    const sectorStats = await Stock.aggregate([
      { $match: { sector: sector, isActive: true } },
      {
        $group: {
          _id: null,
          totalStocks: { $sum: 1 },
          avgChange: { $avg: '$dayChangePercent' },
          totalMarketCap: { $sum: '$marketCap' },
          totalVolume: { $sum: '$volume' },
          gainers: {
            $sum: {
              $cond: [{ $gt: ['$dayChangePercent', 0] }, 1, 0]
            }
          },
          losers: {
            $sum: {
              $cond: [{ $lt: ['$dayChangePercent', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      count: stocks.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      sectorStats: sectorStats[0] || {},
      data: stocks
    });
  } catch (error) {
    console.error('Get sector stocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting sector stocks'
    });
  }
});

// @desc    Get available sectors
// @route   GET /api/stock/sectors
// @access  Public
router.get('/sectors/list', optionalAuth, async (req, res) => {
  try {
    const sectors = await Stock.distinct('sector', { isActive: true });
    
    // Get stock count for each sector
    const sectorInfo = await Stock.aggregate([
      { $match: { isActive: true, sector: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$sector',
          stockCount: { $sum: 1 },
          avgChange: { $avg: '$dayChangePercent' },
          totalMarketCap: { $sum: '$marketCap' }
        }
      },
      { $sort: { stockCount: -1 } }
    ]);

    res.json({
      success: true,
      data: sectorInfo
    });
  } catch (error) {
    console.error('Get sectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting sectors'
    });
  }
});

// @desc    Get exchanges
// @route   GET /api/stock/exchanges
// @access  Public
router.get('/exchanges/list', optionalAuth, async (req, res) => {
  try {
    const exchanges = await Stock.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$exchange',
          stockCount: { $sum: 1 },
          avgChange: { $avg: '$dayChangePercent' },
          totalVolume: { $sum: '$volume' },
          gainers: {
            $sum: {
              $cond: [{ $gt: ['$dayChangePercent', 0] }, 1, 0]
            }
          },
          losers: {
            $sum: {
              $cond: [{ $lt: ['$dayChangePercent', 0] }, 1, 0]
            }
          }
        }
      },
      { $sort: { stockCount: -1 } }
    ]);

    res.json({
      success: true,
      data: exchanges
    });
  } catch (error) {
    console.error('Get exchanges error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting exchanges'
    });
  }
});

module.exports = router;
