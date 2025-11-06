#!/usr/bin/env node

const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const JWT_SECRET = 'tcf-tef-super-secret-jwt-key-2024-development';

// Test data
const testUser = {
  id: 'cmh0x78660000ut7hb07eeoot',
  email: 'admin@aura.ca',
  role: 'ADMIN',
  subscriptionTier: 'PRO'
};

// Create JWT token
function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      iss: 'tcf-tef-api',
      aud: 'tcf-tef-app'
    },
    JWT_SECRET
  );
}

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function addTest(name, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}: ${details}`);
  }
  results.tests.push({ name, passed, details });
}

async function testAPI() {
  console.log('🧪 Testing Messaging System API...\n');
  
  const token = createToken(testUser);
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // Test 1: Health check
    try {
      const response = await axios.get(`${API_BASE_URL}/messages/contacts`, { headers });
      addTest('API Authentication', response.status === 200 || response.data.success === false, 
        response.data.error?.message || 'Unexpected response');
    } catch (error) {
      addTest('API Authentication', false, error.response?.data?.message || error.message);
    }
    
    // Test 2: Get contacts
    try {
      const response = await axios.get(`${API_BASE_URL}/messages/contacts`, { headers });
      addTest('Get Contacts', response.status === 200, 
        response.data.error?.message || 'No contacts found (expected for empty database)');
    } catch (error) {
      addTest('Get Contacts', false, error.response?.data?.message || error.message);
    }
    
    // Test 3: Get unread count
    try {
      const response = await axios.get(`${API_BASE_URL}/messages/unread-count`, { headers });
      addTest('Get Unread Count', response.status === 200, 
        response.data.error?.message || 'Unread count retrieved');
    } catch (error) {
      addTest('Get Unread Count', false, error.response?.data?.message || error.message);
    }
    
    // Test 4: Get messages
    try {
      const response = await axios.get(`${API_BASE_URL}/messages`, { headers });
      addTest('Get Messages', response.status === 200, 
        response.data.error?.message || 'Messages retrieved');
    } catch (error) {
      addTest('Get Messages', false, error.response?.data?.message || error.message);
    }
    
    // Test 5: Send message (will fail without valid receiver)
    try {
      const response = await axios.post(`${API_BASE_URL}/messages`, {
        receiverId: 'test-receiver-id',
        content: 'Test message',
        type: 'text'
      }, { headers });
      addTest('Send Message', response.status === 200, 'Message sent successfully');
    } catch (error) {
      addTest('Send Message', error.response?.status === 404, 
        error.response?.data?.error?.message || 'Expected 404 for invalid receiver');
    }
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
  }
}

async function testSocketIO() {
  console.log('\n🔌 Testing Socket.IO Connection...\n');
  
  try {
    const { io } = require('socket.io-client');
    
    const socket = io('http://localhost:3001', {
      auth: {
        userId: testUser.id,
        userRole: testUser.role,
        userName: 'Test Admin'
      },
      transports: ['websocket', 'polling'],
      timeout: 5000
    });
    
    return new Promise((resolve) => {
      let connected = false;
      let authenticated = false;
      
      const timeout = setTimeout(() => {
        if (!connected) {
          addTest('Socket.IO Connection', false, 'Connection timeout');
          socket.disconnect();
          resolve();
        }
      }, 10000);
      
      socket.on('connect', () => {
        connected = true;
        addTest('Socket.IO Connection', true, 'Connected successfully');
        clearTimeout(timeout);
      });
      
      socket.on('connect_error', (error) => {
        addTest('Socket.IO Connection', false, error.message);
        clearTimeout(timeout);
        resolve();
      });
      
      socket.on('authenticated', () => {
        authenticated = true;
        addTest('Socket.IO Authentication', true, 'Authenticated successfully');
        socket.disconnect();
        resolve();
      });
      
      socket.on('auth_error', (error) => {
        addTest('Socket.IO Authentication', false, error.message);
        socket.disconnect();
        resolve();
      });
    });
    
  } catch (error) {
    addTest('Socket.IO Connection', false, error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Messaging System Tests\n');
  console.log('=' .repeat(50));
  
  await testAPI();
  await testSocketIO();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results:');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Messaging system is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the details above.');
  }
  
  return results;
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testAPI, testSocketIO };
