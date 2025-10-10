const http = require('http');

console.log('🎯 SIMPLE VOICE & IMMIGRATION TEST');
console.log('='.repeat(40));

async function simpleTest() {
  try {
    // Test 1: Admin Login
    console.log('\n🔐 Testing Admin Login...');
    const adminToken = await login('test-admin@aura.ca', 'test123');
    
    if (!adminToken) {
      console.log('❌ Admin login failed');
      return;
    }
    console.log('✅ Admin login successful');

    // Test 2: Student Login
    console.log('\n👨‍🎓 Testing Student Login...');
    const studentToken = await login('timaclaude@gmail.com', 'password123');
    
    if (!studentToken) {
      console.log('❌ Student login failed');
      return;
    }
    console.log('✅ Student login successful');

    // Test 3: Voice Simulation Endpoints
    console.log('\n🎤 Testing Voice Simulation Endpoints...');
    
    // Test VAPI config (public endpoint)
    await testEndpoint('GET', '/api/voice-simulation/vapi-config', null, 'VAPI Config');
    
    // Test available voices (public endpoint)
    await testEndpoint('GET', '/api/voice-simulation/voices', null, 'Available Voices');
    
    // Test monthly count (authenticated)
    await testEndpoint('GET', '/api/voice-simulation/monthly-count', studentToken, 'Voice Monthly Count');
    
    // Test history (authenticated)
    await testEndpoint('GET', '/api/voice-simulation/history', studentToken, 'Voice History');

    // Test 4: Immigration Simulation Endpoints
    console.log('\n🛂 Testing Immigration Simulation Endpoints...');
    
    // Test monthly count (authenticated)
    await testEndpoint('GET', '/api/immigration-simulation/monthly-count/user', studentToken, 'Immigration Monthly Count');
    
    // Test history (authenticated)
    await testEndpoint('GET', '/api/immigration-simulation/history/user', studentToken, 'Immigration History');

    // Test 5: Create Immigration Simulation
    console.log('\n🆕 Testing Immigration Simulation Creation...');
    await testEndpoint('POST', '/api/immigration-simulation/create', studentToken, 'Immigration Creation', {
      country: 'canada',
      immigrationType: 'skilled_worker',
      level: 'B2',
      voicePreference: 'france_female_1'
    });

    console.log('\n🎉 SIMPLE TEST COMPLETE!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function login(email, password) {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({ email, password });

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
            resolve(response.data.tokens.accessToken);
          } else {
            resolve(null);
          }
        } catch (err) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.write(loginData);
    req.end();
  });
}

async function testEndpoint(method, path, token, name, data = null) {
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
        console.log(`   ${icon} ${name}: ${res.statusCode}`);
        
        if (res.statusCode >= 400) {
          try {
            const errorResponse = JSON.parse(responseData);
            console.log(`      Error: ${errorResponse.error?.message || errorResponse.message || 'Unknown'}`);
          } catch (err) {
            console.log(`      Raw: ${responseData.substring(0, 100)}`);
          }
        } else {
          try {
            const response = JSON.parse(responseData);
            if (response.success) {
              console.log(`      Success: ${response.message || 'OK'}`);
            } else {
              console.log(`      Response: ${JSON.stringify(response).substring(0, 100)}`);
            }
          } catch (err) {
            console.log(`      Response: ${responseData.length} bytes`);
          }
        }
        
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ ${name}: Request failed - ${err.message}`);
      resolve();
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

simpleTest();
