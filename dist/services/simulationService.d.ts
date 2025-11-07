export interface SimulationQuestion {
    id: string;
    type: 'multiple_choice' | 'text_input' | 'audio_response' | 'reading_comprehension';
    section: 'comprehension_orale' | 'comprehension_ecrite' | 'grammaire' | 'expression_orale' | 'expression_ecrite';
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    question: string;
    context?: string;
    audioUrl?: string;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    points: number;
    timeLimit?: number;
}
export interface SimulationSession {
    id: string;
    userId: string;
    type: 'TCF' | 'TEF';
    level: string;
    status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
    currentSection: string;
    currentQuestionIndex: number;
    questions: SimulationQuestion[];
    answers: Record<string, any>;
    startedAt: Date;
    completedAt?: Date;
    timeRemaining: number;
    score?: number;
    maxScore?: number;
    percentage?: number;
    levelAchieved?: string;
}
export interface CreateSimulationRequest {
    type: 'TCF' | 'TEF';
    level: 'starter' | 'intermediate' | 'advanced';
    sections: string[];
    duration?: number;
}
export interface SubmitAnswerRequest {
    questionId: string;
    answer: any;
    timeSpent: number;
}
export declare class SimulationService {
    static createSimulation(userId: string, request: CreateSimulationRequest): Promise<SimulationSession>;
    private static generateQuestionsWithGemini;
    private static getDefaultQuestions;
    static startSimulation(sessionId: string, userId: string): Promise<SimulationSession>;
    static submitAnswer(sessionId: string, userId: string, request: SubmitAnswerRequest): Promise<{
        correct: boolean;
        explanation?: string;
        nextQuestion?: SimulationQuestion;
    }>;
    static completeSimulation(sessionId: string, userId: string): Promise<{
        score: number;
        maxScore: number;
        percentage: number;
        levelAchieved: string;
        results: any;
    }>;
    private static checkAnswer;
    private static calculateLevel;
    private static getDefaultDuration;
    static getSimulation(sessionId: string, userId: string): Promise<SimulationSession>;
}
//# sourceMappingURL=simulationService.d.ts.map