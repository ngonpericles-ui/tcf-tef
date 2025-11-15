"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.healthRoutes = router;
router.get('/', async (req, res) => {
    try {
        const [dbHealth, redisHealth] = await Promise.all([
            (0, database_1.checkDatabaseHealth)(),
            (0, redis_1.checkRedisHealth)()
        ]);
        const isHealthy = dbHealth.healthy && redisHealth;
        const healthStatus = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            version: process.env.npm_package_version || '1.0.0',
            services: {
                database: dbHealth.details,
                redis: redisHealth ? 'connected' : 'disconnected',
                server: 'running'
            }
        };
        res.status(isHealthy ? 200 : 503).json(healthStatus);
    }
    catch (error) {
        logger_1.logger.error('Health check failed', error);
        const healthStatus = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            version: process.env.npm_package_version || '1.0.0',
            services: {
                database: 'error',
                redis: 'error',
                server: 'running'
            },
            error: 'Health check failed'
        };
        res.status(503).json(healthStatus);
    }
});
router.get('/detailed', async (req, res) => {
    try {
        const startTime = Date.now();
        await database_1.prisma.$queryRaw `SELECT 1`;
        const dbResponseTime = Date.now() - startTime;
        const detailedHealth = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            version: process.env.npm_package_version || '1.0.0',
            services: {
                database: {
                    status: 'connected',
                    responseTime: `${dbResponseTime}ms`
                },
                server: {
                    status: 'running',
                    memory: {
                        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                        unit: 'MB'
                    },
                    cpu: {
                        usage: process.cpuUsage()
                    }
                }
            }
        };
        res.status(200).json(detailedHealth);
    }
    catch (error) {
        logger_1.logger.error('Detailed health check failed', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Service unavailable'
        });
    }
});
//# sourceMappingURL=health.js.map