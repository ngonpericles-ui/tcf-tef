export interface DailyGoal {
    id: string;
    userId: string;
    title: string;
    description?: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    xpReward: number;
    isCompleted: boolean;
    completedAt?: Date;
    targetDate: Date;
    progress: number;
}
export declare class DailyGoalService {
    static getTodayGoal(userId: string): Promise<DailyGoal | null>;
    static setDailyGoal(userId: string, data: {
        title: string;
        description?: string;
        targetValue: number;
        unit?: string;
        xpReward?: number;
    }): Promise<DailyGoal>;
    static updateProgress(userId: string, progressValue: number): Promise<DailyGoal | null>;
    private static awardXP;
    static completeGoal(userId: string): Promise<DailyGoal | null>;
}
//# sourceMappingURL=dailyGoalService.d.ts.map