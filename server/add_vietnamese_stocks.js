const mongoose = require('mongoose');
const Stock = require('./models/Stock');

// Comprehensive list of Vietnamese stocks
const vietnameseStocks = [
  // Banking
  { symbol: 'VCB', name: 'Vietcombank', exchange: 'HOSE', sector: 'Banking', industry: 'Commercial Banks' },
  { symbol: 'BID', name: 'Bank for Investment and Development of Vietnam', exchange: 'HOSE', sector: 'Banking', industry: 'Commercial Banks' },
  { symbol: 'CTG', name: 'Vietnam Joint Stock Commercial Bank for Industry and Trade', exchange: 'HOSE', sector: 'Banking', industry: 'Commercial Banks' },
  { symbol: 'TCB', name: 'Techcombank', exchange: 'HOSE', sector: 'Banking', industry: 'Commercial Banks' },
  { symbol: 'VPB', name: 'Vietnam Prosperity Joint Stock Commercial Bank', exchange: 'HOSE', sector: 'Banking', industry: 'Commercial Banks' },
  { symbol: 'MBB', name: 'Military Commercial Joint Stock Bank', exchange: 'HOSE', sector: 'Banking', industry: 'Commercial Banks' },
  { symbol: 'STB', name: 'Saigon Thuong Tin Commercial Joint Stock Bank', exchange: 'HOSE', sector: 'Banking', industry: 'Commercial Banks' },
  { symbol: 'ACB', name: 'Asia Commercial Joint Stock Bank', exchange: 'HOSE', sector: 'Banking', industry: 'Commercial Banks' },
  { symbol: 'HDB', name: 'HD Bank', exchange: 'HOSE', sector: 'Banking', industry: 'Commercial Banks' },
  { symbol: 'TPB', name: 'Tien Phong Commercial Joint Stock Bank', exchange: 'HOSE', sector: 'Banking', industry: 'Commercial Banks' },
  { symbol: 'MSB', name: 'Maritime Commercial Joint Stock Bank', exchange: 'HOSE', sector: 'Banking', industry: 'Commercial Banks' },
  { symbol: 'OCB', name: 'Orient Commercial Joint Stock Bank', exchange: 'HOSE', sector: 'Banking', industry: 'Commercial Banks' },
  { symbol: 'LPB', name: 'Lien Viet Post Joint Stock Commercial Bank', exchange: 'HOSE', sector: 'Banking', industry: 'Commercial Banks' },
  { symbol: 'EIB', name: 'Export Import Commercial Joint Stock Bank', exchange: 'HOSE', sector: 'Banking', industry: 'Commercial Banks' },
  { symbol: 'SHB', name: 'Saigon - Hanoi Commercial Joint Stock Bank', exchange: 'HOSE', sector: 'Banking', industry: 'Commercial Banks' },

  // Technology
  { symbol: 'FPT', name: 'FPT Corporation', exchange: 'HOSE', sector: 'Technology', industry: 'Information Technology Services' },
  { symbol: 'CMG', name: 'Computer Management Group', exchange: 'HOSE', sector: 'Technology', industry: 'Information Technology Services' },
  { symbol: 'SAM', name: 'Saigon Securities Incorporation', exchange: 'HOSE', sector: 'Technology', industry: 'Information Technology Services' },

  // Real Estate
  { symbol: 'VHM', name: 'Vinhomes', exchange: 'HOSE', sector: 'Real Estate', industry: 'Real Estate Development' },
  { symbol: 'VIC', name: 'Vingroup', exchange: 'HOSE', sector: 'Real Estate', industry: 'Real Estate Development' },
  { symbol: 'VRE', name: 'Vincom Retail', exchange: 'HOSE', sector: 'Real Estate', industry: 'Real Estate Development' },
  { symbol: 'NVL', name: 'Novaland', exchange: 'HOSE', sector: 'Real Estate', industry: 'Real Estate Development' },
  { symbol: 'DXG', name: 'Dat Xanh Group', exchange: 'HOSE', sector: 'Real Estate', industry: 'Real Estate Development' },
  { symbol: 'BCM', name: 'Investment and Industrial Development Corporation', exchange: 'HOSE', sector: 'Real Estate', industry: 'Real Estate Development' },
  { symbol: 'KDH', name: 'Khang Dien House Trading and Investment', exchange: 'HOSE', sector: 'Real Estate', industry: 'Real Estate Development' },
  { symbol: 'DIG', name: 'DIC Corp', exchange: 'HOSE', sector: 'Real Estate', industry: 'Real Estate Development' },
  { symbol: 'PDR', name: 'Phat Dat Real Estate Development', exchange: 'HOSE', sector: 'Real Estate', industry: 'Real Estate Development' },
  { symbol: 'NLG', name: 'Nam Long Investment Corporation', exchange: 'HOSE', sector: 'Real Estate', industry: 'Real Estate Development' },

  // Food & Beverages
  { symbol: 'VNM', name: 'Vietnam Dairy Products Joint Stock Company', exchange: 'HOSE', sector: 'Food & Beverages', industry: 'Food Products' },
  { symbol: 'MSN', name: 'Masan Group Corporation', exchange: 'HOSE', sector: 'Food & Beverages', industry: 'Food Products' },
  { symbol: 'SAB', name: 'Sabeco', exchange: 'HOSE', sector: 'Food & Beverages', industry: 'Beverages' },
  { symbol: 'KDC', name: 'Kinh Do Corporation', exchange: 'HOSE', sector: 'Food & Beverages', industry: 'Food Products' },
  { symbol: 'MCH', name: 'Masan Consumer Holdings', exchange: 'HOSE', sector: 'Food & Beverages', industry: 'Food Products' },

  // Steel & Materials
  { symbol: 'HPG', name: 'Hoa Phat Group Joint Stock Company', exchange: 'HOSE', sector: 'Steel', industry: 'Steel' },
  { symbol: 'HSG', name: 'Hoa Sen Group', exchange: 'HOSE', sector: 'Steel', industry: 'Steel' },
  { symbol: 'NKG', name: 'Steel National Joint Stock Company', exchange: 'HOSE', sector: 'Steel', industry: 'Steel' },

  // Oil & Gas
  { symbol: 'GAS', name: 'PetroVietnam Gas Joint Stock Corporation', exchange: 'HOSE', sector: 'Oil & Gas', industry: 'Oil & Gas Equipment & Services' },
  { symbol: 'PLX', name: 'Petrolimex', exchange: 'HOSE', sector: 'Oil & Gas', industry: 'Oil & Gas Refining & Marketing' },
  { symbol: 'OIL', name: 'PetroVietnam Oil Corporation', exchange: 'HOSE', sector: 'Oil & Gas', industry: 'Oil & Gas Refining & Marketing' },
  { symbol: 'BSR', name: 'Binh Son Refining and Petrochemical', exchange: 'HOSE', sector: 'Oil & Gas', industry: 'Oil & Gas Refining & Marketing' },
  { symbol: 'PVD', name: 'PetroVietnam Drilling and Well Services', exchange: 'HOSE', sector: 'Oil & Gas', industry: 'Oil & Gas Equipment & Services' },
  { symbol: 'PVS', name: 'PetroVietnam Technical Services Corporation', exchange: 'HOSE', sector: 'Oil & Gas', industry: 'Oil & Gas Equipment & Services' },

  // Utilities
  { symbol: 'GEX', name: 'Electricity of Vietnam', exchange: 'HOSE', sector: 'Utilities', industry: 'Electric Utilities' },
  { symbol: 'REE', name: 'Refrigeration Electrical Engineering Corporation', exchange: 'HOSE', sector: 'Utilities', industry: 'Electric Utilities' },
  { symbol: 'POW', name: 'PetroVietnam Power Corporation', exchange: 'HOSE', sector: 'Utilities', industry: 'Electric Utilities' },

  // Airlines & Transportation
  { symbol: 'HVN', name: 'Vietnam Airlines', exchange: 'HOSE', sector: 'Transportation', industry: 'Airlines' },
  { symbol: 'VJC', name: 'VietJet Aviation', exchange: 'HOSE', sector: 'Transportation', industry: 'Airlines' },

  // Retail
  { symbol: 'MWG', name: 'Mobile World', exchange: 'HOSE', sector: 'Retail', industry: 'Specialty Retail' },
  { symbol: 'FRT', name: 'FPT Retail', exchange: 'HOSE', sector: 'Retail', industry: 'Specialty Retail' },
  { symbol: 'PNJ', name: 'Phu Nhuan Jewelry', exchange: 'HOSE', sector: 'Retail', industry: 'Specialty Retail' },

  // Insurance
  { symbol: 'BVH', name: 'Bao Viet Holdings', exchange: 'HOSE', sector: 'Insurance', industry: 'Life & Health Insurance' },
  { symbol: 'PVI', name: 'PetroVietnam Insurance Corporation', exchange: 'HOSE', sector: 'Insurance', industry: 'Property & Casualty Insurance' },

  // Agriculture
  { symbol: 'HAG', name: 'HAGL Agrico', exchange: 'HOSE', sector: 'Agriculture', industry: 'Agricultural Products' },

  // Textiles
  { symbol: 'VGT', name: 'Golden Victory Textile-Garment', exchange: 'HOSE', sector: 'Textiles', industry: 'Textiles' },
  { symbol: 'TNG', name: 'Thanh Cong Textile Garment Investment Trading', exchange: 'HOSE', sector: 'Textiles', industry: 'Textiles' },

  // HNX Stocks
  { symbol: 'SHS', name: 'Saigon - Hanoi Securities', exchange: 'HNX', sector: 'Securities', industry: 'Investment Banking & Brokerage' },
  { symbol: 'VND', name: 'Viet Nam Dairy Corporation', exchange: 'HNX', sector: 'Food & Beverages', industry: 'Food Products' },
  { symbol: 'TIG', name: 'Thien Long Group Corporation', exchange: 'HNX', sector: 'Other', industry: 'Personal Products' },
  { symbol: 'CEO', name: 'C.E.O Group', exchange: 'HNX', sector: 'Real Estate', industry: 'Real Estate Development' },
  { symbol: 'EVG', name: 'EVN GenCo 3', exchange: 'HNX', sector: 'Utilities', industry: 'Electric Utilities' },
  { symbol: 'VCS', name: 'Vicostone', exchange: 'HNX', sector: 'Construction & Materials', industry: 'Construction Materials' },
  { symbol: 'DNP', name: 'DNP Co., Ltd', exchange: 'HNX', sector: 'Chemicals', industry: 'Chemicals' },
  { symbol: 'SRA', name: 'Saigon Ra Mat', exchange: 'HNX', sector: 'Food & Beverages', industry: 'Beverages' },
  { symbol: 'MIG', name: 'Military Industry - Telecoms Group', exchange: 'HNX', sector: 'Telecommunications', industry: 'Communications Equipment' },
  { symbol: 'VGS', name: 'Vietnam-Germany Steel Pipe', exchange: 'HNX', sector: 'Steel', industry: 'Steel' },

  // Additional popular stocks
  { symbol: 'SSI', name: 'Saigon Securities Inc.', exchange: 'HOSE', sector: 'Securities', industry: 'Investment Banking & Brokerage' },
  { symbol: 'VPS', name: 'VPS Securities', exchange: 'HOSE', sector: 'Securities', industry: 'Investment Banking & Brokerage' },
  { symbol: 'HCM', name: 'Ho Chi Minh City Securities Corporation', exchange: 'HOSE', sector: 'Securities', industry: 'Investment Banking & Brokerage' },
  { symbol: 'VDS', name: 'Viet Dragon Securities Corporation', exchange: 'HOSE', sector: 'Securities', industry: 'Investment Banking & Brokerage' },
];

