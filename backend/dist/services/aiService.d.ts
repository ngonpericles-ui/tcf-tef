export declare class AIService {
    static generateGreeting(firstName: string, lastName: string): Promise<string>;
    t: any;
    static generateMotivation(firstName: string): Promise<string>;
    static generateWeatherMessage(country: string): Promise<string>;
    static generateStudyRecommendations(userId: string): Promise<any[]>;
    static generateDailyTip(): Promise<string>;
    static generateResponse(params: {
        message: string;
        systemPrompt: string;
        context: {
            userLevel: string;
            language: string;
            relevantQuestions: any[];
            conversationHistory: any[];
        };
    }): Promise<{
        content: string;
        confidence?: number;
    }>;
    static generateContent(prompt: string): Promise<string>;
    static generateNotes(content: string, lessonTitle: string, courseTitle: string, transcription?: string): Promise<{
        notes: string[];
    }>;
    static generateQuestions(content: string, lessonTitle: string, courseTitle: string, questionCount?: number, questionTypes?: string[], category?: string, difficulty?: string, transcription?: string, audioUrl?: string | null, videoUrl?: string | null, minWords?: number, maxWords?: number, writingType?: string): Promise<{
        questions: any[];
    }>;
    private static getVocabularyGrammarPrompt;
    private static getExpressionEcritePrompt;
    private static getListeningComprehensionPrompt;
    private static getReadingComprehensionPrompt;
    private static getStandardPrompt;
    private static generateRealisticOptions;
    static generateChatResponse(message: string, context: {
        lessonTitle: string;
        courseTitle: string;
        content: string;
    }): Promise<{
        response: string;
    }>;
    static generateTranscription(videoUrl: string, lessonTitle: string, courseTitle: string): Promise<{
        transcription: string;
    }>;
    static extractSujetsFromText(text: string): Promise<string[]>;
    private static getRandomCorrectAnswer;
    private static generateContentBasedFallback;
    private static extractKeywords;
}
//# sourceMappingURL=aiService.d.ts.map