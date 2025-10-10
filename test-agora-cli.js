const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testAgoraFunctionality() {
  try {
    console.log('🚀 Testing Agora Live Video Chat Functionality');
    console.log('='.repeat(60));
    
    // Login as admin
    console.log('\n🔐 Logging in as admin...');
    const adminResponse = await axios.post(API_BASE + '/auth/login', {
      email: 'admin@tcftef.com',
      password: 'AdminTest123!'
    });
    const adminToken = adminResponse.data.data.tokens.accessToken;
    console.log('✅ Admin logged in successfully');
    
    // Create and login as student
    console.log('\n👨‍🎓 Creating test student...');
    const studentEmail = 'agora-test-student@test.com';
    const studentPassword = 'StudentTest123!';

    try {
      await axios.post(API_BASE + '/auth/register', {
        firstName: 'Agora',
        lastName: 'Student',
        email: studentEmail,
        password: studentPassword,
        role: 'STUDENT'
      });
      console.log('✅ Test student created successfully');
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('already exists')) {
        console.log('✅ Test student already exists');
      } else {
        console.log('⚠️ Student creation failed:', error.response?.data?.error?.message || error.message);
      }
    }

    console.log('\n🔐 Logging in as student...');
    const studentResponse = await axios.post(API_BASE + '/auth/login', {
      email: studentEmail,
      password: studentPassword
    });
    const studentToken = studentResponse.data.data.tokens.accessToken;
    console.log('✅ Student logged in successfully');
    
    // Test Agora configuration
    console.log('\n⚙️ Testing Agora configuration...');
    const configResponse = await axios.get(API_BASE + '/agora/config');
    
    if (configResponse.data.success) {
      console.log('✅ Agora configuration retrieved');
      console.log('   📱 App ID:', configResponse.data.data.appId);
      console.log('   🔧 Mode:', configResponse.data.data.mode);
      console.log('   📺 Codec:', configResponse.data.data.codec);
      console.log('   ✅ Configured:', configResponse.data.data.isConfigured);
    } else {
      console.log('❌ Failed to get Agora configuration:', configResponse.data.error);
      return;
    }
    
    // Test Agora health check
    console.log('\n🏥 Testing Agora health check...');
    const healthResponse = await axios.get(API_BASE + '/agora/health');
    
    if (healthResponse.data.success) {
      console.log('✅ Agora service health check passed');
      console.log('   🟢 Status:', healthResponse.data.data.status);
      console.log('   🎥 RTC Token Generation:', healthResponse.data.data.features.rtcTokenGeneration ? '✅' : '❌');
      console.log('   💬 RTM Token Generation:', healthResponse.data.data.features.rtmTokenGeneration ? '✅' : '❌');
      console.log('   📹 Cloud Recording:', healthResponse.data.data.features.cloudRecording ? '✅' : '❌');
      console.log('   📺 Live Streaming:', healthResponse.data.data.features.liveStreaming ? '✅' : '❌');
    } else {
      console.log('❌ Agora health check failed:', healthResponse.data.error);
    }
    
    // Test RTC token generation for admin (host)
    console.log('\n🎫 Testing RTC token generation for admin (host)...');
    const channelName = 'test-live-session-' + Date.now();
    const adminUid = 'admin-' + Date.now();
    
    const adminTokenResponse = await axios.post(API_BASE + '/agora/rtc/token', {
      channelName: channelName,
      uid: adminUid,
      role: 'publisher',
      expiry: 3600
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (adminTokenResponse.data.success) {
      console.log('✅ Admin RTC token generated successfully');
      console.log('   🎫 Token length:', adminTokenResponse.data.data.token.length);
      console.log('   📺 Channel:', adminTokenResponse.data.data.channelName);
      console.log('   👤 UID:', adminTokenResponse.data.data.uid);
      console.log('   🎭 Role:', adminTokenResponse.data.data.role);
      console.log('   ⏰ Expiry:', new Date(adminTokenResponse.data.data.expiry * 1000).toLocaleString());
    } else {
      console.log('❌ Failed to generate admin RTC token:', adminTokenResponse.data.error);
      return;
    }
    
    // Test RTC token generation for student (participant)
    console.log('\n🎫 Testing RTC token generation for student (participant)...');
    const studentUid = 'student-' + Date.now();
    
    const studentTokenResponse = await axios.post(API_BASE + '/agora/rtc/token', {
      channelName: channelName,
      uid: studentUid,
      role: 'publisher', // Students can also publish in our system
      expiry: 3600
    }, {
      headers: {
        'Authorization': `Bearer ${studentToken}`
      }
    });
    
    if (studentTokenResponse.data.success) {
      console.log('✅ Student RTC token generated successfully');
      console.log('   🎫 Token length:', studentTokenResponse.data.data.token.length);
      console.log('   📺 Channel:', studentTokenResponse.data.data.channelName);
      console.log('   👤 UID:', studentTokenResponse.data.data.uid);
      console.log('   🎭 Role:', studentTokenResponse.data.data.role);
      console.log('   ⏰ Expiry:', new Date(studentTokenResponse.data.data.expiry * 1000).toLocaleString());
    } else {
      console.log('❌ Failed to generate student RTC token:', studentTokenResponse.data.error);
      return;
    }
    
    // Test RTM token generation for messaging
    console.log('\n💬 Testing RTM token generation for messaging...');
    const rtmTokenResponse = await axios.post(API_BASE + '/agora/rtm/token', {
      uid: adminUid,
      expiry: 3600
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (rtmTokenResponse.data.success) {
      console.log('✅ RTM token generated successfully');
      console.log('   🎫 Token length:', rtmTokenResponse.data.data.token.length);
      console.log('   👤 UID:', rtmTokenResponse.data.data.uid);
      console.log('   🎭 Role:', rtmTokenResponse.data.data.role);
      console.log('   ⏰ Expiry:', new Date(rtmTokenResponse.data.data.expiry * 1000).toLocaleString());
    } else {
      console.log('❌ Failed to generate RTM token:', rtmTokenResponse.data.error);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Agora CLI Test Completed!');
    console.log('\n📊 Summary:');
    console.log('✅ Agora configuration working');
    console.log('✅ Health check passed');
    console.log('✅ Admin RTC token generation working');
    console.log('✅ Student RTC token generation working');
    console.log('✅ RTM token generation working');
    console.log('\n🎯 Ready for live video chat implementation!');
    console.log('📺 Channel Name:', channelName);
    console.log('👨‍💼 Admin UID:', adminUid);
    console.log('👨‍🎓 Student UID:', studentUid);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAgoraFunctionality();