async function addVietnameseStocks() {
  try {
    await mongoose.connect('mongodb://localhost:27017/vietnam_stock_tracker');
    console.log('📊 Connected to MongoDB');

    // Clear existing stocks
    await Stock.deleteMany({});
    console.log('🗑️  Cleared existing stocks');

    // Prepare stocks with default values
    const stocksToInsert = vietnameseStocks.map(stock => ({
      ...stock,
      currentPrice: Math.floor(Math.random() * 100000) + 10000, // Random price between 10k-110k VND
      previousClose: null,
      dayChange: 0,
      dayChangePercent: 0,
      volume: Math.floor(Math.random() * 10000000) + 100000, // Random volume
      marketCap: null,
      isActive: true,
      lastPriceUpdate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Insert in batches to avoid memory issues
    const batchSize = 20;
    let totalInserted = 0;

    for (let i = 0; i < stocksToInsert.length; i += batchSize) {
      const batch = stocksToInsert.slice(i, i + batchSize);
      const results = await Stock.insertMany(batch);
      totalInserted += results.length;
      
      console.log(`📈 Inserted batch ${Math.ceil((i + batchSize) / batchSize)}: ${results.length} stocks`);
      
      // Log some examples from this batch
      results.slice(0, 3).forEach(stock => {
        console.log(`   - ${stock.symbol} (${stock.name}) - ${stock.exchange}`);
      });
      
      if (results.length === batchSize && i + batchSize < stocksToInsert.length) {
        console.log('   ...');
      }
    }

    console.log(`\n✅ Successfully added ${totalInserted} Vietnamese stocks to database`);
    console.log('📊 Coverage includes:');
    console.log('   - HOSE stocks (Ho Chi Minh Stock Exchange)');
    console.log('   - HNX stocks (Hanoi Stock Exchange)');
    console.log('   - Major sectors: Banking, Technology, Real Estate, etc.');
    console.log('   - Popular stocks like VCB, FPT, VIC, VHM, GAS, etc.');
    console.log(`   - Target stock EVG is now available!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding Vietnamese stocks:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  addVietnameseStocks();
}

module.exports = { addVietnameseStocks, vietnameseStocks };
