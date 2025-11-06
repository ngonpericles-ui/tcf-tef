// Test Message Persistence
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testMessagePersistence() {
  console.log('🧪 Testing Message Persistence...\n');

  try {
    // 1. Test sending a message
    console.log('1. Testing message sending...');
    const messageData = {
      receiverId: 'test-receiver-id',
      content: 'Test message for persistence',
      subject: 'Persistence Test'
    };

    const response = await axios.post(`${API_BASE}/messages`, messageData, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Message sent successfully:', response.data);

    // 2. Test retrieving messages
    console.log('\n2. Testing message retrieval...');
    const messagesResponse = await axios.get(`${API_BASE}/messages`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    console.log('✅ Messages retrieved successfully:', messagesResponse.data);

    // 3. Test unread count
    console.log('\n3. Testing unread count...');
    const unreadResponse = await axios.get(`${API_BASE}/messages/unread-count`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    console.log('✅ Unread count retrieved:', unreadResponse.data);

    console.log('\n🎉 Message persistence test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testMessagePersistence();
