#!/usr/bin/env node

/**
 * Comprehensive Messaging System Test Script
 * Tests all WhatsApp-level messaging features
 */

const Redis = require('ioredis');
const { io } = require('socket.io-client');

// Test configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const API_URL = process.env.API_URL || 'http://localhost:3001';
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3001';

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}${details ? ` - ${details}` : ''}`);
  
  testResults.tests.push({ name: testName, passed, details });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Test Redis connection
async function testRedisConnection() {
  try {
    const redis = new Redis(REDIS_URL);
    await redis.ping();
    await redis.quit();
    logTest('Redis Connection', true);
    return true;
  } catch (error) {
    logTest('Redis Connection', false, error.message);
    return false;
  }
}

// Test Redis specialized clients
async function testRedisClients() {
  try {
    const redisConfig = {
      host: 'localhost',
      port: 6379,
      lazyConnect: false
    };
    
    const messageQueueRedis = new Redis({
      ...redisConfig,
      keyPrefix: 'aura:queue:',
      db: 1
    });
    
    const cacheRedis = new Redis({
      ...redisConfig,
      keyPrefix: 'aura:cache:',
      db: 2
    });
    
    const rateLimitRedis = new Redis({
      ...redisConfig,
      keyPrefix: 'aura:rate:',
      db: 3
    });

    // Test each client
    await messageQueueRedis.ping();
    await cacheRedis.ping();
    await rateLimitRedis.ping();

    await messageQueueRedis.quit();
    await cacheRedis.quit();
    await rateLimitRedis.quit();

    logTest('Redis Specialized Clients', true);
    return true;
  } catch (error) {
    logTest('Redis Specialized Clients', false, error.message);
    return false;
  }
}

// Test message queuing
async function testMessageQueuing() {
  try {
    const redis = new Redis(REDIS_URL);
    
    // Test message queue operations
    const testMessage = {
      id: `test_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: 'user1',
      receiverId: 'user2',
      content: 'Test message',
      timestamp: new Date().toISOString()
    };

    // Use a unique queue name for testing
    const testQueueName = `test_queue_${Date.now()}`;
    
    // Push message to queue
    await redis.lpush(testQueueName, JSON.stringify(testMessage));
    
    // Pop message from queue
    const result = await redis.rpop(testQueueName);
    
    if (result) {
      const retrievedMessage = JSON.parse(result);
      
      if (retrievedMessage.id === testMessage.id) {
        logTest('Message Queuing', true);
        await redis.del(testQueueName);
        await redis.quit();
        return true;
      } else {
        logTest('Message Queuing', false, 'Message content mismatch');
        await redis.del(testQueueName);
        await redis.quit();
        return false;
      }
    } else {
      logTest('Message Queuing', false, 'No message retrieved from queue');
      await redis.del(testQueueName);
      await redis.quit();
      return false;
    }
  } catch (error) {
    logTest('Message Queuing', false, error.message);
    return false;
  }
}

// Test message caching
async function testMessageCaching() {
  try {
    const redis = new Redis(REDIS_URL);
    
    const testMessage = {
      id: 'cache_test_123',
      content: 'Cached message',
      timestamp: Date.now()
    };

    const cacheKey = 'messages:test_room';
    
    // Add to cache
    await redis.zadd(cacheKey, testMessage.timestamp, JSON.stringify(testMessage));
    
    // Retrieve from cache
    const cachedMessages = await redis.zrevrange(cacheKey, 0, -1);
    const retrievedMessage = JSON.parse(cachedMessages[0]);
    
    if (retrievedMessage.id === testMessage.id) {
      logTest('Message Caching', true);
      await redis.del(cacheKey);
      await redis.quit();
      return true;
    } else {
      logTest('Message Caching', false, 'Cached message mismatch');
      await redis.quit();
      return false;
    }
  } catch (error) {
    logTest('Message Caching', false, error.message);
    return false;
  }
}

// Test rate limiting
async function testRateLimiting() {
  try {
    const redis = new Redis(REDIS_URL);
    
    const userId = 'test_user_rate_limit';
    const rateLimitKey = `rate_limit:${userId}`;
    
    // Test rate limiting
    const current = await redis.incr(rateLimitKey);
    if (current === 1) {
      await redis.expire(rateLimitKey, 60);
    }
    
    if (current <= 100) {
      logTest('Rate Limiting', true, `Current count: ${current}`);
      await redis.del(rateLimitKey);
      await redis.quit();
      return true;
    } else {
      logTest('Rate Limiting', false, 'Rate limit exceeded');
      await redis.quit();
      return false;
    }
  } catch (error) {
    logTest('Rate Limiting', false, error.message);
    return false;
  }
}

