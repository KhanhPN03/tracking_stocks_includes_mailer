const mongoose = require('mongoose');
const News = require('./models/News');

const sampleNews = [
  {
    title: 'VCB achieves strong quarterly results',
    content: 'Vietcombank reported impressive quarterly earnings with significant growth in lending and deposits.',
    summary: 'Vietcombank shows strong financial performance in Q3 2025',
    author: {
      name: 'Vietnam Finance Reporter'
    },
    source: {
      name: 'VN Finance',
      domain: 'vnfinance.com',
      credibility: 4
    },
    url: 'https://example.com/vcb-results-1',
    category: 'earnings',
    symbols: ['VCB'],
    sentiment: 'positive',
    tags: ['banking', 'earnings', 'vietcombank'],
    publishDate: new Date('2025-08-17T10:00:00Z')
  },
  {
    title: 'FPT expands technology services in Southeast Asia',
    content: 'FPT Corporation announces new expansion plans across Southeast Asian markets with focus on digital transformation services.',
    summary: 'FPT Corporation expands regional presence in tech sector',
    author: {
      name: 'Tech Industry Analyst'
    },
    source: {
      name: 'Vietnam Tech News',
      domain: 'vntechnews.com',
      credibility: 4
    },
    url: 'https://example.com/fpt-expansion-1',
    category: 'company-news',
    symbols: ['FPT'],
    sentiment: 'positive',
    tags: ['technology', 'expansion', 'fpt'],
    publishDate: new Date('2025-08-17T14:30:00Z')
  },
  {
    title: 'Vietnam stock market shows resilience amid global volatility',
    content: 'Vietnamese stock exchanges maintain stability despite international market fluctuations, with strong performances from banking and technology sectors.',
    summary: 'VN stock market demonstrates stability during global uncertainty',
    author: {
      name: 'Market Analyst'
    },
    source: {
      name: 'Vietnam Investment Review',
      domain: 'vir.com.vn',
      credibility: 5
    },
    url: 'https://example.com/market-resilience-1',
    category: 'market-news',
    symbols: ['VN-INDEX', 'VN30'],
    sentiment: 'neutral',
    tags: ['market', 'stability', 'vietnam'],
    publishDate: new Date('2025-08-18T09:15:00Z')
  }
];

async function addSampleNews() {
  try {
    await mongoose.connect('mongodb://localhost:27017/vietnam_stock_tracker');
    console.log('Connected to MongoDB');

    // Clear existing news
    await News.deleteMany({});
    console.log('Cleared existing news');

    // Add sample news
    const results = await News.insertMany(sampleNews);
    console.log(`Added ${results.length} sample news articles:`);
    
    results.forEach(article => {
      console.log(`- ${article.title} (${article.symbols.join(', ')})`);
    });

    console.log('✅ Sample news added successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('Error adding sample news:', error);
    process.exit(1);
  }
}

addSampleNews();
