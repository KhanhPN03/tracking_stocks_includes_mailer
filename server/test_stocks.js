const mongoose = require('mongoose');
const Stock = require('./models/Stock');

const testStocks = [
  {
    symbol: 'VCB',
    name: 'Vietcombank',
    exchange: 'HOSE',
    sector: 'Banking',
    industry: 'Commercial Banks',
    currentPrice: 64300,
    isActive: true
  },
  {
    symbol: 'FPT',
    name: 'FPT Corporation',
    exchange: 'HOSE',
    sector: 'Technology',
    industry: 'Information Technology Services',
    currentPrice: 102000,
    isActive: true
  },
  {
    symbol: 'VNM',
    name: 'Vietnam Dairy Products Joint Stock Company',
    exchange: 'HOSE',
    sector: 'Food & Beverages',
    industry: 'Food Products',
    currentPrice: 61100,
    isActive: true
  },
  {
    symbol: 'HPG',
    name: 'Hoa Phat Group Joint Stock Company',
    exchange: 'HOSE',
    sector: 'Steel',
    industry: 'Steel',
    currentPrice: 28600,
    isActive: true
  },
  {
    symbol: 'TCB',
    name: 'Techcombank',
    exchange: 'HOSE',
    sector: 'Banking',
    industry: 'Commercial Banks',
    currentPrice: 38200,
    isActive: true
  }
];

async function addTestStocks() {
  try {
    await mongoose.connect('mongodb://localhost:27017/vietnam_stock_tracker');
    console.log('Connected to MongoDB');

    // Clear existing stocks first
    await Stock.deleteMany({});
    console.log('Cleared existing stocks');

    // Add test stocks
    const results = await Stock.insertMany(testStocks);
    console.log(`Added ${results.length} test stocks:`);
    
    results.forEach(stock => {
      console.log(`- ${stock.symbol} (${stock.name})`);
    });

    console.log('✅ Test stocks added successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('Error adding test stocks:', error);
    process.exit(1);
  }
}

addTestStocks();
