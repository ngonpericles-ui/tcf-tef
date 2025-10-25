const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testStudentCourses() {
  try {
    console.log('🔐 Logging in as student...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'student@aura.ca',
      password: 'Student@123'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful!');
    console.log('Token:', token.substring(0, 50) + '...');

    console.log('\n📚 Fetching courses with student token...');
    const coursesResponse = await axios.get(`${API_BASE_URL}/content-management/courses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Courses API Response:');
    console.log(JSON.stringify(coursesResponse.data, null, 2));
    
    if (coursesResponse.data.success) {
      console.log(`\n✅ Total courses: ${coursesResponse.data.data.content.length}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
}

testStudentCourses();

