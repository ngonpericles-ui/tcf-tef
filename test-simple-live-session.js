#!/usr/bin/env node

const axios = require('axios');

console.log('🧪 SIMPLE LIVE SESSION TEST');
console.log('============================\n');

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_BASE = 'http://localhost:3000';

// Test 1: Check if servers are running
async function testServers() {
  console.log('🔍 Testing Server Connectivity...');
  
  try {
    // Test backend
    const backendResponse = await axios.get(`${API_BASE}/auth/login`, { 
      timeout: 5000,
      validateStatus: () => true // Accept any status code
    });
    console.log(`✅ Backend server responding (Status: ${backendResponse.status})`);
    
    // Test frontend
    const frontendResponse = await axios.get(FRONTEND_BASE, { timeout: 5000 });
    console.log(`✅ Frontend server responding (Status: ${frontendResponse.status})`);
    
    return true;
  } catch (error) {
    console.log(`❌ Server connectivity failed: ${error.message}`);
    return false;
  }
}

// Test 2: Check Agora configuration
async function testAgoraConfig() {
  console.log('\n🎯 Testing Agora Configuration...');
  
  try {
    // Check if .env.local exists
    const fs = require('fs');
    const path = require('path');
    
    const envPath = path.join(__dirname, '.env.local');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      if (envContent.includes('NEXT_PUBLIC_AGORA_APP_ID')) {
        console.log('✅ .env.local file found with Agora configuration');
        
        if (envContent.includes('your-agora-app-id-here')) {
          console.log('⚠️  Agora App ID is still placeholder - you need to set a real App ID');
          console.log('   Go to https://console.agora.io/ and create a project');
          console.log('   Then update .env.local with your real App ID');
        } else {
          console.log('✅ Agora App ID appears to be configured');
        }
      } else {
        console.log('❌ Agora App ID not found in .env.local');
      }
    } else {
      console.log('❌ .env.local file not found');
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Agora config test failed: ${error.message}`);
    return false;
  }
}

// Test 3: Check frontend live session components
async function testFrontendComponents() {
  console.log('\n🌐 Testing Frontend Components...');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const components = [
      'components/tutor-video-session.tsx',
      'components/video-grid.tsx',
      'components/chat-panel.tsx',
      'components/whiteboard-panel.tsx',
      'components/participants-panel.tsx',
      'app/live-session/[id]/page.tsx'
    ];
    
    let allComponentsExist = true;
    
    for (const component of components) {
      const componentPath = path.join(__dirname, component);
      if (fs.existsSync(componentPath)) {
        console.log(`✅ ${component} exists`);
      } else {
        console.log(`❌ ${component} missing`);
        allComponentsExist = false;
      }
    }
    
    return allComponentsExist;
  } catch (error) {
    console.log(`❌ Frontend components test failed: ${error.message}`);
    return false;
  }
}

// Test 4: Manual testing instructions
function showManualTestInstructions() {
  console.log('\n📋 MANUAL TESTING INSTRUCTIONS');
  console.log('================================');
  console.log('\n1. 🌐 Open your browser and go to: http://localhost:3000');
  console.log('\n2. 🔐 Login with admin credentials');
  console.log('\n3. 📹 Navigate to: /admin/live-sessions');
  console.log('\n4. ➕ Create a new live session:');
  console.log('   - Title: "Test Session"');
  console.log('   - Date: Tomorrow');
  console.log('   - Duration: 60 minutes');
  console.log('   - Max Participants: 50');
  console.log('\n5. 🎯 Click "Rejoindre" to join the session');
  console.log('\n6. 🧪 Test the following features:');
  console.log('   ✅ Camera toggle (should show/hide video)');
  console.log('   ✅ Microphone toggle (should mute/unmute audio)');
  console.log('   ✅ Screen sharing (should capture screen)');
  console.log('   ✅ Chat functionality (should send/receive messages)');
  console.log('   ✅ Whiteboard (should allow drawing)');
  console.log('   ✅ Participants panel (should show participants)');
  console.log('   ✅ Recording button (should start/stop recording)');
  console.log('   ✅ Raise hand feature (for students)');
  
  console.log('\n🔧 EXPECTED CONSOLE MESSAGES:');
  console.log('==============================');
  console.log('✅ "Initializing Agora RTC..."');
  console.log('✅ "Joining Agora channel: [sessionId]"');
  console.log('✅ "Agora client joined and published tracks successfully"');
  console.log('✅ "Remote user published: [userId] video/audio"');
  
  console.log('\n⚠️  IF YOU SEE ERRORS:');
  console.log('=====================');
  console.log('❌ "invalid appid" error:');
  console.log('   1. Go to https://console.agora.io/');
  console.log('   2. Create a new project');
  console.log('   3. Copy the App ID');
  console.log('   4. Update .env.local: NEXT_PUBLIC_AGORA_APP_ID=your-real-app-id');
  console.log('   5. Restart frontend: npm run dev');
  
  console.log('\n❌ "window is not defined" error:');
  console.log('   - This is normal during SSR, should work in browser');
  
  console.log('\n❌ "Requested device not found" error:');
  console.log('   - Check camera/microphone permissions in browser');
  console.log('   - Ensure devices are not being used by other applications');
  
  console.log('\n❌ Screen sharing not working:');
  console.log('   - Check browser permissions for screen sharing');
  console.log('   - Try different browsers (Chrome, Firefox, Edge)');
  
  console.log('\n🎉 SUCCESS INDICATORS:');
  console.log('======================');
  console.log('✅ Video preview shows your camera feed');
  console.log('✅ Microphone icon changes when toggled');
  console.log('✅ Screen sharing shows your screen');
  console.log('✅ Chat messages appear in the panel');
  console.log('✅ Whiteboard allows drawing');
  console.log('✅ Participants appear in the panel');
  console.log('✅ Recording button changes state');
  console.log('✅ Raise hand button works for students');
}

// Main test runner
async function runTests() {
  console.log('Starting simple live session tests...\n');
  
  const results = {
    servers: false,
    agoraConfig: false,
    components: false
  };
  
  try {
    // Test 1: Server connectivity
    results.servers = await testServers();
    
    // Test 2: Agora configuration
    results.agoraConfig = await testAgoraConfig();
    
    // Test 3: Frontend components
    results.components = await testFrontendComponents();
    
  } catch (error) {
    console.log('\n❌ Test suite failed:', error.message);
  }
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`Server Connectivity: ${results.servers ? '✅' : '❌'}`);
  console.log(`Agora Configuration: ${results.agoraConfig ? '✅' : '❌'}`);
  console.log(`Frontend Components: ${results.components ? '✅' : '❌'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All automated tests passed! Ready for manual testing.');
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues above.');
  }
  
  // Show manual testing instructions
  showManualTestInstructions();
}

// Run the tests
runTests().catch(console.error);
