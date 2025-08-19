const express = require('express');
const router = express.Router();
const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');
const { protect } = require('../middleware/auth');

/**
 * @route GET /api/analytics/portfolio/:id/performance
 * @desc Get portfolio performance analytics
 * @access Private
 */
router.get('/portfolio/:id/performance', protect, async (req, res) => {
  try {
    const { period = '1M' } = req.query;
    
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục đầu tư'
      });
    }

    // Calculate performance metrics
    const performance = await portfolio.calculatePerformance();
    const riskMetrics = await portfolio.calculateRiskMetrics();
    
    res.json({
      success: true,
      data: {
        performance,
        riskMetrics,
        period
      }
    });
  } catch (error) {
    console.error('Error getting portfolio analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy phân tích danh mục'
    });
  }
});

/**
 * @route GET /api/analytics/market/overview
 * @desc Get market overview analytics
 * @access Public
 */
router.get('/market/overview', async (req, res) => {
  try {
    const marketStats = await Stock.aggregate([
      {
        $group: {
          _id: null,
          totalStocks: { $sum: 1 },
          avgPrice: { $avg: '$currentPrice' },
          totalMarketCap: { $sum: '$marketCap' },
          avgVolume: { $avg: '$volume' }
        }
      }
    ]);

    const sectorDistribution = await Stock.aggregate([
      {
        $group: {
          _id: '$sector',
          count: { $sum: 1 },
          avgChange: { $avg: '$changePercent' }
        }
      }
    ]);

    const topGainers = await Stock.find()
      .sort({ changePercent: -1 })
      .limit(10)
      .select('symbol companyName currentPrice changePercent volume');

    const topLosers = await Stock.find()
      .sort({ changePercent: 1 })
      .limit(10)
      .select('symbol companyName currentPrice changePercent volume');

    res.json({
      success: true,
      data: {
        overview: marketStats[0] || {},
        sectorDistribution,
        topGainers,
        topLosers
      }
    });
  } catch (error) {
    console.error('Error getting market overview:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tổng quan thị trường'
    });
  }
});

/**
 * @route GET /api/analytics/user/summary
 * @desc Get user analytics summary
 * @access Private
 */
router.get('/user/summary', protect, async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ userId: req.user.id });
    
    let totalValue = 0;
    let totalGainLoss = 0;
    let totalStocks = 0;

    for (const portfolio of portfolios) {
      const performance = await portfolio.calculatePerformance();
      totalValue += performance.currentValue;
      totalGainLoss += performance.totalGainLoss;
      totalStocks += portfolio.stocks.length;
    }

    const summary = {
      totalPortfolios: portfolios.length,
      totalValue,
      totalGainLoss,
      totalGainLossPercent: totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0,
      totalStocks,
      portfolios: portfolios.map(p => ({
        id: p._id,
        name: p.name,
        stockCount: p.stocks.length
      }))
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting user summary:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tóm tắt người dùng'
    });
  }
});

module.exports = router;
