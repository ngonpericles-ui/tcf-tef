const http = require('http');

// Test configuration
const BACKEND_URL = 'http://localhost:3001';
const TEST_USER = {
  email: 'timaclaude@gmail.com',
  password: 'password123'
};

// Test data
const IMMIGRATION_SIMULATION_DATA = {
  country: 'canada',
  immigrationType: 'skilled_worker',
  level: 'B2',
  voicePreference: 'france_female_1',
  personalInfo: {
    age: 28,
    education: 'Master',
    experience: '5 years'
  }
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
      return response.data.data.tokens.accessToken;
    } else {
      console.log('❌ Login failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return null;
  }
}

async function testImmigrationSimulationCreation(token) {
  console.log('\n📝 Testing immigration simulation creation...');
  
  try {
    const response = await makeRequest(
      'POST', 
      '/api/immigration-simulation/create', 
      IMMIGRATION_SIMULATION_DATA,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if ((response.statusCode === 201 || response.statusCode === 200) && response.data.success) {
      console.log('✅ Immigration simulation created successfully');
      console.log('   Simulation ID:', response.data.data.id);
      return response.data.data.id;
    } else {
      console.log('❌ Immigration simulation creation failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Immigration simulation creation error:', error.message);
    return null;
  }
}

async function testMonthlyLimitEnforcement(token) {
  console.log('\n📊 Testing monthly limit enforcement...');
  
  try {
    const response = await makeRequest(
      'GET', 
      '/api/immigration-simulation/monthly-count/user',
      null,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Monthly count retrieved successfully');
      console.log('   Monthly count:', response.data.data.monthlyCount);
      console.log('   Limit:', response.data.data.limit);
      console.log('   Remaining:', response.data.data.remaining);
      return response.data.data;
    } else {
      console.log('❌ Monthly count retrieval failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Monthly count error:', error.message);
    return null;
  }
}

async function testProCardValidation(token) {
  console.log('\n💳 Testing Pro Card validation...');

  // This test assumes the user has Pro subscription
  // In a real test, you might want to test with different subscription tiers

  try {
    const response = await makeRequest(
      'POST',
      '/api/immigration-simulation/create',
      IMMIGRATION_SIMULATION_DATA,
      { 'Authorization': `Bearer ${token}` }
    );

    if ((response.statusCode === 201 || response.statusCode === 200) && response.data.success) {
      console.log('✅ Pro Card validation passed (simulation created successfully)');
      return response.data.data.id;
    } else if (response.statusCode === 403) {
      console.log('✅ Pro Card validation working (access denied for non-Pro user)');
      return null;
    } else {
      console.log('❌ Pro Card validation failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Pro Card validation error:', error.message);
    return null;
  }
}

async function testSimulationHistory(token) {
  console.log('\n📚 Testing simulation history retrieval...');
  
  try {
    const response = await makeRequest(
      'GET', 
      '/api/immigration-simulation/history/user',
      null,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Simulation history retrieved successfully');
      console.log('   Number of simulations:', response.data.data.simulations.length);
      return response.data.data.simulations;
    } else {
      console.log('❌ Simulation history retrieval failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Simulation history error:', error.message);
    return null;
  }
}

async function testSimulationStart(token, simulationId) {
  console.log('\n▶️ Testing simulation start...');
  
  if (!simulationId) {
    console.log('❌ No simulation ID provided');
    return false;
  }
  
  try {
    const response = await makeRequest(
      'POST', 
      `/api/immigration-simulation/start/${simulationId}`,
      {},
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Simulation started successfully');
      return true;
    } else {
      console.log('❌ Simulation start failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Simulation start error:', error.message);
    return false;
  }
}

async function testSimulationEnd(token, simulationId) {
  console.log('\n⏹️ Testing simulation end...');
  
  if (!simulationId) {
    console.log('❌ No simulation ID provided');
    return false;
  }
  
  try {
    const mockResults = {
      responses: ['Response 1', 'Response 2'],
      finalScore: 85,
      feedback: 'Good performance overall'
    };
    
    const response = await makeRequest(
      'POST', 
      `/api/immigration-simulation/end/${simulationId}`,
      mockResults,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Simulation ended successfully');
      return true;
    } else {
      console.log('❌ Simulation end failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Simulation end error:', error.message);
    return false;
  }
}

async function testVoicePreferenceStorage(token) {
  console.log('\n🎤 Testing voice preference storage...');
  
  try {
    const dataWithVoice = {
      ...IMMIGRATION_SIMULATION_DATA,
      voicePreference: 'quebec_male_1'
    };
    
    const response = await makeRequest(
      'POST', 
      '/api/immigration-simulation/create', 
      dataWithVoice,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (response.statusCode === 201 && response.data.success) {
      console.log('✅ Voice preference stored successfully');
      console.log('   Voice preference:', response.data.data.voicePreference);
      return response.data.data.id;
    } else {
      console.log('❌ Voice preference storage failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Voice preference storage error:', error.message);
    return null;
  }
}

// Main test function
async function runImmigrationSimulationTests() {
  console.log('🧪 Starting Immigration Simulation Complete Test Suite');
  console.log('=' .repeat(60));
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Login
  totalTests++;
  const token = await testLogin();
  if (token) passedTests++;
  
  if (!token) {
    console.log('\n❌ Cannot proceed without authentication token');
    return;
  }
  
  // Test 2: Monthly limit check
  totalTests++;
  const monthlyData = await testMonthlyLimitEnforcement(token);
  if (monthlyData) passedTests++;
  
  // Test 3: Pro Card validation
  totalTests++;
  const proValidationId = await testProCardValidation(token);
  if (proValidationId) {
    passedTests++;
    console.log('✅ Pro Card validation test passed');
  } else {
    console.log('❌ Pro Card validation test failed');
  }

  // Test 4: Simulation creation
  totalTests++;
  const simulationId = await testImmigrationSimulationCreation(token);
  if (simulationId) {
    passedTests++;
    console.log('✅ Immigration simulation creation test passed');
  } else {
    console.log('❌ Immigration simulation creation test failed');
  }
  
  // Test 5: Voice preference storage
  totalTests++;
  const voiceSimulationId = await testVoicePreferenceStorage(token);
  if (voiceSimulationId) passedTests++;
  
  // Test 6: Simulation history
  totalTests++;
  const history = await testSimulationHistory(token);
  if (history) passedTests++;
  
  // Test 7: Simulation start (use Pro Card validation simulation ID if available)
  totalTests++;
  const testSimId = simulationId || proValidationId;
  console.log('DEBUG: Using simulation ID for start test:', testSimId);
  const startResult = await testSimulationStart(token, testSimId);
  if (startResult) passedTests++;

  // Test 8: Simulation end
  totalTests++;
  const endResult = await testSimulationEnd(token, testSimId);
  if (endResult) passedTests++;
  
  // Results
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Immigration Simulation Test Results');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All immigration simulation tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
  }
}

// Run the tests
runImmigrationSimulationTests().catch(console.error);
