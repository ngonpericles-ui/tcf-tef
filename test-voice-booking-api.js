const http = require('http');

// Test configuration
const BACKEND_URL = 'http://localhost:3001';
const TEST_USER = {
  email: 'timaclaude@gmail.com',
  password: 'password123'
};

// Test data
const VOICE_BOOKING_DATA = {
  scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  voicePreference: 'france_female_1',
  language: 'fr'
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

async function testVoiceSimulationBooking(token) {
  console.log('\n📅 Testing voice simulation booking...');
  
  try {
    const response = await makeRequest(
      'POST', 
      '/api/voice-simulation/book', 
      VOICE_BOOKING_DATA,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if ((response.statusCode === 201 || response.statusCode === 200) && response.data.success) {
      console.log('✅ Voice simulation booked successfully');
      console.log('   Simulation ID:', response.data.data.simulation.id);
      console.log('   Scheduled Date:', response.data.data.simulation.scheduledDate);
      return response.data.data.simulation.id;
    } else {
      console.log('❌ Voice simulation booking failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Voice simulation booking error:', error.message);
    return null;
  }
}

async function testAutoScheduling(token) {
  console.log('\n🤖 Testing auto-scheduling...');
  
  try {
    const autoBookingData = {
      voicePreference: 'quebec_female_1',
      language: 'fr',
      autoSchedule: true
    };
    
    const response = await makeRequest(
      'POST', 
      '/api/voice-simulation/book', 
      autoBookingData,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if ((response.statusCode === 201 || response.statusCode === 200) && response.data.success) {
      console.log('✅ Auto-scheduling successful');
      console.log('   Auto-scheduled Date:', response.data.data.simulation.scheduledDate);
      return response.data.data.simulation.id;
    } else {
      console.log('❌ Auto-scheduling failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Auto-scheduling error:', error.message);
    return null;
  }
}

async function testAvailableSlots(token) {
  console.log('\n📊 Testing available slots retrieval...');
  
  try {
    const response = await makeRequest(
      'GET', 
      '/api/voice-simulation/available-slots',
      null,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Available slots retrieved successfully');
      console.log('   Number of slots:', response.data.data.slots.length);
      return response.data.data.slots;
    } else {
      console.log('❌ Available slots retrieval failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Available slots error:', error.message);
    return null;
  }
}

async function testVoiceSimulationReschedule(token, simulationId) {
  console.log('\n🔄 Testing voice simulation reschedule...');
  
  if (!simulationId) {
    console.log('❌ No simulation ID provided');
    return false;
  }
  
  try {
    const newDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // Day after tomorrow
    const rescheduleData = {
      newDate: newDate,
      voicePreference: 'france_male_1'
    };
    
    const response = await makeRequest(
      'PUT', 
      `/api/voice-simulation/reschedule/${simulationId}`,
      rescheduleData,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Voice simulation rescheduled successfully');
      console.log('   New Date:', response.data.data.scheduledDate);
      return true;
    } else {
      console.log('❌ Voice simulation reschedule failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Voice simulation reschedule error:', error.message);
    return false;
  }
}

async function testVoiceSimulationCancellation(token, simulationId) {
  console.log('\n❌ Testing voice simulation cancellation...');
  
  if (!simulationId) {
    console.log('❌ No simulation ID provided');
    return false;
  }
  
  try {
    const response = await makeRequest(
      'DELETE', 
      `/api/voice-simulation/cancel/${simulationId}`,
      null,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Voice simulation cancelled successfully');
      return true;
    } else {
      console.log('❌ Voice simulation cancellation failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Voice simulation cancellation error:', error.message);
    return false;
  }
}

async function testMonthlyLimitEnforcement(token) {
  console.log('\n📊 Testing monthly limit enforcement...');
  
  try {
    const response = await makeRequest(
      'GET', 
      '/api/voice-simulation/monthly-count',
      null,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Monthly count retrieved successfully');
      console.log('   Monthly count:', response.data.data.monthlyCount);
      console.log('   Limit:', response.data.data.limit);
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

async function testVoiceSimulationHistory(token) {
  console.log('\n📚 Testing voice simulation history...');
  
  try {
    const response = await makeRequest(
      'GET', 
      '/api/voice-simulation/history',
      null,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Voice simulation history retrieved successfully');
      console.log('   Number of simulations:', response.data.data.simulations.length);
      return response.data.data.simulations;
    } else {
      console.log('❌ Voice simulation history retrieval failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Voice simulation history error:', error.message);
    return null;
  }
}

async function testBusinessHoursValidation(token) {
  console.log('\n🕐 Testing business hours validation...');
  
  try {
    // Try to book outside business hours (e.g., Sunday at 2 AM)
    const sunday2AM = new Date();
    sunday2AM.setDate(sunday2AM.getDate() + (7 - sunday2AM.getDay())); // Next Sunday
    sunday2AM.setHours(2, 0, 0, 0);
    
    const invalidBookingData = {
      scheduledDate: sunday2AM.toISOString(),
      voicePreference: 'france_female_1',
      language: 'fr'
    };
    
    const response = await makeRequest(
      'POST', 
      '/api/voice-simulation/book', 
      invalidBookingData,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (response.statusCode === 400) {
      console.log('✅ Business hours validation working (booking rejected)');
      return true;
    } else if (response.statusCode === 201) {
      console.log('⚠️ Business hours validation may not be working (booking accepted)');
      return false;
    } else {
      console.log('❌ Business hours validation test failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Business hours validation error:', error.message);
    return false;
  }
}

// Main test function
async function runVoiceBookingTests() {
  console.log('🧪 Starting Voice Booking API Complete Test Suite');
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
  
  // Test 2: Available slots
  totalTests++;
  const slots = await testAvailableSlots(token);
  if (slots) passedTests++;
  
  // Test 3: Voice simulation booking
  totalTests++;
  const simulationId = await testVoiceSimulationBooking(token);
  if (simulationId) passedTests++;
  
  // Test 4: Auto-scheduling
  totalTests++;
  const autoSimulationId = await testAutoScheduling(token);
  if (autoSimulationId) passedTests++;
  
  // Test 5: Monthly limit enforcement
  totalTests++;
  const monthlyData = await testMonthlyLimitEnforcement(token);
  if (monthlyData) passedTests++;
  
  // Test 6: Voice simulation history
  totalTests++;
  const history = await testVoiceSimulationHistory(token);
  if (history) passedTests++;
  
  // Test 7: Business hours validation
  totalTests++;
  const businessHours = await testBusinessHoursValidation(token);
  if (businessHours) passedTests++;
  
  // Test 8: Reschedule (if we have a simulation)
  if (simulationId) {
    totalTests++;
    const reschedule = await testVoiceSimulationReschedule(token, simulationId);
    if (reschedule) passedTests++;
  }
  
  // Test 9: Cancellation (if we have an auto-scheduled simulation)
  if (autoSimulationId) {
    totalTests++;
    const cancellation = await testVoiceSimulationCancellation(token, autoSimulationId);
    if (cancellation) passedTests++;
  }
  
  // Results
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Voice Booking API Test Results');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All voice booking API tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
  }
}

// Run the tests
runVoiceBookingTests().catch(console.error);
