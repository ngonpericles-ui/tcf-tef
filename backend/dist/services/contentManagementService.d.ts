import { CourseLevel, CourseCategory, SubscriptionTier } from '@prisma/client';
export interface ContentUploadData {
    title: string;
    description: string;
    level: CourseLevel;
    category: CourseCategory | 'TEST' | 'CORRIGER_TCF';
    subscriptionTier: SubscriptionTier;
    language: 'fr' | 'en';
    contentType: 'NOTE' | 'VIDEO' | 'TEST' | 'CORRIGER_TCF' | 'SIMULATION';
    file?: Express.Multer.File;
    tags?: string[];
    duration?: number;
    maxScore?: number;
    passingScore?: number;
}
export interface ContentAnalysisResult {
    extractedText: string;
    questionBankId: string;
    aiAnalysis: {
        topics: string[];
        difficulty: string;
        keyPoints: string[];
        suggestedQuestions: any[];
    };
}
export interface ContentItem {
    id: string;
    title: string;
    description: string;
    level: CourseLevel | CourseLevel[];
    category: string;
    subscriptionTier: SubscriptionTier | SubscriptionTier[];
    requiredTier?: SubscriptionTier;
    availableLevels?: CourseLevel[];
    availableTiers?: SubscriptionTier[];
    contentType: string;
    fileUrl?: string;
    thumbnailUrl?: string;
    duration?: number;
    tags: string[];
    isPublished: boolean;
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
    };
    createdAt: Date;
    updatedAt: Date;
    lessons_data?: any[];
    levels?: CourseLevel[];
    subscriptions?: SubscriptionTier[];
    totalVariants?: number;
    totalVideoCount?: number;
}
export declare class ContentManagementService {
    static uploadContent(uploadData: ContentUploadData, userId: string, userRole: string): Promise<{
        content: ContentItem;
        analysis?: ContentAnalysisResult;
    }>;
    private static createCourseContent;
    static uploadBulkCourseContent(title: string, description: string, level: CourseLevel, category: CourseCategory, subscriptionTier: SubscriptionTier, availableLevels: CourseLevel[], availableTiers: SubscriptionTier[], files: Array<{
        path: string;
        mimetype: string;
        originalname: string;
    }>, userId: string, userRole: string, tags?: string[]): Promise<{
        content: ContentItem;
        lessons: number;
    }>;
    private static createTestContent;
    private static createSimulationContent;
    private static performAIAnalysis;
    private static getResourceType;
    private static extractTextFromFile;
    private static extractTopics;
    private static assessDifficulty;
    private static extractKeyPoints;
    private static generateSuggestedQuestions;
    static getContentForCourses(level?: CourseLevel, category?: CourseCategory, subscriptionTier?: SubscriptionTier, search?: string, page?: number, limit?: number): Promise<{
        content: ContentItem[];
        total: number;
        pages: number;
    }>;
    static getContentForTests(level?: CourseLevel, type?: string, subscriptionTier?: SubscriptionTier, search?: string, page?: number, limit?: number): Promise<{
        content: ContentItem[];
        total: number;
        pages: number;
    }>;
    static getContentForManagement(userRole: string, userId?: string, contentType?: string, page?: number, limit?: number): Promise<{
        content: ContentItem[];
        total: number;
        pages: number;
    }>;
    static updateCourseLevelsAndSubscriptions(courseId: string, levels: string[], subscriptions: string[], userId: string, userRole: string): Promise<ContentItem>;
    static publishContent(contentId: string, contentType: string, userId: string, userRole: string): Promise<ContentItem>;
    static deleteContent(contentId: string, contentType: string, userId: string, userRole: string): Promise<void>;
}
//# sourceMappingURL=contentManagementService.d.ts.map