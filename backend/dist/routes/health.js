"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.healthRoutes = router;
const prisma = new client_1.PrismaClient();
router.get('/', async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            version: process.env.npm_package_version || '1.0.0',
            services: {
                database: 'connected',
                server: 'running'
            }
        };
        res.status(200).json(healthStatus);
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
                database: 'disconnected',
                server: 'running'
            },
            error: 'Database connection failed'
        };
        res.status(503).json(healthStatus);
    }
});
router.get('/detailed', async (req, res) => {
    try {
        const startTime = Date.now();
        await prisma.$queryRaw `SELECT 1`;
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