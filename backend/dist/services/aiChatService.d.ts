interface ChatContext {
    userLevel: string;
    language: string;
    previousMessages: any[];
    [key: string]: any;
}
interface ChatResponse {
    message: string;
    sources: string[];
    confidence: number;
    chatId: string;
}
export declare class AiChatService {
    static sendMessage(userId: string, message: string, chatId: string | null, context: ChatContext): Promise<ChatResponse>;
    static getChatHistory(userId: string, limit?: number): Promise<({
        messages: {
            id: string;
            role: string;
            createdAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            content: string;
            confidence: number | null;
            sessionId: string;
            sources: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string | null;
        isActive: boolean;
    })[]>;
    static getChatSession(chatId: string, userId: string): Promise<{
        messages: {
            id: string;
            role: string;
            createdAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            content: string;
            confidence: number | null;
            sessionId: string;
            sources: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string | null;
        isActive: boolean;
    }>;
    static deleteChatSession(chatId: string, userId: string): Promise<{
        success: boolean;
    }>;
    private static getRelevantQuestions;
    private static generateAIResponse;
    private static buildSystemPrompt;
    private static extractKeywords;
    private static detectCategory;
    private static extractSources;
    private static generateSessionTitle;
}
export {};
//# sourceMappingURL=aiChatService.d.ts.map