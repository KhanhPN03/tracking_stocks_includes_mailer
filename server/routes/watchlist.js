const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const { protect } = require('../middleware/auth');

// Simple validation middleware for watchlists
const validateWatchlist = (req, res, next) => {
  const { name } = req.body;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Watchlist name is required'
    });
  }
  
  next();
};

/**
 * @route GET /api/watchlist
 * @desc Get user's watchlists
 * @access Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const watchlists = await Watchlist.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: watchlists
    });
  } catch (error) {
    console.error('Error getting watchlists:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách theo dõi'
    });
  }
});

/**
 * @route POST /api/watchlist
 * @desc Create new watchlist
 * @access Private
 */
router.post('/', protect, validateWatchlist, async (req, res) => {
  try {
    const watchlistData = {
      ...req.body,
      userId: req.user.id
    };

    const watchlist = new Watchlist(watchlistData);
    await watchlist.save();

    res.status(201).json({
      success: true,
      data: watchlist,
      message: 'Danh sách theo dõi đã được tạo'
    });
  } catch (error) {
    console.error('Error creating watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo danh sách theo dõi'
    });
  }
});

/**
 * @route GET /api/watchlist/:id
 * @desc Get watchlist detail
 * @access Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user.id },
        { isPublic: true }
      ]
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh sách theo dõi'
      });
    }

    res.json({
      success: true,
      data: watchlist
    });
  } catch (error) {
    console.error('Error getting watchlist detail:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết danh sách theo dõi'
    });
  }
});

/**
 * @route PUT /api/watchlist/:id
 * @desc Update watchlist
 * @access Private
 */
router.put('/:id', protect, validateWatchlist, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh sách theo dõi'
      });
    }

    Object.assign(watchlist, req.body);
    await watchlist.save();

    res.json({
      success: true,
      data: watchlist,
      message: 'Danh sách theo dõi đã được cập nhật'
    });
  } catch (error) {
    console.error('Error updating watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật danh sách theo dõi'
    });
  }
});

/**
 * @route DELETE /api/watchlist/:id
 * @desc Delete watchlist
 * @access Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh sách theo dõi'
      });
    }

    res.json({
      success: true,
      message: 'Danh sách theo dõi đã được xóa'
    });
  } catch (error) {
    console.error('Error deleting watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa danh sách theo dõi'
    });
  }
});

/**
 * @route POST /api/watchlist/:id/stocks
 * @desc Add stock to watchlist
 * @access Private
 */
router.post('/:id/stocks', protect, async (req, res) => {
  try {
    const { symbol } = req.body;
    
    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh sách theo dõi'
      });
    }

    // Check if stock already exists
    const existingStock = watchlist.stocks.find(stock => stock.symbol === symbol);
    if (existingStock) {
      return res.status(400).json({
        success: false,
        message: 'Mã cổ phiếu đã có trong danh sách'
      });
    }

    watchlist.stocks.push({
      symbol,
      addedAt: new Date()
    });

    await watchlist.save();

    res.json({
      success: true,
      data: watchlist,
      message: `Đã thêm ${symbol} vào danh sách theo dõi`
    });
  } catch (error) {
    console.error('Error adding stock to watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm cổ phiếu vào danh sách theo dõi'
    });
  }
});

/**
 * @route DELETE /api/watchlist/:id/stocks/:symbol
 * @desc Remove stock from watchlist
 * @access Private
 */
router.delete('/:id/stocks/:symbol', protect, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh sách theo dõi'
      });
    }

    watchlist.stocks = watchlist.stocks.filter(
      stock => stock.symbol !== req.params.symbol
    );

    await watchlist.save();

    res.json({
      success: true,
      data: watchlist,
      message: `Đã xóa ${req.params.symbol} khỏi danh sách theo dõi`
    });
  } catch (error) {
    console.error('Error removing stock from watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa cổ phiếu khỏi danh sách theo dõi'
    });
  }
});

module.exports = router;
