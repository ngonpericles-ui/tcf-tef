const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Test student credentials
const STUDENT_CREDENTIALS = {
  email: 'student@test.com',
  password: 'SecureTest123!'
};

let authToken = '';

// Helper function to make authenticated requests
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} failed:`, error.response?.data?.message || error.message);
    throw error;
  }
};

// Test functions
const testStudentLogin = async () => {
  console.log('\n🔐 Testing Student Login...');
  try {
    const response = await apiRequest('POST', '/auth/login', STUDENT_CREDENTIALS);

    // Extract token and user data from the correct structure
    authToken = response.data.data?.tokens?.accessToken ||
                response.data.tokens?.accessToken ||
                response.data.token ||
                response.data.accessToken;

    const user = response.data.data?.user || response.data.user;

    console.log('✅ Student login successful');
    console.log(`   User: ${user?.firstName || 'Unknown'} ${user?.lastName || 'Unknown'}`);
    console.log(`   Role: ${user?.role || 'Unknown'}`);
    console.log(`   Token: ${authToken ? 'Received' : 'Missing'}`);
    return true;
  } catch (error) {
    console.log('❌ Student login failed - trying to create student account...');
    console.log('Error:', error.response?.data || error.message);
    return false;
  }
};

const createStudentAccount = async () => {
  console.log('\n👤 Creating Student Account...');
  try {
    const studentData = {
      firstName: 'Test',
      lastName: 'Student',
      email: STUDENT_CREDENTIALS.email,
      password: STUDENT_CREDENTIALS.password,
      confirmPassword: STUDENT_CREDENTIALS.password,
      country: 'France',
      city: 'Paris',
      phone: '+33123456789',
      dateOfBirth: '1995-01-01',
      nativeLanguage: 'English',
      targetLevel: 'B2'
    };

    await apiRequest('POST', '/auth/register', studentData);
    console.log('✅ Student account created successfully');
    
    // Now login
    return await testStudentLogin();
  } catch (error) {
    console.log('❌ Failed to create student account');
    return false;
  }
};

const testGetCourses = async () => {
  console.log('\n📚 Testing Get Courses...');
  try {
    const response = await apiRequest('GET', '/courses');
    console.log(`✅ Retrieved ${response.data.length} courses`);
    response.data.forEach(course => {
      console.log(`   - ${course.title} (${course.level})`);
    });
  } catch (error) {
    console.log('❌ Failed to get courses');
  }
};

const testGetTests = async () => {
  console.log('\n📝 Testing Get Tests...');
  try {
    const response = await apiRequest('GET', '/tests');
    console.log(`✅ Retrieved ${response.data.length} tests`);
    response.data.forEach(test => {
      console.log(`   - ${test.title} (${test.level})`);
    });
  } catch (error) {
    console.log('❌ Failed to get tests');
  }
};

const testGetPosts = async () => {
  console.log('\n📰 Testing Get Posts...');
  try {
    const response = await apiRequest('GET', '/posts');
    console.log(`✅ Retrieved ${response.data.length} posts`);
    response.data.forEach(post => {
      console.log(`   - ${post.title || post.content.substring(0, 50)}...`);
    });
  } catch (error) {
    console.log('❌ Failed to get posts');
  }
};

const testGetNotifications = async () => {
  console.log('\n🔔 Testing Get Notifications...');
  try {
    const response = await apiRequest('GET', '/notifications');
    const notifications = response.data.data || response.data;
    const count = Array.isArray(notifications) ? notifications.length : 0;
    console.log(`✅ Retrieved ${count} notifications`);
    if (Array.isArray(notifications)) {
      notifications.forEach(notification => {
        console.log(`   - ${notification.title}: ${notification.message?.substring(0, 50) || 'No message'}...`);
      });
    }
    return notifications;
  } catch (error) {
    console.log('❌ Failed to get notifications');
    console.log('   Error:', error.response?.data?.message || error.message);
    return null;
  }
};

const testGetLiveSessions = async () => {
  console.log('\n🎥 Testing Get Live Sessions...');
  try {
    const response = await apiRequest('GET', '/live-sessions');
    console.log(`✅ Retrieved ${response.data.length} live sessions`);
    response.data.forEach(session => {
      console.log(`   - ${session.title} (${session.level})`);
    });
  } catch (error) {
    console.log('❌ Failed to get live sessions');
  }
};

const testGetProfile = async () => {
  console.log('\n👤 Testing Get Profile...');
  try {
    const response = await apiRequest('GET', '/users/profile');
    const user = response.data.data?.user || response.data.user || response.data;
    console.log('✅ Retrieved user profile');
    console.log(`   Name: ${user?.firstName || 'N/A'} ${user?.lastName || 'N/A'}`);
    console.log(`   Email: ${user?.email || 'N/A'}`);
    console.log(`   Role: ${user?.role || 'N/A'}`);
    console.log(`   Country: ${user?.country || 'N/A'}`);
    console.log(`   Phone: ${user?.phone || 'N/A'}`);
    console.log(`   Subscription: ${user?.subscriptionTier || 'N/A'}`);
    console.log(`   Courses Completed: ${user?.stats?.coursesCompleted || 0}`);
    console.log(`   Tests Completed: ${user?.stats?.testsCompleted || 0}`);
    return user;
  } catch (error) {
    console.log('❌ Failed to get profile');
    console.log('   Error:', error.response?.data?.message || error.message);
    return null;
  }
};

const testAIChatbot = async () => {
  console.log('\n🤖 Testing AI Chatbot...');
  try {
    const testMessages = [
      'Bonjour! Comment puis-je améliorer mon niveau de français?',
      'Quels sont les conseils pour réussir le TCF?',
      'Comment préparer la section expression orale?'
    ];

    for (const message of testMessages) {
      console.log(`   Sending: "${message}"`);
      try {
        const response = await apiRequest('POST', '/ai/chat', { message });
        const aiResponse = response.data.data || response.data;
        console.log(`   AI Response: ${aiResponse.response?.substring(0, 100) || 'No response'}...`);
      } catch (chatError) {
        console.log(`   ⚠️ Chat failed: ${chatError.response?.data?.message || chatError.message}`);
      }
    }
    console.log('✅ AI Chatbot test completed');
  } catch (error) {
    console.log('❌ Failed to test AI chatbot');
    console.log('   Error:', error.response?.data?.message || error.message);
  }
};

const testCreatePost = async () => {
  console.log('\n✍️ Testing Create Post...');
  try {
    const postData = {
      content: 'Test post from student - sharing my TCF preparation experience! 🎯',
      type: 'TEXT'
    };

    const response = await apiRequest('POST', '/posts', postData);
    console.log('✅ Post created successfully');
    console.log(`   Post ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.log('❌ Failed to create post');
    console.log('   Error:', error.response?.data?.message || error.message);
    return null;
  }
};

const testLikePost = async (postId) => {
  if (!postId) return;
  
  console.log('\n❤️ Testing Like Post...');
  try {
    await apiRequest('POST', `/posts/${postId}/like`);
    console.log('✅ Post liked successfully');
  } catch (error) {
    console.log('❌ Failed to like post');
  }
};

// Main test runner
const runStudentTests = async () => {
  console.log('🚀 Starting Student Operations Test Suite');
  console.log('==========================================');

  // Step 1: Login or create account
  let loginSuccess = await testStudentLogin();
  if (!loginSuccess) {
    loginSuccess = await createStudentAccount();
  }

  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  // Step 2: Test all student operations
  await testGetProfile();
  await testGetCourses();
  await testGetTests();
  await testGetPosts();
  await testGetNotifications();
  await testGetLiveSessions();

  // Step 3: Test AI Chatbot
  await testAIChatbot();

  // Step 4: Test post interactions
  const postId = await testCreatePost();
  await testLikePost(postId);

  console.log('\n🎉 Student Operations Test Suite Completed!');
  console.log('==========================================');
};

// Run the tests
console.log('Starting test script...');
runStudentTests().catch((error) => {
  console.error('Test script failed:', error);
  process.exit(1);
});
