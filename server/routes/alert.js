const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const Stock = require('../models/Stock');
const { protect } = require('../middleware/auth');
const AlphaVantageService = require('../services/alphaVantageService');

// Simple validation middleware for alerts
const validateAlert = (req, res, next) => {
  const { symbol, type, condition } = req.body;
  
  if (!symbol || !type || !condition) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: symbol, type, condition'
    });
  }
  
  // Validate type enum
  const validTypes = ['price', 'volume', 'news', 'percent-change', 'technical', 'dividend'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid alert type. Must be one of: ${validTypes.join(', ')}`
    });
  }
  
  // Validate condition enum
  const validConditions = [
    'above', 'below', 'equals',
    'percent-change-up', 'percent-change-down',
    'volume-spike', 'volume-drop',
    'rsi-overbought', 'rsi-oversold',
    'ma-crossover', 'ma-crossunder',
    'new-high', 'new-low'
  ];
  if (!validConditions.includes(condition)) {
    return res.status(400).json({
      success: false,
      message: `Invalid condition. Must be one of: ${validConditions.join(', ')}`
    });
  }
  
  // Validate value is required for certain conditions
  const requiresValue = ['above', 'below', 'equals', 'percent-change-up', 'percent-change-down'];
  if (requiresValue.includes(condition) && (req.body.value === undefined || req.body.value === null)) {
    return res.status(400).json({
      success: false,
      message: `Value is required for condition: ${condition}`
    });
  }
  
  next();
};

/**
 * @route GET /api/alert
 * @desc Get user's alerts
 * @access Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { user: req.user.id };  // Use 'user' field as defined in the model
    if (status) query.status = status;

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Alert.countDocuments(query);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách cảnh báo'
    });
  }
});

/**
 * @route POST /api/alert
 * @desc Create new alert
 * @access Private
 */
router.post('/', protect, validateAlert, async (req, res) => {
  try {
    const { symbol, condition, value, type } = req.body;
    
    // Get current stock price to validate alert
    let currentPrice = null;
    try {
      // First try to get from database
      let stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
      
      if (stock && stock.currentPrice) {
        currentPrice = stock.currentPrice;
      } else {
        // If not in database or no current price, fetch from API
        console.log(`📊 Fetching current price for ${symbol} from API...`);
        const alphaVantageService = new AlphaVantageService();
        const stockData = await alphaVantageService.getStockData(symbol);
        
        if (stockData && stockData.currentPrice) {
          currentPrice = stockData.currentPrice;
          
          // Update or create stock record
          await Stock.findOneAndUpdate(
            { symbol: symbol.toUpperCase() },
            {
              symbol: symbol.toUpperCase(),
              currentPrice: stockData.currentPrice,
              previousClose: stockData.previousClose || stockData.currentPrice,
              dayChange: stockData.dayChange || 0,
              dayChangePercent: stockData.dayChangePercent || 0,
              lastUpdated: new Date()
            },
            { upsert: true, new: true }
          );
        }
      }
    } catch (apiError) {
      console.warn(`⚠️ Could not fetch current price for ${symbol}:`, apiError.message);
    }
    
    // Check if alert would immediately trigger
    let immediatelyTriggered = false;
    let warningMessage = '';
    
    if (currentPrice && value && (condition === 'above' || condition === 'below')) {
      if (condition === 'above' && currentPrice > value) {
        immediatelyTriggered = true;
        warningMessage = `Cảnh báo: Giá hiện tại của ${symbol} (${currentPrice.toLocaleString()} VND) đã cao hơn mức cảnh báo (${value.toLocaleString()} VND). Cảnh báo sẽ được kích hoạt ngay lập tức.`;
      } else if (condition === 'below' && currentPrice < value) {
        immediatelyTriggered = true;
        warningMessage = `Cảnh báo: Giá hiện tại của ${symbol} (${currentPrice.toLocaleString()} VND) đã thấp hơn mức cảnh báo (${value.toLocaleString()} VND). Cảnh báo sẽ được kích hoạt ngay lập tức.`;
      }
    }

    const alertData = {
      ...req.body,
      user: req.user.id
    };

    const alert = new Alert(alertData);
    await alert.save();

    // If alert would immediately trigger, mark it and potentially send notification
    if (immediatelyTriggered) {
      // Import email service here to avoid circular dependencies
      const EmailService = require('../services/emailService');
      const emailService = new EmailService();
      
      // Wait a moment for email service to initialize
      setTimeout(async () => {
        try {
          // Get user info for email
          const User = require('../models/User');
          const user = await User.findById(req.user.id);
          
          if (user && user.preferences?.notifications?.email?.priceAlerts) {
            await emailService.sendAlertNotification(
              user.email,
              user.firstName || user.username,
              symbol.toUpperCase(),
              warningMessage,
              {
                currentPrice: currentPrice,
                change: 0,
                changePercent: 0,
                alertType: type,
                condition: condition,
                targetValue: value
              }
            );
            console.log(`📧 Immediate alert notification sent to ${user.email}`);
          }
        } catch (emailError) {
          console.error('Error sending immediate alert notification:', emailError);
        }
      }, 2000);
    }

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Cảnh báo đã được tạo thành công',
      currentPrice: currentPrice,
      immediatelyTriggered: immediatelyTriggered,
      warning: warningMessage || undefined
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo cảnh báo'
    });
  }
});

/**
 * @route PUT /api/alert/:id
 * @desc Update alert
 * @access Private
 */
router.put('/:id', protect, validateAlert, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.id,
      user: req.user.id  // Use 'user' field as defined in the model
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cảnh báo'
      });
    }

    Object.assign(alert, req.body);
    await alert.save();

    res.json({
      success: true,
      data: alert,
      message: 'Cảnh báo đã được cập nhật'
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật cảnh báo'
    });
  }
});

/**
 * @route DELETE /api/alert/:id
 * @desc Delete alert
 * @access Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const alert = await Alert.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id  // Use 'user' field as defined in the model
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cảnh báo'
      });
    }

    res.json({
      success: true,
      message: 'Cảnh báo đã được xóa'
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa cảnh báo'
    });
  }
});

/**
 * @route POST /api/alert/:id/toggle
 * @desc Toggle alert active status
 * @access Private
 */
router.post('/:id/toggle', protect, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.id,
      user: req.user.id  // Use 'user' field as defined in the model
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cảnh báo'
      });
    }

    alert.isActive = !alert.isActive;
    await alert.save();

    res.json({
      success: true,
      data: { isActive: alert.isActive },
      message: `Cảnh báo đã được ${alert.isActive ? 'kích hoạt' : 'tắt'}`
    });
  } catch (error) {
    console.error('Error toggling alert:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thay đổi trạng thái cảnh báo'
    });
  }
});

module.exports = router;
