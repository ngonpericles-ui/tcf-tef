const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function publishCourses() {
  console.log('🚀 Publishing courses...');
  
  try {
    // Login as admin
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@tcftef.com',
      password: 'AdminTest123!'
    });

    if (!loginResponse.data.success) {
      throw new Error('Admin login failed');
    }

    const authToken = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Admin login successful');

    // Get all courses (admin can see unpublished courses)
    console.log('📚 Getting all courses...');
    const coursesResponse = await axios.get(`${API_BASE_URL}/courses`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        page: 1,
        limit: 50
      }
    });

    const courses = coursesResponse.data.data || [];
    console.log(`Found ${courses.length} courses`);

    // Publish each course
    for (const course of courses) {
      if (!course.isPublished) {
        console.log(`📝 Publishing course: ${course.title}`);
        
        try {
          await axios.put(`${API_BASE_URL}/courses/${course.id}`, {
            isPublished: true
          }, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          console.log(`✅ Published: ${course.title}`);
        } catch (error) {
          console.log(`❌ Failed to publish "${course.title}":`, error.response?.data || error.message);
        }
      } else {
        console.log(`✅ Already published: ${course.title}`);
      }
    }

    // Get all tests and publish them too
    console.log('📝 Getting all tests...');
    const testsResponse = await axios.get(`${API_BASE_URL}/tests`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        page: 1,
        limit: 50
      }
    });

    const tests = testsResponse.data.data || [];
    console.log(`Found ${tests.length} tests`);

    // Publish each test
    for (const test of tests) {
      if (test.status === 'DRAFT') {
        console.log(`📝 Publishing test: ${test.title}`);
        
        try {
          await axios.put(`${API_BASE_URL}/tests/${test.id}`, {
            status: 'PUBLISHED'
          }, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          console.log(`✅ Published: ${test.title}`);
        } catch (error) {
          console.log(`❌ Failed to publish "${test.title}":`, error.response?.data || error.message);
        }
      } else {
        console.log(`✅ Already published: ${test.title}`);
      }
    }

    console.log('🎉 Course and test publishing completed!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

publishCourses();
