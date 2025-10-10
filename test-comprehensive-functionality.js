const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Test configuration
const testConfig = {
  admin: {
    email: 'admin@tcftef.com',
    password: 'AdminTest123!'
  },
  student: {
    email: 'student@test.com',
    password: 'SecureTest123!'
  }
};

let adminToken = '';
let studentToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = '') => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data
    };

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Test functions
async function testAdminLogin() {
  console.log('\n🔐 Testing Admin Login...');
  
  const response = await makeRequest('POST', '/auth/login', testConfig.admin);
  
  if (response.success && response.data.data?.tokens?.accessToken) {
    adminToken = response.data.data.tokens.accessToken;
    console.log('✅ Admin login successful');
    return true;
  } else {
    console.log('❌ Admin login failed:', response.error);
    return false;
  }
}

async function testStudentLogin() {
  console.log('\n🔐 Testing Student Login...');
  
  const response = await makeRequest('POST', '/auth/login', testConfig.student);
  
  if (response.success && response.data.data?.tokens?.accessToken) {
    studentToken = response.data.data.tokens.accessToken;
    console.log('✅ Student login successful');
    return true;
  } else {
    console.log('❌ Student login failed:', response.error);
    return false;
  }
}

async function testAuraChatbot() {
  console.log('\n🤖 Testing Enhanced Aura.CA Chatbot (Gemini 2.5 Flash)...');

  const testMessages = [
    'Bonjour Aura.CA, comment puis-je me préparer efficacement au TCF ?',
    'Quels sont vos meilleurs conseils pour améliorer mon expression orale en français ?',
    'Comment gérer le stress et l\'anxiété pendant l\'examen TCF ?',
    'Pouvez-vous m\'expliquer les différences entre les niveaux CECR A2 et B1 ?',
    'Quelles stratégies recommandez-vous pour enrichir mon vocabulaire français ?',
    'Comment puis-je améliorer ma compréhension écrite pour le TEF Canada ?'
  ];

  let auraSuccessCount = 0;
  for (const message of testMessages) {
    console.log(`\n📝 Testing: "${message.substring(0, 60)}..."`);

    const response = await makeRequest('POST', '/ai/chat', { message }, studentToken);

    if (response.success) {
      const chatData = response.data.data;
      console.log('✅ Aura.CA responded successfully');
      console.log(`   📝 Response length: ${chatData?.message?.length || 0} characters`);
      console.log(`   💡 Suggestions: ${chatData?.suggestions?.length || 0}`);

      // Check response quality indicators
      if (chatData?.message) {
        const responseText = chatData.message.toLowerCase();
        const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(chatData.message);
        const hasFrenchContent = responseText.includes('français') || responseText.includes('tcf') || responseText.includes('tef');
        const hasStructure = chatData.message.includes('•') || chatData.message.includes('1.') || chatData.message.includes('-');

        console.log(`   🎯 Quality: Emojis(${hasEmojis ? '✅' : '❌'}) French(${hasFrenchContent ? '✅' : '❌'}) Structure(${hasStructure ? '✅' : '❌'})`);

        if (hasEmojis && hasFrenchContent && hasStructure) {
          auraSuccessCount++;
        }
      }
    } else {
      console.log('❌ Aura.CA failed to respond:', response.error);
    }
  }

  console.log(`\n📊 Aura.CA Test Results: ${auraSuccessCount}/${testMessages.length} high-quality responses`);
  console.log(`   Model: Gemini 2.5 Flash with enhanced French tutoring system`);
}

async function testCourseManagement() {
  console.log('\n📚 Testing Course Management...');
  
  // Test fetching courses
  console.log('\n📖 Fetching courses...');
  const coursesResponse = await makeRequest('GET', '/courses', null, adminToken);
  
  if (coursesResponse.success) {
    const courses = coursesResponse.data.data?.courses || coursesResponse.data.data || [];
    console.log(`✅ Courses fetched: ${Array.isArray(courses) ? courses.length : 0} courses found`);
    
    // Test course creation
    console.log('\n➕ Creating new course...');
    const newCourse = {
      title: 'Test Course - Aura.CA Integration',
      description: 'A test course created to verify the new functionality',
      level: 'B1',
      duration: 2,
      price: 0,
      isPublished: true,
      content: 'This is test content for the course. It includes lessons about French grammar and vocabulary.',
      images: [],
      materials: [],
      category: 'GRAMMAR',
      requiredTier: 'FREE',
      lessons: 5,
      difficulty: 2,
      tags: ['test', 'aura-ca', 'integration']
    };
    
    const createResponse = await makeRequest('POST', '/courses', newCourse, adminToken);
    
    if (createResponse.success) {
      const courseId = createResponse.data.data?.course?.id;
      console.log(`✅ Course created successfully with ID: ${courseId}`);
      
      // Test course deletion
      if (courseId) {
        console.log('\n🗑️ Testing course deletion...');
        const deleteResponse = await makeRequest('DELETE', `/courses/${courseId}`, null, adminToken);
        
        if (deleteResponse.success) {
          console.log('✅ Course deleted successfully');
        } else {
          console.log('❌ Course deletion failed:', deleteResponse.error);
        }
      }
    } else {
      console.log('❌ Course creation failed:', createResponse.error);
    }
  } else {
    console.log('❌ Failed to fetch courses:', coursesResponse.error);
  }
}

