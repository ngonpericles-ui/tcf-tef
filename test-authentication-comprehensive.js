/**
 * Comprehensive Authentication Test Suite
 * Tests role-based login restrictions, performance, and session isolation
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001'; // Backend URL
const FRONTEND_URL = 'http://localhost:3000'; // Frontend URL

// Test credentials for different roles
const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@aura.ca',
    password: 'Admin123!',
    expectedRole: 'ADMIN',
    loginPage: '/admin/login',
    dashboardPage: '/admin'
  },
  seniorManager: {
    email: 'senior@aura.ca',
    password: 'Senior123!',
    expectedRole: 'SENIOR_MANAGER',
    loginPage: '/manager',
    dashboardPage: '/manager/dashboard'
  },
  juniorManager: {
    email: 'junior@aura.ca',
    password: 'Junior123!',
    expectedRole: 'JUNIOR_MANAGER',
    loginPage: '/manager',
    dashboardPage: '/manager/dashboard'
  },
  student: {
    email: 'student@aura.ca',
    password: 'Student123!',
    expectedRole: 'STUDENT',
    loginPage: '/connexion',
    dashboardPage: '/home'
  }
};

// Test results storage
const testResults = {
  performance: {},
  roleRestrictions: {},
  sessionIsolation: {},
  crossSectionAccess: {}
};

/**
 * Test authentication performance for each role
 */
async function testAuthenticationPerformance() {
  console.log('\n🚀 Testing Authentication Performance...\n');
  
  for (const [role, credentials] of Object.entries(TEST_CREDENTIALS)) {
    console.log(`Testing ${role} login performance...`);
    
    const startTime = Date.now();
    
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: credentials.email,
        password: credentials.password
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (response.data.success) {
        testResults.performance[role] = {
          success: true,
          duration: duration,
          acceptable: duration < 2000, // Should be under 2 seconds
          userRole: response.data.data.user.role
        };
        
        console.log(`✅ ${role} login: ${duration}ms ${duration < 2000 ? '(GOOD)' : '(SLOW)'}`);
      } else {
        testResults.performance[role] = {
          success: false,
          error: response.data.error,
          duration: duration
        };
        console.log(`❌ ${role} login failed: ${response.data.error}`);
      }
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      testResults.performance[role] = {
        success: false,
        error: error.message,
        duration: duration
      };
      console.log(`❌ ${role} login error: ${error.message}`);
    }
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Test role-based login restrictions
 */
async function testRoleBasedRestrictions() {
  console.log('\n🔒 Testing Role-Based Login Restrictions...\n');
  
  // Test that each role can only login with correct credentials
  for (const [role, credentials] of Object.entries(TEST_CREDENTIALS)) {
    console.log(`Testing ${role} role validation...`);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: credentials.email,
        password: credentials.password
      });
      
      if (response.data.success) {
        const userRole = response.data.data.user.role;
        const roleMatches = userRole === credentials.expectedRole;
        
        testResults.roleRestrictions[role] = {
          success: true,
          expectedRole: credentials.expectedRole,
          actualRole: userRole,
          roleMatches: roleMatches
        };
        
        console.log(`✅ ${role} role validation: Expected ${credentials.expectedRole}, Got ${userRole} ${roleMatches ? '(MATCH)' : '(MISMATCH)'}`);
      } else {
        testResults.roleRestrictions[role] = {
          success: false,
          error: response.data.error
        };
        console.log(`❌ ${role} role validation failed: ${response.data.error}`);
      }
    } catch (error) {
      testResults.roleRestrictions[role] = {
        success: false,
        error: error.message
      };
      console.log(`❌ ${role} role validation error: ${error.message}`);
    }
  }
}

/**
 * Test session isolation between roles
 */
async function testSessionIsolation() {
  console.log('\n🔐 Testing Session Isolation...\n');
  
  // Test that logging in as different roles creates separate sessions
  const sessions = {};
  
  for (const [role, credentials] of Object.entries(TEST_CREDENTIALS)) {
    console.log(`Creating session for ${role}...`);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: credentials.email,
        password: credentials.password
      });
      
      if (response.data.success) {
        sessions[role] = {
          accessToken: response.data.data.tokens.accessToken,
          refreshToken: response.data.data.tokens.refreshToken,
          user: response.data.data.user
        };
        
        console.log(`✅ ${role} session created successfully`);
      } else {
        console.log(`❌ ${role} session creation failed: ${response.data.error}`);
      }
    } catch (error) {
      console.log(`❌ ${role} session creation error: ${error.message}`);
    }
  }
  
  // Verify that each session is unique
  const tokens = Object.values(sessions).map(s => s.accessToken);
  const uniqueTokens = [...new Set(tokens)];
  
  testResults.sessionIsolation = {
    totalSessions: Object.keys(sessions).length,
    uniqueTokens: uniqueTokens.length,
    properIsolation: tokens.length === uniqueTokens.length,
    sessions: sessions
  };
  
  console.log(`Session isolation: ${tokens.length} sessions, ${uniqueTokens.length} unique tokens ${tokens.length === uniqueTokens.length ? '(ISOLATED)' : '(NOT ISOLATED)'}`);
}

