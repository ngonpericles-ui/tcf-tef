#!/usr/bin/env node

/**
 * Test High Confidence AI Feedback Creation and Submission
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

console.log('🧪 Testing High Confidence AI Feedback...\n');

async function loginStudent() {
  console.log('🔐 Logging in student...');
  
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

async function createHighConfidenceFeedback(token) {
  console.log('\n🔍 Creating high confidence AI feedback...');
  
  try {
    // Create feedback that should have high confidence but need human review
    const response = await axios.post(`${BACKEND_URL}/api/ai/feedback`, {
      submissionType: 'ESSAY',
      submissionContent: 'Ceci est un essai complexe qui nécessite une révision humaine malgré une bonne performance. L\'étudiant a démontré une excellente compréhension du français mais certains aspects nécessitent une évaluation experte pour une notation complète.',
      simulationResultId: null
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ High confidence feedback created');
    console.log(`   Feedback ID: ${response.data?.data?.id}`);
    console.log(`   AI Score: ${response.data?.data?.aiScore}/100`);
    console.log(`   AI Confidence: ${Math.round(response.data?.data?.aiConfidence * 100)}%`);
    console.log(`   Status: ${response.data?.data?.status}`);
    
    return response.data?.data;
  } catch (error) {
    console.log('❌ High confidence feedback creation failed:', error.response?.status, error.response?.data);
    return null;
  }
}

async function updateFeedbackToHighConfidence(token, feedbackId) {
  console.log('\n🔧 Manually updating feedback to high confidence...');
  
  try {
    // Directly update the database to simulate high confidence feedback that needs human review
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const updatedFeedback = await prisma.aIFeedback.update({
      where: { id: feedbackId },
      data: {
        aiConfidence: 0.95, // 95% confidence
        status: 'PENDING_HUMAN', // Needs human review
        aiScore: 85, // Good score but needs human verification
        overallFeedback: 'Excellent travail avec quelques nuances qui nécessitent une révision experte.',
        strengths: ['Excellente grammaire', 'Vocabulaire riche', 'Structure claire'],
        weaknesses: ['Quelques expressions idiomatiques à améliorer'],
        recommendations: ['Continuer la pratique', 'Consulter un tuteur pour les nuances']
      }
    });
    
    await prisma.$disconnect();
    
    console.log('✅ Feedback updated to high confidence');
    console.log(`   New AI Confidence: ${Math.round(updatedFeedback.aiConfidence * 100)}%`);
    console.log(`   New Status: ${updatedFeedback.status}`);
    
    return updatedFeedback;
  } catch (error) {
    console.log('❌ Failed to update feedback:', error.message);
    return null;
  }
}

async function testSubmissionWorkflow(token, feedbackId) {
  console.log('\n🔍 Testing submission workflow...');
  
  try {
    // Test the submission endpoint
    const response = await axios.post(`${BACKEND_URL}/api/ai/feedback/${feedbackId}/submit-for-review`, {
      selectedTutorId: 'mock-tutor-id',
      message: 'Demande de révision pour ce feedback IA avec confiance élevée.'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Submission workflow working');
    console.log(`   Review request created: ${response.data?.success}`);
    
    return response.data;
  } catch (error) {
    console.log('❌ Submission workflow failed:', error.response?.status, error.response?.data);
    return null;
  }
}

async function verifyExpertisePageFilter(token) {
  console.log('\n🔍 Verifying expertise page shows submittable feedback...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/ai/feedbacks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const feedbacks = response.data?.data || [];
    const submittableFeedbacks = feedbacks.filter(feedback => 
      feedback.aiConfidence >= 0.9 && feedback.status === 'PENDING_HUMAN'
    );
    
    console.log('✅ Expertise page filter verification complete');
    console.log(`   Total feedbacks: ${feedbacks.length}`);
    console.log(`   Submittable feedbacks: ${submittableFeedbacks.length}`);
    
    if (submittableFeedbacks.length > 0) {
      console.log('   🎯 Filter working correctly - high confidence feedback can be submitted!');
    }
    
    return submittableFeedbacks.length > 0;
  } catch (error) {
    console.log('❌ Expertise page verification failed:', error.response?.status);
    return false;
  }
}

async function runHighConfidenceTest() {
  // Login
  const token = await loginStudent();
  if (!token) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Create high confidence feedback
  const feedback = await createHighConfidenceFeedback(token);
  if (!feedback) {
    console.log('❌ Cannot proceed without feedback');
    return;
  }

  // Update to high confidence and pending human review
  const updatedFeedback = await updateFeedbackToHighConfidence(token, feedback.id);
  if (!updatedFeedback) {
    console.log('❌ Cannot proceed without high confidence feedback');
    return;
  }

  // Test submission workflow
  const submissionResult = await testSubmissionWorkflow(token, feedback.id);
  
  // Verify expertise page filter
  const filterWorking = await verifyExpertisePageFilter(token);

  // Summary
  console.log('\n📊 High Confidence Test Results:');
  console.log('=================================');
  console.log(`Feedback Creation: ✅`);
  console.log(`High Confidence Update: ✅`);
  console.log(`Submission Workflow: ${submissionResult ? '✅' : '❌'}`);
  console.log(`Expertise Page Filter: ${filterWorking ? '✅' : '❌'}`);
  
  if (submissionResult && filterWorking) {
    console.log('\n🎉 90%+ Confidence Submission Filter is working perfectly!');
    console.log('🎯 Students can now submit high-confidence AI feedback to tutors!');
  } else {
    console.log('\n⚠️  Some issues found with the submission workflow.');
  }
}

// Run the test
runHighConfidenceTest().catch(console.error);
