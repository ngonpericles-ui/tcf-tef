const http = require('http');

console.log('🎯 PHASE 4: COMPREHENSIVE TESTING PROTOCOL');
console.log('='.repeat(50));

async function comprehensiveTestingProtocol() {
  try {
    console.log('\n📋 COMPREHENSIVE PLATFORM TESTING PROTOCOL');
    console.log('Testing all critical systems for 100% functionality...\n');

    // Test 1: Authentication System
    console.log('🔐 Step 1: Authentication System Testing...');
    const authResults = await testAuthenticationSystem();
    
    // Test 2: Content Management System
    console.log('\n📁 Step 2: Content Management System Testing...');
    const contentResults = await testContentManagementSystem();
    
    // Test 3: Voice & Immigration Simulations
    console.log('\n🎤 Step 3: Voice & Immigration Simulation Testing...');
    const simulationResults = await testSimulationSystems();
    
    // Test 4: Upload Cards System
    console.log('\n📤 Step 4: Upload Cards System Testing...');
    const uploadResults = await testUploadCardsSystem();
    
    // Test 5: Role-Based Access Control
    console.log('\n🔒 Step 5: Role-Based Access Control Testing...');
    const rbacResults = await testRoleBasedAccessControl();
    
    // Test 6: Student Content Access
    console.log('\n👨‍🎓 Step 6: Student Content Access Testing...');
    const studentResults = await testStudentContentAccess();

    // Generate Final Report
    console.log('\n📊 COMPREHENSIVE TEST RESULTS:');
    console.log('='.repeat(50));
    
    const allResults = {
      authentication: authResults,
      contentManagement: contentResults,
      simulations: simulationResults,
      uploadCards: uploadResults,
      roleBasedAccess: rbacResults,
      studentAccess: studentResults
    };
    
    generateFinalReport(allResults);

  } catch (error) {
    console.error('❌ Error in comprehensive testing:', error.message);
  }
}

async function testAuthenticationSystem() {
  const results = { total: 4, passed: 0, failed: 0 };
  
  const users = [
    { email: 'test-admin@aura.ca', password: 'test123', role: 'Admin' },
    { email: 'periclesngon01@gmail.com', password: 'pepe01', role: 'Senior Manager' },
    { email: 'stacyjordan@gmail.com', password: 'pepe01', role: 'Junior Manager' },
    { email: 'timaclaude@gmail.com', password: 'password123', role: 'Student' }
  ];
  
  for (const user of users) {
    const token = await login(user.email, user.password);
    if (token) {
      console.log(`   ✅ ${user.role} Authentication: PASS`);
      results.passed++;
    } else {
      console.log(`   ❌ ${user.role} Authentication: FAIL`);
      results.failed++;
    }
  }
  
  return results;
}

