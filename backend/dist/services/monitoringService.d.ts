export declare class MonitoringService {
    private metrics;
    private alerts;
    private isMonitoring;
    constructor();
    private initializeMetrics;
    private setupAlerts;
    start(): void;
    stop(): void;
    private collectMetrics;
    private checkAlerts;
    private triggerAlert;
    private sendCriticalAlert;
    private storeMetrics;
    private cleanupOldMetrics;
    incrementCounter(metricName: string, value?: number): void;
    setGauge(metricName: string, value: number): void;
    recordTiming(metricName: string, duration: number): void;
    getMetrics(): {
        [k: string]: number;
    };
    getMetricsForTimeRange(metricName: string, startTime: number, endTime: number): Promise<{
        timestamp: number;
        value: number;
    }[]>;
    getRecentAlerts(limit?: number): Promise<any[]>;
    getHealthStatus(): Promise<{
        status: string;
        timestamp: Date;
        metrics: {
            [k: string]: number;
        };
        alerts: any[];
        services: {
            database: {
                status: string;
                responseTime: number;
                error?: undefined;
            } | {
                status: string;
                error: any;
                responseTime?: undefined;
            };
            redis: {
                status: string;
                responseTime: number;
                error?: undefined;
            } | {
                status: string;
                error: any;
                responseTime?: undefined;
            };
            websocket: {
                status: string;
                activeConnections: number;
            };
        };
    } | {
        status: string;
        timestamp: Date;
        error: any;
    }>;
    private checkDatabaseHealth;
    private checkRedisHealth;
    private checkWebSocketHealth;
    generatePerformanceReport(): Promise<{
        timestamp: Date;
        period: string;
        summary: {
            totalMessages: number;
            totalConnections: number;
            averageProcessingTime: number;
            errorRate: number;
            memoryUsage: number;
            cpuUsage: number;
        };
        trends: {
            messagesPerHour: {
                timestamp: number;
                value: number;
            }[];
            connectionsPerHour: {
                timestamp: number;
                value: number;
            }[];
            errorRatePerHour: {
                timestamp: number;
                value: number;
            }[];
        };
        alerts: any[];
        recommendations: any[];
    } | {
        error: any;
    }>;
    private generateRecommendations;
}
export declare const monitoringService: MonitoringService;
export default monitoringService;
//# sourceMappingURL=monitoringService.d.ts.map