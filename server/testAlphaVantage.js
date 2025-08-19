const AlphaVantageService = require('./services/alphaVantageService');

// Test script for Alpha Vantage API
async function testAlphaVantageAPI() {
  console.log('🧪 Testing Alpha Vantage API Service...\n');
  
  const alphaVantage = new AlphaVantageService();
  
  // Check if API key is configured
  console.log('1. Checking API configuration...');
  if (!alphaVantage.isConfigured()) {
    console.log('❌ Alpha Vantage API key not configured');
    console.log('📝 To get a free API key:');
    console.log('   1. Visit: https://www.alphavantage.co/support/#api-key');
    console.log('   2. Sign up for a free account');
    console.log('   3. Copy your API key');
    console.log('   4. Add it to your .env file: ALPHA_VANTAGE_API_KEY=your_api_key_here');
    console.log('   5. Restart the server');
    return;
  }
  
  console.log('✅ API key configured\n');
  
  // Test connection
  console.log('2. Testing API connection...');
  const connectionTest = await alphaVantage.testConnection();
  
  if (connectionTest.success) {
    console.log('✅ Connection successful');
    console.log('📊 Sample data:', JSON.stringify(connectionTest.data, null, 2));
  } else {
    console.log('❌ Connection failed:', connectionTest.error);
    return;
  }
  
  console.log('\n3. Testing multiple Vietnamese stocks...');
  const symbols = ['VCB', 'FPT', 'VNM', 'HPG', 'TCB'];
  
  for (const symbol of symbols) {
    console.log(`\n📈 Testing ${symbol}...`);
    const quote = await alphaVantage.getStockQuote(symbol);
    
    if (quote) {
      console.log(`✅ ${symbol}: ${quote.price} VND (${quote.changePercent}%)`);
    } else {
      console.log(`❌ ${symbol}: No data available`);
    }
  }
  
  console.log('\n🎉 Test completed!');
}

// Run the test
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  testAlphaVantageAPI().catch(error => {
    console.error('Test failed:', error);
  });
}

module.exports = testAlphaVantageAPI;