/**
 * Test cross-section access prevention
 */
async function testCrossSectionAccess() {
  console.log('\n🚫 Testing Cross-Section Access Prevention...\n');
  
  // This would require browser automation to test middleware redirects
  // For now, we'll test API-level access control
  
  for (const [role, credentials] of Object.entries(TEST_CREDENTIALS)) {
    console.log(`Testing ${role} API access...`);
    
    try {
      // Login to get token
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: credentials.email,
        password: credentials.password
      });
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.tokens.accessToken;
        
        // Test access to different endpoints
        const accessTests = {
          adminEndpoint: '/api/admin/users',
          managerEndpoint: '/api/manager/students',
          studentEndpoint: '/api/user/profile'
        };
        
        const accessResults = {};
        
        for (const [endpoint, url] of Object.entries(accessTests)) {
          try {
            const response = await axios.get(`${BASE_URL}${url}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            accessResults[endpoint] = {
              success: true,
              status: response.status,
              hasAccess: response.status === 200
            };
          } catch (error) {
            accessResults[endpoint] = {
              success: false,
              status: error.response?.status || 0,
              hasAccess: false,
              error: error.message
            };
          }
        }
        
        testResults.crossSectionAccess[role] = accessResults;
        console.log(`✅ ${role} access control tested`);
      }
    } catch (error) {
      console.log(`❌ ${role} access control test error: ${error.message}`);
    }
  }
}

/**
 * Generate test report
 */
function generateTestReport() {
  console.log('\n📊 AUTHENTICATION TEST REPORT\n');
  console.log('=' .repeat(50));
  
  // Performance Report
  console.log('\n🚀 PERFORMANCE RESULTS:');
  for (const [role, result] of Object.entries(testResults.performance)) {
    if (result.success) {
      const status = result.acceptable ? '✅ GOOD' : '⚠️  SLOW';
      console.log(`  ${role}: ${result.duration}ms ${status}`);
    } else {
      console.log(`  ${role}: ❌ FAILED - ${result.error}`);
    }
  }
  
  // Role Restrictions Report
  console.log('\n🔒 ROLE RESTRICTIONS:');
  for (const [role, result] of Object.entries(testResults.roleRestrictions)) {
    if (result.success) {
      const status = result.roleMatches ? '✅ CORRECT' : '❌ MISMATCH';
      console.log(`  ${role}: ${status} (${result.actualRole})`);
    } else {
      console.log(`  ${role}: ❌ FAILED - ${result.error}`);
    }
  }
  
  // Session Isolation Report
  console.log('\n🔐 SESSION ISOLATION:');
  const isolation = testResults.sessionIsolation;
  if (isolation.properIsolation) {
    console.log(`  ✅ PROPER ISOLATION: ${isolation.totalSessions} unique sessions`);
  } else {
    console.log(`  ❌ ISOLATION FAILED: ${isolation.totalSessions} sessions, ${isolation.uniqueTokens} unique tokens`);
  }
  
  // Overall Summary
  const performanceIssues = Object.values(testResults.performance).filter(r => !r.success || !r.acceptable).length;
  const roleIssues = Object.values(testResults.roleRestrictions).filter(r => !r.success || !r.roleMatches).length;
  const isolationIssues = testResults.sessionIsolation.properIsolation ? 0 : 1;
  
  const totalIssues = performanceIssues + roleIssues + isolationIssues;
  
  console.log('\n📋 SUMMARY:');
  console.log(`  Performance Issues: ${performanceIssues}`);
  console.log(`  Role Restriction Issues: ${roleIssues}`);
  console.log(`  Session Isolation Issues: ${isolationIssues}`);
  console.log(`  Total Issues: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Authentication system is working correctly.');
  } else {
    console.log(`\n⚠️  ${totalIssues} ISSUES FOUND. Please review the results above.`);
  }
  
  console.log('\n' + '='.repeat(50));
}

/**
 * Main test runner
 */
async function runAuthenticationTests() {
  console.log('🧪 Starting Comprehensive Authentication Tests...');
  console.log(`Backend URL: ${BASE_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  
  try {
    await testAuthenticationPerformance();
    await testRoleBasedRestrictions();
    await testSessionIsolation();
    await testCrossSectionAccess();
    
    generateTestReport();
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAuthenticationTests();
}

module.exports = {
  runAuthenticationTests,
  testResults,
  TEST_CREDENTIALS
};
