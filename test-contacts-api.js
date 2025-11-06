const axios = require('axios');

async function testContactsAPI() {
  try {
    console.log('🧪 Testing Contacts API...');
    
    // Test 1: Check if backend is running
    console.log('\n1. Testing backend health...');
    try {
      const healthResponse = await axios.get('http://localhost:3001/api/health');
      console.log('✅ Backend is running');
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
    }
    
    // Test 2: Try to login and get token
    console.log('\n2. Testing admin login...');
    try {
      const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
        email: 'admin@aura.ca',
        password: 'admin123'
      });
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.accessToken;
        console.log('✅ Admin login successful');
        console.log('🔑 Token:', token.substring(0, 20) + '...');
        
        // Test 3: Try to fetch contacts with token
        console.log('\n3. Testing contacts fetch...');
        try {
          const contactsResponse = await axios.get('http://localhost:3001/api/messages/contacts', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (contactsResponse.data.success) {
            console.log('✅ Contacts fetched successfully');
            console.log('📞 Contacts count:', contactsResponse.data.data.length);
            console.log('👥 Sample contacts:', contactsResponse.data.data.slice(0, 3));
          } else {
            console.log('❌ Contacts fetch failed:', contactsResponse.data.message);
          }
        } catch (error) {
          console.log('❌ Contacts fetch error:', error.response?.data || error.message);
        }
      } else {
        console.log('❌ Admin login failed:', loginResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Login error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testContactsAPI();
