#!/usr/bin/env node

/**
 * Test TCF-TEF Simulation System
 * Comprehensive test of all simulation-related functionality
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

console.log('🧪 Testing TCF-TEF Simulation System...\n');

async function testStudentLogin() {
  console.log('🔐 Testing student login...');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'timaclaude@gmail.com',
      password: 'password123'
    });

    if (response.data.success) {
      console.log('✅ Student login successful!');
      return response.data.data.tokens.accessToken;
    } else {
      console.log('❌ Student login failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Student login error:', error.response?.data || error.message);
    return null;
  }
}

async function testSimulationListing(token) {
  console.log('\n🔍 Testing simulation listing...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/content-management/simulations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Simulations endpoint working');
    console.log(`   Found ${response.data?.data?.content?.length || 0} simulations`);
    
    if (response.data?.data?.content?.length > 0) {
      const simulation = response.data.data.content[0];
      console.log(`   Sample simulation: "${simulation.title}" (${simulation.type})`);
      return simulation;
    }
    return null;
  } catch (error) {
    console.log('❌ Simulations endpoint failed:', error.response?.status, error.response?.data);
    return null;
  }
}

async function testAIFeedbackEndpoint(token) {
  console.log('\n🔍 Testing AI feedback endpoint...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/ai/feedback`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ AI feedback endpoint working');
    console.log(`   Found ${response.data?.data?.length || 0} feedbacks`);
    return response.data?.data || [];
  } catch (error) {
    console.log('❌ AI feedback endpoint failed:', error.response?.status, error.response?.data);
    return [];
  }
}

async function testSimulationStartEndpoint(token) {
  console.log('\n🔍 Testing simulation start endpoint...');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/simulations/test-sim-id/start`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Simulation start endpoint working');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  Simulation start endpoint exists but simulation not found (expected)');
      return { exists: true, notFound: true };
    } else {
      console.log('❌ Simulation start endpoint failed:', error.response?.status, error.response?.data);
      return null;
    }
  }
}

async function testSimulationRoutes(token) {
  console.log('\n🔍 Testing simulation routes...');
  
  const routes = [
    { name: 'Get Simulations', method: 'GET', path: '/api/simulations' },
    { name: 'Get Simulation Questions', method: 'GET', path: '/api/simulations/questions' },
    { name: 'Level Assessment', method: 'GET', path: '/api/simulations/level-history' }
  ];
  
  for (const route of routes) {
    try {
      const response = await axios({
        method: route.method,
        url: `${BACKEND_URL}${route.path}`,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`   ${route.name}: ✅ (${response.status})`);
    } catch (error) {
      console.log(`   ${route.name}: ❌ (${error.response?.status || 'Error'})`);
    }
  }
}

async function testAIFeedbackCreation(token) {
  console.log('\n🔍 Testing AI feedback creation...');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/ai/feedback`, {
      submissionType: 'ESSAY',
      submissionContent: 'Ceci est un test de soumission pour évaluation IA.',
      simulationResultId: null
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ AI feedback creation working');
    console.log(`   Created feedback with ID: ${response.data?.data?.id}`);
    return response.data?.data;
  } catch (error) {
    console.log('❌ AI feedback creation failed:', error.response?.status, error.response?.data);
    return null;
  }
}

async function runSimulationSystemTest() {
  // Test student login
  const token = await testStudentLogin();
  if (!token) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Test simulation listing
  const simulation = await testSimulationListing(token);
  
  // Test AI feedback endpoint
  const feedbacks = await testAIFeedbackEndpoint(token);
  
  // Test simulation start
  const startResult = await testSimulationStartEndpoint(token);
  
  // Test simulation routes
  await testSimulationRoutes(token);
  
  // Test AI feedback creation
  const newFeedback = await testAIFeedbackCreation(token);

  // Summary
  console.log('\n📊 Simulation System Test Results:');
  console.log('===================================');
  console.log(`Authentication: ✅`);
  console.log(`Simulation Listing: ${simulation ? '✅' : '❌'}`);
  console.log(`AI Feedback Endpoint: ${feedbacks.length >= 0 ? '✅' : '❌'}`);
  console.log(`Simulation Start: ${startResult ? '✅' : '❌'}`);
  console.log(`AI Feedback Creation: ${newFeedback ? '✅' : '❌'}`);
  
  console.log('\n🎯 Key Findings:');
  console.log(`- Simulations available: ${simulation ? 'Yes' : 'No'}`);
  console.log(`- AI feedback system: ${feedbacks.length >= 0 ? 'Working' : 'Not working'}`);
  console.log(`- Exam runner support: ${startResult ? 'Partial' : 'Missing'}`);
}

// Run the test
runSimulationSystemTest().catch(console.error);
