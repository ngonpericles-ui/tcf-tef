export interface LevelAssessment {
    currentLevel: string;
    subLevel: number;
    confidence: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    nextLevelRequirements: string[];
    estimatedTimeToNextLevel: string;
}
export interface TestResult {
    testId: string;
    score: number;
    maxScore: number;
    percentage: number;
    sections: {
        name: string;
        score: number;
        maxScore: number;
        percentage: number;
    }[];
    completedAt: Date;
}
export declare class LevelDeterminationService {
    static determineStudentLevel(userId: string): Promise<LevelAssessment>;
    private static calculateWeightedScores;
    private static analyzeSkillPerformance;
    private static calculateLevel;
    private static calculateSubLevel;
    private static calculateConfidence;
    private static generateAssessment;
    private static getLevelRecommendations;
    private static getNextLevelRequirements;
    private static estimateTimeToNextLevel;
    private static getLevelWeight;
    private static getNextLevel;
    private static getNextLevelThreshold;
    private static getDefaultAssessment;
    private static storeAssessment;
}
//# sourceMappingURL=levelDeterminationService.d.ts.map