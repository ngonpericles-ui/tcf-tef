export interface UserLoginEvent {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    loginTime: Date;
    ipAddress?: string;
    userAgent?: string;
}
export interface CourseEnrollmentEvent {
    userId: string;
    courseId: string;
    email: string;
    firstName: string;
    courseName: string;
    instructorName: string;
}
export interface TestCompletionEvent {
    userId: string;
    testId: string;
    email: string;
    firstName: string;
    testName: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    level: string;
}
export interface LiveSessionReminderEvent {
    userId: string;
    sessionId: string;
    email: string;
    firstName: string;
    sessionTitle: string;
    scheduledAt: Date;
    duration: number;
}
export interface NotificationEvent {
    userId: string;
    email: string;
    firstName: string;
    notificationTitle: string;
    notificationMessage: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    actionUrl?: string;
}
export declare class EventEmailService {
    static handleUserLogin(event: UserLoginEvent): Promise<void>;
    static handleCourseEnrollment(event: CourseEnrollmentEvent): Promise<void>;
    static handleTestCompletion(event: TestCompletionEvent): Promise<void>;
    static handleLiveSessionReminder(event: LiveSessionReminderEvent): Promise<void>;
    static handleNotificationEvent(event: NotificationEvent): Promise<void>;
    private static generateTestRecommendations;
    static scheduleLiveSessionReminders(sessionId: string): Promise<void>;
}
//# sourceMappingURL=eventEmailService.d.ts.map