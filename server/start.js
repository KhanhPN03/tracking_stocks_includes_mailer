#!/usr/bin/env node

const { spawn } = require('child_process');
const axios = require('axios');

async function checkServices() {
  console.log('🔍 Checking required services...\n');
  
  // Check MongoDB
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vietnam_stock_tracker', {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB: Connected');
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ MongoDB: Not available');
    console.log('   Please install and start MongoDB:');
    console.log('   - Windows: Download from https://www.mongodb.com/try/download/community');
    console.log('   - macOS: brew install mongodb/brew/mongodb-community');
    console.log('   - Ubuntu: sudo apt install mongodb');
    console.log('   - Or use MongoDB Atlas (cloud): https://cloud.mongodb.com/\n');
  }
  
  // Check Redis (optional)
  try {
    const redis = require('redis');
    const client = redis.createClient({ url: process.env.REDIS_URL });
    await client.connect();
    await client.ping();
    console.log('✅ Redis: Connected');
    await client.quit();
  } catch (error) {
    console.log('⚠️  Redis: Not available (optional for development)');
    console.log('   Install Redis for better performance:');
    console.log('   - Windows: Download from https://redis.io/download');
    console.log('   - macOS: brew install redis');
    console.log('   - Ubuntu: sudo apt install redis-server\n');
  }
  
  // Check API Keys
  console.log('🔑 API Configuration:');
  
  console.log('✅ Yahoo Finance API: Available (Free alternative to DNSE)');
  console.log('   Using Yahoo Finance for Vietnamese stock data instead of paid DNSE API');
  
  const newsKey = process.env.NEWS_API_KEY;
  if (newsKey && newsKey !== 'your_news_api_key') {
    console.log('✅ News API: Configured');
  } else {
    console.log('⚠️  News API: Limited functionality (get free key from newsapi.org)');
  }
  
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  if (emailUser && emailPass && emailPass !== 'your_app_password') {
    console.log('✅ Email Service: Configured');
  } else {
    console.log('⚠️  Email Service: Not configured (setup Gmail App Password)');
  }
  
  console.log('\n🚀 Starting Vietnam Stock Tracker Server...\n');
}

async function startServer() {
  await checkServices();
  
  // Start the main server
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  server.on('close', (code) => {
    console.log(`\n📛 Server stopped with code ${code}`);
    process.exit(code);
  });
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGTERM');
  });
}

if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = { checkServices, startServer };
