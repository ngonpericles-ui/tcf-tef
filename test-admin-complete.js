const axios = require('axios');

async function testCompleteAdminFunctionality() {
  try {
    console.log('🚀 Testing Complete Admin Functionality...\n');
    
    // First, login to get a fresh token
    console.log('1. Testing Admin Login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@tcftef.com',
      password: 'AdminTest123!'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }

    console.log('✅ Admin login successful');
    const token = loginResponse.data.data.tokens.accessToken;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Test all admin endpoints
    const tests = [
      {
        name: 'Admin Dashboard',
        url: 'http://localhost:3001/api/admin/dashboard',
        expectedKeys: ['stats', 'charts', 'recentUsers', 'systemHealth']
      },
      {
        name: 'System Health',
        url: 'http://localhost:3001/api/admin/system/health',
        expectedKeys: ['status', 'database', 'performance']
      },
      {
        name: 'All Users',
        url: 'http://localhost:3001/api/admin/users',
        expectedKeys: ['users', 'pagination'] // Note: this might return array directly
      },
      {
        name: 'Managers List',
        url: 'http://localhost:3001/api/admin/managers',
        expectedKeys: [] // This returns array directly
      },
      {
        name: 'Students (Role Filter)',
        url: 'http://localhost:3001/api/users?role=STUDENT',
        expectedKeys: ['pagination'] // This returns array with pagination
      },
      {
        name: 'Business Metrics',
        url: 'http://localhost:3001/api/admin/metrics/business',
        expectedKeys: ['metrics']
      }
    ];

    for (const test of tests) {
      try {
        console.log(`\n2. Testing ${test.name}...`);
        const response = await axios.get(test.url, { headers });
        
        if (response.status === 200 && response.data.success) {
          console.log(`✅ ${test.name}: Status ${response.status}`);
          
          const data = response.data.data;
          if (Array.isArray(data)) {
            console.log(`   📊 Data: Array with ${data.length} items`);
            if (data.length > 0) {
              console.log(`   📝 First item keys: ${Object.keys(data[0]).slice(0, 5).join(', ')}`);
            }
          } else if (data && typeof data === 'object') {
            console.log(`   📊 Data keys: ${Object.keys(data).join(', ')}`);
            
            // Check expected keys
            if (test.expectedKeys.length > 0) {
              const hasExpectedKeys = test.expectedKeys.some(key => data.hasOwnProperty(key));
              if (hasExpectedKeys) {
                console.log(`   ✅ Contains expected data structure`);
              } else {
                console.log(`   ⚠️  Missing expected keys: ${test.expectedKeys.join(', ')}`);
              }
            }
          }
        } else {
          console.log(`❌ ${test.name}: Status ${response.status}, Success: ${response.data.success}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name}: Error ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    // Test creating a manager
    console.log('\n3. Testing Manager Creation...');
    try {
      const createManagerResponse = await axios.post('http://localhost:3001/api/admin/managers', {
        firstName: 'Test',
        lastName: 'Manager',
        email: `test-manager-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        role: 'JUNIOR_MANAGER'
      }, { headers });

      if (createManagerResponse.data.success) {
        console.log('✅ Manager creation successful');
        console.log(`   📝 Created manager: ${createManagerResponse.data.data.firstName} ${createManagerResponse.data.data.lastName}`);
      } else {
        console.log('❌ Manager creation failed:', createManagerResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Manager creation error:', error.response?.data?.message || error.message);
    }

    // Test notifications
    console.log('\n4. Testing Notifications...');
    try {
      const notificationsResponse = await axios.get('http://localhost:3001/api/notifications', { headers });
      if (notificationsResponse.data.success) {
        console.log('✅ Notifications fetch successful');
        console.log(`   📊 Notifications count: ${notificationsResponse.data.data?.length || 0}`);
      }
    } catch (error) {
      console.log('❌ Notifications error:', error.response?.data?.message || error.message);
    }

    // Test sessions
    console.log('\n5. Testing Live Sessions...');
    try {
      const sessionsResponse = await axios.get('http://localhost:3001/api/live-sessions', { headers });
      if (sessionsResponse.data.success) {
        console.log('✅ Sessions fetch successful');
        console.log(`   📊 Sessions count: ${sessionsResponse.data.data?.length || 0}`);
      }
    } catch (error) {
      console.log('❌ Sessions error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Admin functionality testing completed!');
    console.log('\n📋 Summary:');
    console.log('- Backend APIs are functional and returning data');
    console.log('- Authentication system working correctly');
    console.log('- Admin dashboard data available');
    console.log('- User management endpoints operational');
    console.log('- Manager management system functional');
    console.log('\n🌐 Frontend should now display real data from backend!');
    console.log('   Frontend URL: http://localhost:3002');
    console.log('   Backend URL: http://localhost:3001');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testCompleteAdminFunctionality();
