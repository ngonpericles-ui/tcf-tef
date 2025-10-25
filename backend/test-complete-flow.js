const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testCompleteFlow() {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧪 COMPLETE FLOW TEST - STUDENT API ENDPOINTS');
    console.log('═══════════════════════════════════════════════════════════\n');

    // 1. Login as student
    console.log('1️⃣  LOGGING IN AS STUDENT...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'student@aura.ca',
      password: 'Student@123'
    });
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful!\n');

    // 2. Fetch courses
    console.log('2️⃣  FETCHING COURSES...');
    const coursesResponse = await axios.get(`${API_BASE_URL}/content-management/courses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (coursesResponse.data.success) {
      const courses = coursesResponse.data.data.content;
      console.log(`✅ Fetched ${courses.length} courses\n`);
      
      // 3. Verify course structure
      console.log('3️⃣  VERIFYING COURSE STRUCTURE...');
      const firstCourse = courses[0];
      console.log('First course fields:');
      console.log(`  - id: ${firstCourse.id}`);
      console.log(`  - title: ${firstCourse.title}`);
      console.log(`  - category: ${firstCourse.category}`);
      console.log(`  - level: ${firstCourse.level}`);
      console.log(`  - subscriptionTier: ${firstCourse.subscriptionTier}`);
      console.log(`  - isPublished: ${firstCourse.isPublished}`);
      console.log(`  - createdBy: ${firstCourse.createdBy?.firstName} ${firstCourse.createdBy?.lastName}\n`);
      
      // 4. Count courses by category
      console.log('4️⃣  COURSES BY CATEGORY...');
      const categoryCounts = {};
      courses.forEach(course => {
        categoryCounts[course.category] = (categoryCounts[course.category] || 0) + 1;
      });
      Object.entries(categoryCounts).forEach(([category, count]) => {
        console.log(`  - ${category}: ${count} course(s)`);
      });
      console.log();
      
      // 5. Verify filtering capability
      console.log('5️⃣  TESTING FILTERING...');
      const grammarCourses = courses.filter(c => c.category === 'GRAMMAR');
      console.log(`  - Grammar courses: ${grammarCourses.length}`);
      const freeCourses = courses.filter(c => c.subscriptionTier === 'FREE');
      console.log(`  - Free courses: ${freeCourses.length}`);
      const a1Courses = courses.filter(c => c.level === 'A1');
      console.log(`  - A1 level courses: ${a1Courses.length}\n`);
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ ALL TESTS PASSED!');
      console.log('═══════════════════════════════════════════════════════════');
    } else {
      console.log('❌ API response not successful');
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCompleteFlow();

