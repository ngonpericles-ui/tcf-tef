export interface FileProcessingResult {
    fileId: string;
    originalName: string;
    cloudinaryUrl: string;
    thumbnailUrl?: string;
    extractedText?: string;
    metadata: {
        size: number;
        mimeType: string;
        dimensions?: {
            width: number;
            height: number;
        };
        duration?: number;
        pages?: number;
    };
    aiAnalysis?: {
        questions: Array<{
            question: string;
            answer: string;
            explanation?: string;
            difficulty: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
            category: string;
        }>;
        summary: string;
        topics: string[];
    };
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
    processedAt?: Date;
}
export interface FileSearchFilters {
    category?: string;
    level?: string;
    contentType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    hasAiAnalysis?: boolean;
    createdBy?: string;
}
export declare class EnhancedFileManagementService {
    static uploadAndProcess(file: Express.Multer.File, metadata: {
        title: string;
        description: string;
        level: string;
        category: string;
        contentType: string;
        subscriptionTier: string;
        userId: string;
    }): Promise<FileProcessingResult>;
    private static extractTextFromPDF;
    private static performAIAnalysis;
    private static extractQuestionsFromText;
    private static generateSummary;
    private static extractTopics;
    private static getResourceType;
    static searchFiles(filters: FileSearchFilters, pagination: {
        page: number;
        limit: number;
    }): Promise<{
        files: any[];
        total: number;
        pagination: any;
    }>;
    static processFile(fileId: string): Promise<FileProcessingResult>;
}
//# sourceMappingURL=enhancedFileManagementService.d.ts.map