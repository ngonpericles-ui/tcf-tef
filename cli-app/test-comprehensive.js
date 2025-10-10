#!/usr/bin/env node

import axios from 'axios';
import chalk from 'chalk';

const API_BASE_URL = 'http://localhost:3001/api';
let authToken = null;

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function for API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token || authToken) {
      config.headers.Authorization = `Bearer ${token || authToken}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error?.message || error.response.data.message || 'API Error');
    }
    throw new Error(error.message);
  }
}

// Test function wrapper
async function runTest(testName, testFunction) {
  try {
    console.log(chalk.yellow(`🧪 Testing: ${testName}`));
    await testFunction();
    console.log(chalk.green(`✅ PASSED: ${testName}`));
    testResults.passed++;
    testResults.tests.push({ name: testName, status: 'PASSED' });
  } catch (error) {
    console.log(chalk.red(`❌ FAILED: ${testName} - ${error.message}`));
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAILED', error: error.message });
  }
}

// Authentication Tests
async function testAuthentication() {
  // Test login
  const loginResult = await apiCall('POST', '/auth/login', {
    email: 'admin@tcftef.com',
    password: 'AdminTest123!'
  });

  if (!loginResult.success || !loginResult.data.tokens?.accessToken) {
    throw new Error(`Login failed or no token returned. Response: ${JSON.stringify(loginResult)}`);
  }

  authToken = loginResult.data.tokens.accessToken;

  // Test token validation
  const profileResult = await apiCall('GET', '/users/profile');
  if (!profileResult.success || !profileResult.data.user) {
    throw new Error('Token validation failed');
  }
}

// User Management Tests
async function testUserProfile() {
  const result = await apiCall('GET', '/users/profile');
  if (!result.success || !result.data.user) {
    throw new Error('Failed to get user profile');
  }
}

async function testUserDashboard() {
  const result = await apiCall('GET', '/users/dashboard');
  if (!result.success) {
    throw new Error('Failed to get user dashboard');
  }
}

// Course Management Tests
async function testCourseCreation() {
  const courseData = {
    title: 'Test French Course',
    description: 'A comprehensive test course for French learning',
    level: 'A1',
    category: 'GRAMMAR',
    duration: 120,
    price: 99.99,
    tags: ['french', 'beginner', 'test'],
    requiredTier: 'FREE',
    lessons: 10,
    difficulty: 1
  };

  const result = await apiCall('POST', '/courses', courseData);
  if (!result.success || !result.data.course) {
    throw new Error('Failed to create course');
  }

  return result.data.course.id;
}

async function testCourseRetrieval() {
  const result = await apiCall('GET', '/courses');
  if (!result.success) {
    throw new Error('Failed to retrieve courses');
  }
}

// Test Management Tests
async function testTestCreation() {
  const testData = {
    title: 'Sample French Test',
    description: 'A test for French proficiency',
    type: 'PRACTICE',
    level: 'A1',
    category: 'GRAMMAR',
    difficulty: 1,
    duration: 60,
    passingScore: 70,
    requiredTier: 'FREE',
    questionCount: 1,
    tags: ['french', 'test'],
    questions: [
      {
        question: 'What is "hello" in French?',
        type: 'MULTIPLE_CHOICE',
        options: ['Bonjour', 'Au revoir', 'Merci', 'Pardon'],
        correctAnswer: 'Bonjour',
        points: 10
      }
    ]
  };

  const result = await apiCall('POST', '/tests', testData);
  if (!result.success || !result.data.test) {
    throw new Error('Failed to create test');
  }

  return result.data.test.id;
}

async function testTestRetrieval() {
  const result = await apiCall('GET', '/tests');
  if (!result.success) {
    throw new Error('Failed to retrieve tests');
  }
}

// Admin Tests
async function testAdminDashboard() {
  const result = await apiCall('GET', '/admin/dashboard');
  if (!result.success) {
    throw new Error('Failed to get admin dashboard');
  }
}

async function testAdminUsers() {
  const result = await apiCall('GET', '/admin/users');
  if (!result.success) {
    throw new Error('Failed to get admin users');
  }
}

async function testSystemHealth() {
  const result = await apiCall('GET', '/admin/system/health');
  if (!result.success) {
    throw new Error('Failed to get system health');
  }
}

// Main test runner
async function runAllTests() {
  console.log(chalk.cyan('🚀 Starting Comprehensive Backend Testing'));
  console.log(chalk.gray('═'.repeat(60)));
  
  // Authentication Tests
  await runTest('User Authentication', testAuthentication);
  
  // User Management Tests
  await runTest('User Profile Retrieval', testUserProfile);
  await runTest('User Dashboard', testUserDashboard);
  
  // Course Management Tests
  await runTest('Course Creation', testCourseCreation);
  await runTest('Course Retrieval', testCourseRetrieval);
  
  // Test Management Tests
  await runTest('Test Creation', testTestCreation);
  await runTest('Test Retrieval', testTestRetrieval);
  
  // Admin Tests
  await runTest('Admin Dashboard', testAdminDashboard);
  await runTest('Admin User Management', testAdminUsers);
  await runTest('System Health Check', testSystemHealth);
  
  // Print Results
  console.log(chalk.gray('═'.repeat(60)));
  console.log(chalk.cyan('📊 TEST RESULTS SUMMARY'));
  console.log(chalk.green(`✅ Passed: ${testResults.passed}`));
  console.log(chalk.red(`❌ Failed: ${testResults.failed}`));
  console.log(chalk.blue(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`));
  
  if (testResults.failed > 0) {
    console.log(chalk.yellow('\n⚠️  Failed Tests:'));
    testResults.tests.filter(t => t.status === 'FAILED').forEach(test => {
      console.log(chalk.red(`   • ${test.name}: ${test.error}`));
    });
  }
  
  console.log(chalk.gray('═'.repeat(60)));
  
  if (testResults.failed === 0) {
    console.log(chalk.green('🎉 ALL TESTS PASSED! Backend system is fully functional.'));
  } else {
    console.log(chalk.yellow('⚠️  Some tests failed. Please review the errors above.'));
  }
}

// Run tests if called directly
runAllTests().catch(error => {
  console.error(chalk.red('💥 Test runner failed:', error.message));
  process.exit(1);
});

export { runAllTests, testResults };
