require('dotenv').config();

const mongoose = require('mongoose');

async function updateUserNotificationPreferences() {
  console.log('🔧 Updating user notification preferences...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = require('./models/User');
    
    // Update user notification preferences
    const result = await User.findOneAndUpdate(
      { email: 'khanhpn.dev@gmail.com' },
      {
        $set: {
          'preferences.notifications.email.priceAlerts': true,
          'preferences.notifications.email.weeklyReports': true,
          'preferences.notifications.email.marketNews': true,
          'preferences.notifications.email.systemUpdates': true,
          'preferences.notifications.push.priceAlerts': true,
          'preferences.notifications.push.marketNews': true
        }
      },
      { new: true }
    );
    
    if (result) {
      console.log('✅ Updated notification preferences for:', result.email);
      console.log('📧 Email notifications:');
      console.log('  - Price alerts:', result.preferences.notifications.email.priceAlerts);
      console.log('  - Weekly reports:', result.preferences.notifications.email.weeklyReports);
      console.log('  - Market news:', result.preferences.notifications.email.marketNews);
      console.log('  - System updates:', result.preferences.notifications.email.systemUpdates);
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Failed to update preferences:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

updateUserNotificationPreferences().catch(console.error);
