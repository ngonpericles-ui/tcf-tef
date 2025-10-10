#!/usr/bin/env node

/**
 * Test Improved Fallback Assessment
 * Tests the enhanced fallback algorithm with excellent performance data
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

console.log('🧪 Testing Improved Fallback Assessment...\n');

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

async function testExcellentPerformance(token) {
  console.log('\n🔍 Testing Excellent Performance (should get 95% confidence)...');
  
  try {
    const excellentData = {
      testLevel: 'B2',
      score: 95, // Excellent score - should trigger 95% confidence
      totalQuestions: 50,
      correctAnswers: 47,
      timeSpent: 45
    };

    console.log('📤 Sending excellent performance data:', JSON.stringify(excellentData, null, 2));

    const response = await axios.post(`${BACKEND_URL}/api/simulations/assess-level`, excellentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      const assessment = response.data.data.assessment;
      console.log('✅ Assessment successful!');
      console.log(`📊 Level: ${assessment.determinedLevel}`);
      console.log(`🎯 Confidence: ${(assessment.confidence * 100).toFixed(1)}%`);
      console.log(`📝 Method: ${assessment.detailedAnalysis.method}`);
      
      if (assessment.confidence >= 0.9) {
        console.log('🎉 HIGH CONFIDENCE ACHIEVED! (≥90%)');
      } else {
        console.log('⚠️ Confidence below target');
      }
      
      return assessment;
    } else {
      console.log('❌ Assessment failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Assessment error:', error.response?.data || error.message);
    return null;
  }
}

async function testGoodPerformance(token) {
  console.log('\n🔍 Testing Good Performance (should get 92% confidence)...');
  
  try {
    const goodData = {
      testLevel: 'B1',
      score: 85, // Good score - should trigger 92% confidence
      totalQuestions: 40,
      correctAnswers: 34,
      timeSpent: 50
    };

    const response = await axios.post(`${BACKEND_URL}/api/simulations/assess-level`, goodData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      const assessment = response.data.data.assessment;
      console.log('✅ Assessment successful!');
      console.log(`📊 Level: ${assessment.determinedLevel}`);
      console.log(`🎯 Confidence: ${(assessment.confidence * 100).toFixed(1)}%`);
      
      return assessment;
    } else {
      console.log('❌ Assessment failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Assessment error:', error.response?.data || error.message);
    return null;
  }
}

async function testMediumPerformance(token) {
  console.log('\n🔍 Testing Medium Performance (should get 88% confidence)...');
  
  try {
    const mediumData = {
      testLevel: 'A2',
      score: 75, // Medium score - should trigger 88% confidence
      totalQuestions: 30,
      correctAnswers: 22,
      timeSpent: 40
    };

    const response = await axios.post(`${BACKEND_URL}/api/simulations/assess-level`, mediumData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      const assessment = response.data.data.assessment;
      console.log('✅ Assessment successful!');
      console.log(`📊 Level: ${assessment.determinedLevel}`);
      console.log(`🎯 Confidence: ${(assessment.confidence * 100).toFixed(1)}%`);
      
      return assessment;
    } else {
      console.log('❌ Assessment failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Assessment error:', error.response?.data || error.message);
    return null;
  }
}

async function runImprovedFallbackTest() {
  // Test student login
  const token = await testStudentLogin();
  if (!token) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Test different performance levels
  const excellentAssessment = await testExcellentPerformance(token);
  const goodAssessment = await testGoodPerformance(token);
  const mediumAssessment = await testMediumPerformance(token);

  // Summary
  console.log('\n📊 Improved Fallback Test Results:');
  console.log('===================================');
  
  if (excellentAssessment) {
    console.log(`Excellent (95% score): ${excellentAssessment.determinedLevel} (${(excellentAssessment.confidence * 100).toFixed(1)}% confidence)`);
  }
  
  if (goodAssessment) {
    console.log(`Good (85% score): ${goodAssessment.determinedLevel} (${(goodAssessment.confidence * 100).toFixed(1)}% confidence)`);
  }
  
  if (mediumAssessment) {
    console.log(`Medium (75% score): ${mediumAssessment.determinedLevel} (${(mediumAssessment.confidence * 100).toFixed(1)}% confidence)`);
  }

  // Check if any assessment achieved high confidence
  const highConfidenceAchieved = [excellentAssessment, goodAssessment, mediumAssessment]
    .some(assessment => assessment && assessment.confidence >= 0.9);

  if (highConfidenceAchieved) {
    console.log('\n🎉 SUCCESS: High confidence algorithm is working! (≥90%)');
  } else {
    console.log('\n⚠️ ISSUE: No assessment achieved high confidence (≥90%)');
  }
}

// Run the test
runImprovedFallbackTest().catch(console.error);
