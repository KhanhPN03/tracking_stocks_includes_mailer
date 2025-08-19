const cron = require('node-cron');
const moment = require('moment-timezone');

class ScheduleService {
  constructor() {
    this.isActiveHours = false;
    this.timezone = 'Asia/Ho_Chi_Minh'; // Vietnam timezone
    this.startHour = 9; // 9 AM
    this.endHour = 15; // 3 PM
    this.activeJobs = new Map();
    
    this.initializeSchedule();
  }

  initializeSchedule() {
    // Check if we're currently in active hours
    this.checkActiveHours();

    // Schedule to start server at 9 AM every day
    cron.schedule('0 9 * * *', () => {
      this.startActiveHours();
    }, {
      timezone: this.timezone
    });

    // Schedule to stop server at 3 PM every day
    cron.schedule('0 15 * * *', () => {
      this.stopActiveHours();
    }, {
      timezone: this.timezone
    });

    // Check every minute if we're in active hours (failsafe)
    cron.schedule('* * * * *', () => {
      this.checkActiveHours();
    }, {
      timezone: this.timezone
    });

    console.log(`🕐 Schedule Service initialized - Active hours: ${this.startHour}:00 - ${this.endHour}:00 (${this.timezone})`);
  }

  checkActiveHours() {
    const now = moment.tz(this.timezone);
    const currentHour = now.hour();
    const shouldBeActive = currentHour >= this.startHour && currentHour < this.endHour;

    if (shouldBeActive !== this.isActiveHours) {
      this.isActiveHours = shouldBeActive;
      
      if (shouldBeActive) {
        this.startActiveHours();
      } else {
        this.stopActiveHours();
      }
    }
  }

  startActiveHours() {
    if (this.isActiveHours) return; // Already active

    this.isActiveHours = true;
    const now = moment.tz(this.timezone).format('YYYY-MM-DD HH:mm:ss');
    
    console.log(`🟢 [${now}] Server entering ACTIVE HOURS (9 AM - 3 PM)`);
    console.log('📈 Starting stock price monitoring...');
    console.log('🔔 Alert system activated...');
    console.log('💾 User action logging enabled...');

    // Emit to all connected clients
    if (global.io) {
      global.io.emit('server_status', {
        status: 'active',
        message: 'Server is now active (9 AM - 3 PM)',
        timestamp: now
      });
    }

    // Start intensive services
    this.startIntensiveServices();
  }

  stopActiveHours() {
    if (!this.isActiveHours) return; // Already inactive

    this.isActiveHours = false;
    const now = moment.tz(this.timezone).format('YYYY-MM-DD HH:mm:ss');
    
    console.log(`🔴 [${now}] Server entering STANDBY MODE (outside 9 AM - 3 PM)`);
    console.log('📉 Reducing stock price monitoring...');
    console.log('🔕 Alert system in standby...');
    console.log('💾 User actions still being saved...');

    // Emit to all connected clients
    if (global.io) {
      global.io.emit('server_status', {
        status: 'standby',
        message: 'Server in standby mode (outside trading hours)',
        timestamp: now
      });
    }

    // Stop intensive services but keep essential ones
    this.stopIntensiveServices();
  }

  startIntensiveServices() {
    // Start frequent stock price updates (every 30 seconds during active hours)
    if (!this.activeJobs.has('priceUpdates')) {
      const priceUpdateJob = cron.schedule('*/30 * * * * *', async () => {
        if (this.isActiveHours && global.priceService) {
          try {
            await global.priceService.updateAllStockPrices();
          } catch (error) {
            console.error('Price update error:', error.message);
          }
        }
      }, { scheduled: false });
      
      priceUpdateJob.start();
      this.activeJobs.set('priceUpdates', priceUpdateJob);
    }

    // Start frequent alert checking (every minute during active hours)
    if (!this.activeJobs.has('alertChecking')) {
      const alertJob = cron.schedule('* * * * *', async () => {
        if (this.isActiveHours && global.alertService) {
          try {
            await global.alertService.checkAllAlerts();
          } catch (error) {
            console.error('Alert check error:', error.message);
          }
        }
      }, { scheduled: false });
      
      alertJob.start();
      this.activeJobs.set('alertChecking', alertJob);
    }

    console.log('⚡ Intensive services started for active hours');
  }

  stopIntensiveServices() {
    // Stop frequent price updates
    if (this.activeJobs.has('priceUpdates')) {
      this.activeJobs.get('priceUpdates').stop();
      this.activeJobs.delete('priceUpdates');
    }

    // Stop frequent alert checking
    if (this.activeJobs.has('alertChecking')) {
      this.activeJobs.get('alertChecking').stop();
      this.activeJobs.delete('alertChecking');
    }

    console.log('💤 Intensive services stopped for standby mode');
  }

  isServerActive() {
    return this.isActiveHours;
  }

  getActiveHoursInfo() {
    const now = moment.tz(this.timezone);
    const nextStart = moment.tz(this.timezone).hour(this.startHour).minute(0).second(0);
    const nextEnd = moment.tz(this.timezone).hour(this.endHour).minute(0).second(0);

    // If current time is past today's end time, next start is tomorrow
    if (now.hour() >= this.endHour) {
      nextStart.add(1, 'day');
      nextEnd.add(1, 'day');
    }
    // If current time is before today's start time, next end is today
    else if (now.hour() < this.startHour) {
      // nextEnd is already today
    }
    // If we're in active hours, next start is tomorrow
    else {
      nextStart.add(1, 'day');
    }

    return {
      isActive: this.isActiveHours,
      timezone: this.timezone,
      activeHours: `${this.startHour}:00 - ${this.endHour}:00`,
      currentTime: now.format('YYYY-MM-DD HH:mm:ss'),
      nextStart: nextStart.format('YYYY-MM-DD HH:mm:ss'),
      nextEnd: nextEnd.format('YYYY-MM-DD HH:mm:ss')
    };
  }

  // Force manual activation (for testing or special cases)
  forceActivate() {
    console.log('🔧 Manual activation requested');
    this.startActiveHours();
  }

  // Force manual deactivation (for maintenance)
  forceDeactivate() {
    console.log('🔧 Manual deactivation requested');
    this.stopActiveHours();
  }
}

module.exports = ScheduleService;
