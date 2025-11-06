import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Redis configuration for different use cases (Online Redis Cloud) - OPTIMIZED
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  // Enhanced retry and timeout settings
  maxRetriesPerRequest: 5,
  retryDelayOnFailover: 200,
  connectTimeout: 30000,
  commandTimeout: 30000,
  lazyConnect: false,
  keepAlive: 60000,
  // High availability settings
  enableOfflineQueue: false,
  enableReadyCheck: true,
  maxLoadingTimeout: 10000,
  // Connection pool settings
  family: 4,
  // Performance settings
  maxMemoryPolicy: 'allkeys-lru',
  // Enhanced error handling
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 200, 5000);
    console.log(`Redis retry attempt ${times}, delay: ${delay}ms`);
    return delay;
  },
  // SSL/TLS for online Redis (disabled for now due to TLS issues)
  // tls: process.env.REDIS_HOST?.includes('redis-cloud.com') ? {} : undefined,
};

// Main Redis client for general operations
export const redis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:messaging:',
});

// Redis client for Socket.IO adapter
export const redisPubClient = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:socketio:',
});

export const redisSubClient = redisPubClient.duplicate();

// Redis client for message queues (high throughput)
export const messageQueueRedis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:queue:',
  db: 1, // Use different DB for queues
  maxRetriesPerRequest: null, // For blocking operations
  lazyConnect: false,
  keepAlive: 60000,
});

// Redis client for caching (fast access)
export const cacheRedis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:cache:',
  db: 2, // Use different DB for caching
  maxRetriesPerRequest: 1,
  lazyConnect: false,
});

// Redis client for rate limiting (strict)
export const rateLimitRedis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:rate:',
  db: 3, // Use different DB for rate limiting
  maxRetriesPerRequest: 1,
  lazyConnect: false,
});

// Redis client for sessions
export const sessionRedis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:session:',
});


// Redis client for presence tracking
export const presenceRedis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:presence:',
});

// Redis client for typing indicators
export const typingRedis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:typing:',
});

// Redis client for notifications
export const notificationRedis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:notification:',
});

// Redis client for analytics
export const analyticsRedis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:analytics:',
});

// Redis client for search indexing
export const searchRedis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:search:',
});

// Redis client for file uploads
export const uploadRedis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:upload:',
});

// Redis client for encryption keys
export const encryptionRedis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:encryption:',
});

// Redis client for webhooks
export const webhookRedis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:webhook:',
});

// Redis client for dead letter queue
export const deadLetterRedis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:deadletter:',
});

// Redis client for monitoring
export const monitoringRedis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:monitoring:',
});

// Redis client for testing
export const testRedis = new Redis({
  ...redisConfig,
  keyPrefix: 'aura:test:',
});

// Redis cluster configuration (for production scaling)
export const createRedisCluster = () => {
  if (process.env.REDIS_CLUSTER_NODES) {
    const nodes = process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
      const [host, port] = node.split(':');
      return { host, port: parseInt(port) };
    });

    return new Redis.Cluster(nodes, {
      redisOptions: {
        password: process.env.REDIS_PASSWORD,
        keyPrefix: 'aura:messaging:',
      },
      enableOfflineQueue: false,
      enableReadyCheck: true,
      scaleReads: 'slave',
    });
  }
  return null;
};

// Redis Sentinel configuration (for high availability)
export const createRedisSentinel = () => {
  if (process.env.REDIS_SENTINEL_HOSTS) {
    const sentinels = process.env.REDIS_SENTINEL_HOSTS.split(',').map(host => {
      const [hostname, port] = host.split(':');
      return { host: hostname, port: parseInt(port) };
    });

    return new Redis({
      sentinels,
      name: process.env.REDIS_SENTINEL_NAME || 'mymaster',
      password: process.env.REDIS_PASSWORD,
      keyPrefix: 'aura:messaging:',
    });
  }
  return null;
};

// Connection event handlers
const setupRedisEventHandlers = (client: Redis, name: string) => {
  client.on('connect', () => {
    logger.info(`Redis ${name} connected`);
  });

  client.on('ready', () => {
    logger.info(`Redis ${name} ready`);
  });

  client.on('error', (error) => {
    logger.error(`Redis ${name} error:`, error);
  });

  client.on('close', () => {
    logger.warn(`Redis ${name} connection closed`);
  });

  client.on('reconnecting', () => {
    logger.info(`Redis ${name} reconnecting...`);
  });

  client.on('end', () => {
    logger.warn(`Redis ${name} connection ended`);
  });
};

// Setup event handlers for all Redis clients
setupRedisEventHandlers(redis, 'main');
setupRedisEventHandlers(redisPubClient, 'pub');
setupRedisEventHandlers(redisSubClient, 'sub');
setupRedisEventHandlers(messageQueueRedis, 'queue');
setupRedisEventHandlers(cacheRedis, 'cache');
setupRedisEventHandlers(sessionRedis, 'session');
setupRedisEventHandlers(rateLimitRedis, 'ratelimit');
setupRedisEventHandlers(presenceRedis, 'presence');
setupRedisEventHandlers(typingRedis, 'typing');
setupRedisEventHandlers(notificationRedis, 'notification');
setupRedisEventHandlers(analyticsRedis, 'analytics');
setupRedisEventHandlers(searchRedis, 'search');
setupRedisEventHandlers(uploadRedis, 'upload');
setupRedisEventHandlers(encryptionRedis, 'encryption');
setupRedisEventHandlers(webhookRedis, 'webhook');
setupRedisEventHandlers(deadLetterRedis, 'deadletter');
setupRedisEventHandlers(monitoringRedis, 'monitoring');
setupRedisEventHandlers(testRedis, 'test');

// Health check function
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
};

// Get Redis info
export const getRedisInfo = async () => {
  try {
    const info = await redis.info();
    return {
      status: 'connected',
      info: info.split('\r\n').reduce((acc, line) => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>)
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
};

// Graceful shutdown
export const shutdownRedis = async () => {
  logger.info('Shutting down Redis connections...');
  
  const clients = [
    redis, redisPubClient, redisSubClient, messageQueueRedis,
    cacheRedis, sessionRedis, rateLimitRedis, presenceRedis,
    typingRedis, notificationRedis, analyticsRedis, searchRedis,
    uploadRedis, encryptionRedis, webhookRedis, deadLetterRedis,
    monitoringRedis, testRedis
  ];

  await Promise.all(clients.map(client => client.quit()));
  logger.info('All Redis connections closed');
};

// Process cleanup
process.on('SIGINT', shutdownRedis);
process.on('SIGTERM', shutdownRedis);
process.on('beforeExit', shutdownRedis);

export default redis;
