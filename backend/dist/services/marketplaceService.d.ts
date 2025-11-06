import { ApiResponse } from '../types';
export interface TutorProfile {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    bio: string;
    title?: string;
    specialties: string[];
    subjects?: string[];
    languages: string[];
    availability: string[];
    workingHours?: string[];
    location: string | null;
    phone?: string;
    website?: string;
    acceptsMessages?: boolean;
    profilePicture: string | null;
    isActive: boolean;
    status?: string;
}
export interface StudentRequest {
    id: string;
    studentId: string;
    tutorId: string;
    requestType: 'session' | 'message' | 'expertise';
    subject: string;
    description: string;
    urgency: 'low' | 'medium' | 'high';
    requestedDate: string;
    status: 'pending' | 'accepted' | 'declined' | 'completed';
    createdAt: string;
    studentName?: string;
    studentEmail?: string;
    studentAvatar?: string;
    tutorName?: string;
    tutorEmail?: string;
    tutorAvatar?: string;
    feedbackId?: string;
    response?: string;
    completedDate?: string;
}
export declare class MarketplaceService {
    static getTutorProfile(userId: string): Promise<ApiResponse<TutorProfile | null>>;
    static getStudentRequests(tutorId: string, status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED' | 'CANCELLED', requestType?: 'SESSION' | 'MESSAGE' | 'EXPERTISE'): Promise<ApiResponse<StudentRequest[]>>;
    static getAllTutors(): Promise<ApiResponse<TutorProfile[]>>;
    static updateTutorProfile(userId: string, updates: Partial<TutorProfile>): Promise<ApiResponse<TutorProfile>>;
    static activateTutorProfile(userId: string, isActive: boolean): Promise<ApiResponse<TutorProfile | null>>;
    static createStudentRequest(studentId: string, tutorId: string, requestData: {
        requestType: 'SESSION' | 'MESSAGE' | 'EXPERTISE';
        subject: string;
        description: string;
        urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
        requestedDate?: Date;
        feedbackId?: string;
        metadata?: any;
    }): Promise<ApiResponse<StudentRequest>>;
    static handleStudentRequest(requestId: string, action: 'accept' | 'decline' | 'complete', managerId: string, response?: string): Promise<ApiResponse<any>>;
    static getStudentOwnRequests(studentId: string, status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED' | 'CANCELLED'): Promise<ApiResponse<StudentRequest[]>>;
    static getAllSpecialties(): Promise<ApiResponse<string[]>>;
    static getAllSubjects(): Promise<ApiResponse<string[]>>;
    static getAllAvailabilityOptions(): Promise<ApiResponse<string[]>>;
}
//# sourceMappingURL=marketplaceService.d.ts.map