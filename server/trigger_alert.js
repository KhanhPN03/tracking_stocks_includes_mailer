require('dotenv').config();

const mongoose = require('mongoose');
const AlertService = require('./services/alertService');

async function triggerAlertManually() {
  console.log('🔧 Manually triggering alert check...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Create a minimal Socket.IO mock
    const mockIo = {
      to: () => ({
        emit: (event, data) => {
          console.log(`📡 Socket event: ${event}`, data);
        }
      })
    };
    
    // Initialize alert service
    const alertService = new AlertService(mockIo);
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Alert service initialized');
    
    // Manually trigger alert check
    console.log('🔔 Running alert check...');
    await alertService.checkAllAlerts();
    console.log('✅ Alert check completed');
    
    // Wait a bit to let any async operations complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

triggerAlertManually().catch(console.error);
