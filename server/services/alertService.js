const cron = require('node-cron');
const Alert = require('../models/Alert');
const User = require('../models/User');
const Stock = require('../models/Stock');
const EmailService = require('./emailService');

class AlertService {
  constructor(io) {
    this.io = io;
    this.isRunning = false;
    this.emailService = new EmailService();
    this.checkInterval = null;
    this.activeAlerts = new Map();
    this.triggerQueue = [];
    this.processingQueue = false;
  }

  /**
   * Start the alert service
   */
  start() {
    if (this.isRunning) {
      console.log('Alert service is already running');
      return;
    }

    console.log('🔔 Starting Alert Service...');
    this.isRunning = true;

    // Load active alerts into memory
    this.loadActiveAlerts();

    // Schedule alert checks every minute
    this.scheduleAlertChecks();

    // Start processing trigger queue
    this.startQueueProcessor();

    // Schedule cleanup of expired alerts
    this.scheduleCleanup();

    console.log('✅ Alert Service started successfully');
  }

  /**
   * Stop the alert service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping Alert Service...');
    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.activeAlerts.clear();
    this.triggerQueue = [];

    console.log('✅ Alert Service stopped');
  }

  /**
   * Load active alerts from database into memory
   */
  async loadActiveAlerts() {
    try {
      const now = new Date();
      
      const alerts = await Alert.find({
        isActive: true,
        $or: [
          { 'settings.expiresAt': { $exists: false } },
          { 'settings.expiresAt': { $gt: now } }
        ],
        $and: [
          {
            $or: [
              // Never triggered alerts
              { triggered: false },
              // 'always' frequency alerts (can trigger multiple times)
              { 'settings.frequency': 'always' },
              // 'daily' frequency alerts that haven't triggered today
              { 
                'settings.frequency': 'daily',
                $or: [
                  { lastTriggered: { $exists: false } },
                  { lastTriggered: { $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } }
                ]
              },
              // Alerts past their cooldown period
              {
                lastTriggered: { 
                  $lt: new Date(now.getTime() - (60 * 60 * 1000)) // Default 1 hour cooldown
                }
              }
            ]
          }
        ]
      }).populate('user', 'email preferences firstName');

      this.activeAlerts.clear();
      alerts.forEach(alert => {
        // Additional runtime check for cooldown period
        if (this.isAlertReady(alert, now)) {
          this.activeAlerts.set(alert._id.toString(), alert);
        }
      });

      console.log(`📋 Loaded ${alerts.length} active alerts (${this.activeAlerts.size} ready for checking)`);
    } catch (error) {
      console.error('Error loading active alerts:', error);
    }
  }

  /**
   * Check if an alert is ready to be triggered based on its settings
   */
  isAlertReady(alert, now = new Date()) {
    // Check if alert is disabled after trigger
    if (alert.settings.disableAfterTrigger && alert.triggered) {
      return false;
    }

    // Check frequency settings
    if (alert.settings.frequency === 'once' && alert.triggered) {
      return false;
    }

    // Check daily frequency
    if (alert.settings.frequency === 'daily' && alert.lastTriggered) {
      const today = now.toDateString();
      const lastTriggerDate = new Date(alert.lastTriggered).toDateString();
      if (today === lastTriggerDate) {
        return false;
      }
    }

    // Check cooldown period
    if (alert.lastTriggered) {
      const cooldownMinutes = alert.settings.cooldownMinutes || 60;
      const cooldownEnd = new Date(alert.lastTriggered.getTime() + (cooldownMinutes * 60 * 1000));
      if (now < cooldownEnd) {
        return false;
      }
    }

    return true;
  }

