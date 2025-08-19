const mongoose = require('mongoose');

// User Activity Log Schema
const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'register',
      'view_dashboard',
      'view_portfolio',
      'view_stocks',
      'view_alerts',
      'view_news',
      'create_alert',
      'update_alert',
      'delete_alert',
      'add_to_portfolio',
      'remove_from_portfolio',
      'update_portfolio',
      'search_stock',
      'view_stock_detail',
      'change_settings',
      'export_data',
      'api_call',
      'error_occurred'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Can store any additional data
    default: {}
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  serverActive: {
    type: Boolean,
    default: true
  },
  responseTime: Number, // in milliseconds
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: String
}, {
  timestamps: true,
  collection: 'user_activities'
});

// Add indexes for better query performance
userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ action: 1, timestamp: -1 });
userActivitySchema.index({ timestamp: -1 });
userActivitySchema.index({ serverActive: 1 });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

class ActivityLogService {
  constructor() {
    this.batchBuffer = [];
    this.batchSize = 10;
    this.flushInterval = 5000; // 5 seconds
    
    // Start batch processing
    this.startBatchProcessor();
  }

  async logActivity(data) {
    try {
      const activityData = {
        userId: data.userId,
        sessionId: data.sessionId || 'anonymous',
        action: data.action,
        details: data.details || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        serverActive: global.scheduleService ? global.scheduleService.isServerActive() : true,
        responseTime: data.responseTime,
        success: data.success !== false, // Default to true unless explicitly false
        errorMessage: data.errorMessage,
        timestamp: new Date()
      };

      // Add to batch buffer for efficient saving
      this.batchBuffer.push(activityData);

      // If buffer is full, flush immediately
      if (this.batchBuffer.length >= this.batchSize) {
        await this.flushBatch();
      }

      return true;
    } catch (error) {
      console.error('Failed to log user activity:', error);
      return false;
    }
  }

  async flushBatch() {
    if (this.batchBuffer.length === 0) return;

    try {
      const batch = [...this.batchBuffer];
      this.batchBuffer = [];

      await UserActivity.insertMany(batch);
      console.log(`💾 Saved ${batch.length} user activities to database`);
    } catch (error) {
      console.error('Failed to flush activity batch:', error);
      // Put failed items back in buffer to retry
      this.batchBuffer.unshift(...this.batchBuffer);
    }
  }

  startBatchProcessor() {
    setInterval(async () => {
      await this.flushBatch();
    }, this.flushInterval);
  }

  // Middleware function to automatically log API requests
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Override res.send to capture response
      const originalSend = res.send;
      res.send = function(data) {
        const responseTime = Date.now() - startTime;
        
        // Log the activity
        if (req.user || req.path !== '/api/health') { // Don't log health checks without user
          activityLogService.logActivity({
            userId: req.user?._id,
            sessionId: req.sessionID || req.headers['x-session-id'],
            action: 'api_call',
            details: {
              method: req.method,
              path: req.path,
              query: req.query,
              body: req.method === 'POST' ? req.body : undefined,
              statusCode: res.statusCode
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            responseTime: responseTime,
            success: res.statusCode < 400
          });
        }

        originalSend.call(this, data);
      };

      next();
    };
  }

  // Get user activity statistics
  async getUserActivityStats(userId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const activities = await UserActivity.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            lastActivity: { $max: '$timestamp' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      return activities;
    } catch (error) {
      console.error('Failed to get user activity stats:', error);
      return [];
    }
  }

  // Get system activity statistics
  async getSystemActivityStats(hours = 24) {
    try {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hours);

      const stats = await UserActivity.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              hour: { $hour: '$timestamp' },
              serverActive: '$serverActive'
            },
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' },
            avgResponseTime: { $avg: '$responseTime' }
          }
        },
        {
          $project: {
            _id: 1,
            count: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            avgResponseTime: { $round: ['$avgResponseTime', 2] }
          }
        },
        {
          $sort: { '_id.hour': 1 }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Failed to get system activity stats:', error);
      return [];
    }
  }

  // Clean old activity logs (keep only last 30 days)
  async cleanOldLogs() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const result = await UserActivity.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      console.log(`🧹 Cleaned ${result.deletedCount} old activity logs`);
      return result.deletedCount;
    } catch (error) {
      console.error('Failed to clean old activity logs:', error);
      return 0;
    }
  }
}

// Create global instance
const activityLogService = new ActivityLogService();

module.exports = {
  ActivityLogService,
  UserActivity,
  activityLogService
};
