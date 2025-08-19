require('dotenv').config();

const EmailService = require('./services/emailService');
const mongoose = require('mongoose');

async function testEmailService() {
  console.log('🧪 Testing Email Service...');
  
  try {
    // Initialize email service
    const emailService = new EmailService();
    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Email service initialized');
    
    // Test alert notification
    const testAlertData = {
      currentPrice: 105000,
      change: 5000,
      changePercent: 5.0,
      alertType: 'PRICE_ALERT',
      condition: 'GREATER_THAN',
      targetValue: 100000
    };
    
    console.log('📧 Sending test alert notification...');
    const result = await emailService.sendAlertNotification(
      'khanhpn.dev@gmail.com',
      'Khanh',
      'FPT',
      'Giá FPT đã vượt qua mức cảnh báo 100,000 VND',
      testAlertData
    );
    
    console.log('✅ Test email sent successfully:', result);
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
}

async function checkAlertData() {
  console.log('\n🔍 Checking alert data in database...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Alert = require('./models/Alert');
    const User = require('./models/User');
    
    // Find alerts for FPT
    const alerts = await Alert.find({ symbol: 'FPT' }).populate('user');
    console.log(`📋 Found ${alerts.length} alerts for FPT:`);
    
    alerts.forEach((alert, index) => {
      console.log(`\nAlert ${index + 1}:`);
      console.log(`- ID: ${alert._id}`);
      console.log(`- User: ${alert.user?.email || 'Unknown'}`);
      console.log(`- Type: ${alert.type}`);
      console.log(`- Condition: ${alert.condition}`);
      console.log(`- Target Value: ${alert.value}`);
      console.log(`- Is Active: ${alert.isActive}`);
      console.log(`- Triggered: ${alert.triggered}`);
      console.log(`- Created: ${alert.createdAt}`);
    });
    
    // Check user notification preferences
    const user = await User.findOne({ email: 'khanhpn.dev@gmail.com' });
    if (user) {
      console.log('\n👤 User notification preferences:');
      console.log(`- Email Notifications: ${user.emailNotifications}`);
      console.log(`- Alert Notifications: ${user.alertNotifications}`);
      console.log(`- Push Notifications: ${user.pushNotifications}`);
    } else {
      console.log('\n❌ User not found: khanhpn.dev@gmail.com');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

async function main() {
  await testEmailService();
  await checkAlertData();
  process.exit(0);
}

main().catch(console.error);
