const http = require('http');

console.log('🔍 VOICE SIMULATION DEBUG TEST');
console.log('='.repeat(40));

async function debugVoiceAuth() {
  try {
    // Get student token
    console.log('\n🔐 Getting Student Token...');
    const studentToken = await login('timaclaude@gmail.com', 'password123');
    
    if (!studentToken) {
      console.log('❌ Student login failed');
      return;
    }
    
    console.log('✅ Student token received');

    // Test the exact failing endpoint with detailed debugging
    console.log('\n🧪 Testing Voice Monthly Count with Debug...');
    await testVoiceEndpointWithDebug('/api/voice-simulation/monthly-count', studentToken);

    // Test a working endpoint for comparison
    console.log('\n🧪 Testing Immigration Monthly Count for Comparison...');
    await testVoiceEndpointWithDebug('/api/immigration-simulation/monthly-count/user', studentToken);

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

async function testVoiceEndpointWithDebug(path, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Voice-Debug-Test/1.0'
      }
    };

    console.log(`\n📍 Testing: ${path}`);
    console.log(`🔑 Token: ${token.substring(0, 30)}...`);
    console.log(`📤 Request Headers:`, JSON.stringify(options.headers, null, 2));

    const req = http.request(options, (res) => {
      console.log(`📥 Response Status: ${res.statusCode}`);
      console.log(`📥 Response Headers:`, JSON.stringify(res.headers, null, 2));
      
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      
      res.on('end', () => {
        console.log(`📄 Response Body: ${responseData}`);
        
        if (res.statusCode >= 400) {
          try {
            const errorResponse = JSON.parse(responseData);
            console.log(`❌ Parsed Error:`, JSON.stringify(errorResponse, null, 2));
          } catch (err) {
            console.log(`❌ Raw Error Response: ${responseData}`);
          }
        } else {
          try {
            const response = JSON.parse(responseData);
            console.log(`✅ Parsed Success:`, JSON.stringify(response, null, 2));
          } catch (err) {
            console.log(`✅ Raw Success Response: ${responseData}`);
          }
        }
        
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Request Error: ${err.message}`);
      resolve();
    });

    req.end();
  });
}

debugVoiceAuth();
