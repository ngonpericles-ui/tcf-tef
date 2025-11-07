export interface TeacherFeedbackRequest {
    userId: string;
    simulationId: string;
    simulationTitle: string;
    answers: Record<string, string>;
    questions: Array<{
        id: string;
        type: 'MCQ' | 'FILL_IN' | 'TRUE_FALSE' | 'ESSAY' | 'AUDIO_RESPONSE';
        questionText: string;
        correctAnswer?: string;
        options?: string[];
        points: number;
        section: string;
    }>;
    timeSpent: number;
    totalDuration: number;
}
export interface TeacherFeedbackResult {
    id: string;
    overallScore: number;
    maxScore: number;
    confidence: number;
    canGradeTo100Percent: boolean;
    overallFeedback: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    detailedAnalysis: {
        questionAnalysis: Array<{
            questionId: string;
            studentAnswer: string;
            correctAnswer?: string;
            isCorrect: boolean;
            points: number;
            maxPoints: number;
            teacherComments: string;
            mistakeType?: string;
            correction?: string;
            explanation?: string;
        }>;
        sectionAnalysis: Array<{
            section: string;
            score: number;
            maxScore: number;
            feedback: string;
        }>;
        unclearResponses: string[];
        uniqueLanguageStyles: string[];
        grammarErrors: Array<{
            error: string;
            correction: string;
            explanation: string;
        }>;
        vocabularyNotes: Array<{
            word: string;
            usage: string;
            suggestion: string;
        }>;
    };
}
export declare class AITeacherFeedbackService {
    static generateTeacherFeedback(request: TeacherFeedbackRequest): Promise<TeacherFeedbackResult>;
    private static analyzeStudentWork;
    private static analyzeQuestion;
    private static calculateStringSimilarity;
    private static levenshteinDistance;
    private static generateSectionFeedback;
    private static generateAITeacherComments;
    private static generateFallbackTeacherFeedback;
    private static calculateScoresAndConfidence;
    private static saveFeedbackToDatabase;
    static getTeacherFeedbackById(feedbackId: string, userId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        maxScore: number;
        simulationResultId: string | null;
        submissionType: string;
        submissionContent: string | null;
        submissionFileUrl: string | null;
        aiScore: number;
        aiConfidence: number;
        overallFeedback: string;
        strengths: import("@prisma/client/runtime/library").JsonValue;
        weaknesses: import("@prisma/client/runtime/library").JsonValue;
        recommendations: import("@prisma/client/runtime/library").JsonValue;
        detailedAnalysis: import("@prisma/client/runtime/library").JsonValue;
        humanReviewerId: string | null;
        humanReviewerName: string | null;
        humanFeedback: string | null;
        humanScore: number | null;
        humanReviewDate: Date | null;
    }>;
    static getTeacherFeedbacksForUser(userId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        maxScore: number;
        simulationResultId: string | null;
        submissionType: string;
        submissionContent: string | null;
        submissionFileUrl: string | null;
        aiScore: number;
        aiConfidence: number;
        overallFeedback: string;
        strengths: import("@prisma/client/runtime/library").JsonValue;
        weaknesses: import("@prisma/client/runtime/library").JsonValue;
        recommendations: import("@prisma/client/runtime/library").JsonValue;
        detailedAnalysis: import("@prisma/client/runtime/library").JsonValue;
        humanReviewerId: string | null;
        humanReviewerName: string | null;
        humanFeedback: string | null;
        humanScore: number | null;
        humanReviewDate: Date | null;
    }[]>;
}
//# sourceMappingURL=aiTeacherFeedbackService.d.ts.map