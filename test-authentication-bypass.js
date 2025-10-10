const http = require('http');

// Test configuration
const BACKEND_URL = 'http://localhost:3001';
const TEST_USER = {
  email: 'timaclaude@gmail.com',
  password: 'password123'
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testLogin() {
  console.log('\n🔐 Testing user login...');
  
  try {
    const response = await makeRequest('POST', '/api/auth/login', TEST_USER);
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Login successful');
      return {
        accessToken: response.data.data.tokens.accessToken,
        userId: response.data.data.user.id
      };
    } else {
      console.log('❌ Login failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return null;
  }
}

async function testTemporaryTokenGeneration(token, userId) {
  console.log('\n🎫 Testing temporary token generation...');
  
  try {
    // Create a voice simulation first to get a simulation ID
    const voiceBookingData = {
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      voicePreference: 'france_female_1',
      language: 'fr'
    };
    
    const bookingResponse = await makeRequest(
      'POST', 
      '/api/voice-simulation/book', 
      voiceBookingData,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (bookingResponse.statusCode !== 201 && bookingResponse.statusCode !== 200) {
      console.log('❌ Failed to create voice simulation for token test');
      return null;
    }
    
    const simulationId = bookingResponse.data.data.simulation.id;
    
    // Test temporary token generation (this would normally be done by email service)
    const tokenData = {
      userId: userId,
      simulationId: simulationId,
      purpose: 'voice_simulation_access'
    };
    
    const response = await makeRequest(
      'POST', 
      '/api/auth/generate-temporary-token', 
      tokenData,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Temporary token generated successfully');
      console.log('   Token length:', response.data.data.token.length);
      console.log('   Expires at:', response.data.data.expiresAt);
      return {
        temporaryToken: response.data.data.token,
        simulationId: simulationId
      };
    } else {
      console.log('❌ Temporary token generation failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Temporary token generation error:', error.message);
    return null;
  }
}

async function testTemporaryTokenValidation(temporaryToken, simulationId) {
  console.log('\n✅ Testing temporary token validation...');
  
  if (!temporaryToken || !simulationId) {
    console.log('❌ No temporary token or simulation ID provided');
    return false;
  }
  
  try {
    // Test accessing voice simulation with temporary token
    const response = await makeRequest(
      'GET', 
      `/api/voice-simulation/${simulationId}?token=${temporaryToken}`,
      null
    );
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Temporary token validation successful');
      console.log('   Accessed simulation:', response.data.data.id);
      return true;
    } else {
      console.log('❌ Temporary token validation failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Temporary token validation error:', error.message);
    return false;
  }
}

async function testTemporaryTokenExpiration() {
  console.log('\n⏰ Testing temporary token expiration...');
  
  try {
    // Create an expired token (this is a simulation - in real implementation, 
    // you'd need to wait for actual expiration or manipulate the token)
    const expiredToken = 'expired_token_simulation';
    
    const response = await makeRequest(
      'GET', 
      `/api/voice-simulation/test?token=${expiredToken}`,
      null
    );
    
    if (response.statusCode === 401 || response.statusCode === 403) {
      console.log('✅ Expired token properly rejected');
      return true;
    } else {
      console.log('⚠️ Expired token validation may not be working properly');
      return false;
    }
  } catch (error) {
    console.log('❌ Token expiration test error:', error.message);
    return false;
  }
}

async function testInvalidTokenRejection() {
  console.log('\n🚫 Testing invalid token rejection...');
  
  try {
    const invalidToken = 'invalid_token_12345';
    
    const response = await makeRequest(
      'GET', 
      `/api/voice-simulation/test?token=${invalidToken}`,
      null
    );
    
    if (response.statusCode === 401 || response.statusCode === 403) {
      console.log('✅ Invalid token properly rejected');
      return true;
    } else {
      console.log('⚠️ Invalid token validation may not be working properly');
      return false;
    }
  } catch (error) {
    console.log('❌ Invalid token test error:', error.message);
    return false;
  }
}

async function testEmailLinkAccess(temporaryToken, simulationId) {
  console.log('\n📧 Testing email link access simulation...');
  
  if (!temporaryToken || !simulationId) {
    console.log('❌ No temporary token or simulation ID provided');
    return false;
  }
  
  try {
    // Simulate accessing the frontend page with temporary token
    // This would be the URL that users click in their emails
    const emailLinkUrl = `/voice-simulation/${simulationId}?token=${temporaryToken}`;
    
    // Test the backend endpoint that would be called by the frontend
    const response = await makeRequest(
      'GET', 
      `/api/voice-simulation/access/${simulationId}?token=${temporaryToken}`,
      null
    );
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Email link access successful');
      console.log('   Email link URL:', emailLinkUrl);
      return true;
    } else {
      console.log('❌ Email link access failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Email link access error:', error.message);
    return false;
  }
}

async function testImmigrationSimulationTokenAccess(token, userId) {
  console.log('\n🏛️ Testing immigration simulation token access...');
  
  try {
    // Create an immigration simulation first
    const immigrationData = {
      country: 'canada',
      immigrationType: 'skilled_worker',
      level: 'B2',
      voicePreference: 'france_female_1'
    };
    
    const createResponse = await makeRequest(
      'POST', 
      '/api/immigration-simulation/create', 
      immigrationData,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (createResponse.statusCode !== 201) {
      console.log('❌ Failed to create immigration simulation for token test');
      return false;
    }
    
    const simulationId = createResponse.data.data.id;
    
    // Generate temporary token for immigration simulation
    const tokenData = {
      userId: userId,
      simulationId: simulationId,
      purpose: 'immigration_simulation_access'
    };
    
    const tokenResponse = await makeRequest(
      'POST', 
      '/api/auth/generate-temporary-token', 
      tokenData,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (tokenResponse.statusCode !== 200) {
      console.log('❌ Failed to generate temporary token for immigration simulation');
      return false;
    }
    
    const temporaryToken = tokenResponse.data.data.token;
    
    // Test accessing immigration simulation with temporary token
    const accessResponse = await makeRequest(
      'GET', 
      `/api/immigration-simulation/${simulationId}?token=${temporaryToken}`,
      null
    );
    
    if (accessResponse.statusCode === 200 && accessResponse.data.success) {
      console.log('✅ Immigration simulation token access successful');
      return true;
    } else {
      console.log('❌ Immigration simulation token access failed:', accessResponse.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Immigration simulation token access error:', error.message);
    return false;
  }
}

async function testTokenSecurityFeatures(temporaryToken) {
  console.log('\n🔒 Testing token security features...');
  
  if (!temporaryToken) {
    console.log('❌ No temporary token provided');
    return false;
  }
  
  try {
    // Test 1: Token should be long enough (at least 32 characters)
    if (temporaryToken.length < 32) {
      console.log('❌ Token too short (security risk)');
      return false;
    }
    
    // Test 2: Token should not be easily guessable (should contain random characters)
    const hasNumbers = /\d/.test(temporaryToken);
    const hasLetters = /[a-zA-Z]/.test(temporaryToken);
    
    if (!hasNumbers || !hasLetters) {
      console.log('❌ Token not sufficiently random');
      return false;
    }
    
    // Test 3: Token should have limited scope (can't access other resources)
    const unauthorizedResponse = await makeRequest(
      'GET', 
      `/api/user/profile?token=${temporaryToken}`,
      null
    );
    
    if (unauthorizedResponse.statusCode === 401 || unauthorizedResponse.statusCode === 403) {
      console.log('✅ Token properly scoped (cannot access unauthorized resources)');
      return true;
    } else {
      console.log('⚠️ Token scope may be too broad');
      return false;
    }
  } catch (error) {
    console.log('❌ Token security test error:', error.message);
    return false;
  }
}

// Main test function
async function runAuthenticationBypassTests() {
  console.log('🧪 Starting Authentication Bypass Complete Test Suite');
  console.log('=' .repeat(60));
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Login
  totalTests++;
  const authData = await testLogin();
  if (authData) passedTests++;
  
  if (!authData) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }
  
  const { accessToken, userId } = authData;
  
  // Test 2: Temporary token generation
  totalTests++;
  const tokenData = await testTemporaryTokenGeneration(accessToken, userId);
  if (tokenData) passedTests++;
  
  if (!tokenData) {
    console.log('\n❌ Cannot proceed without temporary token');
    return;
  }
  
  const { temporaryToken, simulationId } = tokenData;
  
  // Test 3: Temporary token validation
  totalTests++;
  const validation = await testTemporaryTokenValidation(temporaryToken, simulationId);
  if (validation) passedTests++;
  
  // Test 4: Email link access
  totalTests++;
  const emailAccess = await testEmailLinkAccess(temporaryToken, simulationId);
  if (emailAccess) passedTests++;
  
  // Test 5: Token security features
  totalTests++;
  const security = await testTokenSecurityFeatures(temporaryToken);
  if (security) passedTests++;
  
  // Test 6: Invalid token rejection
  totalTests++;
  const invalidRejection = await testInvalidTokenRejection();
  if (invalidRejection) passedTests++;
  
  // Test 7: Token expiration
  totalTests++;
  const expiration = await testTemporaryTokenExpiration();
  if (expiration) passedTests++;
  
  // Test 8: Immigration simulation token access
  totalTests++;
  const immigrationAccess = await testImmigrationSimulationTokenAccess(accessToken, userId);
  if (immigrationAccess) passedTests++;
  
  // Results
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Authentication Bypass Test Results');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All authentication bypass tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
  }
  
  console.log('\n📋 Test Summary:');
  console.log('- Temporary token generation and validation');
  console.log('- Email link access simulation');
  console.log('- Token security and scope validation');
  console.log('- Invalid and expired token rejection');
  console.log('- Immigration simulation token access');
}

// Run the tests
runAuthenticationBypassTests().catch(console.error);
