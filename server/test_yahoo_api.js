const PriceService = require('./services/priceService');

// Mock Socket.IO object
const mockIo = {
  emit: (event, data) => {
    console.log(`Socket Event: ${event}`, data);
  }
};

async function testYahooFinanceAPI() {
  try {
    console.log('🧪 Testing Yahoo Finance API Integration...\n');
    
    const priceService = new PriceService(mockIo);
    
    // Test individual symbols
    const testSymbols = ['VCB', 'FPT', 'VNM', 'HPG', 'TCB'];
    
    console.log('Testing individual stock fetches:');
    for (const symbol of testSymbols) {
      try {
        const data = await priceService.fetchPriceData('HOSE', [symbol]);
        if (data && data.length > 0) {
          const stock = data[0];
          console.log(`✅ ${symbol}: $${stock.currentPrice.toLocaleString()} VND (${stock.dayChangePercent > 0 ? '+' : ''}${stock.dayChangePercent}%)`);
        } else {
          console.log(`❌ ${symbol}: No data returned`);
        }
      } catch (error) {
        console.log(`❌ ${symbol}: Error - ${error.message}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n📊 Testing batch fetch:');
    const batchData = await priceService.fetchPriceData('HOSE', testSymbols);
    console.log(`✅ Batch fetch returned ${batchData.length} stocks`);
    
    batchData.forEach(stock => {
      const changeIcon = stock.dayChangePercent > 0 ? '📈' : stock.dayChangePercent < 0 ? '📉' : '➡️';
      console.log(`${changeIcon} ${stock.symbol}: ${stock.currentPrice.toLocaleString()} VND (${stock.dayChangePercent > 0 ? '+' : ''}${stock.dayChangePercent}%)`);
    });
    
    console.log('\n✅ Yahoo Finance API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testYahooFinanceAPI();
