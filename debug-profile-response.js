const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Student credentials
const STUDENT_CREDENTIALS = {
  email: 'student@test.com',
  password: 'SecureTest123!'
};

let authToken = '';

// Helper function to make authenticated requests
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response;
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} failed:`, error.response?.data?.message || error.message);
    throw error;
  }
};

const testStudentLogin = async () => {
  console.log('🔐 Testing Student Login...');
  try {
    const response = await apiRequest('POST', '/auth/login', STUDENT_CREDENTIALS);

    // Extract token and user data from the correct structure
    authToken = response.data.data?.tokens?.accessToken ||
                response.data.tokens?.accessToken ||
                response.data.token ||
                response.data.accessToken;

    const user = response.data.data?.user || response.data.user;

    console.log('✅ Student login successful');
    console.log('📋 Full login response structure:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Student login failed');
    return false;
  }
};

const testGetProfile = async () => {
  console.log('\n👤 Testing Get Profile...');
  try {
    const response = await apiRequest('GET', '/users/profile');
    console.log('✅ Profile request successful');
    console.log('📋 Full profile response structure:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Try different ways to access the data
    console.log('\n🔍 Data access attempts:');
    console.log('response.data:', response.data ? 'exists' : 'null');
    console.log('response.data.data:', response.data.data ? 'exists' : 'null');
    console.log('response.data.user:', response.data.user ? 'exists' : 'null');
    
    if (response.data.data) {
      console.log('📝 Profile data from response.data.data:');
      console.log(`   Name: ${response.data.data.firstName} ${response.data.data.lastName}`);
      console.log(`   Email: ${response.data.data.email}`);
      console.log(`   Role: ${response.data.data.role}`);
    }
    
    if (response.data.user) {
      console.log('📝 Profile data from response.data.user:');
      console.log(`   Name: ${response.data.user.firstName} ${response.data.user.lastName}`);
      console.log(`   Email: ${response.data.user.email}`);
      console.log(`   Role: ${response.data.user.role}`);
    }
    
    if (!response.data.data && !response.data.user) {
      console.log('📝 Profile data from response.data directly:');
      console.log(`   Name: ${response.data.firstName} ${response.data.lastName}`);
      console.log(`   Email: ${response.data.email}`);
      console.log(`   Role: ${response.data.role}`);
    }
    
    return response.data;
  } catch (error) {
    console.log('❌ Failed to get profile');
    console.log('Error details:', error.response?.data || error.message);
    return null;
  }
};

const main = async () => {
  console.log('🚀 Starting Profile Response Debug');
  console.log('===================================');

  // Step 1: Login as student
  const loginSuccess = await testStudentLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  // Step 2: Test profile endpoint
  await testGetProfile();

  console.log('\n🎉 Profile Response Debug Completed!');
  console.log('===================================');
};

// Run the script
main().catch(console.error);
