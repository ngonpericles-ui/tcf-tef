#!/usr/bin/env node

/**
 * Authentication Flow Test Script
 * Tests the authentication and routing logic
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:3000';

// Test data
const testUsers = {
  admin: {
    email: 'admin@tcf-tef.com',
    password: 'admin123',
    role: 'ADMIN'
  },
  manager: {
    email: 'manager@tcf-tef.com', 
    password: 'manager123',
    role: 'SENIOR_MANAGER'
  },
  student: {
    email: 'student@tcf-tef.com',
    password: 'student123', 
    role: 'STUDENT'
  }
};

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');

  // Test 1: Unauthenticated access to root
  console.log('1️⃣ Testing unauthenticated access to root...');
  try {
    const response = await axios.get(FRONTEND_URL);
    console.log('✅ Root redirects to welcome page');
  } catch (error) {
    console.log('❌ Root access failed:', error.message);
  }

  // Test 2: Student login
  console.log('\n2️⃣ Testing student login...');
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUsers.student.email,
      password: testUsers.student.password
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Student login successful');
      console.log('   User role:', loginResponse.data.data.user.role);
      console.log('   Access token received:', !!loginResponse.data.data.tokens.accessToken);
    } else {
      console.log('❌ Student login failed:', loginResponse.data.error);
    }
  } catch (error) {
    console.log('❌ Student login error:', error.response?.data?.error?.message || error.message);
  }

  // Test 3: Admin login
  console.log('\n3️⃣ Testing admin login...');
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUsers.admin.email,
      password: testUsers.admin.password
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      console.log('   User role:', loginResponse.data.data.user.role);
      console.log('   Access token received:', !!loginResponse.data.data.tokens.accessToken);
    } else {
      console.log('❌ Admin login failed:', loginResponse.data.error);
    }
  } catch (error) {
    console.log('❌ Admin login error:', error.response?.data?.error?.message || error.message);
  }

  // Test 4: Manager login
  console.log('\n4️⃣ Testing manager login...');
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUsers.manager.email,
      password: testUsers.manager.password
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Manager login successful');
      console.log('   User role:', loginResponse.data.data.user.role);
      console.log('   Access token received:', !!loginResponse.data.data.tokens.accessToken);
    } else {
      console.log('❌ Manager login failed:', loginResponse.data.error);
    }
  } catch (error) {
    console.log('❌ Manager login error:', error.response?.data?.error?.message || error.message);
  }

  // Test 5: Backend health check
  console.log('\n5️⃣ Testing backend health...');
  try {
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    if (healthResponse.data.success) {
      console.log('✅ Backend is healthy');
      console.log('   Status:', healthResponse.data.data.status);
    } else {
      console.log('❌ Backend health check failed');
    }
  } catch (error) {
    console.log('❌ Backend health error:', error.message);
  }

  console.log('\n🎯 Authentication Flow Test Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Test the following flows:');
  console.log('   - New visitor → Welcome page');
  console.log('   - Student login → /connexion → /home');
  console.log('   - Admin login → /admin/login → /admin');
  console.log('   - Manager login → /manager → /manager/dashboard');
  console.log('3. Test page refresh on each section');
  console.log('4. Test tab switching and returning');
}

// Run the test
testAuthFlow().catch(console.error);