  /**
   * Schedule regular alert checks
   */
  scheduleAlertChecks() {
    // Check alerts every minute
    cron.schedule('* * * * *', () => {
      if (this.isRunning) {
        this.checkAllAlerts();
      }
    });

    // More frequent checks during market hours (every 30 seconds)
    cron.schedule('*/30 * 9-14 * * 1-5', () => {
      if (this.isRunning && this.isMarketOpen()) {
        this.checkAllAlerts();
      }
    }, {
      timezone: 'Asia/Ho_Chi_Minh'
    });

    // Reload active alerts every 5 minutes to pick up new alerts and refresh state
    cron.schedule('*/5 * * * *', () => {
      if (this.isRunning) {
        console.log('🔄 Refreshing active alerts...');
        this.loadActiveAlerts();
      }
    });

    console.log('⏰ Alert check scheduler started (1 minute intervals, 30 second market hours checks, 5 minute refreshes)');
  }

  /**
   * Schedule cleanup of expired alerts
   */
  scheduleCleanup() {
    // Clean up expired alerts daily at midnight
    cron.schedule('0 0 * * *', () => {
      this.cleanupExpiredAlerts();
    }, {
      timezone: 'Asia/Ho_Chi_Minh'
    });
  }

  /**
   * Check if Vietnam stock market is currently open
   */
  isMarketOpen() {
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

  /**
   * Check all active alerts
   */
  async checkAllAlerts() {
    try {
      if (this.activeAlerts.size === 0) {
        return;
      }

      // Get unique symbols from all alerts
      const symbols = [...new Set(Array.from(this.activeAlerts.values()).map(alert => alert.symbol))];
      
      // Get current stock data
      const stocks = await Stock.find({
        symbol: { $in: symbols },
        isActive: true
      }).lean();

      const stockData = stocks.reduce((acc, stock) => {
        acc[stock.symbol] = {
          currentPrice: stock.currentPrice,
          previousClose: stock.previousClose,
          dayChange: stock.dayChange,
          dayChangePercent: stock.dayChangePercent,
          volume: stock.volume,
          averageVolume: stock.averageVolume,
          week52High: stock.week52High,
          week52Low: stock.week52Low,
          technical: stock.technicalIndicators.length > 0 
            ? stock.technicalIndicators[stock.technicalIndicators.length - 1]
            : null
        };
        return acc;
      }, {});

      // Check each alert
      const now = new Date();
      for (const [alertId, alert] of this.activeAlerts) {
        try {
          const currentData = stockData[alert.symbol];
          if (!currentData) {
            continue;
          }

          // Double-check if alert is ready (additional safeguard)
          if (!this.isAlertReady(alert, now)) {
            continue;
          }

          if (alert.shouldTrigger(currentData)) {
            this.triggerQueue.push({
              alert: alert,
              currentData: currentData,
              timestamp: now
            });
          }
        } catch (error) {
          console.error(`Error checking alert ${alertId}:`, error);
        }
      }

    } catch (error) {
      console.error('Error in checkAllAlerts:', error);
    }
  }

  /**
   * Start processing the trigger queue
   */
  startQueueProcessor() {
    setInterval(async () => {
      if (this.triggerQueue.length > 0 && !this.processingQueue) {
        this.processingQueue = true;
        
        const trigger = this.triggerQueue.shift();
        try {
          await this.processTrigger(trigger);
        } catch (error) {
          console.error('Queue processing error:', error);
        }
        
        this.processingQueue = false;
      }
    }, 1000); // Process one trigger per second
  }

  /**
   * Process a triggered alert
   */
  async processTrigger({ alert, currentData, timestamp }) {
    try {
      console.log(`🔔 Processing alert trigger for ${alert.symbol}: ${alert.condition}`);

      // Update alert in database
      await Alert.findByIdAndUpdate(alert._id, {
        triggered: true,
        triggeredAt: timestamp,
        lastTriggered: timestamp,
        triggeredPrice: currentData.currentPrice,
        $inc: { triggerCount: 1 }
      });

      // Update alert in memory
      const memoryAlert = this.activeAlerts.get(alert._id.toString());
      if (memoryAlert) {
        memoryAlert.triggered = true;
        memoryAlert.triggeredAt = timestamp;
        memoryAlert.lastTriggered = timestamp;
        memoryAlert.triggeredPrice = currentData.currentPrice;
        memoryAlert.triggerCount += 1;

        // Update alert state and handle frequency settings
        if (memoryAlert.settings.disableAfterTrigger) {
          memoryAlert.isActive = false;
          this.activeAlerts.delete(alert._id.toString());
          await Alert.findByIdAndUpdate(alert._id, { isActive: false });
        } else if (memoryAlert.settings.frequency === 'once') {
          // Remove from memory to prevent re-checking until service restart
          this.activeAlerts.delete(alert._id.toString());
        }
      }

      // Generate alert message
      const message = alert.generateMessage(currentData);

      // Send notifications
      await this.sendNotifications(alert, message, currentData);

      // Emit real-time notification
      this.io.to(`user-${alert.user._id}`).emit('alert-triggered', {
        alertId: alert._id,
        symbol: alert.symbol,
        message: message,
        currentPrice: currentData.currentPrice,
        timestamp: timestamp,
        priority: alert.priority
      });

      console.log(`✅ Alert processed successfully for ${alert.symbol}`);

    } catch (error) {
      console.error('Error processing trigger:', error);
    }
  }

  /**
   * Send notifications for triggered alert
   */
  async sendNotifications(alert, message, currentData) {
    try {
      const user = alert.user;
      
      // Email notification
      if (alert.settings.email && user.preferences.notifications.email.priceAlerts) {
        try {
          await this.emailService.sendAlertNotification(
            user.email,
            user.firstName,
            alert.symbol,
            message,
            {
              currentPrice: currentData.currentPrice,
              change: currentData.dayChange,
              changePercent: currentData.dayChangePercent,
              alertType: alert.type,
              condition: alert.condition,
              targetValue: alert.value
            }
          );
          console.log(`📧 Email alert sent to ${user.email}`);
        } catch (emailError) {
          console.error('Error sending email alert:', emailError);
        }
      }

      // Push notification (if implemented)
      if (alert.settings.push && user.preferences.notifications.push.priceAlerts) {
        // Implement push notification logic here
        console.log(`📱 Push notification would be sent to user ${user._id}`);
      }

      // SMS notification (if implemented)
      if (alert.settings.sms) {
        // Implement SMS notification logic here
        console.log(`📱 SMS would be sent to user ${user._id}`);
      }

    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  /**
   * Add new alert to active alerts
   */
  async addAlert(alertData) {
    try {
      const alert = new Alert(alertData);
      await alert.save();
      
      // Load the alert with user data
      const populatedAlert = await Alert.findById(alert._id)
        .populate('user', 'email preferences firstName');
      
      if (populatedAlert.isActive) {
        this.activeAlerts.set(alert._id.toString(), populatedAlert);
        console.log(`➕ Added new alert for ${alert.symbol}`);
      }
      
      return alert;
    } catch (error) {
      console.error('Error adding alert:', error);
      throw error;
    }
  }

  /**
   * Update existing alert
   */
  async updateAlert(alertId, updateData) {
    try {
      const alert = await Alert.findByIdAndUpdate(
        alertId,
        updateData,
        { new: true }
      ).populate('user', 'email preferences firstName');

      if (!alert) {
        throw new Error('Alert not found');
      }

      // Update in memory
      if (alert.isActive) {
        this.activeAlerts.set(alertId, alert);
      } else {
        this.activeAlerts.delete(alertId);
      }

      console.log(`✏️ Updated alert ${alertId}`);
      return alert;
    } catch (error) {
      console.error('Error updating alert:', error);
      throw error;
    }
  }

  /**
   * Remove alert
   */
  async removeAlert(alertId) {
    try {
      await Alert.findByIdAndDelete(alertId);
      this.activeAlerts.delete(alertId);
      console.log(`🗑️ Removed alert ${alertId}`);
    } catch (error) {
      console.error('Error removing alert:', error);
      throw error;
    }
  }

  /**
   * Clean up expired alerts
   */
  async cleanupExpiredAlerts() {
    try {
      console.log('🧹 Cleaning up expired alerts...');
      
      const result = await Alert.updateMany(
        {
          'settings.expiresAt': { $lt: new Date() },
          isActive: true
        },
        {
          isActive: false
        }
      );

      console.log(`🧹 Deactivated ${result.modifiedCount} expired alerts`);

      // Remove from memory
      for (const [alertId, alert] of this.activeAlerts) {
        if (alert.settings.expiresAt && alert.settings.expiresAt < new Date()) {
          this.activeAlerts.delete(alertId);
        }
      }

    } catch (error) {
      console.error('Error cleaning up expired alerts:', error);
    }
  }

  /**
   * Get alerts for a specific user
   */
  async getUserAlerts(userId, options = {}) {
    try {
      const query = { user: userId };
      
      if (options.isActive !== undefined) {
        query.isActive = options.isActive;
      }
      
      if (options.symbol) {
        query.symbol = options.symbol.toUpperCase();
      }

      const alerts = await Alert.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 50);

      return alerts;
    } catch (error) {
      console.error('Error getting user alerts:', error);
      throw error;
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(userId) {
    try {
      const stats = await Alert.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            triggered: { $sum: { $cond: ['$triggered', 1, 0] } },
            byType: {
              $push: {
                type: '$type',
                isActive: '$isActive',
                triggered: '$triggered'
              }
            }
          }
        }
      ]);

      return stats[0] || {
        total: 0,
        active: 0,
        triggered: 0,
        byType: []
      };
    } catch (error) {
      console.error('Error getting alert stats:', error);
      throw error;
    }
  }

