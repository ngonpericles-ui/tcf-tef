require('dotenv').config({ path: './backend/.env' }); // Load environment variables from backend/.env

const Redis = require('ioredis');

console.log('🔍 Testing Redis Cloud connection...');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  // Try without TLS first
  // tls: process.env.REDIS_HOST?.includes('redis-cloud.com') ? {} : undefined,
  maxRetriesPerRequest: 3, // Limit retries
  enableOfflineQueue: true, // Enable offline queue
  connectTimeout: 10000,
  commandTimeout: 10000,
  lazyConnect: true, // Don't connect immediately
};

console.log('📋 Redis Configuration:');
console.log(`  Host: ${redisConfig.host}`);
console.log(`  Port: ${redisConfig.port}`);
console.log(`  Password: ${redisConfig.password ? 'Set' : 'Not set'}`);
console.log(`  DB: ${redisConfig.db}`);
console.log(`  TLS: Disabled (testing without TLS)`);

const redis = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('ready', () => {
  console.log('✅ Redis ready');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
  process.exit(1); // Exit with error code on connection error
});

redis.on('close', () => {
  console.log('🔌 Redis connection closed');
});

async function testRedis() {
  try {
    // Connect first
    await redis.connect();
    console.log('✅ Redis connection established');

    await redis.ping();
    console.log('✅ Redis ping successful');

    await redis.set('test_key', 'test_value');
    const value = await redis.get('test_key');
    if (value === 'test_value') {
      console.log('✅ Redis set/get test: success');
    } else {
      console.error('❌ Redis set/get test: failed');
      process.exit(1);
    }

    const info = await redis.info();
    console.log('✅ Redis server info retrieved');
    // console.log(info); // Uncomment to see full info

    console.log('🎉 Redis Cloud connection test PASSED');
  } catch (error) {
    console.error('❌ Redis Cloud connection test FAILED:', error);
    process.exit(1);
  } finally {
    await redis.quit();
  }
}

testRedis();
