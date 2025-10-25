export interface SimulationResult {
    simulationId: string;
    testLevel: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeSpent: number;
    answers: any[];
    sectionScores?: {
        [section: string]: {
            score: number;
            maxScore: number;
            percentage: number;
        };
    };
}
export interface LevelAssessmentResult {
    determinedLevel: string;
    subLevel: number;
    confidence: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    nextLevelRequirements: string[];
    estimatedTimeToNext: string;
    detailedAnalysis: any;
}
export declare class LevelAssessmentService {
    static assessLevel(userId: string, simulationResult: SimulationResult): Promise<LevelAssessmentResult>;
    private static performAILevelAnalysis;
    private static validateLevel;
    private static fallbackLevelAnalysis;
    static getLevelHistory(userId: string): Promise<({
        simulation: {
            title: string;
            type: import(".prisma/client").$Enums.TestType;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        timeSpent: number;
        score: number;
        correctAnswers: number;
        simulationId: string | null;
        confidence: number;
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
        detailedAnalysis: import("@prisma/client/runtime/library").JsonValue;
        testLevel: string;
        totalQuestions: number;
        determinedLevel: string;
        subLevel: number;
        nextLevelRequirements: string[];
        estimatedTimeToNext: string;
    })[]>;
    static getCurrentLevel(userId: string): Promise<string>;
}
//# sourceMappingURL=levelAssessmentService.d.ts.map