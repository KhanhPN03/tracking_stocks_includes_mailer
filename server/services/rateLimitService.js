const rateLimit = require('express-rate-limit');

class RateLimitService {
  constructor() {
    this.redisClient = null;
    this.limiters = {};
    // Skip Redis setup for now - use memory store
    this.createLimiters();
  }

  /**
   * Setup Redis client for rate limiting
   */
  setupRedis() {
    try {
      if (process.env.REDIS_URL && Redis) {
        this.redisClient = Redis.createClient({
          url: process.env.REDIS_URL
        });

        this.redisClient.on('error', (err) => {
          console.error('Redis Client Error:', err);
        });

        this.redisClient.on('connect', () => {
          console.log('✅ Redis connected for rate limiting');
        });

        this.redisClient.connect();
      }
    } catch (error) {
      console.error('❌ Redis setup error:', error);
      console.log('📝 Rate limiting will use memory store (not recommended for production)');
    }
  }

  /**
   * Create different rate limiters for different endpoints
   */
  createLimiters() {
    // Use memory store for now (simpler setup)
    const store = undefined;

    // General API limiter
    this.limiters.general = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: {
        error: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => {
        return req.ip;
      }
    });

    // Authentication limiter (stricter)
    this.limiters.auth = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // limit each IP to 10 auth attempts per windowMs
      message: {
        error: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => {
        return `${req.ip}-${req.body.email || 'unknown'}`;
      },
      skipSuccessfulRequests: true
    });

    // Password reset limiter
    this.limiters.passwordReset = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // limit each IP to 3 password reset attempts per hour
      message: {
        error: 'Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => {
        return `${req.ip}-${req.body.email || 'unknown'}`;
      }
    });

    // Email verification limiter
    this.limiters.emailVerification = rateLimit({
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 5, // limit each IP to 5 email verification requests per 10 minutes
      message: {
        error: 'Quá nhiều yêu cầu xác thực email, vui lòng thử lại sau 10 phút'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => {
        return `${req.ip}-${req.body.email || req.user?.email || 'unknown'}`;
      }
    });

    // Stock price requests limiter
    this.limiters.stockPrices = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60, // limit each IP to 60 price requests per minute
      message: {
        error: 'Quá nhiều yêu cầu giá cổ phiếu, vui lòng thử lại sau 1 phút'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => {
        return req.user ? `user-${req.user.id}` : req.ip;
      }
    });

    // Portfolio operations limiter
    this.limiters.portfolio = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 30, // limit each user to 30 portfolio operations per minute
      message: {
        error: 'Quá nhiều thao tác danh mục, vui lòng thử lại sau 1 phút'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => {
        return req.user ? `user-${req.user.id}` : req.ip;
      }
    });

    // Alert creation limiter
    this.limiters.alerts = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // limit each user to 50 alert operations per 15 minutes
      message: {
        error: 'Quá nhiều thao tác cảnh báo, vui lòng thử lại sau 15 phút'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => {
        return req.user ? `user-${req.user.id}` : req.ip;
      }
    });

    // File upload limiter
    this.limiters.upload = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // limit each user to 10 file uploads per hour
      message: {
        error: 'Quá nhiều lần tải file, vui lòng thử lại sau 1 giờ'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => {
        return req.user ? `user-${req.user.id}` : req.ip;
      }
    });

    // Search limiter
    this.limiters.search = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 100, // limit each IP to 100 search requests per minute
      message: {
        error: 'Quá nhiều yêu cầu tìm kiếm, vui lòng thử lại sau 1 phút'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => {
        return req.user ? `user-${req.user.id}` : req.ip;
      }
    });

    // News requests limiter
    this.limiters.news = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 50, // limit each IP to 50 news requests per minute
      message: {
        error: 'Quá nhiều yêu cầu tin tức, vui lòng thử lại sau 1 phút'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => {
        return req.user ? `user-${req.user.id}` : req.ip;
      }
    });

    // Premium user limiter (more generous)
    this.limiters.premium = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5000, // premium users get higher limits
      message: {
        error: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => {
        return `premium-${req.user.id}`;
      },
      skip: (req) => {
        return !req.user || req.user.subscriptionStatus !== 'active';
      }
    });

    // WebSocket connection limiter
    this.limiters.websocket = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 10, // limit each IP to 10 WebSocket connection attempts per minute
      message: {
        error: 'Quá nhiều kết nối WebSocket, vui lòng thử lại sau 1 phút'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => {
        return req.ip;
      }
    });

    console.log('✅ Rate limiters initialized');
  }

  /**
   * Get limiter by name
   */
  getLimiter(name) {
    if (!this.limiters[name]) {
      console.warn(`⚠️ Rate limiter '${name}' not found, using general limiter`);
      return this.limiters.general;
    }
    return this.limiters[name];
  }

  /**
   * Create custom limiter
   */
  createCustomLimiter(options) {
    const store = undefined; // Use memory store

    return rateLimit({
      store: store,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return req.user ? `user-${req.user.id}` : req.ip;
      },
      ...options
    });
  }

  /**
   * Middleware to apply different limits based on user type
   */
  dynamicLimiter(defaultLimiterName) {
    return (req, res, next) => {
      // Premium users get more generous limits
      if (req.user && req.user.subscriptionStatus === 'active') {
        return this.limiters.premium(req, res, next);
      }

      // Regular users get standard limits
      const limiter = this.getLimiter(defaultLimiterName);
      return limiter(req, res, next);
    };
  }

  /**
   * Get current rate limit status for a key
   */
  async getRateLimitStatus(limiterName, key) {
    try {
      if (!this.redisClient) {
        return { remaining: 'unknown', reset: 'unknown' };
      }

      const limiter = this.getLimiter(limiterName);
      // This would need to be implemented based on the specific rate limiter used
      // For now, return a placeholder
      return { remaining: 'unknown', reset: 'unknown' };
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return { remaining: 'unknown', reset: 'unknown' };
    }
  }

  /**
   * Reset rate limit for a specific key (admin function)
   */
  async resetRateLimit(limiterName, key) {
    try {
      if (!this.redisClient) {
        console.log('Redis not available, cannot reset rate limit');
        return false;
      }

      const redisKey = `rl:${limiterName}:${key}`;
      await this.redisClient.del(redisKey);
      console.log(`✅ Rate limit reset for key: ${key}`);
      return true;
    } catch (error) {
      console.error('Error resetting rate limit:', error);
      return false;
    }
  }

  /**
   * Get rate limit statistics
   */
  async getStatistics() {
    try {
      if (!this.redisClient) {
        return { message: 'Redis not available for statistics' };
      }

      const stats = {};
      const limiters = Object.keys(this.limiters);

      for (const limiterName of limiters) {
        try {
          const pattern = `rl:${limiterName}:*`;
          const keys = await this.redisClient.keys(pattern);
          stats[limiterName] = {
            activeKeys: keys.length,
            pattern: pattern
          };
        } catch (error) {
          stats[limiterName] = { error: error.message };
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting rate limit statistics:', error);
      return { error: error.message };
    }
  }

  /**
   * Cleanup expired rate limit entries
   */
  async cleanup() {
    try {
      if (!this.redisClient) {
        return;
      }

      const pattern = 'rl:*';
      const keys = await this.redisClient.keys(pattern);
      let cleanedCount = 0;

      for (const key of keys) {
        const ttl = await this.redisClient.ttl(key);
        if (ttl === -1) { // Key exists but has no expiration
          await this.redisClient.del(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired rate limit entries`);
      }
    } catch (error) {
      console.error('Error during rate limit cleanup:', error);
    }
  }

  /**
   * Health check for rate limiting service
   */
  async healthCheck() {
    try {
      const health = {
        status: 'healthy',
        limiters: Object.keys(this.limiters).length,
        redis: false,
        timestamp: new Date().toISOString()
      };

      if (this.redisClient) {
        try {
          await this.redisClient.ping();
          health.redis = true;
        } catch (error) {
          health.redis = false;
          health.redisError = error.message;
        }
      }

      return health;
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Shutdown rate limiting service
   */
  async shutdown() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        console.log('✅ Rate limiting Redis connection closed');
      }
    } catch (error) {
      console.error('Error shutting down rate limiting service:', error);
    }
  }
}

module.exports = RateLimitService;
