export declare class AIService {
    static generateGreeting(firstName: string, lastName: string): Promise<string>;
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
}
//# sourceMappingURL=aiService.d.ts.map