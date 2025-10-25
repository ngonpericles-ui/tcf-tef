const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testCoursesAPI() {
  try {
    console.log('🔐 Logging in as student...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'student@aura.ca',
      password: 'Student@123'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful!');

    console.log('\n📚 Fetching courses...');
    const coursesResponse = await axios.get(`${API_BASE_URL}/content-management/courses`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('\n✅ Courses API Response:');
    console.log(JSON.stringify(coursesResponse.data, null, 2));

    if (coursesResponse.data.success && coursesResponse.data.data.content) {
      const courses = coursesResponse.data.data.content;
      console.log(`\n📊 Total courses: ${courses.length}`);
      
      console.log('\n📋 First course structure:');
      console.log(JSON.stringify(courses[0], null, 2));

      console.log('\n🔍 Checking subscriptionTier field:');
      courses.forEach((course, index) => {
        console.log(`Course ${index + 1}: subscriptionTier = "${course.subscriptionTier}"`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCoursesAPI();

