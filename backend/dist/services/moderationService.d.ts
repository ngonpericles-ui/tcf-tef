import { ApiResponse } from '../types';
export interface UserReport {
    id: number;
    reporterId: string;
    reportedUserId: string;
    reason: string;
    description: string;
    status: 'pending' | 'resolved' | 'dismissed' | 'escalated';
    createdAt: string;
    resolvedAt?: string;
    notes?: string;
    reporterName: string;
    reportedUserName: string;
}
export interface ContentReport {
    id: number;
    reporterId: string;
    contentId: number;
    contentType: 'post' | 'comment';
    reason: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected' | 'deleted';
    createdAt: string;
    moderatedAt?: string;
    reporterName: string;
    contentTitle: string;
}
export interface ModerationAction {
    id: number;
    sessionId: string;
    participantId: number;
    action: 'mute' | 'kick' | 'warn' | 'ban';
    reason: string;
    timestamp: string;
    moderator: string;
    moderatorName: string;
}
export declare class ModerationService {
    static getUserReports(): Promise<ApiResponse<UserReport[]>>;
    static getContentReports(): Promise<ApiResponse<ContentReport[]>>;
    static getModerationActions(): Promise<ApiResponse<ModerationAction[]>>;
    static moderateLiveSession(sessionId: string, participantId: number, action: string, reason: string, moderatorId: string): Promise<ApiResponse<any>>;
    static moderatePost(postId: string, action: string, reason: string, moderatorId: string): Promise<ApiResponse<any>>;
    static moderateComment(commentId: string, action: string, reason: string, moderatorId: string): Promise<ApiResponse<any>>;
    static handleReport(reportId: string, action: string, notes: string, moderatorId: string): Promise<ApiResponse<any>>;
}
export default ModerationService;
//# sourceMappingURL=moderationService.d.ts.map