const http = require('http');

// Test level assessment functionality
async function testLevelAssessment() {
  console.log('🧪 Testing Level Assessment System...\n');
  
  // Step 1: Login as student
  const loginData = JSON.stringify({
    email: 'timaclaude@gmail.com',
    password: 'password123'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  return new Promise((resolve) => {
    const req = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', async () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.success) {
            console.log('✅ Student login successful!');
            const accessToken = response.data.tokens?.accessToken || response.data.accessToken;
            
            // Test level assessment endpoints
            await testSimulationAssessment(accessToken);
            await testLevelHistory(accessToken);
            
          } else {
            console.log('❌ Student login failed!');
            console.log('Response:', response);
          }
          
          resolve(response);
        } catch (err) {
          console.log('❌ Error parsing login response:', err.message);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Login request failed:', err.message);
      resolve(null);
    });

    req.write(loginData);
    req.end();
  });
}

async function testSimulationAssessment(accessToken) {
  console.log('\n🔍 Testing Simulation Level Assessment...');
  
  // Sample simulation result data
  const assessmentData = JSON.stringify({
    simulationId: null, // Use null since the test simulation doesn't exist in the database
    testLevel: 'B2',
    score: 75,
    totalQuestions: 40,
    correctAnswers: 30,
    timeSpent: 120,
    answers: [
      { questionId: '1', answer: 'A', correct: true },
      { questionId: '2', answer: 'B', correct: false },
      // ... more answers
    ],
    sectionScores: {
      'comprehension_ecrite': { score: 18, maxScore: 20, percentage: 90 },
      'comprehension_orale': { score: 15, maxScore: 20, percentage: 75 },
      'expression_ecrite': { score: 12, maxScore: 20, percentage: 60 },
      'expression_orale': { score: 14, maxScore: 20, percentage: 70 }
    }
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/simulations/assess-level',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Content-Length': Buffer.byteLength(assessmentData)
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.success) {
            console.log('✅ Level assessment successful!');
            const assessment = response.data.assessment;
            console.log(`📊 Determined Level: ${assessment.determinedLevel}`);
            console.log(`📈 Sub-level: ${assessment.subLevel}`);
            console.log(`🎯 Confidence: ${(assessment.confidence * 100).toFixed(1)}%`);
            console.log(`💪 Strengths: ${assessment.strengths.join(', ')}`);
            console.log(`📝 Weaknesses: ${assessment.weaknesses.join(', ')}`);
            console.log(`🎯 Recommendations: ${assessment.recommendations.slice(0, 2).join(', ')}`);
            console.log(`⏱️ Time to next level: ${assessment.estimatedTimeToNext}`);
          } else {
            console.log('❌ Level assessment failed!');
            console.log(`Status: ${res.statusCode}`);
            console.log('Response:', response);
          }
          
          resolve(response);
        } catch (err) {
          console.log('❌ Error parsing assessment response:', err.message);
          console.log('Raw response:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Assessment request failed:', err.message);
      resolve(null);
    });

    req.write(assessmentData);
    req.end();
  });
}

async function testLevelHistory(accessToken) {
  console.log('\n🔍 Testing Level History...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/simulations/level-history',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.success) {
            console.log('✅ Level history retrieved successfully!');
            console.log(`📊 Current Level: ${response.data.currentLevel}`);
            console.log(`📈 Assessment History: ${response.data.history.length} assessments`);
            
            if (response.data.history.length > 0) {
              const latest = response.data.history[0];
              console.log(`📅 Latest Assessment: ${latest.determinedLevel} (${new Date(latest.createdAt).toLocaleDateString()})`);
              console.log(`🎯 Confidence: ${(latest.confidence * 100).toFixed(1)}%`);
            }
          } else {
            console.log('❌ Level history failed!');
            console.log(`Status: ${res.statusCode}`);
            console.log('Response:', response);
          }
          
          resolve(response);
        } catch (err) {
          console.log('❌ Error parsing history response:', err.message);
          console.log('Raw response:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ History request failed:', err.message);
      resolve(null);
    });

    req.end();
  });
}

// Run the test
testLevelAssessment().then(() => {
  console.log('\n🎉 Level Assessment Testing Complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
