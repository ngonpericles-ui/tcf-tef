const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Test student credentials
const TEST_EMAIL = 'student@aura.ca';
const TEST_PASSWORD = 'Student@123';

let authToken = null;
let studentUserId = null;

async function login() {
  try {
    console.log('🔐 Logging in as student...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (response.data.success && response.data.data?.tokens?.accessToken) {
      authToken = response.data.data.tokens.accessToken;
      studentUserId = response.data.data.user.id;
      console.log('✅ Login successful!');
      console.log(`   User ID: ${studentUserId}`);
      return authToken;
    } else {
      console.error('❌ Login failed:', response.data.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    process.exit(1);
  }
}

async function testEndpoint(name, method, endpoint, params = null) {
  try {
    console.log(`\n📍 Testing: ${name}`);
    console.log(`   ${method} ${endpoint}`);
    
    const config = {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    let response;
    if (method === 'GET') {
      response = await axios.get(`${API_BASE_URL}${endpoint}`, config);
    } else if (method === 'POST') {
      response = await axios.post(`${API_BASE_URL}${endpoint}`, params, config);
    }

    if (response.data.success) {
      console.log(`✅ Success`);
      if (response.data.data) {
        if (Array.isArray(response.data.data)) {
          console.log(`   Found ${response.data.data.length} items`);
        } else if (response.data.data.content) {
          console.log(`   Found ${response.data.data.content.length} items`);
        } else if (response.data.data.total) {
          console.log(`   Total: ${response.data.data.total}`);
        }
      }
      return true;
    } else {
      console.log(`⚠️  Response not successful: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Student API Endpoint Tests...\n');
  console.log('======================================================================');

  // Login first
  await login();

  console.log('\n======================================================================');
  console.log('📚 COURSE ENDPOINTS');
  console.log('======================================================================');

  // Test course endpoints
  await testEndpoint('Get all courses', 'GET', '/content-management/courses');
  await testEndpoint('Get courses by category (GRAMMAR)', 'GET', '/content-management/courses?category=GRAMMAR');
  await testEndpoint('Get courses by level (A1)', 'GET', '/content-management/courses?level=A1');
  await testEndpoint('Get courses with pagination', 'GET', '/content-management/courses?page=1&limit=5');
  await testEndpoint('Search courses', 'GET', '/content-management/courses?search=Grammaire');

  console.log('\n======================================================================');
  console.log('🧪 TEST ENDPOINTS');
  console.log('======================================================================');

  // Test test endpoints
  await testEndpoint('Get all tests', 'GET', '/tests');
  await testEndpoint('Get tests by category', 'GET', '/tests?category=GRAMMAR');
  await testEndpoint('Get tests by level', 'GET', '/tests?level=A1');

  console.log('\n======================================================================');
  console.log('📊 DASHBOARD & HOME ENDPOINTS');
  console.log('======================================================================');

  // Test dashboard endpoints
  await testEndpoint('Get dashboard data', 'GET', '/home/dashboard');
  await testEndpoint('Get user profile', 'GET', '/users/profile');

  console.log('\n======================================================================');
  console.log('📝 ENROLLMENT ENDPOINTS');
  console.log('======================================================================');

  // Test enrollment endpoints
  await testEndpoint('Get enrolled courses', 'GET', '/courses/enrolled');
  await testEndpoint('Get course progress', 'GET', '/courses/progress');

  console.log('\n======================================================================');
  console.log('🎤 LIVE SESSION ENDPOINTS');
  console.log('======================================================================');

  // Test live session endpoints
  await testEndpoint('Get live sessions', 'GET', '/live-sessions');
  await testEndpoint('Get upcoming sessions', 'GET', '/live-sessions?status=SCHEDULED');

  console.log('\n======================================================================');
  console.log('✅ Test completed!');
  console.log('======================================================================\n');
}

runTests().catch(console.error);

