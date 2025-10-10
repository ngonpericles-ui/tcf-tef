const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test credentials
const ADMIN_CREDENTIALS = {
  email: 'mfondomerlin@gmail.com',
  password: 'password01'
};

const STUDENT_CREDENTIALS = {
  email: 'timaclaude@gmail.com',
  password: 'password123'
};

let adminToken = '';
let studentToken = '';

async function login(credentials, userType) {
  try {
    console.log(`\n🔐 Logging in as ${userType}...`);
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    
    if (response.data.success) {
      console.log(`✅ ${userType} login successful`);
      return response.data.data.accessToken;
    } else {
      console.log(`❌ ${userType} login failed:`, response.data.error);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${userType} login error:`, error.response?.data || error.message);
    return null;
  }
}

async function testGetReviewRequests() {
  try {
    console.log('\n📋 Testing GET /admin/review-requests...');
    const response = await axios.get(`${BASE_URL}/admin/review-requests`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Review requests retrieved successfully');
      console.log(`📊 Found ${response.data.data.length} review requests`);
      
      if (response.data.data.length > 0) {
        console.log('📝 Sample request:', JSON.stringify(response.data.data[0], null, 2));
      }
    } else {
      console.log('❌ Failed to get review requests:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Error getting review requests:', error.response?.data || error.message);
  }
}

async function testCreateAIFeedback() {
  try {
    console.log('\n🤖 Testing POST /ai/feedback (create AI feedback)...');
    const response = await axios.post(`${BASE_URL}/ai/feedback`, {
      submissionType: 'essay',
      submissionContent: 'This is a test essay for review. It contains some basic French content that needs to be evaluated by AI and potentially reviewed by a human expert.',
      simulationResultId: null
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ AI feedback created successfully');
      console.log('📝 Feedback ID:', response.data.data.id);
      return response.data.data.id;
    } else {
      console.log('❌ Failed to create AI feedback:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Error creating AI feedback:', error.response?.data || error.message);
    return null;
  }
}

async function testSubmitForReview(feedbackId) {
  try {
    console.log('\n📤 Testing POST /ai/feedback/:id/submit-for-review...');
    
    // First, get available tutors (admin users)
    const tutorsResponse = await axios.get(`${BASE_URL}/marketplace/tutors`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    if (!tutorsResponse.data.success || tutorsResponse.data.data.length === 0) {
      console.log('❌ No tutors available for review request');
      return null;
    }
    
    const selectedTutor = tutorsResponse.data.data[0];
    console.log('👨‍🏫 Selected tutor:', selectedTutor.firstName, selectedTutor.lastName);
    
    const response = await axios.post(`${BASE_URL}/ai/feedback/${feedbackId}/submit-for-review`, {
      selectedTutorId: selectedTutor.id,
      message: 'Please review my AI feedback. I think the score might be too low and would like a human expert opinion.'
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Review request submitted successfully');
      console.log('📝 Request ID:', response.data.data.reviewRequestId);
      return response.data.data.reviewRequestId;
    } else {
      console.log('❌ Failed to submit review request:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Error submitting review request:', error.response?.data || error.message);
    return null;
  }
}

async function testHandleReviewRequest(requestId) {
  try {
    console.log('\n✅ Testing POST /admin/review-requests/:id/action (accept)...');
    const response = await axios.post(`${BASE_URL}/admin/review-requests/${requestId}/action`, {
      action: 'accept',
      response: 'I will review your AI feedback and provide detailed human analysis.'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Review request accepted successfully');
      return true;
    } else {
      console.log('❌ Failed to accept review request:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error accepting review request:', error.response?.data || error.message);
    return false;
  }
}

async function testCompleteReviewRequest(requestId) {
  try {
    console.log('\n🎯 Testing POST /admin/review-requests/:id/action (complete)...');
    const response = await axios.post(`${BASE_URL}/admin/review-requests/${requestId}/action`, {
      action: 'complete',
      response: 'Review completed. Here is my detailed analysis.',
      humanFeedback: 'After careful review, I found that your essay demonstrates good understanding of French grammar and vocabulary. However, there are areas for improvement in sentence structure and coherence. The AI score was appropriate, but I would give you a slightly higher score for effort and creativity.',
      humanScore: 78
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Review request completed successfully');
      return true;
    } else {
      console.log('❌ Failed to complete review request:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error completing review request:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Review Request API Tests...');
  
  // Login as admin and student
  adminToken = await login(ADMIN_CREDENTIALS, 'Admin');
  studentToken = await login(STUDENT_CREDENTIALS, 'Student');
  
  if (!adminToken || !studentToken) {
    console.log('❌ Failed to login. Stopping tests.');
    return;
  }
  
  // Test the complete flow
  console.log('\n📋 Testing complete review request flow...');
  
  // 1. Create AI feedback as student
  const feedbackId = await testCreateAIFeedback();
  if (!feedbackId) return;
  
  // 2. Submit for review as student
  const requestId = await testSubmitForReview(feedbackId);
  if (!requestId) return;
  
  // 3. Get review requests as admin
  await testGetReviewRequests();
  
  // 4. Accept review request as admin
  const accepted = await testHandleReviewRequest(requestId);
  if (!accepted) return;
  
  // 5. Complete review request as admin
  await testCompleteReviewRequest(requestId);
  
  // 6. Get updated review requests
  await testGetReviewRequests();
  
  console.log('\n🎉 All tests completed!');
}

// Run the tests
runTests().catch(console.error);
