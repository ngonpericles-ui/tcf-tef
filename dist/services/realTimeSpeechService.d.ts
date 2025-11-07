import { Server as SocketIOServer } from 'socket.io';
export interface ConversationSession {
    id: string;
    userId: string;
    level: string;
    topic?: string;
    history: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: Date;
        audioData?: string;
    }>;
    isActive: boolean;
    startedAt: Date;
    lastActivity: Date;
}
export interface SpeechAnalysis {
    transcription: string;
    confidence: number;
    grammar: {
        errors: Array<{
            text: string;
            correction: string;
            explanation: string;
        }>;
        score: number;
    };
    pronunciation: {
        score: number;
        feedback: string[];
    };
    vocabulary: {
        level: string;
        suggestions: string[];
    };
    fluency: {
        score: number;
        pace: string;
    };
}
export declare class RealTimeSpeechService {
    private static sessions;
    private static io;
    static initializeSocketIO(io: SocketIOServer): void;
    private static createConversationSession;
    private static processSpeechInput;
    private static processTextInput;
    private static generateAIResponse;
    private static analyzeSpeech;
    private static endConversationSession;
    private static getWelcomeMessage;
    private static getInstructions;
    static getActiveSessionsCount(): number;
    static cleanupInactiveSessions(): void;
}
//# sourceMappingURL=realTimeSpeechService.d.ts.map