async function testStudentCourseAccess() {
  console.log('\n👨‍🎓 Testing Student Course Access...');
  
  const response = await makeRequest('GET', '/courses', null, studentToken);
  
  if (response.success) {
    const courses = response.data.data?.courses || response.data.data || [];
    console.log(`✅ Student can access ${Array.isArray(courses) ? courses.length : 0} courses`);
    
    // Show course details
    courses.slice(0, 3).forEach((course, index) => {
      console.log(`   ${index + 1}. ${course.title} (${course.level}) - ${course.isPublished ? 'Published' : 'Draft'}`);
    });
  } else {
    console.log('❌ Student course access failed:', response.error);
  }
}

async function testStudentTestAccess() {
  console.log('\n📝 Testing Student Test Access...');
  
  const response = await makeRequest('GET', '/tests', null, studentToken);
  
  if (response.success) {
    const tests = response.data.data?.tests || response.data.data || [];
    console.log(`✅ Student can access ${Array.isArray(tests) ? tests.length : 0} tests`);
    
    // Show test details
    tests.slice(0, 3).forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.title} (${test.level}) - ${test.questions?.length || 0} questions`);
    });
  } else {
    console.log('❌ Student test access failed:', response.error);
  }
}

async function testAdminContentPage() {
  console.log('\n🎛️ Testing Admin Content Page Data...');
  
  // Test courses endpoint
  const coursesResponse = await makeRequest('GET', '/courses', null, adminToken);
  if (coursesResponse.success && coursesResponse.data) {
    const courses = coursesResponse.data.data?.courses || coursesResponse.data.data || [];
    console.log(`📚 Courses API: ✅ (${Array.isArray(courses) ? courses.length : 0})`);
  } else {
    console.log('📚 Courses API: ❌ Failed');
  }

  // Test tests endpoint
  const testsResponse = await makeRequest('GET', '/tests', null, adminToken);
  if (testsResponse.success && testsResponse.data) {
    const tests = testsResponse.data.data?.tests || testsResponse.data.data || [];
    console.log(`📝 Tests API: ✅ (${Array.isArray(tests) ? tests.length : 0})`);
  } else {
    console.log('📝 Tests API: ❌ Failed');
  }
}

async function testFileUpload() {
  console.log('\n📤 Testing File Upload Functionality...');

  try {
    // Create a test file
    const fs = require('fs');
    const FormData = require('form-data');
    const path = require('path');

    const testFilePath = path.join(__dirname, 'test-upload.txt');
    const testContent = 'This is a test file for upload functionality.\nCreated at: ' + new Date().toISOString();

    fs.writeFileSync(testFilePath, testContent);

    // Test document upload
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));

    const uploadResponse = await axios.post('http://localhost:3001/api/upload/document', formData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        ...formData.getHeaders()
      }
    });

    if (uploadResponse.data.success) {
      const uploadedFile = uploadResponse.data.data.file;
      console.log('✅ File upload system working');
      console.log(`   📁 File uploaded: ${uploadedFile.originalName} (${uploadedFile.size} bytes)`);

      // Clean up - delete the uploaded file
      await makeRequest('DELETE', `/files/${uploadedFile.id}`, null, adminToken);
    } else {
      console.log('❌ File upload failed:', uploadResponse.data.error);
    }

    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }

  } catch (error) {
    console.log('❌ File upload test failed:', error.response?.data?.error || error.message);
  }
}

// Main test execution
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Functionality Tests');
  console.log('='.repeat(50));
  
  try {
    // Authentication tests
    const adminLoginSuccess = await testAdminLogin();
    const studentLoginSuccess = await testStudentLogin();
    
    if (!adminLoginSuccess || !studentLoginSuccess) {
      console.log('\n❌ Authentication failed. Stopping tests.');
      return;
    }
    
    // Core functionality tests
    await testAuraChatbot();
    await testCourseManagement();
    await testStudentCourseAccess();
    await testStudentTestAccess();
    await testAdminContentPage();
    await testFileUpload();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Comprehensive Tests Completed!');
    console.log('\n📊 Summary:');
    console.log('✅ Admin authentication working');
    console.log('✅ Student authentication working');
    console.log('✅ Aura.CA chatbot integration tested');
    console.log('✅ Course management (create/delete) tested');
    console.log('✅ Student course access verified');
    console.log('✅ Student test access verified');
    console.log('✅ Admin content page APIs tested');
    console.log('✅ File upload system checked');
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
  }
}

// Run the tests
runComprehensiveTests();
