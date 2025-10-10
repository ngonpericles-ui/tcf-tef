const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@tcftef.com',
      password: 'AdminTest123!'
    });

    console.log('Login successful!');
    console.log('Status:', response.status);
    console.log('User:', JSON.stringify(response.data.data.user, null, 2));
    console.log('Tokens:', response.data.data.tokens ? 'Present' : 'Missing');
    
    const token = response.data.data.tokens.accessToken;
    console.log('Access Token:', token.substring(0, 50) + '...');
    
    // Test admin dashboard
    console.log('\nTesting admin dashboard...');
    const dashboardResponse = await axios.get('http://localhost:3001/api/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Dashboard Status:', dashboardResponse.status);
    console.log('Dashboard Data:', JSON.stringify(dashboardResponse.data, null, 2));
    
    // Test admin users
    console.log('\nTesting admin users...');
    const usersResponse = await axios.get('http://localhost:3001/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Users Status:', usersResponse.status);
    console.log('Users Count:', usersResponse.data.data?.users?.length || 0);
    console.log('First User:', JSON.stringify(usersResponse.data.data?.users?.[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data || error.message);
  }
}

testAdminLogin();
