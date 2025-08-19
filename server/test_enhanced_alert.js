require('dotenv').config();

const mongoose = require('mongoose');

async function testAlertCreation() {
  console.log('🧪 Testing enhanced alert creation with price validation...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Alert = require('./models/Alert');
    const Stock = require('./models/Stock');
    const User = require('./models/User');
    const AlphaVantageService = require('./services/alphaVantageService');
    
    // Get test user
    const user = await User.findOne({ email: 'khanhpn.dev@gmail.com' });
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log(`👤 Test user: ${user.email}`);
    
    // Test the enhanced alert creation logic
    const symbol = 'FPT';
    const condition = 'above';
    const value = 90000; // Lower than current price to trigger immediately
    const type = 'price';
    
    console.log(`\n📊 Creating alert: ${symbol} ${condition} ${value} VND`);
    
    // Get current stock price (simulating the enhanced route logic)
    let currentPrice = null;
    try {
      // First try to get from database
      let stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
      
      if (stock && stock.currentPrice) {
        currentPrice = stock.currentPrice;
        console.log(`📈 Current price from database: ${currentPrice} VND`);
      } else {
        // If not in database, fetch from API (this would normally happen)
        console.log(`📊 Stock not in database, would fetch from API...`);
        
        // For demo, let's use the simulated current price we set earlier
        const stockFromDB = await Stock.findOne({ symbol: 'FPT' });
        if (stockFromDB) {
          currentPrice = stockFromDB.currentPrice;
          console.log(`📈 Using existing database price: ${currentPrice} VND`);
        }
      }
    } catch (apiError) {
      console.warn(`⚠️ Could not fetch current price for ${symbol}:`, apiError.message);
    }
    
    // Check if alert would immediately trigger
    let immediatelyTriggered = false;
    let warningMessage = '';
    
    if (currentPrice && value && (condition === 'above' || condition === 'below')) {
      if (condition === 'above' && currentPrice > value) {
        immediatelyTriggered = true;
        warningMessage = `Cảnh báo: Giá hiện tại của ${symbol} (${currentPrice.toLocaleString()} VND) đã cao hơn mức cảnh báo (${value.toLocaleString()} VND). Cảnh báo sẽ được kích hoạt ngay lập tức.`;
      } else if (condition === 'below' && currentPrice < value) {
        immediatelyTriggered = true;
        warningMessage = `Cảnh báo: Giá hiện tại của ${symbol} (${currentPrice.toLocaleString()} VND) đã thấp hơn mức cảnh báo (${value.toLocaleString()} VND). Cảnh báo sẽ được kích hoạt ngay lập tức.`;
      }
    }
    
    console.log('\n🔍 Alert Validation Results:');
    console.log(`- Current Price: ${currentPrice ? currentPrice.toLocaleString() + ' VND' : 'Unknown'}`);
    console.log(`- Target Value: ${value.toLocaleString()} VND`);
    console.log(`- Condition: ${condition}`);
    console.log(`- Would Trigger Immediately: ${immediatelyTriggered ? '✅ YES' : '❌ NO'}`);
    if (warningMessage) {
      console.log(`- Warning: ${warningMessage}`);
    }
    
    // Create the alert
    const alertData = {
      symbol: symbol.toUpperCase(),
      type,
      condition,
      value,
      message: `Test alert for ${symbol} ${condition} ${value}`,
      user: user._id
    };
    
    const alert = new Alert(alertData);
    await alert.save();
    
    console.log('\n✅ Alert created successfully:');
    console.log(`- Alert ID: ${alert._id}`);
    console.log(`- Symbol: ${alert.symbol}`);
    console.log(`- Condition: ${alert.condition}`);
    console.log(`- Value: ${alert.value}`);
    console.log(`- Active: ${alert.isActive}`);
    
    // Simulate immediate trigger notification
    if (immediatelyTriggered) {
      console.log('\n📧 Would send immediate notification email...');
      console.log(`   To: ${user.email}`);
      console.log(`   Subject: 🔔 Cảnh báo ${symbol} - Vietnam Stock Tracker`);
      console.log(`   Message: ${warningMessage}`);
    }
    
    console.log('\n🎉 Enhanced alert creation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testAlertCreation().catch(console.error);
