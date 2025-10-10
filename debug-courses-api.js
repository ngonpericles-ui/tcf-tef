const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

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

async function debugCoursesAPI() {
  try {
    console.log('🔐 Logging in as admin...');
    
    // Login as admin
    const adminResponse = await axios.post(`${API_BASE}/auth/login`, testConfig.admin);
    const adminToken = adminResponse.data.data.tokens.accessToken;
    console.log('✅ Admin logged in successfully');
    
    console.log('\n📚 Testing Admin Courses API...');
    
    // Test admin courses endpoint
    const adminCoursesResponse = await axios.get(`${API_BASE}/courses`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('Admin Courses Response:');
    console.log('- Success:', adminCoursesResponse.data.success);
    console.log('- Status:', adminCoursesResponse.status);
    console.log('- Data structure:', Object.keys(adminCoursesResponse.data.data || {}));
    
    if (adminCoursesResponse.data.data) {
      const courses = adminCoursesResponse.data.data.courses || adminCoursesResponse.data.data;
      console.log('- Courses count:', Array.isArray(courses) ? courses.length : 'Not an array');
      
      if (Array.isArray(courses) && courses.length > 0) {
        console.log('- First 3 courses:');
        courses.slice(0, 3).forEach((course, index) => {
          console.log(`  ${index + 1}. ${course.title} (${course.level}) - ${course.isPublished ? 'Published' : 'Draft'}`);
        });
      }
    }
    
    console.log('\n👨‍🎓 Testing Student Courses API...');
    
    // Login as student
    const studentResponse = await axios.post(`${API_BASE}/auth/login`, testConfig.student);
    const studentToken = studentResponse.data.data.tokens.accessToken;
    console.log('✅ Student logged in successfully');
    
    // Test student courses endpoint
    const studentCoursesResponse = await axios.get(`${API_BASE}/courses`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`
      }
    });
    
    console.log('Student Courses Response:');
    console.log('- Success:', studentCoursesResponse.data.success);
    console.log('- Status:', studentCoursesResponse.status);
    console.log('- Data structure:', Object.keys(studentCoursesResponse.data.data || {}));
    
    if (studentCoursesResponse.data.data) {
      const courses = studentCoursesResponse.data.data.courses || studentCoursesResponse.data.data;
      console.log('- Courses count:', Array.isArray(courses) ? courses.length : 'Not an array');
      
      if (Array.isArray(courses) && courses.length > 0) {
        console.log('- First 3 courses:');
        courses.slice(0, 3).forEach((course, index) => {
          console.log(`  ${index + 1}. ${course.title} (${course.level}) - ${course.isPublished ? 'Published' : 'Draft'}`);
        });
      }
    }
    
    console.log('\n📝 Testing Tests API...');
    
    // Test tests endpoint
    const testsResponse = await axios.get(`${API_BASE}/tests`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('Tests Response:');
    console.log('- Success:', testsResponse.data.success);
    console.log('- Status:', testsResponse.status);
    console.log('- Data structure:', Object.keys(testsResponse.data.data || {}));
    
    if (testsResponse.data.data) {
      const tests = testsResponse.data.data.tests || testsResponse.data.data;
      console.log('- Tests count:', Array.isArray(tests) ? tests.length : 'Not an array');
      
      if (Array.isArray(tests) && tests.length > 0) {
        console.log('- All tests:');
        tests.forEach((test, index) => {
          console.log(`  ${index + 1}. ${test.title} (${test.level}) - ${test.isPublished ? 'Published' : 'Draft'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugCoursesAPI();
