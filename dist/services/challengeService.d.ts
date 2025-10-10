export interface DailyChallenge {
    id: string;
    title: {
        fr: string;
        en: string;
    };
    description: {
        fr: string;
        en: string;
    };
    reward: {
        fr: string;
        en: string;
    };
    difficulty: string;
    duration: string;
    xpReward: number;
    badgeReward?: string;
    isActive: boolean;
    category: string;
}
export interface UserProgress {
    completedChallenges: number;
    totalXp: number;
    badges: string[];
    streak: number;
    lastCompleted?: string;
}
export declare class ChallengeService {
    static getDailyChallenges(): Promise<DailyChallenge[]>;
    static getUserProgress(userId: string): Promise<UserProgress>;
    static startChallenge(userId: string, challengeId: string): Promise<{
        challengeId: string;
        startedAt: string;
        message: string;
    }>;
    static completeChallenge(userId: string, challengeId: string): Promise<{
        challengeId: string;
        completedAt: string;
        xpEarned: number;
        badgeEarned: string;
        message: string;
    }>;
}
//# sourceMappingURL=challengeService.d.ts.map