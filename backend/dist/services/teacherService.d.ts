interface TeacherFilters {
    search?: string;
    specialties?: string;
    availability?: string;
    rating?: number;
    sortBy?: string;
}
interface TeacherProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    bio: string;
    specialties: string[];
    rating: number;
    totalSessions: number;
    languages: string[];
    availability: string[];
    profileImage?: string;
    isAvailable: boolean;
    experience: number;
    certifications: string[];
    hourlyRate?: number;
    responseTime: string;
}
export declare class TeacherService {
    static getAvailableTeachers(userId: string, filters: TeacherFilters): Promise<TeacherProfile[]>;
    static getTeacherProfile(teacherId: string, userId: string): Promise<TeacherProfile>;
    static getTeacherAvailability(teacherId: string, date?: string): Promise<any>;
    static bookSession(teacherId: string, userId: string, bookingData: any): Promise<any>;
    private static getSortOrder;
    private static checkAvailability;
    private static generateAvailableSlots;
}
export {};
//# sourceMappingURL=teacherService.d.ts.map