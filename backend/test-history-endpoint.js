const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testHistoryEndpoint() {
  try {
    console.log('🔐 Logging in as student...');
    
    // Login first
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'timaclaude@gmail.com',
      password: 'Student@123'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful!');
    console.log('Token:', token.substring(0, 50) + '...\n');

    // Test the history endpoint
    console.log('📋 Testing /api/voice-simulation/history endpoint...');
    
    let historyResponse;
    try {
      historyResponse = await axios.get(`${API_BASE_URL}/api/voice-simulation/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (loginError) {
      console.log('⚠️ Login failed, trying to get token from existing session...');
      // Try with a known token from the user
      const knownToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtaGQxbWdkZzAwMDF2ZnFrOWNpODBkZDQiLCJ1c2VySWQiOiJjbWhkMW1nZHcwMDAxd2ZxazljajgwZGQ0IiwiZW1haWwiOiJ0aW1hY2xhdWRlQGdtYWlsLmNvbSIsInJvbGUiOiJTVFVERU5UIiwic3Vic2NyaXB0aW9uVGllciI6IkZSRUUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzYxNzcxODU2LCJleHAiOjE3NjE4NTgyNTYsImF1ZCI6InRjZi10ZWYtYXBwIiwiaXNzIjoidGNmLXRlZi1hcGkifQ.WA45LSmBH-Jbd5sm87tHB4ggdNzM1owFNFO95fxJlug';
      historyResponse = await axios.get(`${API_BASE_URL}/api/voice-simulation/history`, {
        headers: {
          'Authorization': `Bearer ${knownToken}`,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('\n✅ History API Response:');
    console.log('Status:', historyResponse.status);
    console.log('Success:', historyResponse.data.success);
    console.log('Total simulations:', historyResponse.data.data?.length || 0);
    
    if (historyResponse.data.data && historyResponse.data.data.length > 0) {
      console.log('\n📋 Simulations:');
      historyResponse.data.data.forEach((sim, index) => {
        console.log(`\n--- Simulation ${index + 1} ---`);
        console.log('ID:', sim.id);
        console.log('scheduledDate:', sim.scheduledDate);
        console.log('scheduledDate type:', typeof sim.scheduledDate);
        console.log('scheduledDate value:', sim.scheduledDate?.toString());
        console.log('status:', sim.status);
        console.log('voicePreference:', sim.voicePreference);
        console.log('questionsData:', sim.questionsData);
        console.log('createdAt:', sim.createdAt);
        
        // Test date parsing
        if (sim.scheduledDate) {
          const date = new Date(sim.scheduledDate);
          console.log('Parsed date:', date.toString());
          console.log('Is valid date:', !isNaN(date.getTime()));
          console.log('ISO string:', date.toISOString());
        } else {
          console.log('⚠️ No scheduledDate field!');
        }
      });
    } else {
      console.log('\n⚠️ No simulations found in response');
      console.log('Full response:', JSON.stringify(historyResponse.data, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testHistoryEndpoint();
