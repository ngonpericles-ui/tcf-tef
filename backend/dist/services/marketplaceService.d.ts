import { ApiResponse } from '../types';
export interface TutorProfile {
    id: string;
    userId: string;
    title: string;
    bio: string;
    specialties: string[];
    experience: number;
    rating: number;
    totalStudents: number;
    languages: string[];
    availability: string;
    location: string;
    website?: string;
    phone?: string;
    isActive: boolean;
    hourlyRate?: number;
    joinedDate: string;
    lastActive: string;
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
}
export declare class MarketplaceService {
    static getTutorProfile(userId: string): Promise<ApiResponse<TutorProfile | null>>;
    static getStudentRequests(tutorId: string): Promise<ApiResponse<StudentRequest[]>>;
    static getAllTutors(): Promise<ApiResponse<TutorProfile[]>>;
    static updateTutorProfile(userId: string, updates: Partial<TutorProfile>): Promise<ApiResponse<TutorProfile>>;
    static activateTutorProfile(userId: string, isActive: boolean): Promise<ApiResponse<TutorProfile | null>>;
    static handleStudentRequest(requestId: string, action: 'accept' | 'decline', managerId: string): Promise<ApiResponse<any>>;
}
//# sourceMappingURL=marketplaceService.d.ts.map