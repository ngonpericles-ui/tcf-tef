const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testAnalyticsAPI() {
  try {
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@aura.ca',
      password: 'Admin@123'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful!');

    console.log('\n📊 Fetching analytics...');
    const analyticsResponse = await axios.get(`${API_BASE_URL}/admin/analytics?timeframe=30d`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('\n✅ Analytics API Response:');
    console.log(JSON.stringify(analyticsResponse.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
}

testAnalyticsAPI();

