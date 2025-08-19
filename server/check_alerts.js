require('dotenv').config();

const mongoose = require('mongoose');

async function checkAndFixAlerts() {
  console.log('🔧 Checking alerts and stock data...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Alert = require('./models/Alert');
    const Stock = require('./models/Stock');
    const User = require('./models/User');
    
    // Check FPT stock current price
    const fptStock = await Stock.findOne({ symbol: 'FPT' });
    if (fptStock) {
      console.log('\n📊 FPT Stock Data:');
      console.log(`- Current Price: ${fptStock.currentPrice} VND`);
      console.log(`- Previous Close: ${fptStock.previousClose} VND`);
      console.log(`- Day Change: ${fptStock.dayChange} VND (${fptStock.dayChangePercent}%)`);
      console.log(`- Last Updated: ${fptStock.lastUpdated}`);
    } else {
      console.log('❌ FPT stock data not found');
    }
    
    // Check and update alerts for khanhpn.dev@gmail.com
    const alerts = await Alert.find({ 
      symbol: 'FPT',
      isActive: true 
    }).populate('user');
    
    console.log(`\n🔔 Found ${alerts.length} active FPT alerts:`);
    
    for (const alert of alerts) {
      console.log(`\nAlert ID: ${alert._id}`);
      console.log(`- User: ${alert.user.email}`);
      console.log(`- Type: ${alert.type}`);
      console.log(`- Condition: ${alert.condition}`);
      console.log(`- Target Value: ${alert.value}`);
      console.log(`- Current settings:`, alert.settings);
      console.log(`- Triggered: ${alert.triggered}`);
      
      // Check if alert should trigger based on current price
      if (fptStock && alert.condition === 'above' && fptStock.currentPrice > alert.value) {
        console.log(`🚨 This alert SHOULD trigger! Current price (${fptStock.currentPrice}) > target (${alert.value})`);
      }
      
      // Update alert settings to enable email notifications
      if (!alert.settings || !alert.settings.email) {
        const updatedAlert = await Alert.findByIdAndUpdate(
          alert._id,
          {
            $set: {
              'settings.email': true,
              'settings.push': true,
              'settings.sms': false
            }
          },
          { new: true }
        );
        console.log('✅ Updated alert settings to enable email notifications');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

checkAndFixAlerts().catch(console.error);
