const axios = require('axios');
const cheerio = require('cheerio');
const News = require('../models/News');

class NewsService {
  constructor() {
    this.isRunning = false;
    this.updateInterval = null;
    this.sources = [
      {
        name: 'CafeF',
        url: 'https://cafef.vn/thi-truong-chung-khoan.chn',
        selector: '.tlitem',
        titleSelector: 'h3 a',
        linkSelector: 'h3 a',
        timeSelector: '.time',
        category: 'market'
      },
      {
        name: 'VnEconomy',
        url: 'https://vneconomy.vn/chung-khoan.htm',
        selector: '.story',
        titleSelector: '.story__title a',
        linkSelector: '.story__title a',
        timeSelector: '.story__meta-time',
        category: 'market'
      },
      {
        name: 'Vietstock',
        url: 'https://vietstock.vn/thi-truong-chung-khoan',
        selector: '.news-item',
        titleSelector: '.news-title a',
        linkSelector: '.news-title a',
        timeSelector: '.news-time',
        category: 'market'
      }
    ];
    this.sentimentKeywords = {
      positive: [
        'tăng', 'lên', 'tích cực', 'khả quan', 'tốt', 'mạnh', 'cải thiện',
        'phục hồi', 'bứt phá', 'đột phá', 'kỷ lục', 'cao nhất', 'tăng trưởng'
      ],
      negative: [
        'giảm', 'xuống', 'suy giảm', 'tiêu cực', 'xấu', 'yếu', 'sụt giảm',
        'lao dốc', 'thấp nhất', 'khủng hoảng', 'rủi ro', 'lo ngại', 'căng thẳng'
      ]
    };
  }

  /**
   * Start news service
   */
  start() {
    if (this.isRunning) {
      console.log('📰 News service is already running');
      return;
    }

    console.log('📰 Starting news service...');
    this.isRunning = true;

    // Fetch news immediately
    this.fetchAllNews();

    // Set up periodic updates (every 15 minutes)
    this.updateInterval = setInterval(() => {
      this.fetchAllNews();
    }, 15 * 60 * 1000);

    console.log('✅ News service started');
  }

  /**
   * Stop news service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('📰 Stopping news service...');
    this.isRunning = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log('✅ News service stopped');
  }

  /**
   * Fetch news from all sources
   */
  async fetchAllNews() {
    try {
      console.log('📰 Fetching news from all sources...');
      
      const promises = this.sources.map(source => 
        this.fetchFromSource(source).catch(error => {
          console.error(`❌ Error fetching from ${source.name}:`, error.message);
          return [];
        })
      );

      const results = await Promise.all(promises);
      const allNews = results.flat();

      console.log(`📰 Fetched ${allNews.length} news items`);

      // Save news to database
      await this.saveNews(allNews);

      // Clean up old news
      await this.cleanupOldNews();

    } catch (error) {
      console.error('❌ Error in fetchAllNews:', error);
    }
  }

  /**
   * Fetch news from a specific source
   */
  async fetchFromSource(source) {
    try {
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await axios.get(source.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const newsItems = [];

      $(source.selector).each((index, element) => {
        try {
          const titleElement = $(element).find(source.titleSelector);
          const linkElement = $(element).find(source.linkSelector);
          const timeElement = $(element).find(source.timeSelector);

          const title = titleElement.text().trim();
          const relativeLink = linkElement.attr('href');
          const timeText = timeElement.text().trim();

          if (title && relativeLink) {
            // Convert relative URL to absolute
            const url = relativeLink.startsWith('http') 
              ? relativeLink 
              : new URL(relativeLink, source.url).href;

            const newsItem = {
              title,
              url,
              source: source.name,
              category: source.category,
              publishTime: this.parseTime(timeText),
              content: '', // Will be fetched separately if needed
              sentiment: this.analyzeSentiment(title),
              symbols: this.extractSymbols(title)
            };

            newsItems.push(newsItem);
          }
        } catch (error) {
          console.error(`Error parsing news item from ${source.name}:`, error);
        }
      });

      console.log(`📰 Fetched ${newsItems.length} items from ${source.name}`);
      return newsItems;

    } catch (error) {
      console.error(`❌ Error fetching from ${source.name}:`, error.message);
      return [];
    }
  }

  /**
   * Parse time string to Date object
   */
  parseTime(timeText) {
    try {
      const now = new Date();
      
      // Handle Vietnamese time formats
      if (timeText.includes('phút trước')) {
        const minutes = parseInt(timeText.match(/(\d+)/)?.[1] || '0');
        return new Date(now.getTime() - minutes * 60 * 1000);
      }
      
      if (timeText.includes('giờ trước')) {
        const hours = parseInt(timeText.match(/(\d+)/)?.[1] || '0');
        return new Date(now.getTime() - hours * 60 * 60 * 1000);
      }
      
      if (timeText.includes('ngày trước')) {
        const days = parseInt(timeText.match(/(\d+)/)?.[1] || '0');
        return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      }

      // Try to parse as date
      const dateMatch = timeText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        return new Date(year, month - 1, day);
      }

      // Default to current time
      return now;
    } catch (error) {
      return new Date();
    }
  }

