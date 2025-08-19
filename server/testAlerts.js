const axios = require('axios');

// Test script for Alert API
async function testAlertAPI() {
  console.log('🧪 Testing Alert API...\n');
  
  const baseURL = 'http://localhost:5000';
  let authToken = null;
  
  // Step 1: Login to get auth token
  console.log('1. Logging in to get auth token...');
  try {
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed');
      console.log('📝 Note: Make sure you have a test user with email: test@example.com, password: password123');
      console.log('   Or create one using the registration endpoint');
      return;
    }
  } catch (error) {
    console.log('❌ Login request failed:', error.response?.data?.message || error.message);
    console.log('📝 Note: Make sure the server is running and you have a test user');
    return;
  }
  
  // Configure axios with auth header
  const apiClient = axios.create({
    baseURL,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  // Step 2: Create a test alert
  console.log('\n2. Creating a test alert...');
  try {
    const alertData = {
      symbol: 'VCB',
      type: 'price',
      condition: 'above',
      value: 85000,
      message: 'VCB price is above 85,000 VND'
    };
    
    const createResponse = await apiClient.post('/api/alerts', alertData);
    
    if (createResponse.data.success) {
      console.log('✅ Alert created successfully');
      console.log('📊 Alert data:', JSON.stringify(createResponse.data.data, null, 2));
      
      const alertId = createResponse.data.data._id;
      
      // Step 3: Get all alerts
      console.log('\n3. Fetching all alerts...');
      const getResponse = await apiClient.get('/api/alerts');
      
      if (getResponse.data.success) {
        console.log('✅ Alerts fetched successfully');
        console.log(`📊 Found ${getResponse.data.data.alerts.length} alerts`);
        
        // Step 4: Update the alert
        console.log('\n4. Updating the alert...');
        const updateData = {
          symbol: 'VCB',
          type: 'price',
          condition: 'above',
          value: 90000,
          message: 'Updated: VCB price is above 90,000 VND'
        };
        
        const updateResponse = await apiClient.put(`/api/alerts/${alertId}`, updateData);
        
        if (updateResponse.data.success) {
          console.log('✅ Alert updated successfully');
          console.log('📊 Updated alert:', JSON.stringify(updateResponse.data.data, null, 2));
          
          // Step 5: Delete the alert
          console.log('\n5. Deleting the alert...');
          const deleteResponse = await apiClient.delete(`/api/alerts/${alertId}`);
          
          if (deleteResponse.data.success) {
            console.log('✅ Alert deleted successfully');
            console.log('🎉 All alert operations completed successfully!');
          } else {
            console.log('❌ Alert deletion failed:', deleteResponse.data.message);
          }
        } else {
          console.log('❌ Alert update failed:', updateResponse.data.message);
        }
      } else {
        console.log('❌ Failed to fetch alerts:', getResponse.data.message);
      }
    } else {
      console.log('❌ Alert creation failed:', createResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Alert operation failed:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message || error.message);
    console.log('Errors:', error.response?.data?.errors);
    
    if (error.response?.status === 400) {
      console.log('\n🔍 This was the issue you reported! The 400 Bad Request error.');
      console.log('   The fix should resolve this validation error.');
    }
  }
}

// Test different alert types
async function testDifferentAlertTypes() {
  console.log('\n🧪 Testing Different Alert Types...\n');
  
  const baseURL = 'http://localhost:5000';
  let authToken = null;
  
  // Login first
  try {
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    authToken = loginResponse.data.data.token;
  } catch (error) {
    console.log('❌ Login failed for type testing');
    return;
  }
  
  const apiClient = axios.create({
    baseURL,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  // Test different alert configurations
  const testAlerts = [
    {
      name: 'Price Above Alert',
      data: { symbol: 'VCB', type: 'price', condition: 'above', value: 85000 }
    },
    {
      name: 'Price Below Alert',
      data: { symbol: 'FPT', type: 'price', condition: 'below', value: 120000 }
    },
    {
      name: 'Percent Change Up Alert',
      data: { symbol: 'VNM', type: 'percent-change', condition: 'percent-change-up', value: 5 }
    },
    {
      name: 'Volume Spike Alert',
      data: { symbol: 'HPG', type: 'volume', condition: 'volume-spike' }
    },
    {
      name: 'Technical RSI Alert',
      data: { symbol: 'TCB', type: 'technical', condition: 'rsi-overbought' }
    }
  ];
  
  const createdAlerts = [];
  
  for (const test of testAlerts) {
    try {
      console.log(`Testing: ${test.name}...`);
      const response = await apiClient.post('/api/alerts', test.data);
      
      if (response.data.success) {
        console.log(`✅ ${test.name} created successfully`);
        createdAlerts.push(response.data.data._id);
      } else {
        console.log(`❌ ${test.name} failed:`, response.data.message);
      }
    } catch (error) {
      console.log(`❌ ${test.name} error:`, error.response?.data?.message || error.message);
    }
  }
  
  // Clean up - delete all created alerts
  console.log('\n🧹 Cleaning up test alerts...');
  for (const alertId of createdAlerts) {
    try {
      await apiClient.delete(`/api/alerts/${alertId}`);
      console.log(`✅ Deleted alert ${alertId}`);
    } catch (error) {
      console.log(`❌ Failed to delete alert ${alertId}`);
    }
  }
  
  console.log('✅ Test cleanup completed');
}

// Run the tests
if (require.main === module) {
  console.log('🚀 Starting Alert API Tests...\n');
  
  testAlertAPI()
    .then(() => testDifferentAlertTypes())
    .then(() => {
      console.log('\n🎉 All tests completed!');
      console.log('🔧 If any tests failed, check the server logs for more details.');
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error.message);
    });
}

module.exports = { testAlertAPI, testDifferentAlertTypes };
