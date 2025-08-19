const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');

/**
 * @route GET /api/realtime/market-status
 * @desc Get market status and trading hours
 * @access Public
 */
router.get('/market-status', (req, res) => {
  try {
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    
    res.json({
      success: true,
      data: {
        isOpen: isMarketOpen(),
        currentTime: vietnamTime,
        timezone: 'Asia/Ho_Chi_Minh',
        tradingHours: {
          open: '09:00',
          close: '15:00',
          timezone: 'ICT'
        },
        nextSession: getNextTradingSession()
      }
    });

  } catch (error) {
    console.error('Error getting market status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route GET /api/realtime/:symbol
 * @desc Get real-time stock data for a specific symbol
 * @access Public
 */
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const stock = await Stock.findOne({ 
      symbol: symbol.toUpperCase(),
      isActive: true 
    }).select('symbol currentPrice previousClose dayChange dayChangePercent volume lastUpdated').lean();

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock ${symbol} not found`
      });
    }

    res.json({
      success: true,
      data: stock,
      marketOpen: isMarketOpen(),
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error getting real-time stock data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route POST /api/realtime/bulk
 * @desc Get real-time stock data for multiple symbols
 * @access Public
 */
router.post('/bulk', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Symbols array is required'
      });
    }

    // Limit to prevent abuse
    if (symbols.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 50 symbols allowed per request'
      });
    }

    const stocks = await Stock.find({ 
      symbol: { $in: symbols.map(s => s.toUpperCase()) },
      isActive: true 
    }).select('symbol currentPrice previousClose dayChange dayChangePercent volume lastUpdated').lean();

    res.json({
      success: true,
      data: stocks,
      marketOpen: isMarketOpen(),
      timestamp: new Date(),
      count: stocks.length
    });

  } catch (error) {
    console.error('Error getting bulk stock data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper functions
function isMarketOpen() {
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  
  const hour = vietnamTime.getHours();
  const minute = vietnamTime.getMinutes();
  const dayOfWeek = vietnamTime.getDay();
  
  // Check if it's a weekday (Monday = 1, Friday = 5)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  
  // Trading hours: 9:00 - 15:00 ICT
  const currentTime = hour * 60 + minute;
  const marketOpen = 9 * 60; // 9:00
  const marketClose = 15 * 60; // 15:00
  
  return currentTime >= marketOpen && currentTime < marketClose;
}

function getNextTradingSession() {
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  
  // If market is currently open, next session is the close
  if (isMarketOpen()) {
    const closeTime = new Date(vietnamTime);
    closeTime.setHours(15, 0, 0, 0);
    return {
      type: 'close',
      time: closeTime,
      message: 'Market closes at 15:00 ICT'
    };
  }
  
  // Find next opening
  const nextOpen = new Date(vietnamTime);
  nextOpen.setHours(9, 0, 0, 0);
  
  // If past today's open time, move to next weekday
  if (vietnamTime.getHours() >= 15 || vietnamTime.getDay() === 0 || vietnamTime.getDay() === 6) {
    nextOpen.setDate(nextOpen.getDate() + 1);
    
    // Skip weekends
    while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
      nextOpen.setDate(nextOpen.getDate() + 1);
    }
  }
  
  return {
    type: 'open',
    time: nextOpen,
    message: `Market opens at 09:00 ICT on ${nextOpen.toDateString()}`
  };
}

module.exports = router;
