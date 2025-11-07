export interface SpeechAnalysisResult {
    transcription: string;
    confidence: number;
    pronunciation: {
        score: number;
        feedback: string[];
        mistakes: Array<{
            word: string;
            issue: string;
            correction: string;
        }>;
    };
    grammar: {
        score: number;
        errors: Array<{
            error: string;
            correction: string;
            explanation: string;
        }>;
    };
    fluency: {
        score: number;
        wordsPerMinute: number;
        pauseAnalysis: string;
    };
    vocabulary: {
        score: number;
        level: string;
        suggestions: string[];
    };
    overallScore: number;
    level: string;
    feedback: string;
    teacherResponse: string;
}
export interface VoiceOption {
    id: string;
    name: string;
    gender: 'MALE' | 'FEMALE';
    language: 'fr-FR';
    description: string;
}
export interface SpeechExercise {
    id: string;
    title: string;
    instruction: string;
    prompt: string;
    level: string;
    expectedDuration: number;
    criteria: string[];
}
export declare class SpeechService {
    static getAvailableVoices(): VoiceOption[];
    static textToSpeech(text: string, voiceId?: string, speed?: number): Promise<{
        audioBuffer: Buffer;
        audioUrl: string;
    }>;
    static speechToText(audioBuffer: Buffer): Promise<{
        transcription: string;
        confidence: number;
    }>;
    static analyzeSpeech(audioBuffer: Buffer, exerciseId?: string, userId?: string): Promise<SpeechAnalysisResult>;
    private static getAIAnalysis;
    private static generateTeacherResponse;
    private static getDefaultAnalysis;
    static getSpeechExercises(level?: string): SpeechExercise[];
    static createConversation(userMessage: string, conversationHistory?: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>, level?: string): Promise<{
        response: string;
        audioUrl?: string;
    }>;
}
//# sourceMappingURL=speechService.d.ts.map