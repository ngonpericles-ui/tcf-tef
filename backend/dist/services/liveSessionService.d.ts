import { UserRole, LiveSessionStatus } from '@prisma/client';
import { CreateLiveSessionRequest, LiveSessionWithDetails, PaginationParams, FilterParams } from '../types';
export declare class LiveSessionService {
    static createLiveSession(sessionData: CreateLiveSessionRequest, createdById: string, creatorRole: UserRole): Promise<LiveSessionWithDetails>;
    static getLiveSessionById(sessionId: string, userId?: string): Promise<LiveSessionWithDetails>;
    static getAllLiveSessions(pagination: PaginationParams, filters: FilterParams, userId?: string): Promise<{
        sessions: LiveSessionWithDetails[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static registerForSession(sessionId: string, userId: string): Promise<void>;
    static unregisterFromSession(sessionId: string, userId: string): Promise<void>;
    static updateSessionStatus(sessionId: string, newStatus: LiveSessionStatus, userId: string, userRole: UserRole): Promise<LiveSessionWithDetails>;
    static getUserRegisteredSessions(userId: string, pagination: PaginationParams): Promise<{
        sessions: LiveSessionWithDetails[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static updateLiveSession(sessionId: string, userId: string, userRole: UserRole | undefined, updateData: any): Promise<LiveSessionWithDetails>;
    static deleteLiveSession(sessionId: string, userId: string, userRole: UserRole | undefined): Promise<void>;
    private static hasAccessToTier;
    static initializeCronJobs(): void;
}
//# sourceMappingURL=liveSessionService.d.ts.map