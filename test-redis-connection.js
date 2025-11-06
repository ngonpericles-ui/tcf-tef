const Redis = require('ioredis');

// Test Redis connection with current environment variables
const testRedisConnection = async () => {
  console.log('🔍 Testing Redis connection...');
  
  const config = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 10000,
    enableOfflineQueue: true,
    enableReadyCheck: true,
    maxLoadingTimeout: 5000,
    tls: process.env.REDIS_HOST?.includes('redislabs.com') ? {} : undefined,
  };

  console.log('📋 Redis Configuration:');
  console.log('  Host:', config.host);
  console.log('  Port:', config.port);
  console.log('  Password:', config.password ? '***' : 'Not set');
  console.log('  DB:', config.db);
  console.log('  TLS:', config.tls ? 'Enabled' : 'Disabled');

  const redis = new Redis(config);

  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redis.on('ready', () => {
    console.log('✅ Redis ready');
  });

  redis.on('error', (error) => {
    console.error('❌ Redis error:', error.message);
  });

  redis.on('close', () => {
    console.log('⚠️ Redis connection closed');
  });

  try {
    // Test basic operations
    await redis.ping();
    console.log('✅ Redis ping successful');
    
    // Test set/get
    await redis.set('test:connection', 'success');
    const value = await redis.get('test:connection');
    console.log('✅ Redis set/get test:', value);
    
    // Test info
    const info = await redis.info('server');
    console.log('✅ Redis server info retrieved');
    
    // Cleanup
    await redis.del('test:connection');
    console.log('✅ Redis test cleanup completed');
    
    console.log('🎉 Redis connection test PASSED');
    
  } catch (error) {
    console.error('❌ Redis connection test FAILED:', error.message);
    console.error('Full error:', error);
  } finally {
    await redis.quit();
    console.log('🔌 Redis connection closed');
  }
};

// Load environment variables
require('dotenv').config({ path: '.env' });

testRedisConnection().catch(console.error);