  /**
   * Analyze sentiment of news title
   */
  analyzeSentiment(text) {
    const lowerText = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    // Count positive keywords
    this.sentimentKeywords.positive.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        positiveScore++;
      }
    });

    // Count negative keywords
    this.sentimentKeywords.negative.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        negativeScore++;
      }
    });

    if (positiveScore > negativeScore) {
      return 'positive';
    } else if (negativeScore > positiveScore) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  /**
   * Extract stock symbols from news title
   */
  extractSymbols(text) {
    // Match Vietnamese stock symbols (3-4 letters, usually uppercase)
    const symbolMatches = text.match(/\b[A-Z]{3,4}\b/g);
    
    if (!symbolMatches) {
      return [];
    }

    // Filter to only include valid-looking stock symbols
    const validSymbols = symbolMatches.filter(symbol => {
      // Common Vietnamese stock symbols pattern
      return /^[A-Z]{3,4}$/.test(symbol) && 
             !['VND', 'USD', 'EUR', 'CEO', 'CFO', 'IPO'].includes(symbol);
    });

    return [...new Set(validSymbols)]; // Remove duplicates
  }

  /**
   * Save news items to database
   */
  async saveNews(newsItems) {
    try {
      let savedCount = 0;
      let updatedCount = 0;

      for (const item of newsItems) {
        try {
          // Check if news already exists
          const existingNews = await News.findOne({
            $or: [
              { url: item.url },
              { title: item.title, source: item.source }
            ]
          });

          if (existingNews) {
            // Update existing news
            existingNews.sentiment = item.sentiment;
            existingNews.symbols = item.symbols;
            existingNews.lastUpdated = new Date();
            await existingNews.save();
            updatedCount++;
          } else {
            // Create new news
            const news = new News({
              ...item,
              publishTime: item.publishTime || new Date(),
              createdAt: new Date()
            });
            await news.save();
            savedCount++;
          }
        } catch (error) {
          console.error('Error saving news item:', error);
        }
      }

      console.log(`📰 Saved ${savedCount} new news items, updated ${updatedCount} existing items`);
    } catch (error) {
      console.error('❌ Error saving news:', error);
    }
  }

  /**
   * Fetch full content for a news item
   */
  async fetchFullContent(newsUrl) {
    try {
      const response = await axios.get(newsUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Try different selectors for content
      const contentSelectors = [
        '.detail-content',
        '.article-content',
        '.news-content',
        '.post-content',
        'article',
        '.content'
      ];

      let content = '';
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text().trim();
          break;
        }
      }

      return content || '';
    } catch (error) {
      console.error('Error fetching full content:', error);
      return '';
    }
  }

  /**
   * Get news by filters
   */
  async getNews(filters = {}) {
    try {
      const {
        category,
        source,
        sentiment,
        symbols,
        limit = 50,
        skip = 0,
        startDate,
        endDate
      } = filters;

      const query = {};

      if (category) query.category = category;
      if (source) query.source = source;
      if (sentiment) query.sentiment = sentiment;
      if (symbols && symbols.length > 0) {
        query.symbols = { $in: symbols };
      }

      if (startDate || endDate) {
        query.publishTime = {};
        if (startDate) query.publishTime.$gte = new Date(startDate);
        if (endDate) query.publishTime.$lte = new Date(endDate);
      }

      const news = await News.find(query)
        .sort({ publishTime: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      return news;
    } catch (error) {
      console.error('Error getting news:', error);
      throw error;
    }
  }

  /**
   * Get trending news
   */
  async getTrendingNews(limit = 10) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const trending = await News.find({
        publishTime: { $gte: oneDayAgo }
      })
      .sort({ 
        views: -1, 
        likes: -1, 
        publishTime: -1 
      })
      .limit(limit)
      .lean();

      return trending;
    } catch (error) {
      console.error('Error getting trending news:', error);
      throw error;
    }
  }

  /**
   * Search news
   */
  async searchNews(searchTerm, limit = 20) {
    try {
      const searchRegex = new RegExp(searchTerm, 'i');
      
      const news = await News.find({
        $or: [
          { title: searchRegex },
          { summary: searchRegex },
          { content: searchRegex },
          { symbols: { $in: [searchTerm.toUpperCase()] } }
        ]
      })
      .sort({ publishTime: -1 })
      .limit(limit)
      .lean();

      return news;
    } catch (error) {
      console.error('Error searching news:', error);
      throw error;
    }
  }

  /**
   * Get news statistics
   */
  async getStatistics() {
    try {
      const stats = await News.aggregate([
        {
          $group: {
            _id: null,
            totalNews: { $sum: 1 },
            avgViews: { $avg: '$views' },
            sentimentDistribution: {
              $push: '$sentiment'
            }
          }
        }
      ]);

      const sentimentCount = {};
      if (stats[0]?.sentimentDistribution) {
        stats[0].sentimentDistribution.forEach(sentiment => {
          sentimentCount[sentiment] = (sentimentCount[sentiment] || 0) + 1;
        });
      }

      return {
        total: stats[0]?.totalNews || 0,
        averageViews: stats[0]?.avgViews || 0,
        sentimentDistribution: sentimentCount
      };
    } catch (error) {
      console.error('Error getting news statistics:', error);
      return { total: 0, averageViews: 0, sentimentDistribution: {} };
    }
  }

  /**
   * Clean up old news (older than 30 days)
   */
  async cleanupOldNews() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const result = await News.deleteMany({
        publishTime: { $lt: thirtyDaysAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} old news items`);
      }
    } catch (error) {
      console.error('Error cleaning up old news:', error);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      sources: this.sources.length,
      lastUpdate: new Date().toISOString()
    };
  }
}

module.exports = NewsService;
