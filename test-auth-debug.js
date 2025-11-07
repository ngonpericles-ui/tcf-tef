const http = require('http');

console.log('🔍 AUTHENTICATION DEBUG TEST');
console.log('='.repeat(40));

async function debugAuth() {
  try {
    // Get student token
    console.log('\n🔐 Getting Student Token...');
    const studentToken = await login('timaclaude@gmail.com', 'password123');
    
    if (!studentToken) {
      console.log('❌ Student login failed');
      return;
    }
    
    console.log('✅ Student token received');
    console.log('🔑 Token preview:', studentToken.substring(0, 50) + '...');

    // Test different authenticated endpoints
    console.log('\n🧪 Testing Different Authenticated Endpoints...');
    
    // Test immigration endpoint (working)
    await testWithToken('/api/immigration-simulation/monthly-count/user', studentToken, 'Immigration Monthly Count');
    
    // Test voice endpoint (failing)
    await testWithToken('/api/voice-simulation/monthly-count', studentToken, 'Voice Monthly Count');
    
    // Test voice history (failing)
    await testWithToken('/api/voice-simulation/history', studentToken, 'Voice History');
    
    // Test a simple auth endpoint
    await testWithToken('/api/auth/profile', studentToken, 'Auth Profile');

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
            console.log('Login failed:', response);
            resolve(null);
          }
        } catch (err) {
          console.log('Login parse error:', err.message);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.log('Login request error:', err.message);
      resolve(null);
    });

    req.write(loginData);
    req.end();
  });
}

async function testWithToken(path, token, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    console.log(`\n🔍 Testing: ${name}`);
    console.log(`📍 Path: ${path}`);
    console.log(`🔑 Auth Header: Bearer ${token.substring(0, 20)}...`);

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      
      res.on('end', () => {
        const icon = res.statusCode < 400 ? '✅' : '❌';
        console.log(`${icon} Status: ${res.statusCode}`);
        
        if (res.statusCode >= 400) {
          try {
            const errorResponse = JSON.parse(responseData);
            console.log(`❌ Error: ${errorResponse.error?.message || errorResponse.message || 'Unknown'}`);
            console.log(`📄 Full Error:`, JSON.stringify(errorResponse, null, 2));
          } catch (err) {
            console.log(`❌ Raw Error: ${responseData}`);
          }
        } else {
          try {
            const response = JSON.parse(responseData);
            console.log(`✅ Success: ${response.message || 'OK'}`);
            if (response.data) {
              console.log(`📊 Data keys: ${Object.keys(response.data).join(', ')}`);
            }
          } catch (err) {
            console.log(`✅ Response: ${responseData.length} bytes`);
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

debugAuth();
