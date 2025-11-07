import { TestWithDetails, CreateTestRequest, StartTestResponse, SubmitTestRequest, PaginationParams, FilterParams } from '@/types';
import { UserRole } from '@prisma/client';
export declare class TestService {
    static createTest(testData: CreateTestRequest, createdById: string, creatorRole: UserRole): Promise<TestWithDetails>;
    static createTestWithQuestions(testData: CreateTestRequest, questionsData: any[], createdById: string, creatorRole: UserRole): Promise<TestWithDetails>;
    static getTestById(testId: string, userId?: string): Promise<TestWithDetails>;
    static getAllTests(pagination: PaginationParams, filters: FilterParams, userId?: string): Promise<{
        tests: TestWithDetails[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static startTest(testId: string, userId: string): Promise<StartTestResponse>;
    static submitTest(submitData: SubmitTestRequest, userId: string): Promise<{
        score: number;
        totalPoints: number;
        passed: boolean;
        feedback?: string;
    }>;
    private static generateAIFeedback;
    static getUserTestAttempts(userId: string, pagination: PaginationParams): Promise<{
        attempts: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    private static checkAnswer;
    static addQuestionsToTest(testId: string, questions: any[], userId: string): Promise<{
        questions: {
            level: import(".prisma/client").$Enums.CourseLevel;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            category: import(".prisma/client").$Enums.CourseCategory;
            type: string;
            testId: string;
            correctAnswer: import("@prisma/client/runtime/library").JsonValue;
            explanation: string | null;
            explanationEn: string | null;
            questionText: string;
            questionTextEn: string | null;
            options: import("@prisma/client/runtime/library").JsonValue | null;
            points: number;
            order: number;
        }[];
    }>;
    static getTestQuestions(testId: string, userId: string): Promise<{
        level: import(".prisma/client").$Enums.CourseLevel;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: import(".prisma/client").$Enums.CourseCategory;
        type: string;
        testId: string;
        correctAnswer: import("@prisma/client/runtime/library").JsonValue;
        explanation: string | null;
        explanationEn: string | null;
        questionText: string;
        questionTextEn: string | null;
        options: import("@prisma/client/runtime/library").JsonValue | null;
        points: number;
        order: number;
    }[]>;
    static updateTestQuestion(testId: string, questionId: string, questionData: any, userId: string): Promise<{
        level: import(".prisma/client").$Enums.CourseLevel;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: import(".prisma/client").$Enums.CourseCategory;
        type: string;
        testId: string;
        correctAnswer: import("@prisma/client/runtime/library").JsonValue;
        explanation: string | null;
        explanationEn: string | null;
        questionText: string;
        questionTextEn: string | null;
        options: import("@prisma/client/runtime/library").JsonValue | null;
        points: number;
        order: number;
    }>;
    static deleteTestQuestion(testId: string, questionId: string, userId: string): Promise<boolean>;
    private static hasAccessToTier;
    static getTestResults(testId: string, userId: string): Promise<any>;
}
//# sourceMappingURL=testService.d.ts.map