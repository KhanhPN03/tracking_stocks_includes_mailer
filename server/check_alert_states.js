const mongoose = require('mongoose');
const Alert = require('./models/Alert');
const Stock = require('./models/Stock');
const User = require('./models/User');

async function checkAlertStates() {
  try {
    await mongoose.connect('mongodb://localhost:27017/vietnam_stock_tracker');
    console.log('📊 Connected to MongoDB');

    // Check all alerts
    const allAlerts = await Alert.find({}).populate('user', 'email');
    console.log(`\n📋 Total alerts in database: ${allAlerts.length}`);

    if (allAlerts.length > 0) {
      console.log('\n🔍 Alert Details:');
      allAlerts.forEach((alert, index) => {
        console.log(`\n${index + 1}. Alert ID: ${alert._id}`);
        console.log(`   Symbol: ${alert.symbol}`);
        console.log(`   Type: ${alert.type}`);
        console.log(`   Condition: ${alert.condition}`);
        console.log(`   Value: ${alert.value}`);
        console.log(`   Is Active: ${alert.isActive}`);
        console.log(`   Triggered: ${alert.triggered}`);
        console.log(`   Trigger Count: ${alert.triggerCount}`);
        console.log(`   Last Triggered: ${alert.lastTriggered || 'Never'}`);
        console.log(`   Frequency: ${alert.settings.frequency}`);
        console.log(`   Disable After Trigger: ${alert.settings.disableAfterTrigger}`);
        console.log(`   Cooldown Minutes: ${alert.settings.cooldownMinutes}`);
        console.log(`   User Email: ${alert.user?.email || 'Unknown'}`);
      });
    }

    // Check specific stock prices
    const stockSymbols = ['EVG', 'FPT', 'VCB'];
    console.log('\n📈 Current Stock Prices:');
    
    for (const symbol of stockSymbols) {
      const stock = await Stock.findOne({ symbol, isActive: true });
      if (stock) {
        console.log(`   ${symbol}: ${stock.currentPrice.toLocaleString()} VND`);
      } else {
        console.log(`   ${symbol}: Not found`);
      }
    }

    // Simulate alert state check logic
    console.log('\n🔔 Alert State Analysis:');
    const now = new Date();
    
    for (const alert of allAlerts) {
      const isReady = checkAlertReady(alert, now);
      console.log(`   ${alert.symbol} (${alert.condition} ${alert.value}): ${isReady ? '✅ Ready' : '❌ Not Ready'}`);
      
      if (!isReady) {
        if (alert.settings.frequency === 'once' && alert.triggered) {
          console.log(`     Reason: Already triggered (frequency: once)`);
        } else if (alert.lastTriggered) {
          const cooldownEnd = new Date(alert.lastTriggered.getTime() + (alert.settings.cooldownMinutes * 60 * 1000));
          if (now < cooldownEnd) {
            const remainingMinutes = Math.ceil((cooldownEnd - now) / (60 * 1000));
            console.log(`     Reason: In cooldown (${remainingMinutes} minutes remaining)`);
          }
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function checkAlertReady(alert, now = new Date()) {
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

checkAlertStates();
