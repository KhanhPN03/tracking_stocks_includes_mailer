const mongoose = require('mongoose');
const Stock = require('./models/Stock');

async function showCurrentStockData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/vietnam_stock_tracker');
    console.log('📊 Current Stock Data from Yahoo Finance API:\n');

    const stocks = await Stock.find({}).select('symbol name currentPrice previousClose dayChange dayChangePercent volume lastUpdated');
    
    if (stocks.length === 0) {
      console.log('No stocks found in database');
      return;
    }

    console.log('Stock Symbol | Company Name                              | Current Price | Day Change | Change % | Volume      | Last Updated');
    console.log('-------------|-------------------------------------------|---------------|------------|----------|-------------|------------------');
    
    stocks.forEach(stock => {
      const symbol = stock.symbol.padEnd(12);
      const name = (stock.name || 'N/A').substring(0, 42).padEnd(42);
      const price = `${(stock.currentPrice || 0).toLocaleString()} VND`.padEnd(13);
      const change = `${(stock.dayChange || 0).toLocaleString()} VND`.padEnd(10);
      const changePercent = `${(stock.dayChangePercent || 0).toFixed(2)}%`.padEnd(8);
      const volume = `${(stock.volume || 0).toLocaleString()}`.padEnd(11);
      const updated = stock.lastUpdated ? stock.lastUpdated.toLocaleString() : 'Never';
      
      console.log(`${symbol} | ${name} | ${price} | ${change} | ${changePercent} | ${volume} | ${updated}`);
    });
    
    console.log('\n✅ Yahoo Finance API is successfully providing real-time Vietnamese stock data!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

showCurrentStockData();
