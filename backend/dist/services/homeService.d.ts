export interface DashboardData {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        subscriptionTier: string;
        profileImage?: string;
        createdAt: string;
    };
    analytics: {
        weeklyProgress: number;
        improvementRate: number;
        studyStreak: number;
        completedTests: number;
        averageScore: number;
        timeStudied: string;
        weakAreas: string[];
        strongAreas: string[];
        nextRecommendations: any[];
    };
    studySession: {
        isActive: boolean;
        startTime?: string;
        currentDuration: number;
        dailyGoal: number;
        progress: number;
    };
    daysOnPlatform: number;
    regionalTime: {
        time: string;
        date: string;
        timezone: string;
    };
}
export interface AIMessages {
    greeting: string;
    motivation: string;
    weather: string;
}
export interface StudySessionData {
    isActive: boolean;
    startTime?: string;
    currentDuration: number;
    dailyGoal: number;
    progress: number;
    totalTimeToday: number;
    targetTime?: number;
}
export declare class HomeService {
    static getDashboardData(userId: string): Promise<DashboardData>;
    static getAIMessages(userId: string): Promise<AIMessages>;
    static getStudySessionDataOptimized(userId: string): Promise<StudySessionData>;
    static getStudySessionData(userId: string): Promise<StudySessionData>;
    static startStudySession(userId: string, targetTime?: number): Promise<{
        isActive: boolean;
        startTime: string;
        targetTime: number;
        message: string;
    }>;
    static stopStudySession(userId: string): Promise<{
        isActive: boolean;
        message: string;
    }>;
    static resetStudySession(userId: string): Promise<{
        isActive: boolean;
        message: string;
    }>;
    static getDaysOnPlatform(userId: string): Promise<number>;
    static getRegionalTimeDataOptimized(country: string): Promise<{
        time: string;
        date: string;
        timezone: string;
    }>;
    static getRegionalTimeData(userId: string): Promise<{
        time: string;
        date: string;
        timezone: string;
    }>;
    private static getAnalyticsDataOptimized;
    private static getAnalyticsData;
    private static calculateStudyStreak;
    private static formatDuration;
    private static getTimezoneFromCountry;
}
//# sourceMappingURL=homeService.d.ts.map