export interface AssistantContext {
    page: string;
    userLevel?: string;
    simulationType?: 'voice' | 'immigration';
    country?: string;
    immigrationType?: string;
    language: 'fr' | 'en';
}
export interface AssistantResponse {
    message: string;
    suggestions?: string[];
    confidence: number;
}
export declare class FloatingAiAssistantService {
    static getAssistance(userId: string, userMessage: string, context: AssistantContext): Promise<AssistantResponse>;
    private static buildSystemPrompt;
    private static buildUserPrompt;
    private static parseResponse;
    static getQuickSuggestions(context: AssistantContext): string[];
}
//# sourceMappingURL=floatingAiAssistantService.d.ts.map