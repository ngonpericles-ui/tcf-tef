const axios = require('axios');

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

async function testMessagesUnreadCount() {
  try {
    console.log('🔐 Logging in as student...');
    
    // First, login to get a token
    const loginResponse = await apiClient.post('/auth/login', {
      email: 'student@aura.ca',
      password: 'Student@123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful!');
    console.log('Token:', token.substring(0, 50) + '...');
    
    // Set the token in the header
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Now test the unread-count endpoint
    console.log('\n📬 Testing /messages/unread-count endpoint...');
    
    try {
      const response = await apiClient.get('/messages/unread-count');
      console.log('✅ Success!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMessagesUnreadCount();

