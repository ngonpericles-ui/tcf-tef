import Redis from 'ioredis';
export declare const redis: Redis | null;
export declare const redisPubClient: Redis | null;
export declare const redisSubClient: Redis;
export declare const messageQueueRedis: Redis | null;
export declare const cacheRedis: Redis | null;
export declare const rateLimitRedis: Redis | null;
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
export declare const monitoringRedis: Redis | null;
export declare const testRedis: Redis;
export declare const createRedisCluster: () => import("ioredis").Cluster;
export declare const createRedisSentinel: () => Redis;
export declare const checkRedisHealth: () => Promise<boolean>;
export declare const getRedisInfo: () => Promise<{
    status: string;
    message: string;
    info?: undefined;
    error?: undefined;
} | {
    status: string;
    info: Record<string, string>;
    message?: undefined;
    error?: undefined;
} | {
    status: string;
    error: any;
    message?: undefined;
    info?: undefined;
}>;
export declare const shutdownRedis: () => Promise<void>;
export default redis;
//# sourceMappingURL=redis.d.ts.map