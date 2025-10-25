const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testLogin() {
  try {
    console.log('🔐 Testing login...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'student@aura.ca',
      password: 'Student@123'
    });

    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Login failed!');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    console.error('Full error:', error);
  }
}

testLogin();

