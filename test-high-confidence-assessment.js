#!/usr/bin/env node

/**
 * Test High Confidence Level Assessment
 * Tests the improved AI confidence algorithm with excellent performance data
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

console.log('🧪 Testing High Confidence Level Assessment...\n');

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

async function testHighConfidenceAssessment(token) {
  console.log('\n🔍 Testing High Confidence Level Assessment...');
  
  try {
    // Test with excellent performance data that should trigger high confidence
    const excellentPerformanceData = {
      simulationId: 'test-simulation-excellent',
      testLevel: 'B2',
      score: 92, // Excellent score
      totalQuestions: 50,
      correctAnswers: 46, // 92% correct
      timeSpent: 45, // Good time management
      answers: [],
      sectionScores: {
        'Compréhension écrite': { score: 94, percentage: 94, correctAnswers: 19, totalQuestions: 20 },
        'Compréhension orale': { score: 90, percentage: 90, correctAnswers: 18, totalQuestions: 20 },
        'Expression écrite': { score: 92, percentage: 92, correctAnswers: 9, totalQuestions: 10 }
      }
    };

    const response = await axios.post(`${BACKEND_URL}/api/simulations/assess-level`, excellentPerformanceData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      const assessment = response.data.data.assessment;
      console.log('✅ High confidence assessment successful!');
      console.log(`📊 Determined Level: ${assessment.determinedLevel}`);
      console.log(`📈 Sub-level: ${assessment.subLevel}`);
      console.log(`🎯 Confidence: ${(assessment.confidence * 100).toFixed(1)}%`);
      console.log(`💪 Strengths: ${assessment.strengths.join(', ')}`);
      console.log(`📝 Weaknesses: ${assessment.weaknesses.join(', ')}`);
      console.log(`🎯 Recommendations: ${assessment.recommendations.join(', ')}`);
      console.log(`⏱️ Time to next level: ${assessment.estimatedTimeToNext}`);
      
      if (assessment.confidence >= 0.9) {
        console.log('🎉 HIGH CONFIDENCE ACHIEVED! (≥90%)');
      } else if (assessment.confidence >= 0.8) {
        console.log('✅ Good confidence achieved (≥80%)');
      } else {
        console.log('⚠️ Confidence still below target (<80%)');
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

async function testMediumConfidenceAssessment(token) {
  console.log('\n🔍 Testing Medium Performance Assessment...');
  
  try {
    // Test with medium performance data
    const mediumPerformanceData = {
      simulationId: 'test-simulation-medium',
      testLevel: 'B1',
      score: 75, // Good score
      totalQuestions: 40,
      correctAnswers: 30, // 75% correct
      timeSpent: 50,
      answers: [],
      sectionScores: {
        'Compréhension écrite': { score: 80, percentage: 80, correctAnswers: 12, totalQuestions: 15 },
        'Compréhension orale': { score: 70, percentage: 70, correctAnswers: 14, totalQuestions: 20 },
        'Expression écrite': { score: 75, percentage: 75, correctAnswers: 4, totalQuestions: 5 }
      }
    };

    const response = await axios.post(`${BACKEND_URL}/api/simulations/assess-level`, mediumPerformanceData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      const assessment = response.data.data.assessment;
      console.log('✅ Medium performance assessment successful!');
      console.log(`📊 Determined Level: ${assessment.determinedLevel}`);
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

async function runHighConfidenceTest() {
  // Test student login
  const token = await testStudentLogin();
  if (!token) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Test high confidence assessment
  const excellentAssessment = await testHighConfidenceAssessment(token);
  
  // Test medium confidence assessment
  const mediumAssessment = await testMediumConfidenceAssessment(token);

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  if (excellentAssessment) {
    console.log(`Excellent Performance: ${excellentAssessment.determinedLevel} (${(excellentAssessment.confidence * 100).toFixed(1)}% confidence)`);
  }
  
  if (mediumAssessment) {
    console.log(`Medium Performance: ${mediumAssessment.determinedLevel} (${(mediumAssessment.confidence * 100).toFixed(1)}% confidence)`);
  }

  if (excellentAssessment && excellentAssessment.confidence >= 0.9) {
    console.log('\n🎉 SUCCESS: High confidence algorithm is working! (≥90%)');
  } else if (excellentAssessment && excellentAssessment.confidence >= 0.8) {
    console.log('\n✅ GOOD: Confidence algorithm improved (≥80%)');
  } else {
    console.log('\n⚠️ NEEDS IMPROVEMENT: Confidence still below target');
  }
}

// Run the test
runHighConfidenceTest().catch(console.error);