async function testContentManagementSystem() {
  const results = { total: 6, passed: 0, failed: 0 };
  const adminToken = await login('test-admin@aura.ca', 'test123');
  
  if (!adminToken) {
    console.log('   ❌ Cannot test content management - admin login failed');
    return { total: 6, passed: 0, failed: 6 };
  }
  
  const tests = [
    { endpoint: '/api/content-management/management', name: 'Content List' },
    { endpoint: '/api/content-management/courses', name: 'Student Courses' },
    { endpoint: '/api/content-management/management?level=B1', name: 'Level Filter' },
    { endpoint: '/api/content-management/management?contentType=NOTE', name: 'Type Filter' },
    { endpoint: '/api/content-management/management?search=test', name: 'Search Filter' },
    { endpoint: '/api/content-management/management?limit=10', name: 'Pagination' }
  ];
  
  for (const test of tests) {
    const success = await testEndpoint('GET', test.endpoint, adminToken, test.name);
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  return results;
}

async function testSimulationSystems() {
  const results = { total: 6, passed: 0, failed: 0 };
  const studentToken = await login('timaclaude@gmail.com', 'password123');
  
  if (!studentToken) {
    console.log('   ❌ Cannot test simulations - student login failed');
    return { total: 6, passed: 0, failed: 6 };
  }
  
  const tests = [
    { endpoint: '/api/voice-simulation/vapi-config', name: 'VAPI Config', token: null },
    { endpoint: '/api/voice-simulation/voices', name: 'Available Voices', token: null },
    { endpoint: '/api/voice-simulation/monthly-count', name: 'Voice Monthly Count', token: studentToken },
    { endpoint: '/api/voice-simulation/history', name: 'Voice History', token: studentToken },
    { endpoint: '/api/immigration-simulation/monthly-count/user', name: 'Immigration Monthly Count', token: studentToken },
    { endpoint: '/api/immigration-simulation/history/user', name: 'Immigration History', token: studentToken }
  ];
  
  for (const test of tests) {
    const success = await testEndpoint('GET', test.endpoint, test.token, test.name);
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  return results;
}

async function testUploadCardsSystem() {
  const results = { total: 6, passed: 0, failed: 0 };
  const adminToken = await login('test-admin@aura.ca', 'test123');
  
  if (!adminToken) {
    console.log('   ❌ Cannot test upload cards - admin login failed');
    return { total: 6, passed: 0, failed: 6 };
  }
  
  const uploadCards = [
    { name: 'Course Material', contentType: 'NOTE', category: 'GRAMMAR' },
    { name: 'Video Content', contentType: 'VIDEO', category: 'LISTENING' },
    { name: 'Test/Assessment', contentType: 'TEST', category: 'READING' },
    { name: 'TCF/TEF Simulation', contentType: 'SIMULATION', category: 'TCF_TEF' },
    { name: 'Note/Document', contentType: 'NOTE', category: 'VOCABULARY' },
    { name: 'TCF/TEF Corrections', contentType: 'CORRIGER_TCF', category: 'TCF_TEF' }
  ];
  
  for (const card of uploadCards) {
    const uploadData = {
      title: `Test ${card.name}`,
      description: `Test upload for ${card.name}`,
      level: 'B1',
      category: card.category,
      subscriptionTier: 'FREE',
      contentType: card.contentType,
      language: 'fr'
    };
    
    const success = await testUpload(adminToken, card.name, uploadData);
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  return results;
}

async function testRoleBasedAccessControl() {
  const results = { total: 4, passed: 0, failed: 0 };
  const juniorManagerToken = await login('stacyjordan@gmail.com', 'pepe01');
  
  if (!juniorManagerToken) {
    console.log('   ❌ Cannot test RBAC - junior manager login failed');
    return { total: 4, passed: 0, failed: 4 };
  }
  
  // Test junior manager restrictions
  const restrictionTests = [
    {
      name: 'Junior Manager Content List (Should be Limited)',
      test: async () => {
        const data = await getEndpointData('/api/content-management/management', juniorManagerToken);
        return data && data.content && data.content.length < 20; // Should see limited content
      }
    },
    {
      name: 'Junior Manager A1 Upload (Should Succeed)',
      test: async () => {
        const uploadData = {
          title: 'A1 Test Content',
          description: 'A1 level test',
          level: 'A1',
          category: 'GRAMMAR',
          subscriptionTier: 'FREE',
          contentType: 'NOTE',
          language: 'fr'
        };
        return await testUpload(juniorManagerToken, 'A1 Content', uploadData);
      }
    },
    {
      name: 'Junior Manager C2 Upload (Should Fail)',
      test: async () => {
        const uploadData = {
          title: 'C2 Test Content',
          description: 'C2 level test',
          level: 'C2',
          category: 'GRAMMAR',
          subscriptionTier: 'FREE',
          contentType: 'NOTE',
          language: 'fr'
        };
        const success = await testUpload(juniorManagerToken, 'C2 Content', uploadData);
        return !success; // Should fail
      }
    },
    {
      name: 'Junior Manager Audio Simulation (Should Fail)',
      test: async () => {
        const uploadData = {
          title: 'Audio Simulation',
          description: 'Audio simulation test',
          level: 'A1',
          category: 'ORAL',
          subscriptionTier: 'FREE',
          contentType: 'SIMULATION',
          language: 'fr'
        };
        const success = await testUpload(juniorManagerToken, 'Audio Simulation', uploadData);
        return !success; // Should fail
      }
    }
  ];
  
  for (const test of restrictionTests) {
    try {
      const passed = await test.test();
      if (passed) {
        console.log(`   ✅ ${test.name}: PASS`);
        results.passed++;
      } else {
        console.log(`   ❌ ${test.name}: FAIL`);
        results.failed++;
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ERROR - ${error.message}`);
      results.failed++;
    }
  }
  
  return results;
}

async function testStudentContentAccess() {
  const results = { total: 4, passed: 0, failed: 0 };
  const studentToken = await login('timaclaude@gmail.com', 'password123');
  
  if (!studentToken) {
    console.log('   ❌ Cannot test student access - student login failed');
    return { total: 4, passed: 0, failed: 4 };
  }
  
  const tests = [
    { endpoint: '/api/content-management/courses', name: 'Course Content Access' },
    { endpoint: '/api/content-management/courses?level=B1', name: 'Level-based Filtering' },
    { endpoint: '/api/content-management/courses?subscriptionTier=PRO', name: 'Subscription-based Filtering' },
    { endpoint: '/api/content-management/courses?limit=5', name: 'Pagination Support' }
  ];
  
  for (const test of tests) {
    const success = await testEndpoint('GET', test.endpoint, studentToken, test.name);
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  return results;
}

function generateFinalReport(results) {
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  
  Object.values(results).forEach(result => {
    totalTests += result.total;
    totalPassed += result.passed;
    totalFailed += result.failed;
  });
  
  const successRate = Math.round((totalPassed / totalTests) * 100);
  
  console.log(`📊 Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`📈 Success Rate: ${successRate}%`);
  console.log('');
  
  // Detailed breakdown
  console.log('📋 Detailed Results:');
  Object.entries(results).forEach(([system, result]) => {
    const rate = Math.round((result.passed / result.total) * 100);
    const icon = rate === 100 ? '✅' : rate >= 80 ? '⚠️' : '❌';
    console.log(`   ${icon} ${system}: ${result.passed}/${result.total} (${rate}%)`);
  });
  
  console.log('');
  if (successRate >= 95) {
    console.log('🎉 PLATFORM STATUS: PRODUCTION READY!');
    console.log('✅ All critical systems are functional');
  } else if (successRate >= 80) {
    console.log('⚠️ PLATFORM STATUS: MOSTLY FUNCTIONAL');
    console.log('🔧 Some systems need attention');
  } else {
    console.log('❌ PLATFORM STATUS: NEEDS WORK');
    console.log('🚨 Critical issues need to be addressed');
  }
}

// Helper functions
async function login(email, password) {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({ email, password });
    const options = {
      hostname: 'localhost', port: 3001, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(res.statusCode === 200 && response.success ? response.data.tokens.accessToken : null);
        } catch (err) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(loginData);
    req.end();
  });
}

async function testEndpoint(method, path, token, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost', port: 3001, path: path, method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        const success = res.statusCode < 400;
        const icon = success ? '✅' : '❌';
        console.log(`   ${icon} ${name}: ${res.statusCode}`);
        resolve(success);
      });
    });
    req.on('error', (err) => {
      console.log(`   ❌ ${name}: Request failed`);
      resolve(false);
    });
    req.end();
  });
}

async function testUpload(token, name, uploadData) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(uploadData);
    const options = {
      hostname: 'localhost', port: 3001, path: '/api/content-management/upload', method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    };
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        const success = res.statusCode < 400;
        const icon = success ? '✅' : '❌';
        console.log(`   ${icon} ${name}: ${res.statusCode}`);
        resolve(success);
      });
    });
    req.on('error', () => {
      console.log(`   ❌ ${name}: Request failed`);
      resolve(false);
    });
    req.write(postData);
    req.end();
  });
}

async function getEndpointData(path, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost', port: 3001, path: path, method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          resolve(res.statusCode === 200 && response.success ? response.data : null);
        } catch (err) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

comprehensiveTestingProtocol();
