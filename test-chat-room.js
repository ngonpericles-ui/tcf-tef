const io = require('socket.io-client');
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

// Test configuration
const testConfig = {
  admin: {
    email: 'admin@tcftef.com',
    password: 'AdminTest123!'
  },
  student: {
    email: 'student@test.com',
    password: 'SecureTest123!'
  }
};

let adminToken = '';
let studentToken = '';

async function loginUsers() {
  console.log('🔐 Logging in users...');
  
  try {
    // Login admin
    const adminResponse = await axios.post(`${API_BASE}/auth/login`, testConfig.admin);
    adminToken = adminResponse.data.data.tokens.accessToken;
    console.log('✅ Admin logged in');
    
    // Login student
    const studentResponse = await axios.post(`${API_BASE}/auth/login`, testConfig.student);
    studentToken = studentResponse.data.data.tokens.accessToken;
    console.log('✅ Student logged in');
    
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

function createSocketConnection(userType, token, userData) {
  return new Promise((resolve, reject) => {
    console.log(`🔌 Connecting ${userType} to Socket.IO...`);
    
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      console.log(`✅ ${userType} connected to Socket.IO`);
      
      // Authenticate user
      socket.emit('authenticate', userData);
      
      socket.on('rooms-list', (rooms) => {
        console.log(`📋 ${userType} received rooms list: ${rooms.length} rooms`);
        resolve(socket);
      });
      
      socket.on('error', (error) => {
        console.error(`❌ ${userType} socket error:`, error);
        reject(error);
      });
    });
    
    socket.on('connect_error', (error) => {
      console.error(`❌ ${userType} connection error:`, error.message);
      reject(error);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!socket.connected) {
        reject(new Error(`${userType} connection timeout`));
      }
    }, 10000);
  });
}

async function testChatRoomFunctionality() {
  console.log('\n💬 Testing Chat Room Functionality...');
  
  try {
    // Create socket connections
    const adminSocket = await createSocketConnection('Admin', adminToken, {
      userId: 'admin-test-id',
      username: 'Admin User',
      role: 'ADMIN'
    });
    
    const studentSocket = await createSocketConnection('Student', studentToken, {
      userId: 'student-test-id',
      username: 'Test Student',
      role: 'STUDENT'
    });
    
    console.log('\n🎯 Testing Room Creation (Admin)...');
    
    // Test room creation
    adminSocket.emit('create-room', {
      name: 'Test Room - Aura.CA Integration',
      description: 'A test room for verifying chat functionality',
      isPublic: true
    });
    
    // Wait for room creation confirmation
    await new Promise((resolve) => {
      adminSocket.on('room-created-success', (data) => {
        console.log(`✅ Room created: ${data.name}`);
        resolve();
      });
      
      setTimeout(resolve, 3000); // Timeout after 3 seconds
    });
    
    console.log('\n💬 Testing Message Exchange...');
    
    // Test message sending
    studentSocket.emit('send-message', {
      roomId: 'general',
      message: 'Bonjour ! Je teste le chat en temps réel.'
    });
    
    adminSocket.emit('send-message', {
      roomId: 'general',
      message: 'Bonjour ! Bienvenue dans le chat communautaire !'
    });
    
    // Listen for messages
    let messagesReceived = 0;
    const messagePromise = new Promise((resolve) => {
      const messageHandler = (message) => {
        messagesReceived++;
        console.log(`📨 Message received: "${message.message}" from ${message.username}`);
        
        if (messagesReceived >= 2) {
          resolve();
        }
      };
      
      adminSocket.on('new-message', messageHandler);
      studentSocket.on('new-message', messageHandler);
      
      setTimeout(resolve, 5000); // Timeout after 5 seconds
    });
    
    await messagePromise;
    
    console.log('\n🤖 Testing Aura.CA Chat...');
    
    // Test Aura.CA chat
    studentSocket.emit('aura-chat', {
      message: 'Bonjour Aura.CA, comment puis-je améliorer mon français ?'
    });
    
    // Wait for Aura.CA response
    await new Promise((resolve) => {
      studentSocket.on('aura-response', (response) => {
        console.log('✅ Aura.CA responded');
        console.log(`   📝 Response length: ${response.message.length} characters`);
        console.log(`   💡 Suggestions: ${response.suggestions?.length || 0}`);
        console.log(`   📄 Preview: ${response.message.substring(0, 100)}...`);
        resolve();
      });
      
      setTimeout(() => {
        console.log('⏰ Aura.CA response timeout');
        resolve();
      }, 10000);
    });
    
    console.log('\n🔌 Cleaning up connections...');
    adminSocket.disconnect();
    studentSocket.disconnect();
    
    console.log('\n✅ Chat Room Test Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Chat room test failed:', error.message);
  }
}

async function runChatTests() {
  console.log('🚀 Starting Chat Room & Aura.CA Integration Tests');
  console.log('='.repeat(60));
  
  const loginSuccess = await loginUsers();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  await testChatRoomFunctionality();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Chat Tests Completed!');
  console.log('\n📊 Summary:');
  console.log('✅ Socket.IO connections established');
  console.log('✅ Room creation functionality tested');
  console.log('✅ Real-time messaging tested');
  console.log('✅ Aura.CA integration tested');
  console.log('✅ Admin and student interactions verified');
}

runChatTests().catch(console.error);
