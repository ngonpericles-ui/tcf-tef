const axios = require('axios');

async function testAdminEndpoints() {
  try {
    console.log('Testing admin endpoints...');
    
    // First, login to get a fresh token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@tcftef.com',
      password: 'AdminTest123!'
    });

    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      const token = loginResponse.data.data.tokens.accessToken;
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Test dashboard
      console.log('\n--- Testing Dashboard ---');
      const dashboardResponse = await axios.get('http://localhost:3001/api/admin/dashboard', { headers });
      console.log('Dashboard Status:', dashboardResponse.status);
      console.log('Dashboard Data Keys:', Object.keys(dashboardResponse.data.data));
      console.log('Stats:', dashboardResponse.data.data.stats);
      
      // Test managers
      console.log('\n--- Testing Managers ---');
      const managersResponse = await axios.get('http://localhost:3001/api/admin/managers', { headers });
      console.log('Managers Status:', managersResponse.status);
      console.log('Managers Data:', managersResponse.data);
      
      // Test users (students)
      console.log('\n--- Testing Users/Students ---');
      const usersResponse = await axios.get('http://localhost:3001/api/admin/users', { headers });
      console.log('Users Status:', usersResponse.status);
      console.log('Users Data Keys:', Object.keys(usersResponse.data.data || {}));
      console.log('Users Count:', usersResponse.data.data?.users?.length || 0);
      
      // Test users with role filter
      console.log('\n--- Testing Students with Role Filter ---');
      const studentsResponse = await axios.get('http://localhost:3001/api/users?role=STUDENT', { headers });
      console.log('Students Status:', studentsResponse.status);
      console.log('Students Data:', studentsResponse.data);
      
    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

testAdminEndpoints();
