const axios = require('axios');

async function registerAndTestAlerts() {
  const baseURL = 'http://localhost:5000';
  
  console.log('🔐 Registering test user...');
  
  // Register a test user with unique timestamp
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  
  try {
    const registerResponse = await axios.post(`${baseURL}/api/auth/register`, {
      username: `testuser${timestamp}`,
      email: testEmail,
      password: 'Password123'  // Must have uppercase, lowercase, and number
    });
    
    if (registerResponse.data.success) {
      console.log('✅ Test user registered successfully');
    } else {
      console.log('❌ Registration failed:', registerResponse.data.message);
      return;
    }
  } catch (error) {
    console.log('❌ Registration failed:', error.response?.data?.message || error.message);
    console.log('📋 Errors:', error.response?.data?.errors);
    return;
  }
  
  // Login
  console.log('🔑 Logging in...');
  let authToken;
  try {
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: testEmail,
      password: 'Password123'
    });
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
  } catch (error) {
    console.log('❌ Login request failed:', error.response?.data?.message || error.message);
    return;
  }
  
  // Test alert creation
  console.log('\n🚨 Testing Alert Creation...');
  
  const apiClient = axios.create({
    baseURL,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  // Test the problematic alert creation that was giving 400 error
  try {
    const alertData = {
      symbol: 'VCB',
      type: 'price',
      condition: 'above',
      value: 85000,
      message: 'VCB price is above 85,000 VND'
    };
    
    console.log('📤 Sending alert data:', JSON.stringify(alertData, null, 2));
    
    const response = await apiClient.post('/api/alerts', alertData);
    
    if (response.data.success) {
      console.log('🎉 SUCCESS! Alert created without 400 error');
      console.log('📊 Response:', JSON.stringify(response.data, null, 2));
      
      // Test GET alerts
      console.log('\n📋 Testing GET alerts...');
      const getResponse = await apiClient.get('/api/alerts');
      console.log('✅ GET alerts successful, found', getResponse.data.data.alerts.length, 'alerts');
      
      // Clean up - delete the test alert
      const alertId = response.data.data._id;
      await apiClient.delete(`/api/alerts/${alertId}`);
      console.log('🧹 Test alert cleaned up');
      
      console.log('\n🎉 ALL TESTS PASSED! Alert API is working correctly.');
      
    } else {
      console.log('❌ Alert creation failed:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Alert creation failed with error:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
    console.log('Errors:', error.response?.data?.errors);
    
    if (error.response?.status === 400) {
      console.log('\n💡 This is the 400 Bad Request error you reported!');
      console.log('🔧 The validation fixes should have resolved this.');
      console.log('📋 Check the error details above to see what field validation failed.');
    }
  }
}

// Run the test
console.log('🚀 Starting Alert API Test...\n');
registerAndTestAlerts().catch(console.error);
