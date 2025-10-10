import { Language } from './i18nService';
interface VoiceSettings {
    provider: 'azure' | '11labs' | 'openai' | 'vapi';
    voiceId: string;
    speed?: number;
    pitch?: number;
    stability?: number;
    similarityBoost?: number;
}
interface VoiceOption {
    id: string;
    name: string;
    gender: 'MALE' | 'FEMALE';
    accent: 'FRANCE' | 'QUEBEC';
    description: string;
    voiceId: string;
}
interface VapiAssistant {
    id?: string;
    name: string;
    model: {
        provider: 'openai';
        model: 'gpt-4' | 'gpt-3.5-turbo';
        messages: Array<{
            role: 'system' | 'user' | 'assistant';
            content: string;
        }>;
        temperature?: number;
        maxTokens?: number;
    };
    voice: VoiceSettings;
    firstMessage?: string;
    endCallMessage?: string;
    recordingEnabled?: boolean;
    hipaaEnabled?: boolean;
    clientMessages?: string[];
    serverMessages?: string[];
    silenceTimeoutSeconds?: number;
    maxDurationSeconds?: number;
    backgroundSound?: 'office' | 'none';
    backchannelingEnabled?: boolean;
    backgroundDenoisingEnabled?: boolean;
    modelOutputInMessagesEnabled?: boolean;
}
interface VapiCall {
    id?: string;
    assistantId?: string;
    assistant?: VapiAssistant;
    phoneNumberId?: string;
    customer?: {
        number?: string;
        name?: string;
    };
    type?: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall';
    status?: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended' | 'active';
    endedReason?: string;
    messages?: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
        timestamp: string;
    }>;
    recordingUrl?: string;
    summary?: string;
    transcript?: string;
    analysis?: {
        successEvaluation?: string;
        userSentiment?: string;
        callSummary?: string;
    };
    costs?: {
        total?: number;
        model?: number;
        voice?: number;
        vapi?: number;
    };
    startedAt?: string;
    endedAt?: string;
    duration?: number;
}
declare class VapiService {
    private config;
    private axiosInstance;
    private publicKey;
    private readonly VOICE_OPTIONS;
    constructor();
    getPublicKey(): string;
    getVoiceOptions(): VoiceOption[];
    getVoiceById(voiceId: string): VoiceOption | undefined;
    createFrenchAssistant(voiceId: string, questions: any[], language?: Language): Promise<VapiAssistant>;
    createImmigrationAssistant(voiceId: string, country: string, immigrationType: string, questions: any[], language?: Language): Promise<VapiAssistant>;
    startVoiceSimulation(simulationId: string, assistantId: string, language?: Language): Promise<VapiCall>;
    getCallAnalysis(callId: string): Promise<VapiCall>;
    endCall(callId: string): Promise<void>;
    processCallResults(callId: string, simulationId: string): Promise<any>;
    private analyzeTranscript;
    getRandomQuestions(level?: string, count?: number): Promise<any[]>;
    private getDefaultQuestions;
}
declare const _default: VapiService;
export default _default;
//# sourceMappingURL=vapiService.d.ts.map