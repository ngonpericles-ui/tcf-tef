"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringService = exports.MonitoringService = void 0;
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
const database_1 = require("../config/database");
class MonitoringService {
    constructor() {
        this.metrics = new Map();
        this.alerts = new Map();
        this.isMonitoring = false;
        this.initializeMetrics();
        this.setupAlerts();
    }
    initializeMetrics() {
        this.metrics.set('messages_sent_total', 0);
        this.metrics.set('messages_delivered_total', 0);
        this.metrics.set('messages_read_total', 0);
        this.metrics.set('active_connections', 0);
        this.metrics.set('active_conversations', 0);
        this.metrics.set('queue_length', 0);
        this.metrics.set('processing_time_avg', 0);
        this.metrics.set('error_rate', 0);
        this.metrics.set('memory_usage', 0);
        this.metrics.set('cpu_usage', 0);
        this.metrics.set('database_connections', 0);
        this.metrics.set('redis_connections', 0);
        this.metrics.set('websocket_connections', 0);
        this.metrics.set('api_requests_total', 0);
        this.metrics.set('api_requests_success', 0);
        this.metrics.set('api_requests_error', 0);
        this.metrics.set('cache_hits', 0);
        this.metrics.set('cache_misses', 0);
        this.metrics.set('search_queries', 0);
        this.metrics.set('file_uploads', 0);
        this.metrics.set('notifications_sent', 0);
        this.metrics.set('encryption_operations', 0);
        this.metrics.set('webhook_calls', 0);
    }
    setupAlerts() {
        this.alerts.set('high_error_rate', {
            threshold: 0.05,
            condition: (value) => value > 0.05,
            message: 'High error rate detected',
            severity: 'critical'
        });
        this.alerts.set('high_memory_usage', {
            threshold: 0.9,
            condition: (value) => value > 0.9,
            message: 'High memory usage detected',
            severity: 'warning'
        });
        this.alerts.set('high_queue_length', {
            threshold: 1000,
            condition: (value) => value > 1000,
            message: 'High message queue length detected',
            severity: 'warning'
        });
        this.alerts.set('low_connections', {
            threshold: 10,
            condition: (value) => value < 10,
            message: 'Low active connections detected',
            severity: 'info'
        });
        this.alerts.set('high_processing_time', {
            threshold: 5000,
            condition: (value) => value > 5000,
            message: 'High message processing time detected',
            severity: 'warning'
        });
    }
    start() {
        if (this.isMonitoring) {
            logger_1.logger.warn('Monitoring service is already running');
            return;
        }
        this.isMonitoring = true;
        logger_1.logger.info('Starting monitoring service');
        setInterval(() => {
            this.collectMetrics();
        }, 30000);
        setInterval(() => {
            this.checkAlerts();
        }, 60000);
        setInterval(() => {
            this.storeMetrics();
        }, 300000);
        setInterval(() => {
            this.cleanupOldMetrics();
        }, 3600000);
    }
    stop() {
        this.isMonitoring = false;
        logger_1.logger.info('Stopping monitoring service');
    }
    async collectMetrics() {
        try {
            const memoryUsage = process.memoryUsage();
            this.metrics.set('memory_usage', memoryUsage.heapUsed / memoryUsage.heapTotal);
            const cpuUsage = process.cpuUsage();
            this.metrics.set('cpu_usage', cpuUsage.user + cpuUsage.system);
            try {
                const dbConnections = await database_1.prisma.$queryRaw `SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'`;
                this.metrics.set('database_connections', dbConnections[0].count);
            }
            catch (error) {
                logger_1.logger.error('Failed to get database connections:', error);
            }
            try {
                const redisInfo = await redis_1.monitoringRedis.info('clients');
                const connectedClients = redisInfo.match(/connected_clients:(\d+)/);
                if (connectedClients) {
                    this.metrics.set('redis_connections', parseInt(connectedClients[1]));
                }
            }
            catch (error) {
                logger_1.logger.error('Failed to get Redis connections:', error);
            }
            try {
                const queueLength = await redis_1.monitoringRedis.llen('message_queue');
                this.metrics.set('queue_length', queueLength);
            }
            catch (error) {
                logger_1.logger.error('Failed to get queue length:', error);
            }
            try {
                const activeConversations = await database_1.prisma.chatSession.count({
                    where: { isActive: true }
                });
                this.metrics.set('active_conversations', activeConversations);
            }
            catch (error) {
                logger_1.logger.error('Failed to get active conversations:', error);
            }
            const totalRequests = this.metrics.get('api_requests_total') || 0;
            const errorRequests = this.metrics.get('api_requests_error') || 0;
            const errorRate = totalRequests > 0 ? errorRequests / totalRequests : 0;
            this.metrics.set('error_rate', errorRate);
            logger_1.logger.debug('Metrics collected', {
                memoryUsage: this.metrics.get('memory_usage'),
                cpuUsage: this.metrics.get('cpu_usage'),
                databaseConnections: this.metrics.get('database_connections'),
                redisConnections: this.metrics.get('redis_connections'),
                queueLength: this.metrics.get('queue_length'),
                activeConversations: this.metrics.get('active_conversations'),
                errorRate: this.metrics.get('error_rate')
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to collect metrics:', error);
        }
    }
    checkAlerts() {
        this.alerts.forEach((alert, alertName) => {
            const metricValue = this.metrics.get(alertName.replace('_alert', ''));
            if (metricValue !== undefined && alert.condition(metricValue)) {
                this.triggerAlert(alertName, alert, metricValue);
            }
        });
    }
    async triggerAlert(alertName, alert, value) {
        const alertData = {
            name: alertName,
            message: alert.message,
            severity: alert.severity,
            value: value,
            threshold: alert.threshold,
            timestamp: new Date(),
            resolved: false
        };
        await redis_1.monitoringRedis.lpush('alerts', JSON.stringify(alertData));
        logger_1.logger.warn('Alert triggered', alertData);
        if (alert.severity === 'critical') {
            await this.sendCriticalAlert(alertData);
        }
    }
    async sendCriticalAlert(alertData) {
        try {
            logger_1.logger.error('CRITICAL ALERT', alertData);
            await redis_1.monitoringRedis.hset('critical_alerts', alertData.name, JSON.stringify(alertData));
        }
        catch (error) {
            logger_1.logger.error('Failed to send critical alert:', error);
        }
    }
    async storeMetrics() {
        try {
            const timestamp = Date.now();
            const metricsData = {
                timestamp,
                metrics: Object.fromEntries(this.metrics)
            };
            await redis_1.monitoringRedis.setex(`metrics:${timestamp}`, 604800, JSON.stringify(metricsData));
            const pipeline = redis_1.monitoringRedis.pipeline();
            this.metrics.forEach((value, key) => {
                pipeline.zadd(`metrics:${key}`, timestamp, value);
            });
            await pipeline.exec();
            logger_1.logger.debug('Metrics stored in Redis', { timestamp, count: this.metrics.size });
        }
        catch (error) {
            logger_1.logger.error('Failed to store metrics:', error);
        }
    }
    async cleanupOldMetrics() {
        try {
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            const pipeline = redis_1.monitoringRedis.pipeline();
            this.metrics.forEach((_, key) => {
                pipeline.zremrangebyscore(`metrics:${key}`, 0, oneWeekAgo);
            });
            await pipeline.exec();
            await redis_1.monitoringRedis.ltrim('alerts', 0, 999);
            logger_1.logger.info('Old metrics cleaned up');
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup old metrics:', error);
        }
    }
    incrementCounter(metricName, value = 1) {
        const current = this.metrics.get(metricName) || 0;
        this.metrics.set(metricName, current + value);
    }
    setGauge(metricName, value) {
        this.metrics.set(metricName, value);
    }
    recordTiming(metricName, duration) {
        const current = this.metrics.get(metricName) || 0;
        const count = this.metrics.get(`${metricName}_count`) || 0;
        const newAverage = (current * count + duration) / (count + 1);
        this.metrics.set(metricName, newAverage);
        this.metrics.set(`${metricName}_count`, count + 1);
    }
    getMetrics() {
        return Object.fromEntries(this.metrics);
    }
    async getMetricsForTimeRange(metricName, startTime, endTime) {
        try {
            const values = await redis_1.monitoringRedis.zrangebyscore(`metrics:${metricName}`, startTime, endTime, 'WITHSCORES');
            return values.reduce((acc, value, index) => {
                if (index % 2 === 0) {
                    acc.push({
                        timestamp: parseInt(values[index + 1]),
                        value: parseFloat(value)
                    });
                }
                return acc;
            }, []);
        }
        catch (error) {
            logger_1.logger.error('Failed to get metrics for time range:', error);
            return [];
        }
    }
    async getRecentAlerts(limit = 100) {
        try {
            const alerts = await redis_1.monitoringRedis.lrange('alerts', 0, limit - 1);
            return alerts.map(alert => JSON.parse(alert));
        }
        catch (error) {
            logger_1.logger.error('Failed to get recent alerts:', error);
            return [];
        }
    }
    async getHealthStatus() {
        try {
            const health = {
                status: 'healthy',
                timestamp: new Date(),
                metrics: this.getMetrics(),
                alerts: await this.getRecentAlerts(10),
                services: {
                    database: await this.checkDatabaseHealth(),
                    redis: await this.checkRedisHealth(),
                    websocket: await this.checkWebSocketHealth()
                }
            };
            const criticalAlerts = health.alerts.filter(alert => alert.severity === 'critical');
            if (criticalAlerts.length > 0) {
                health.status = 'critical';
            }
            else if (health.alerts.some(alert => alert.severity === 'warning')) {
                health.status = 'warning';
            }
            return health;
        }
        catch (error) {
            logger_1.logger.error('Failed to get health status:', error);
            return {
                status: 'error',
                timestamp: new Date(),
                error: error.message
            };
        }
    }
    async checkDatabaseHealth() {
        try {
            await database_1.prisma.$queryRaw `SELECT 1`;
            return { status: 'healthy', responseTime: Date.now() };
        }
        catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }
    async checkRedisHealth() {
        try {
            const start = Date.now();
            await redis_1.monitoringRedis.ping();
            return { status: 'healthy', responseTime: Date.now() - start };
        }
        catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }
    async checkWebSocketHealth() {
        return { status: 'healthy', activeConnections: this.metrics.get('active_connections') || 0 };
    }
    async generatePerformanceReport() {
        try {
            const now = Date.now();
            const oneHourAgo = now - (60 * 60 * 1000);
            const oneDayAgo = now - (24 * 60 * 60 * 1000);
            const report = {
                timestamp: new Date(),
                period: '24h',
                summary: {
                    totalMessages: this.metrics.get('messages_sent_total') || 0,
                    totalConnections: this.metrics.get('active_connections') || 0,
                    averageProcessingTime: this.metrics.get('processing_time_avg') || 0,
                    errorRate: this.metrics.get('error_rate') || 0,
                    memoryUsage: this.metrics.get('memory_usage') || 0,
                    cpuUsage: this.metrics.get('cpu_usage') || 0
                },
                trends: {
                    messagesPerHour: await this.getMetricsForTimeRange('messages_sent_total', oneHourAgo, now),
                    connectionsPerHour: await this.getMetricsForTimeRange('active_connections', oneHourAgo, now),
                    errorRatePerHour: await this.getMetricsForTimeRange('error_rate', oneHourAgo, now)
                },
                alerts: await this.getRecentAlerts(50),
                recommendations: this.generateRecommendations()
            };
            return report;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate performance report:', error);
            return { error: error.message };
        }
    }
    generateRecommendations() {
        const recommendations = [];
        const errorRate = this.metrics.get('error_rate') || 0;
        if (errorRate > 0.05) {
            recommendations.push({
                type: 'error_rate',
                message: 'High error rate detected. Consider reviewing error logs and improving error handling.',
                priority: 'high'
            });
        }
        const memoryUsage = this.metrics.get('memory_usage') || 0;
        if (memoryUsage > 0.8) {
            recommendations.push({
                type: 'memory_usage',
                message: 'High memory usage detected. Consider optimizing memory usage or scaling resources.',
                priority: 'medium'
            });
        }
        const queueLength = this.metrics.get('queue_length') || 0;
        if (queueLength > 1000) {
            recommendations.push({
                type: 'queue_length',
                message: 'High message queue length detected. Consider scaling message processing workers.',
                priority: 'medium'
            });
        }
        const processingTime = this.metrics.get('processing_time_avg') || 0;
        if (processingTime > 5000) {
            recommendations.push({
                type: 'processing_time',
                message: 'High message processing time detected. Consider optimizing message processing logic.',
                priority: 'medium'
            });
        }
        return recommendations;
    }
}
exports.MonitoringService = MonitoringService;
exports.monitoringService = new MonitoringService();
exports.default = exports.monitoringService;
//# sourceMappingURL=monitoringService.js.map