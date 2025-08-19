require('dotenv').config();

const mongoose = require('mongoose');

async function debugAlertTrigger() {
  console.log('🐛 Debugging alert trigger logic...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Alert = require('./models/Alert');
    const Stock = require('./models/Stock');
    const User = require('./models/User');
    
    // Get FPT stock data
    const fptStock = await Stock.findOne({ symbol: 'FPT' });
    const currentData = {
      currentPrice: fptStock.currentPrice,
      previousClose: fptStock.previousClose,
      dayChange: fptStock.dayChange,
      dayChangePercent: fptStock.dayChangePercent,
      volume: fptStock.volume,
      averageVolume: fptStock.averageVolume,
      week52High: fptStock.week52High,
      week52Low: fptStock.week52Low,
      technical: null
    };
    
    console.log('\n📊 Current FPT data:', currentData);
    
    // Get alert for khanhpn.dev@gmail.com
    const user = await User.findOne({ email: 'khanhpn.dev@gmail.com' });
    const alert = await Alert.findOne({ 
      symbol: 'FPT',
      user: user._id
    }).populate('user');
    
    if (!alert) {
      console.log('❌ Alert not found');
      return;
    }
    
    console.log('\n🔔 Alert details:');
    console.log(`- ID: ${alert._id}`);
    console.log(`- Symbol: ${alert.symbol}`);
    console.log(`- Type: ${alert.type}`);
    console.log(`- Condition: ${alert.condition}`);
    console.log(`- Value: ${alert.value}`);
    console.log(`- Is Active: ${alert.isActive}`);
    console.log(`- Status: ${alert.status}`);
    console.log(`- Triggered: ${alert.triggered}`);
    console.log(`- Last Triggered: ${alert.lastTriggered}`);
    console.log(`- Settings:`, alert.settings);
    
    // Test shouldTrigger method
    console.log('\n🧪 Testing shouldTrigger method...');
    
    // Step by step debugging
    console.log(`- Is Active: ${alert.isActive}`);
    console.log(`- Status: ${alert.status}`);
    console.log(`- Status check: ${alert.status !== 'active'}`);
    console.log(`- Has been triggered: ${alert.triggered}`);
    console.log(`- Frequency: ${alert.settings.frequency}`);
    console.log(`- Frequency check (once & triggered): ${alert.settings.frequency === 'once' && alert.triggered}`);
    
    const shouldTrigger = alert.shouldTrigger(currentData);
    console.log(`\n🔔 Should trigger: ${shouldTrigger}`);
    
    // Manual trigger condition check
    const manualCheck = currentData.currentPrice > alert.value;
    console.log(`\n✋ Manual check (${currentData.currentPrice} > ${alert.value}): ${manualCheck}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

debugAlertTrigger().catch(console.error);
