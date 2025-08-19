const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/vietnam-stock-tracker');

// Import models
const User = require('./models/User');
const Portfolio = require('./models/Portfolio');

async function createSampleData() {
  try {
    console.log('Creating sample portfolio data...');

    // Check if sample user exists
    let user = await User.findOne({ email: 'test@example.com' });
    
    if (!user) {
      // Create a sample user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true
      });
      console.log('✅ Sample user created');
    } else {
      console.log('✅ Sample user already exists');
    }

    // Check if sample portfolios exist
    const existingPortfolios = await Portfolio.find({ owner: user._id });
    
    if (existingPortfolios.length === 0) {
      // Create sample portfolios
      const portfolios = [
        {
          name: 'Danh mục cổ phiếu ngân hàng',
          description: 'Tập trung đầu tư vào các cổ phiếu ngân hàng hàng đầu Việt Nam',
          owner: user._id,
          type: 'personal',
          riskProfile: 'conservative',
          stocks: [
            {
              symbol: 'VCB',
              companyName: 'Vietcombank',
              quantity: 100,
              purchasePrice: 62000,
              purchaseDate: new Date('2025-01-15'),
              currentPrice: 65200
            },
            {
              symbol: 'TCB',
              companyName: 'Techcombank', 
              quantity: 200,
              purchasePrice: 35000,
              purchaseDate: new Date('2025-02-10'),
              currentPrice: 38250
            }
          ],
          performance: {
            totalValue: 100 * 65200 + 200 * 38250,
            totalReturn: (100 * 65200 + 200 * 38250) - (100 * 62000 + 200 * 35000),
            totalReturnPercent: (((100 * 65200 + 200 * 38250) - (100 * 62000 + 200 * 35000)) / (100 * 62000 + 200 * 35000)) * 100
          },
          isActive: true,
          settings: {
            isPublic: true,
            allowCopy: true
          }
        },
        {
          name: 'Danh mục cổ phiếu công nghệ',
          description: 'Đầu tư vào các cổ phiếu công nghệ tiềm năng',
          owner: user._id,
          type: 'personal',
          riskProfile: 'moderate',
          stocks: [
            {
              symbol: 'FPT',
              companyName: 'FPT Corporation',
              quantity: 150,
              purchasePrice: 98000,
              purchaseDate: new Date('2025-01-20'),
              currentPrice: 101800
            }
          ],
          performance: {
            totalValue: 150 * 101800,
            totalReturn: 150 * (101800 - 98000),
            totalReturnPercent: ((101800 - 98000) / 98000) * 100
          },
          isActive: true,
          settings: {
            isPublic: true,
            allowCopy: false
          }
        }
      ];

      await Portfolio.insertMany(portfolios);
      console.log('✅ Sample portfolios created');
    } else {
      console.log('✅ Sample portfolios already exist');
    }

    console.log('\n📊 Sample data summary:');
    console.log(`- User: ${user.email}`);
    console.log(`- Portfolios: ${await Portfolio.countDocuments({ owner: user._id })}`);
    
    const allPortfolios = await Portfolio.find({ owner: user._id });
    allPortfolios.forEach(portfolio => {
      console.log(`  - ${portfolio.name}: ${portfolio.stocks.length} stocks`);
    });

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSampleData();
