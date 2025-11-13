import { Language } from './i18nService';
interface BookingRequest {
    userId: string;
    bookingType: 'MANUAL' | 'AUTO';
    preferredDates?: Date[];
    voicePreference?: string;
}
interface SimulationSession {
    simulationId: string;
    userId: string;
    assistantId: string;
    callId?: string;
    askedQuestions: Map<string, any>;
    questionResponses: Map<string, any>;
    currentLevel: string;
    questionCount: number;
    performanceScores: {
        fluency: number[];
        grammar: number[];
        vocabulary: number[];
        pronunciation: number[];
        coherence: number[];
    };
    startTime: Date;
}
declare class VoiceSimulationService {
    activeSessions: Map<string, SimulationSession>;
    constructor();
    bookSimulation(request: BookingRequest, language?: Language): Promise<any>;
    startSimulation(simulationId: string): Promise<any>;
    endSimulation(simulationId: string): Promise<any>;
    getSimulation(simulationId: string, userId: string): Promise<any>;
    getUserSimulations(userId: string): Promise<any>;
    private getNextAvailableSlot;
    findAvailableSlots(startDate: Date, endDate: Date): Promise<Date[]>;
    private getMonthlySimulationCount;
    private sendBookingConfirmation;
    private sendResultsEmail;
    private initializeCronJobs;
    markExpiredSessions(): Promise<{
        scheduled: number;
        active: number;
    }>;
    private sendReminderEmail;
    getActiveSession(simulationId: string): SimulationSession | undefined;
    handleFetchNextQuestion(simulationId: string, level: string, category?: string, excludeQuestionIds?: string[]): Promise<any>;
    handleStoreQuestionResponse(simulationId: string, questionId: string, questionText: string, questionLevel: string, questionCategory: string | undefined, studentResponse: string, timestamp?: string): Promise<any>;
    handleAnalyzeResponse(simulationId: string, questionId: string, studentResponse: string, questionLevel: string, conversationContext?: string): Promise<any>;
    handleGetNextDifficultyLevel(simulationId: string, currentLevel: string, performanceScores: any): Promise<any>;
    handleGetQuestionCount(simulationId: string): Promise<any>;
    private analyzeResponseRealTime;
    cancelSimulation(simulationId: string, userId: string, language?: Language): Promise<any>;
    rescheduleSimulation(simulationId: string, userId: string, newDate: Date, voicePreference?: string, language?: Language): Promise<any>;
    private isSlotAvailable;
    private sendCancellationEmail;
    private sendReschedulingEmail;
}
declare const _default: VoiceSimulationService;
export default _default;
//# sourceMappingURL=voiceSimulationService.d.ts.map