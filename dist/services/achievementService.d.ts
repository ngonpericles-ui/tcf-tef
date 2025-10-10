export declare class AchievementService {
    static getRecentAchievements(userId: string): Promise<{
        id: string;
        title: string;
        description: string;
        icon: string;
        category: string;
        points: number;
        earnedAt: Date;
        progress: number;
        isCompleted: boolean;
    }[]>;
    static getAllAchievements(userId: string): Promise<{
        id: string;
        title: string;
        description: string;
        icon: string;
        category: string;
        points: number;
        earnedAt: Date;
        progress: number;
        isCompleted: boolean;
    }[]>;
    static getAchievementProgress(userId: string): Promise<{
        totalAchievements: number;
        completedAchievements: number;
        totalPoints: number;
        completionPercentage: number;
    }>;
    static getAchievementSummary(userId: string): Promise<{
        recentAchievements: {
            id: string;
            title: string;
            description: string;
            icon: string;
            category: string;
            points: number;
            earnedAt: Date;
            progress: number;
            isCompleted: boolean;
        }[];
        progress: {
            totalAchievements: number;
            completedAchievements: number;
            totalPoints: number;
            completionPercentage: number;
        };
        totalPoints: number;
        completionRate: number;
    }>;
}
//# sourceMappingURL=achievementService.d.ts.map