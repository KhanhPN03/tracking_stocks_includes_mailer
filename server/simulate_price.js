require('dotenv').config();

const mongoose = require('mongoose');

async function simulatePriceUpdate() {
  console.log('📈 Simulating FPT price update to trigger alert...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Stock = require('./models/Stock');
    
    // Update FPT price to well above the alert threshold
    const newPrice = 105000; // Well above 100,000 threshold
    
    const result = await Stock.findOneAndUpdate(
      { symbol: 'FPT' },
      {
        $set: {
          currentPrice: newPrice,
          previousClose: 100000,
          dayChange: 5000,
          dayChangePercent: 5.0,
          lastUpdated: new Date()
        }
      },
      { new: true }
    );
    
    if (result) {
      console.log('✅ FPT price updated:');
      console.log(`- Current Price: ${result.currentPrice} VND`);
      console.log(`- Previous Close: ${result.previousClose} VND`);
      console.log(`- Day Change: ${result.dayChange} VND (${result.dayChangePercent}%)`);
      console.log(`- Last Updated: ${result.lastUpdated}`);
      console.log('\n🔔 This should trigger alerts for values below 105,000 VND');
    } else {
      console.log('❌ Failed to update FPT stock');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

simulatePriceUpdate().catch(console.error);
