const express = require('express');
const router = express.Router();
const News = require('../models/News');
const { protect, optionalAuth } = require('../middleware/auth');

// Simple validation middleware for search
const validateSearchQuery = (req, res, next) => {
  const { q } = req.query;
  
  if (!q || q.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }
  
  next();
};

/**
 * @route GET /api/news
 * @desc Get news with filters
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      source,
      sentiment,
      symbols,
      page = 1,
      limit = 20,
      startDate,
      endDate
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Build query filters
    if (category) query.category = category;
    if (source) query.source = source;
    if (sentiment) query.sentiment = sentiment;
    
    if (symbols) {
      const symbolArray = Array.isArray(symbols) ? symbols : symbols.split(',');
      query.symbols = { $in: symbolArray.map(s => s.toUpperCase()) };
    }

    if (startDate || endDate) {
      query.publishTime = {};
      if (startDate) query.publishTime.$gte = new Date(startDate);
      if (endDate) query.publishTime.$lte = new Date(endDate);
    }

    // Get total count for pagination
    const total = await News.countDocuments(query);

    // Get news items
    const news = await News.find(query)
      .sort({ publishTime: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-content') // Exclude full content for list view
      .lean();

    // If user is authenticated, track their news preferences
    if (req.user) {
      // Update user's news reading history (could be implemented)
    }

    res.json({
      success: true,
      data: {
        news,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: total,
          limit: parseInt(limit)
        },
        filters: {
          category,
          source,
          sentiment,
          symbols: symbols ? symbols.split(',') : []
        }
      }
    });
  } catch (error) {
    console.error('Error getting news:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tin tức'
    });
  }
});

/**
 * @route GET /api/news/trending
 * @desc Get trending news
 * @access Public
 */
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const trending = await News.find({
      publishTime: { $gte: oneDayAgo }
    })
    .sort({ 
      views: -1, 
      likes: -1, 
      publishTime: -1 
    })
    .limit(parseInt(limit))
    .select('-content')
    .lean();

    res.json({
      success: true,
      data: trending
    });
  } catch (error) {
    console.error('Error getting trending news:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tin tức hot'
    });
  }
});

/**
 * @route GET /api/news/search
 * @desc Search news
 * @access Public
 */
router.get('/search', validateSearchQuery, optionalAuth, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const searchRegex = new RegExp(q, 'i');
    const query = {
      $or: [
        { title: searchRegex },
        { summary: searchRegex },
        { symbols: { $in: [q.toUpperCase()] } }
      ]
    };

    const total = await News.countDocuments(query);
    const news = await News.find(query)
      .sort({ publishTime: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-content')
      .lean();

    res.json({
      success: true,
      data: {
        news,
        query: q,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error searching news:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tìm kiếm tin tức'
    });
  }
});

/**
 * @route GET /api/news/:id
 * @desc Get single news item with full content
 * @access Public
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Increment view count
    await News.findByIdAndUpdate(req.params.id, {
      $inc: { views: 1 }
    });

    // If user is authenticated, add to reading history
    if (req.user) {
      // Could implement reading history tracking here
    }

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error getting news detail:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết tin tức'
    });
  }
});

/**
 * @route POST /api/news/:id/like
 * @desc Like/unlike a news item
 * @access Private
 */
router.post('/:id/like', protect, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    const userId = req.user.id;
    const isLiked = news.likedBy.includes(userId);

    if (isLiked) {
      // Unlike
      news.likedBy = news.likedBy.filter(id => id.toString() !== userId);
      news.likes = Math.max(0, news.likes - 1);
    } else {
      // Like
      news.likedBy.push(userId);
      news.likes += 1;
    }

    await news.save();

    res.json({
      success: true,
      data: {
        liked: !isLiked,
        likes: news.likes
      }
    });
  } catch (error) {
    console.error('Error toggling news like:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thích/bỏ thích tin tức'
    });
  }
});

/**
 * @route POST /api/news/:id/save
 * @desc Save/unsave a news item
 * @access Private
 */
router.post('/:id/save', protect, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    const userId = req.user.id;
    const isSaved = news.savedBy.includes(userId);

    if (isSaved) {
      // Unsave
      news.savedBy = news.savedBy.filter(id => id.toString() !== userId);
    } else {
      // Save
      news.savedBy.push(userId);
    }

    await news.save();

    res.json({
      success: true,
      data: {
        saved: !isSaved
      }
    });
  } catch (error) {
    console.error('Error toggling news save:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lưu/bỏ lưu tin tức'
    });
  }
});

/**
 * @route GET /api/news/saved/list
 * @desc Get user's saved news
 * @access Private
 */
router.get('/saved/list', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const savedNews = await News.find({
      savedBy: req.user.id
    })
    .sort({ publishTime: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .select('-content')
    .lean();

    const total = await News.countDocuments({
      savedBy: req.user.id
    });

    res.json({
      success: true,
      data: {
        news: savedNews,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting saved news:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tin tức đã lưu'
    });
  }
});

/**
 * @route GET /api/news/categories/list
 * @desc Get available news categories
 * @access Public
 */
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await News.distinct('category');
    const sources = await News.distinct('source');

    res.json({
      success: true,
      data: {
        categories,
        sources
      }
    });
  } catch (error) {
    console.error('Error getting news categories:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh mục tin tức'
    });
  }
});

/**
 * @route GET /api/news/symbols/:symbol
 * @desc Get news for a specific stock symbol
 * @access Public
 */
router.get('/symbols/:symbol', optionalAuth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const symbolUpper = symbol.toUpperCase();
    const query = {
      symbols: { $in: [symbolUpper] }
    };

    const total = await News.countDocuments(query);
    const news = await News.find(query)
      .sort({ publishTime: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-content')
      .lean();

    res.json({
      success: true,
      data: {
        symbol: symbolUpper,
        news,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting symbol news:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tin tức mã cổ phiếu'
    });
  }
});

/**
 * @route GET /api/news/statistics/overview
 * @desc Get news statistics
 * @access Public
 */
router.get('/statistics/overview', async (req, res) => {
  try {
    const stats = await News.aggregate([
      {
        $group: {
          _id: null,
          totalNews: { $sum: 1 },
          avgViews: { $avg: '$views' },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' }
        }
      }
    ]);

    const sentimentStats = await News.aggregate([
      {
        $group: {
          _id: '$sentiment',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await News.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const sourceStats = await News.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalNews: 0,
          avgViews: 0,
          totalViews: 0,
          totalLikes: 0
        },
        sentimentDistribution: sentimentStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        categoryDistribution: categoryStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        sourceDistribution: sourceStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error getting news statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê tin tức'
    });
  }
});

module.exports = router;
