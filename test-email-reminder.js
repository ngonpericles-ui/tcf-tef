const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test credentials
const STUDENT_CREDENTIALS = {
  email: 'timaclaude@gmail.com',
  password: 'password123'
};

let studentToken = '';

async function login() {
  try {
    console.log('🔐 Logging in as student...');
    const response = await axios.post(`${BASE_URL}/auth/login`, STUDENT_CREDENTIALS);

    console.log('📝 Login response:', JSON.stringify(response.data, null, 2));

    if (response.data.success && response.data.data && response.data.data.tokens && response.data.data.tokens.accessToken) {
      console.log('✅ Student login successful');
      return response.data.data.tokens.accessToken;
    } else {
      console.log('❌ Student login failed:', response.data.error || 'No access token in response');
      return null;
    }
  } catch (error) {
    console.log('❌ Student login error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetLiveSessions() {
  try {
    console.log('\n📋 Testing GET /live-sessions...');
    const response = await axios.get(`${BASE_URL}/live-sessions`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Live sessions retrieved successfully');
      console.log(`📊 Found ${response.data.data.length} live sessions`);
      
      if (response.data.data.length > 0) {
        console.log('📝 Sample session:', JSON.stringify(response.data.data[0], null, 2));
        return response.data.data[0].id;
      }
    } else {
      console.log('❌ Failed to get live sessions:', response.data.error);
    }
    return null;
  } catch (error) {
    console.log('❌ Error getting live sessions:', error.response?.data || error.message);
    return null;
  }
}

async function testSetReminder(sessionId) {
  try {
    console.log('\n⏰ Testing POST /live-sessions/reminder...');
    const response = await axios.post(`${BASE_URL}/live-sessions/reminder`, {
      sessionId: sessionId,
      reminderTime: '5min'
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Reminder set successfully');
      console.log('📝 Response:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.log('❌ Failed to set reminder:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error setting reminder:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Email Reminder API Tests...');
  
  // Login as student
  studentToken = await login();
  
  if (!studentToken) {
    console.log('❌ Failed to login. Stopping tests.');
    return;
  }
  
  // Get live sessions
  const sessionId = await testGetLiveSessions();
  
  if (!sessionId) {
    console.log('❌ No live sessions found. Cannot test reminder functionality.');
    return;
  }
  
  // Test setting reminder
  await testSetReminder(sessionId);
  
  console.log('\n🎉 Email reminder tests completed!');
}

// Run the tests
runTests().catch(console.error);
