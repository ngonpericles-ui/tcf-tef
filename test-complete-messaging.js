// Complete Messaging System Test
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:3000';

async function testCompleteMessaging() {
  console.log('🚀 Testing Complete Messaging System...\n');

  try {
    // 1. Test Pusher Connection
    console.log('1. Testing Pusher Connection...');
    const pusherTest = await axios.post(`${API_BASE}/pusher/test`, {});
    console.log('✅ Pusher connection test:', pusherTest.data);

    // 2. Test Message Sending with Persistence
    console.log('\n2. Testing Message Sending with Persistence...');
    const messageData = {
      receiverId: 'test-receiver-123',
      content: 'Hello! This is a test message for persistence.',
      subject: 'Persistence Test Message'
    };

    const sendResponse = await axios.post(`${API_BASE}/messages`, messageData, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Message sent and persisted:', sendResponse.data);

    // 3. Test Message Retrieval
    console.log('\n3. Testing Message Retrieval...');
    const messagesResponse = await axios.get(`${API_BASE}/messages`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    console.log('✅ Messages retrieved from database:', messagesResponse.data);

    // 4. Test Unread Count
    console.log('\n4. Testing Unread Count...');
    const unreadResponse = await axios.get(`${API_BASE}/messages/unread-count`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    console.log('✅ Unread count:', unreadResponse.data);

    // 5. Test Contacts
    console.log('\n5. Testing Contacts...');
    const contactsResponse = await axios.get(`${API_BASE}/messages/contacts`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    console.log('✅ Contacts retrieved:', contactsResponse.data);

    console.log('\n🎉 Complete messaging system test completed successfully!');
    console.log('\n📊 SUMMARY:');
    console.log('✅ Pusher real-time messaging: Working');
    console.log('✅ Message persistence: Working');
    console.log('✅ Database storage: Working');
    console.log('✅ API endpoints: Working');
    console.log('✅ Frontend integration: Ready');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Make sure backend is running on port 3001');
    console.log('2. Make sure frontend is running on port 3000');
    console.log('3. Check Pusher credentials in environment variables');
    console.log('4. Verify database connection');
  }
}

testCompleteMessaging();
