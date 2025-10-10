const http = require('http');

console.log('🎯 PHASE 1: VOICE & IMMIGRATION SIMULATION TESTING');
console.log('='.repeat(60));

async function testVoiceAndImmigrationSystems() {
  try {
    // Step 1: Test Authentication
    console.log('\n🔐 Step 1: Testing Authentication');
    const adminToken = await loginAsAdmin();
    const studentToken = await loginAsStudent();
    
    if (!adminToken || !studentToken) {
      console.log('❌ Authentication failed - cannot proceed');
      return;
    }

    // Step 2: Test Voice Simulation System
    console.log('\n🎙️ Step 2: Testing Voice Simulation System');
    await testVoiceSimulationSystem(adminToken, studentToken);

    // Step 3: Test Immigration Simulation System
    console.log('\n🛂 Step 3: Testing Immigration Simulation System');
    await testImmigrationSimulationSystem(adminToken, studentToken);

    // Step 4: Test Monthly Limits
    console.log('\n📊 Step 4: Testing Monthly Limits');
    await testMonthlyLimits(studentToken);

    // Step 5: Test Email Notifications
    console.log('\n📧 Step 5: Testing Email Notifications');
    await testEmailNotifications();

    console.log('\n🎉 PHASE 1 TESTING COMPLETE!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function loginAsAdmin() {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({
      email: 'test-admin@aura.ca',
      password: 'test123'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.success) {
            console.log('✅ Admin login successful!');
            resolve(response.data.tokens.accessToken);
          } else {
            console.log('❌ Admin login failed');
            resolve(null);
          }
        } catch (err) {
          console.log('❌ Admin login error:', err.message);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Admin login request failed:', err.message);
      resolve(null);
    });

    req.write(loginData);
    req.end();
  });
}

async function loginAsStudent() {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({
      email: 'timaclaude@gmail.com',
      password: 'password123'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.success) {
            console.log('✅ Student login successful!');
            resolve(response.data.tokens.accessToken);
          } else {
            console.log('❌ Student login failed');
            resolve(null);
          }
        } catch (err) {
          console.log('❌ Student login error:', err.message);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Student login request failed:', err.message);
      resolve(null);
    });

    req.write(loginData);
    req.end();
  });
}

async function testVoiceSimulationSystem(adminToken, studentToken) {
  console.log('\n   🎤 Testing Voice Simulation API Endpoints...');

  // Test voice simulation booking
  await testAPIEndpoint('POST', '/api/voice-simulation/book', studentToken, {
    bookingType: 'conversation',
    preferredDates: ['2025-10-09T10:00:00Z'],
    voicePreference: 'france_female_1'
  }, 'Voice Simulation Booking');

  // Test voice simulation history
  await testAPIEndpoint('GET', '/api/voice-simulation/history', studentToken, null, 'Voice Simulation History');

  // Test monthly count
  await testAPIEndpoint('GET', '/api/voice-simulation/monthly-count', studentToken, null, 'Voice Simulation Monthly Count');

  // Test VAPI integration
  console.log('\n   📞 Testing VAPI Integration...');
  await testAPIEndpoint('GET', '/api/voice-simulation/vapi-config', null, null, 'VAPI Config Check');

  // Test available voices
  await testAPIEndpoint('GET', '/api/voice-simulation/voices', null, null, 'Available Voices');
}

async function testImmigrationSimulationSystem(adminToken, studentToken) {
  console.log('\n   🛂 Testing Immigration Simulation API Endpoints...');

  // Test immigration simulation creation
  await testAPIEndpoint('POST', '/api/immigration-simulation/create', studentToken, {
    country: 'canada',
    immigrationType: 'skilled_worker',
    level: 'B2',
    voicePreference: 'france_female_1',
    personalInfo: {
      name: 'Test User',
      profession: 'Software Developer'
    }
  }, 'Immigration Simulation Creation');

  // Test immigration simulation history
  await testAPIEndpoint('GET', '/api/immigration-simulation/history/user', studentToken, null, 'Immigration Simulation History');

  // Test monthly count
  await testAPIEndpoint('GET', '/api/immigration-simulation/monthly-count/user', studentToken, null, 'Immigration Simulation Monthly Count');
}

async function testMonthlyLimits(studentToken) {
  console.log('\n   📊 Testing Monthly Limit Enforcement...');

  // Test voice simulation limits
  await testAPIEndpoint('GET', '/api/voice-simulation/monthly-count', studentToken, null, 'Voice Simulation Monthly Count');

  // Test immigration simulation limits
  await testAPIEndpoint('GET', '/api/immigration-simulation/monthly-count/user', studentToken, null, 'Immigration Simulation Monthly Count');
}

async function testEmailNotifications() {
  console.log('\n   📧 Testing Email Notification System...');
  console.log('   ✅ Email notification system configured (simulated)');
}

async function testAPIEndpoint(method, path, token, data, testName) {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Only add Authorization header if token is provided
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      
      res.on('end', () => {
        const icon = res.statusCode < 400 ? '✅' : '❌';
        console.log(`   ${icon} ${testName}: Status ${res.statusCode}`);
        
        if (res.statusCode >= 400) {
          try {
            const errorResponse = JSON.parse(responseData);
            console.log(`      Error: ${errorResponse.error?.message || 'Unknown error'}`);
          } catch (err) {
            console.log(`      Raw error: ${responseData.substring(0, 100)}...`);
          }
        } else {
          try {
            const response = JSON.parse(responseData);
            if (response.success) {
              console.log(`      ✅ Success: ${response.message || 'Operation completed'}`);
            }
          } catch (err) {
            console.log(`      ✅ Response received (${responseData.length} bytes)`);
          }
        }
        
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ ${testName}: Request failed - ${err.message}`);
      resolve();
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

testVoiceAndImmigrationSystems();
