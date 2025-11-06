"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shutdownRedis = exports.getRedisInfo = exports.checkRedisHealth = exports.createRedisSentinel = exports.createRedisCluster = exports.testRedis = exports.monitoringRedis = exports.deadLetterRedis = exports.webhookRedis = exports.encryptionRedis = exports.uploadRedis = exports.searchRedis = exports.analyticsRedis = exports.notificationRedis = exports.typingRedis = exports.presenceRedis = exports.sessionRedis = exports.rateLimitRedis = exports.cacheRedis = exports.messageQueueRedis = exports.redisSubClient = exports.redisPubClient = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 5,
    retryDelayOnFailover: 200,
    connectTimeout: 30000,
    commandTimeout: 30000,
    lazyConnect: false,
    keepAlive: 60000,
    enableOfflineQueue: false,
    enableReadyCheck: true,
    maxLoadingTimeout: 10000,
    family: 4,
    maxMemoryPolicy: 'allkeys-lru',
    retryStrategy: (times) => {
        const delay = Math.min(times * 200, 5000);
        console.log(`Redis retry attempt ${times}, delay: ${delay}ms`);
        return delay;
    },
};
exports.redis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:messaging:',
});
exports.redisPubClient = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:socketio:',
});
exports.redisSubClient = exports.redisPubClient.duplicate();
exports.messageQueueRedis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:queue:',
    db: 1,
    maxRetriesPerRequest: null,
    lazyConnect: false,
    keepAlive: 60000,
});
exports.cacheRedis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:cache:',
    db: 2,
    maxRetriesPerRequest: 1,
    lazyConnect: false,
});
exports.rateLimitRedis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:rate:',
    db: 3,
    maxRetriesPerRequest: 1,
    lazyConnect: false,
});
exports.sessionRedis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:session:',
});
exports.presenceRedis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:presence:',
});
exports.typingRedis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:typing:',
});
exports.notificationRedis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:notification:',
});
exports.analyticsRedis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:analytics:',
});
exports.searchRedis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:search:',
});
exports.uploadRedis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:upload:',
});
exports.encryptionRedis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:encryption:',
});
exports.webhookRedis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:webhook:',
});
exports.deadLetterRedis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:deadletter:',
});
exports.monitoringRedis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:monitoring:',
});
exports.testRedis = new ioredis_1.default({
    ...redisConfig,
    keyPrefix: 'aura:test:',
});
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
const setupRedisEventHandlers = (client, name) => {
    client.on('connect', () => {
        logger_1.logger.info(`Redis ${name} connected`);
    });
    client.on('ready', () => {
        logger_1.logger.info(`Redis ${name} ready`);
    });
    client.on('error', (error) => {
        logger_1.logger.error(`Redis ${name} error:`, error);
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
};
setupRedisEventHandlers(exports.redis, 'main');
setupRedisEventHandlers(exports.redisPubClient, 'pub');
setupRedisEventHandlers(exports.redisSubClient, 'sub');
setupRedisEventHandlers(exports.messageQueueRedis, 'queue');
setupRedisEventHandlers(exports.cacheRedis, 'cache');
setupRedisEventHandlers(exports.sessionRedis, 'session');
setupRedisEventHandlers(exports.rateLimitRedis, 'ratelimit');
setupRedisEventHandlers(exports.presenceRedis, 'presence');
setupRedisEventHandlers(exports.typingRedis, 'typing');
setupRedisEventHandlers(exports.notificationRedis, 'notification');
setupRedisEventHandlers(exports.analyticsRedis, 'analytics');
setupRedisEventHandlers(exports.searchRedis, 'search');
setupRedisEventHandlers(exports.uploadRedis, 'upload');
setupRedisEventHandlers(exports.encryptionRedis, 'encryption');
setupRedisEventHandlers(exports.webhookRedis, 'webhook');
setupRedisEventHandlers(exports.deadLetterRedis, 'deadletter');
setupRedisEventHandlers(exports.monitoringRedis, 'monitoring');
setupRedisEventHandlers(exports.testRedis, 'test');
const checkRedisHealth = async () => {
    try {
        await exports.redis.ping();
        return true;
    }
    catch (error) {
        logger_1.logger.error('Redis health check failed:', error);
        return false;
    }
};
exports.checkRedisHealth = checkRedisHealth;
const getRedisInfo = async () => {
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
            error: error.message
        };
    }
};
exports.getRedisInfo = getRedisInfo;
const shutdownRedis = async () => {
    logger_1.logger.info('Shutting down Redis connections...');
    const clients = [
        exports.redis, exports.redisPubClient, exports.redisSubClient, exports.messageQueueRedis,
        exports.cacheRedis, exports.sessionRedis, exports.rateLimitRedis, exports.presenceRedis,
        exports.typingRedis, exports.notificationRedis, exports.analyticsRedis, exports.searchRedis,
        exports.uploadRedis, exports.encryptionRedis, exports.webhookRedis, exports.deadLetterRedis,
        exports.monitoringRedis, exports.testRedis
    ];
    await Promise.all(clients.map(client => client.quit()));
    logger_1.logger.info('All Redis connections closed');
};
exports.shutdownRedis = shutdownRedis;
process.on('SIGINT', exports.shutdownRedis);
process.on('SIGTERM', exports.shutdownRedis);
process.on('beforeExit', exports.shutdownRedis);
exports.default = exports.redis;
//# sourceMappingURL=redis.js.map