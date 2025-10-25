const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testFrontendAPICall() {
  try {
    console.log('🔐 Logging in as student...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'student@aura.ca',
      password: 'Student@123'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful!');

    // Test 1: Without token (like unauthenticated frontend)
    console.log('\n📚 Test 1: Fetching courses WITHOUT token...');
    try {
      const response1 = await axios.get(`${API_BASE_URL}/content-management/courses`);
      console.log('✅ Response:', response1.data.success ? 'SUCCESS' : 'FAILED');
      console.log('Courses:', response1.data.data?.content?.length || 0);
    } catch (error) {
      console.error('❌ Error:', error.response?.status, error.response?.data?.message);
    }

    // Test 2: With token
    console.log('\n📚 Test 2: Fetching courses WITH token...');
    try {
      const response2 = await axios.get(`${API_BASE_URL}/content-management/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Response:', response2.data.success ? 'SUCCESS' : 'FAILED');
      console.log('Courses:', response2.data.data?.content?.length || 0);
    } catch (error) {
      console.error('❌ Error:', error.response?.status, error.response?.data?.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFrontendAPICall();

