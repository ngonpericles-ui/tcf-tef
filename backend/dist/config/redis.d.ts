import Redis from 'ioredis';
export declare const redis: Redis;
export declare const redisPubClient: Redis;
export declare const redisSubClient: Redis;
export declare const messageQueueRedis: Redis;
export declare const cacheRedis: Redis;
export declare const rateLimitRedis: Redis;
export declare const sessionRedis: Redis;
export declare const presenceRedis: Redis;
export declare const typingRedis: Redis;
export declare const notificationRedis: Redis;
export declare const analyticsRedis: Redis;
export declare const searchRedis: Redis;
export declare const uploadRedis: Redis;
export declare const encryptionRedis: Redis;
export declare const webhookRedis: Redis;
export declare const deadLetterRedis: Redis;
export declare const monitoringRedis: Redis;
export declare const testRedis: Redis;
export declare const createRedisCluster: () => import("ioredis").Cluster;
export declare const createRedisSentinel: () => Redis;
export declare const checkRedisHealth: () => Promise<boolean>;
export declare const getRedisInfo: () => Promise<{
    status: string;
    info: Record<string, string>;
    error?: undefined;
} | {
    status: string;
    error: any;
    info?: undefined;
}>;
export declare const shutdownRedis: () => Promise<void>;
export default redis;
//# sourceMappingURL=redis.d.ts.map