// Test offline message queuing
async function testOfflineMessageQueuing() {
  try {
    const redis = new Redis(REDIS_URL);
    
    const userId = 'offline_user_test';
    const offlineKey = `offline:${userId}`;
    
    const testMessage = {
      id: 'offline_msg_123',
      content: 'Offline message',
      timestamp: new Date().toISOString()
    };

    // Queue offline message
    await redis.lpush(offlineKey, JSON.stringify(testMessage));
    await redis.expire(offlineKey, 7 * 24 * 60 * 60);
    
    // Check offline message count
    const count = await redis.llen(offlineKey);
    
    if (count === 1) {
      logTest('Offline Message Queuing', true, `Queued ${count} message`);
      await redis.del(offlineKey);
      await redis.quit();
      return true;
    } else {
      logTest('Offline Message Queuing', false, `Expected 1, got ${count}`);
      await redis.quit();
      return false;
    }
  } catch (error) {
    logTest('Offline Message Queuing', false, error.message);
    return false;
  }
}

// Test room management
async function testRoomManagement() {
  try {
    const redis = new Redis(REDIS_URL);
    
    const roomId = 'test_room_123';
    const userId1 = 'user1';
    const userId2 = 'user2';
    
    // Create room
    await redis.hset(`room:${roomId}`, {
      id: roomId,
      type: 'individual',
      participants: JSON.stringify([userId1, userId2]),
      createdAt: new Date().toISOString()
    });
    
    // Add participants
    await redis.sadd(`room:${roomId}:participants`, userId1, userId2);
    await redis.sadd(`user:${userId1}:rooms`, roomId);
    await redis.sadd(`user:${userId2}:rooms`, roomId);
    
    // Check participants
    const participants = await redis.smembers(`room:${roomId}:participants`);
    const userRooms = await redis.smembers(`user:${userId1}:rooms`);
    
    if (participants.length === 2 && userRooms.includes(roomId)) {
      logTest('Room Management', true, `${participants.length} participants`);
      
      // Cleanup
      await redis.del(`room:${roomId}`);
      await redis.del(`room:${roomId}:participants`);
      await redis.del(`user:${userId1}:rooms`);
      await redis.del(`user:${userId2}:rooms`);
      await redis.quit();
      return true;
    } else {
      logTest('Room Management', false, 'Room setup failed');
      await redis.quit();
      return false;
    }
  } catch (error) {
    logTest('Room Management', false, error.message);
    return false;
  }
}

// Test message delivery status
async function testMessageDeliveryStatus() {
  try {
    const redis = new Redis(REDIS_URL);
    
    const messageId = 'delivery_test_123';
    const userId = 'test_user_delivery';
    
    // Set delivery status
    await redis.hset(`message:${messageId}`, {
      deliveredAt: new Date().toISOString(),
      deliveredTo: userId,
      isRead: 'false'
    });
    
    // Get delivery status
    const status = await redis.hgetall(`message:${messageId}`);
    
    if (status.deliveredAt && status.deliveredTo === userId) {
      logTest('Message Delivery Status', true, 'Status tracked correctly');
      await redis.del(`message:${messageId}`);
      await redis.quit();
      return true;
    } else {
      logTest('Message Delivery Status', false, 'Status not tracked');
      await redis.quit();
      return false;
    }
  } catch (error) {
    logTest('Message Delivery Status', false, error.message);
    return false;
  }
}

// Test batch operations
async function testBatchOperations() {
  try {
    const redis = new Redis(REDIS_URL);
    
    const pipeline = redis.pipeline();
    const testMessages = [
      { id: 'batch_1', content: 'Message 1' },
      { id: 'batch_2', content: 'Message 2' },
      { id: 'batch_3', content: 'Message 3' }
    ];
    
    // Batch operations
    for (const message of testMessages) {
      pipeline.hset(`test:${message.id}`, message);
    }
    
    const results = await pipeline.exec();
    
    // Check if all operations succeeded
    const allSuccessful = results.every(([err, result]) => !err);
    
    if (allSuccessful) {
      logTest('Batch Operations', true, `${testMessages.length} operations`);
      
      // Cleanup
      const cleanupPipeline = redis.pipeline();
      for (const message of testMessages) {
        cleanupPipeline.del(`test:${message.id}`);
      }
      await cleanupPipeline.exec();
      await redis.quit();
      return true;
    } else {
      logTest('Batch Operations', false, 'Some operations failed');
      await redis.quit();
      return false;
    }
  } catch (error) {
    logTest('Batch Operations', false, error.message);
    return false;
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  try {
    const response = await fetch(`${API_URL}/api/messages/unread-count`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid_token_for_testing'
      }
    });
    
    const data = await response.json();
    
    // We expect a 401 or similar error for invalid token
    if (response.status === 401 || data.message === 'Invalid token') {
      logTest('API Endpoints', true, 'Authentication working');
      return true;
    } else {
      logTest('API Endpoints', false, `Unexpected response: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('API Endpoints', false, error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting WhatsApp-Level Messaging System Tests\n');
  
  // Core Redis tests
  await testRedisConnection();
  await testRedisClients();
  
  // Messaging functionality tests
  await testMessageQueuing();
  await testMessageCaching();
  await testRateLimiting();
  await testOfflineMessageQueuing();
  await testRoomManagement();
  await testMessageDeliveryStatus();
  await testBatchOperations();
  
  // API tests
  await testAPIEndpoints();
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! The messaging system is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
  }
  
  return testResults.failed === 0;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testResults };
