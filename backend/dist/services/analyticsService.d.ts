import { AnalyticsData } from '@/types';
import { UserRole } from '@prisma/client';
export declare class AnalyticsService {
    static getDashboardAnalytics(userRole: UserRole): Promise<AnalyticsData>;
    static trackEvent(eventType: string, eventData: any, userId?: string, sessionId?: string, userAgent?: string, ipAddress?: string): Promise<void>;
    private static getUserGrowthData;
    private static getCourseCompletionData;
    private static getTestScoreData;
    private static getRevenueData;
    static getUserActivityAnalytics(userId: string, days?: number): Promise<any>;
    static getSystemMetrics(userRole: UserRole): Promise<any>;
}
//# sourceMappingURL=analyticsService.d.ts.map