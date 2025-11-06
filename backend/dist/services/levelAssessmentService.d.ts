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
            level: string;
            id: string;
            status: string;
            type: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        timeSpent: number;
        score: number;
        simulationId: string | null;
        confidence: number;
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
        testLevel: string;
        totalQuestions: number;
        correctAnswers: number;
        determinedLevel: string;
        subLevel: number;
        nextLevelRequirements: string[];
        estimatedTimeToNext: string | null;
        detailedAnalysis: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    static getCurrentLevel(userId: string): Promise<string>;
}
//# sourceMappingURL=levelAssessmentService.d.ts.map