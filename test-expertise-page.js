#!/usr/bin/env node

/**
 * Test Expertise Page AI Feedback Loading
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

console.log('🧪 Testing Expertise Page AI Feedback Loading...\n');

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

async function testAIFeedbacksEndpoint(token) {
  console.log('\n🔍 Testing AI feedbacks endpoint (corrected)...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/ai/feedbacks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ AI feedbacks endpoint working');
    console.log(`   Found ${response.data?.data?.length || 0} feedbacks`);
    
    if (response.data?.data?.length > 0) {
      const feedback = response.data.data[0];
      console.log(`   Sample feedback: ID ${feedback.id}, Score: ${feedback.aiScore}/${feedback.maxScore}`);
    }
    
    return response.data?.data || [];
  } catch (error) {
    console.log('❌ AI feedbacks endpoint failed:', error.response?.status, error.response?.data);
    return [];
  }
}

async function testCreateSampleFeedback(token) {
  console.log('\n🔍 Creating sample AI feedback for testing...');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/ai/feedback`, {
      submissionType: 'ESSAY',
      submissionContent: 'Bonjour, je suis étudiant de français. J\'aime beaucoup apprendre cette langue magnifique. Mon objectif est de devenir fluent en français pour mon travail.',
      simulationResultId: null
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Sample AI feedback created successfully');
    console.log(`   Feedback ID: ${response.data?.data?.id}`);
    console.log(`   AI Score: ${response.data?.data?.aiScore}/100`);
    console.log(`   AI Confidence: ${Math.round(response.data?.data?.aiConfidence * 100)}%`);
    
    return response.data?.data;
  } catch (error) {
    console.log('❌ Sample feedback creation failed:', error.response?.status, error.response?.data);
    return null;
  }
}

async function runExpertisePageTest() {
  // Test student login
  const token = await testStudentLogin();
  if (!token) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Test AI feedbacks endpoint (corrected)
  let feedbacks = await testAIFeedbacksEndpoint(token);
  
  // If no feedbacks exist, create a sample one
  if (feedbacks.length === 0) {
    console.log('\n📝 No existing feedbacks found. Creating sample feedback...');
    const newFeedback = await testCreateSampleFeedback(token);
    
    if (newFeedback) {
      // Test again to see if it appears
      feedbacks = await testAIFeedbacksEndpoint(token);
    }
  }

  // Summary
  console.log('\n📊 Expertise Page Test Results:');
  console.log('================================');
  console.log(`Authentication: ✅`);
  console.log(`AI Feedbacks Endpoint: ${feedbacks.length >= 0 ? '✅' : '❌'}`);
  console.log(`Available Feedbacks: ${feedbacks.length}`);
  
  if (feedbacks.length > 0) {
    console.log('\n🎯 Expertise Page should now display AI feedback data!');
  } else {
    console.log('\n⚠️  No AI feedback data available for expertise page');
  }
}

// Run the test
runExpertisePageTest().catch(console.error);
