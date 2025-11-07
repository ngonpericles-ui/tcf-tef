"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shutdownRedis = exports.getRedisInfo = exports.checkRedisHealth = exports.createRedisSentinel = exports.createRedisCluster = exports.testRedis = exports.monitoringRedis = exports.deadLetterRedis = exports.webhookRedis = exports.encryptionRedis = exports.uploadRedis = exports.searchRedis = exports.analyticsRedis = exports.notificationRedis = exports.typingRedis = exports.presenceRedis = exports.sessionRedis = exports.rateLimitRedis = exports.cacheRedis = exports.messageQueueRedis = exports.redisSubClient = exports.redisPubClient = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const isRedisEnabled = !!process.env.REDIS_HOST && process.env.REDIS_HOST !== 'localhost';
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: isRedisEnabled ? 3 : null,
    retryDelayOnFailover: 200,
    connectTimeout: 10000,
    commandTimeout: 5000,
    lazyConnect: true,
    keepAlive: 60000,
    enableOfflineQueue: false,
    enableReadyCheck: true,
    maxLoadingTimeout: 5000,
    family: 4,
    maxMemoryPolicy: 'allkeys-lru',
    retryStrategy: (times) => {
        if (!isRedisEnabled || times > 5) {
            logger_1.logger.warn(`Redis connection disabled or max retries reached (${times}). Continuing without Redis.`);
            return null;
        }
        const delay = Math.min(times * 200, 2000);
        logger_1.logger.info(`Redis retry attempt ${times}, delay: ${delay}ms`);
        return delay;
    },
    reconnectOnError: (err) => {
        if (!isRedisEnabled)
            return false;
        const targetError = 'READONLY';
        return err.message.includes(targetError);
    },
};
const createSafeRedisClient = (config, name) => {
    if (!isRedisEnabled) {
        logger_1.logger.warn(`Redis ${name} disabled - REDIS_HOST not configured. Running without Redis.`);
        return null;
    }
    try {
        const client = new ioredis_1.default({
            ...config,
            ...redisConfig,
        });
        client.on('error', (error) => {
            logger_1.logger.error(`Redis ${name} error:`, error.message);
        });
        client.on('connect', () => {
            logger_1.logger.info(`Redis ${name} connected`);
        });
        client.on('ready', () => {
            logger_1.logger.info(`Redis ${name} ready`);
        });
        client.on('close', () => {
            logger_1.logger.warn(`Redis ${name} connection closed`);
        });
        client.on('reconnecting', () => {
            logger_1.logger.info(`Redis ${name} reconnecting...`);
        });
        client.on('end', () => {
            logger_1.logger.warn(`Redis ${name} connection ended`);
        });
        return client;
    }
    catch (error) {
        logger_1.logger.error(`Failed to create Redis ${name} client:`, error);
        return null;
    }
};
exports.redis = createSafeRedisClient({ keyPrefix: 'aura:messaging:' }, 'main');
exports.redisPubClient = createSafeRedisClient({ keyPrefix: 'aura:socketio:' }, 'pub');
exports.redisSubClient = exports.redisPubClient ? exports.redisPubClient.duplicate() : null;
exports.messageQueueRedis = createSafeRedisClient({
    keyPrefix: 'aura:queue:',
    db: 1,
    maxRetriesPerRequest: null,
}, 'queue');
exports.cacheRedis = createSafeRedisClient({
    keyPrefix: 'aura:cache:',
    db: 2,
    maxRetriesPerRequest: 1,
}, 'cache');
exports.rateLimitRedis = createSafeRedisClient({
    keyPrefix: 'aura:rate:',
    db: 3,
    maxRetriesPerRequest: 1,
}, 'ratelimit');
exports.sessionRedis = createSafeRedisClient({ keyPrefix: 'aura:session:' }, 'session');
exports.presenceRedis = createSafeRedisClient({ keyPrefix: 'aura:presence:' }, 'presence');
exports.typingRedis = createSafeRedisClient({ keyPrefix: 'aura:typing:' }, 'typing');
exports.notificationRedis = createSafeRedisClient({ keyPrefix: 'aura:notification:' }, 'notification');
exports.analyticsRedis = createSafeRedisClient({ keyPrefix: 'aura:analytics:' }, 'analytics');
exports.searchRedis = createSafeRedisClient({ keyPrefix: 'aura:search:' }, 'search');
exports.uploadRedis = createSafeRedisClient({ keyPrefix: 'aura:upload:' }, 'upload');
exports.encryptionRedis = createSafeRedisClient({ keyPrefix: 'aura:encryption:' }, 'encryption');
exports.webhookRedis = createSafeRedisClient({ keyPrefix: 'aura:webhook:' }, 'webhook');
exports.deadLetterRedis = createSafeRedisClient({ keyPrefix: 'aura:deadletter:' }, 'deadletter');
exports.monitoringRedis = createSafeRedisClient({ keyPrefix: 'aura:monitoring:' }, 'monitoring');
exports.testRedis = createSafeRedisClient({ keyPrefix: 'aura:test:' }, 'test');
const createRedisCluster = () => {
    if (process.env.REDIS_CLUSTER_NODES) {
        const nodes = process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
            const [host, port] = node.split(':');
            return { host, port: parseInt(port) };
        });
        return new ioredis_1.default.Cluster(nodes, {
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
exports.createRedisCluster = createRedisCluster;
const createRedisSentinel = () => {
    if (process.env.REDIS_SENTINEL_HOSTS) {
        const sentinels = process.env.REDIS_SENTINEL_HOSTS.split(',').map(host => {
            const [hostname, port] = host.split(':');
            return { host: hostname, port: parseInt(port) };
        });
        return new ioredis_1.default({
            sentinels,
            name: process.env.REDIS_SENTINEL_NAME || 'mymaster',
            password: process.env.REDIS_PASSWORD,
            keyPrefix: 'aura:messaging:',
        });
    }
    return null;
};
exports.createRedisSentinel = createRedisSentinel;
const checkRedisHealth = async () => {
    if (!isRedisEnabled || !exports.redis) {
        logger_1.logger.info('Redis health check skipped - Redis not configured');
        return false;
    }
    try {
        await exports.redis.ping();
        return true;
    }
    catch (error) {
        logger_1.logger.warn('Redis health check failed:', error);
        return false;
    }
};
exports.checkRedisHealth = checkRedisHealth;
const getRedisInfo = async () => {
    if (!isRedisEnabled || !exports.redis) {
        return {
            status: 'disabled',
            message: 'Redis is not configured'
        };
    }
    try {
        const info = await exports.redis.info();
        return {
            status: 'connected',
            info: info.split('\r\n').reduce((acc, line) => {
                if (line.includes(':')) {
                    const [key, value] = line.split(':');
                    acc[key] = value;
                }
                return acc;
            }, {})
        };
    }
    catch (error) {
        return {
            status: 'error',
            error: error?.message || 'Unknown error'
        };
    }
};
exports.getRedisInfo = getRedisInfo;
const shutdownRedis = async () => {
    if (!isRedisEnabled) {
        logger_1.logger.info('Redis shutdown skipped - Redis not configured');
        return;
    }
    logger_1.logger.info('Shutting down Redis connections...');
    const clients = [
        exports.redis, exports.redisPubClient, exports.redisSubClient, exports.messageQueueRedis,
        exports.cacheRedis, exports.sessionRedis, exports.rateLimitRedis, exports.presenceRedis,
        exports.typingRedis, exports.notificationRedis, exports.analyticsRedis, exports.searchRedis,
        exports.uploadRedis, exports.encryptionRedis, exports.webhookRedis, exports.deadLetterRedis,
        exports.monitoringRedis, exports.testRedis
    ].filter(Boolean);
    await Promise.allSettled(clients.map(client => client.quit().catch(err => logger_1.logger.warn('Error closing Redis client:', err))));
    logger_1.logger.info('All Redis connections closed');
};
exports.shutdownRedis = shutdownRedis;
process.on('SIGINT', exports.shutdownRedis);
process.on('SIGTERM', exports.shutdownRedis);
process.on('beforeExit', exports.shutdownRedis);
exports.default = exports.redis;
//# sourceMappingURL=redis.js.map