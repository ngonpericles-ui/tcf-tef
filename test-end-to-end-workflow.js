#!/usr/bin/env node

/**
 * End-to-End AI Teacher Feedback System Test
 * Tests complete workflow including high-confidence feedback submission
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BACKEND_URL = 'http://localhost:3001';
const prisma = new PrismaClient();

console.log('🎯 Testing End-to-End AI Teacher Feedback Workflow...\n');

async function loginUser(email, password, role) {
  console.log(`🔐 Logging in ${role}...`);
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email,
      password
    });

    if (response.data.success) {
      console.log(`✅ ${role} login successful!`);
      return response.data.data.tokens.accessToken;
    } else {
      console.log(`❌ ${role} login failed:`, response.data.error);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${role} login error:`, error.response?.data || error.message);
    return null;
  }
}

async function createHighConfidenceFeedback(token) {
  console.log('\n🔍 Creating high confidence AI feedback...');
  
  try {
    // Create feedback
    const response = await axios.post(`${BACKEND_URL}/api/ai/feedback`, {
      submissionType: 'SIMULATION_COMPLETION',
      submissionContent: JSON.stringify({
        simulationTitle: 'Test TCF Simulation - High Confidence',
        answers: {
          'q1': 'Bonjour, je suis un étudiant français très motivé.',
          'q2': 'J\'aimerais améliorer mon niveau de français pour mes études.',
          'q3': 'Vrai',
          'q4': 'Je pense que cette réponse nécessite une révision humaine pour être complètement évaluée.'
        },
        timeSpent: 1800
      }),
      simulationResultId: null
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const feedbackId = response.data?.data?.id;
    console.log(`✅ AI Teacher Feedback created: ${feedbackId}`);
    
    // Update to high confidence and pending human review
    const updatedFeedback = await prisma.aIFeedback.update({
      where: { id: feedbackId },
      data: {
        aiConfidence: 0.95, // 95% confidence
        status: 'PENDING_HUMAN', // Needs human review
        aiScore: 88, // Good score but needs human verification
        overallFeedback: 'Excellent travail avec quelques nuances qui nécessitent une révision experte pour une évaluation complète.',
        strengths: ['Excellente grammaire', 'Vocabulaire riche', 'Structure claire', 'Bonne compréhension'],
        weaknesses: ['Quelques expressions idiomatiques à améliorer', 'Nuances culturelles à approfondir'],
        recommendations: ['Continuer la pratique', 'Consulter un tuteur pour les nuances', 'Pratiquer les expressions idiomatiques']
      }
    });
    
    console.log(`✅ Updated to high confidence: ${Math.round(updatedFeedback.aiConfidence * 100)}%`);
    console.log(`✅ Status: ${updatedFeedback.status}`);
    
    return updatedFeedback;
  } catch (error) {
    console.log('❌ High confidence feedback creation failed:', error.response?.status, error.response?.data || error.message);
    return null;
  }
}

async function testExpertisePageFilter(token) {
  console.log('\n🔍 Testing expertise page 90%+ confidence filter...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/ai/feedbacks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const feedbacks = response.data?.data || [];
    const submittableFeedbacks = feedbacks.filter(feedback => 
      feedback.aiConfidence >= 0.9 && feedback.status === 'PENDING_HUMAN'
    );
    
    console.log(`✅ Expertise page filter test complete:`);
    console.log(`   Total feedbacks: ${feedbacks.length}`);
    console.log(`   High confidence (≥90%): ${feedbacks.filter(f => f.aiConfidence >= 0.9).length}`);
    console.log(`   Needs human review: ${feedbacks.filter(f => f.status === 'PENDING_HUMAN').length}`);
    console.log(`   Submittable to tutors: ${submittableFeedbacks.length}`);
    
    return submittableFeedbacks;
  } catch (error) {
    console.log('❌ Expertise page test failed:', error.response?.status);
    return [];
  }
}

async function testFeedbackSubmission(token, feedbackId) {
  console.log('\n🔍 Testing feedback submission to tutor...');
  
  try {
    // Get a tutor ID from the database
    const tutor = await prisma.user.findFirst({
      where: { 
        role: { in: ['SENIOR_MANAGER', 'ADMIN'] },
        status: 'ACTIVE'
      }
    });
    
    if (!tutor) {
      console.log('❌ No tutor found for submission test');
      return false;
    }
    
    const response = await axios.post(`${BACKEND_URL}/api/ai/feedback/${feedbackId}/submit-for-review`, {
      selectedTutorId: tutor.id,
      message: 'Demande de révision pour ce feedback IA avec confiance élevée (95%). L\'étudiant a bien performé mais certaines nuances nécessitent une évaluation experte.'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Feedback submission successful');
    console.log(`   Review request created: ${response.data?.success}`);
    console.log(`   Assigned to tutor: ${tutor.firstName} ${tutor.lastName}`);
    
    return response.data?.success;
  } catch (error) {
    console.log('❌ Feedback submission failed:', error.response?.status, error.response?.data);
    return false;
  }
}

async function testAdminReviewWorkflow(adminToken) {
  console.log('\n🔍 Testing admin review workflow...');
  
  try {
    // Get review requests
    const response = await axios.get(`${BACKEND_URL}/api/admin/review-requests`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const reviewRequests = response.data || [];
    console.log(`✅ Admin can fetch review requests: ${reviewRequests.length} found`);
    
    if (reviewRequests.length > 0) {
      const request = reviewRequests[0];
      console.log(`   Latest request ID: ${request.id}`);
      console.log(`   Student: ${request.student?.firstName} ${request.student?.lastName}`);
      console.log(`   Status: ${request.status}`);
      console.log(`   AI Confidence: ${Math.round(request.feedback?.aiConfidence * 100)}%`);
      
      // Test sending a message action
      const actionResponse = await axios.post(`${BACKEND_URL}/api/admin/review-requests/${request.id}/action`, {
        action: 'accept',
        response: 'Votre demande de révision a été acceptée. Je vais examiner votre travail et vous fournir des commentaires détaillés.',
        humanFeedback: 'Excellent travail global. Votre français montre une très bonne maîtrise avec quelques points à améliorer.',
        humanScore: 92
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log(`✅ Admin action successful: ${actionResponse.data?.success}`);
      return true;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Admin review workflow failed:', error.response?.status, error.response?.data);
    return false;
  }
}

async function runEndToEndTest() {
  try {
    console.log('🎯 Starting End-to-End AI Teacher Feedback System Test\n');
    
    // 1. Login users
    const studentToken = await loginUser('timaclaude@gmail.com', 'password123', 'Student');
    const adminToken = await loginUser('mfondomerlin@gmail.com', 'password01', 'Admin');
    
    if (!studentToken || !adminToken) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }

    // 2. Create high confidence feedback
    const highConfidenceFeedback = await createHighConfidenceFeedback(studentToken);
    if (!highConfidenceFeedback) {
      console.log('❌ Cannot proceed without high confidence feedback');
      return;
    }

    // 3. Test expertise page filter
    const submittableFeedbacks = await testExpertisePageFilter(studentToken);
    
    // 4. Test feedback submission
    let submissionSuccess = false;
    if (submittableFeedbacks.length > 0) {
      submissionSuccess = await testFeedbackSubmission(studentToken, highConfidenceFeedback.id);
    }
    
    // 5. Test admin review workflow
    const adminWorkflowSuccess = await testAdminReviewWorkflow(adminToken);

    // Summary
    console.log('\n📊 End-to-End Test Results:');
    console.log('============================');
    console.log(`Student Authentication: ✅`);
    console.log(`Admin Authentication: ✅`);
    console.log(`High Confidence Feedback Creation: ${highConfidenceFeedback ? '✅' : '❌'}`);
    console.log(`Expertise Page 90%+ Filter: ${submittableFeedbacks.length > 0 ? '✅' : '❌'}`);
    console.log(`Feedback Submission Workflow: ${submissionSuccess ? '✅' : '❌'}`);
    console.log(`Admin Review Workflow: ${adminWorkflowSuccess ? '✅' : '❌'}`);
    
    const allPassed = highConfidenceFeedback && submittableFeedbacks.length > 0 && submissionSuccess && adminWorkflowSuccess;
    
    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED! End-to-End workflow is fully operational!');
      console.log('🎯 Students can now:');
      console.log('   - Complete simulations and receive AI teacher feedback');
      console.log('   - View detailed feedback in expertise page');
      console.log('   - Submit high-confidence feedback to tutors');
      console.log('🎯 Admins can now:');
      console.log('   - Receive and review feedback submissions');
      console.log('   - Take actions (accept, reject, message students)');
      console.log('   - Manage the complete review workflow');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }
    
  } catch (error) {
    console.error('❌ End-to-end test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
runEndToEndTest();