  /**
   * Test alert conditions (for debugging)
   */
  async testAlert(alertId, mockData = null) {
    try {
      const alert = await Alert.findById(alertId)
        .populate('user', 'email preferences firstName');

      if (!alert) {
        throw new Error('Alert not found');
      }

      let currentData = mockData;
      if (!currentData) {
        const stock = await Stock.findOne({ symbol: alert.symbol });
        if (!stock) {
          throw new Error('Stock not found');
        }

        currentData = {
          currentPrice: stock.currentPrice,
          previousClose: stock.previousClose,
          dayChange: stock.dayChange,
          dayChangePercent: stock.dayChangePercent,
          volume: stock.volume,
          averageVolume: stock.averageVolume,
          week52High: stock.week52High,
          week52Low: stock.week52Low
        };
      }

      const shouldTrigger = alert.shouldTrigger(currentData);
      const message = alert.generateMessage(currentData);

      return {
        alertId: alert._id,
        symbol: alert.symbol,
        shouldTrigger,
        message,
        currentData,
        alertCondition: `${alert.condition} ${alert.value || ''}`
      };
    } catch (error) {
      console.error('Error testing alert:', error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeAlertsCount: this.activeAlerts.size,
      queueLength: this.triggerQueue.length,
      processingQueue: this.processingQueue,
      marketOpen: this.isMarketOpen()
    };
  }

  /**
   * Bulk create alerts for portfolio stocks
   */
  async createPortfolioAlerts(userId, portfolioId, alertSettings) {
    try {
      const Portfolio = require('../models/Portfolio');
      const portfolio = await Portfolio.findOne({
        _id: portfolioId,
        owner: userId
      });

      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      const alerts = [];
      for (const stock of portfolio.stocks) {
        if (stock.currentQuantity > 0) {
          const alertData = {
            user: userId,
            symbol: stock.symbol,
            ...alertSettings,
            source: {
              type: 'portfolio',
              id: portfolioId,
              name: portfolio.name
            }
          };

          const alert = await this.addAlert(alertData);
          alerts.push(alert);
        }
      }

      console.log(`📊 Created ${alerts.length} alerts for portfolio ${portfolio.name}`);
      return alerts;
    } catch (error) {
      console.error('Error creating portfolio alerts:', error);
      throw error;
    }
  }
}

module.exports = AlertService;
