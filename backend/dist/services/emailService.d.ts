export interface EmailOptions {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        content?: Buffer | string;
        path?: string;
        contentType?: string;
    }>;
}
export interface WelcomeEmailData {
    firstName: string;
    lastName: string;
    email: string;
    loginUrl: string;
}
export interface CourseEnrollmentEmailData {
    firstName: string;
    email: string;
    courseName: string;
    courseUrl: string;
    instructorName: string;
}
export interface LiveSessionEmailData {
    firstName: string;
    email: string;
    sessionTitle: string;
    sessionDate: string;
    sessionTime: string;
    joinUrl: string;
    duration: number;
}
export interface TestResultEmailData {
    firstName: string;
    email: string;
    testName: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    level: string;
    recommendations: string[];
}
export interface VoiceSimulationBookingEmailData {
    firstName: string;
    email: string;
    scheduledDate: Date;
    voicePreference: string;
    duration: string;
    simulationId?: string;
    accessUrl?: string;
}
export interface VoiceSimulationReschedulingEmailData {
    firstName: string;
    email: string;
    scheduledDate: Date;
    voicePreference: string;
    duration: string;
    simulationId?: string;
    accessUrl?: string;
}
export interface VoiceSimulationReminderEmailData {
    firstName: string;
    email: string;
    scheduledDate: Date;
    simulationId: string;
    userId: string;
}
export interface VoiceSimulationResultsEmailData {
    firstName: string;
    email: string;
    overallScore: number;
    fluencyScore: number;
    grammarScore: number;
    vocabularyScore: number;
    pronunciationScore: number;
    coherenceScore: number;
    feedback: string;
    completedAt: Date;
}
export interface ImmigrationSimulationReschedulingEmailData {
    to: string;
    firstName: string;
    lastName: string;
    country: string;
    immigrationType: string;
    scheduledDate: Date;
    duration: string;
    simulationId: string;
    accessUrl: string;
}
export interface ImmigrationSimulationConfirmationEmailData {
    firstName: string;
    email: string;
    country: string;
    immigrationType: string;
    scheduledDate: Date;
    simulationId: string;
    userId: string;
}
export interface ImmigrationSimulationReminderEmailData {
    firstName: string;
    email: string;
    country: string;
    immigrationType: string;
    scheduledDate: Date;
    simulationId: string;
    userId: string;
}
export interface ImmigrationSimulationResultsEmailData {
    firstName: string;
    email: string;
    country: string;
    immigrationType: string;
    finalScore: number;
    feedback: string;
    completedAt: Date;
    simulationId: string;
}
export interface OneOnOneSessionEmailData {
    firstName: string;
    email: string;
    sessionTitle: string;
    instructorName: string;
    sessionDate: string;
    sessionTime: string;
    secureLink: string;
    duration: number;
}
export declare class EmailService {
    private static transporter;
    private static fromAddress;
    private static replyToAddress;
    private static getLogoDataUri;
    private static wrapEmailWithProfessionalDesign;
    private static generateEmailContent;
    static sendEmail(options: EmailOptions): Promise<boolean>;
    static sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean>;
    static sendCourseEnrollmentEmail(data: CourseEnrollmentEmailData): Promise<boolean>;
    static sendLiveSessionReminderConfirmationEmail(data: LiveSessionEmailData & {
        reminderMinutes?: number;
    }): Promise<boolean>;
    static sendLiveSessionReminderEmail(data: LiveSessionEmailData & {
        reminderMinutes?: number;
    }): Promise<boolean>;
    static sendTestResultsEmail(data: TestResultEmailData): Promise<boolean>;
    static testEmailConfiguration(): Promise<boolean>;
    static sendVoiceSimulationBookingEmail(data: VoiceSimulationBookingEmailData & {
        accessUrl?: string;
        simulationId?: string;
    }): Promise<boolean>;
    static sendVoiceSimulationReschedulingEmail(data: VoiceSimulationReschedulingEmailData & {
        accessUrl?: string;
        simulationId?: string;
    }): Promise<boolean>;
    static sendVoiceSimulationReminderEmail(data: VoiceSimulationReminderEmailData): Promise<boolean>;
    static sendVoiceSimulationResultsEmail(data: VoiceSimulationResultsEmailData): Promise<boolean>;
    static sendImmigrationSimulationConfirmationEmail(data: ImmigrationSimulationConfirmationEmailData): Promise<boolean>;
    static sendImmigrationSimulationReschedulingEmail(data: ImmigrationSimulationReschedulingEmailData): Promise<boolean>;
    static sendImmigrationSimulationReminderEmail(data: ImmigrationSimulationReminderEmailData): Promise<boolean>;
    static sendImmigrationSimulationResultsEmail(data: ImmigrationSimulationResultsEmailData): Promise<boolean>;
    static sendOneOnOneSessionEmail(data: OneOnOneSessionEmailData): Promise<boolean>;
    static sendPasswordResetCode(data: {
        email: string;
        code: string;
        firstName?: string;
        lang?: 'fr' | 'en';
    }): Promise<boolean>;
}
declare const _default: EmailService;
export default _default;
//# sourceMappingURL=emailService.d.ts.map