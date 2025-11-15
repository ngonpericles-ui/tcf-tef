import { CourseWithDetails, CreateCourseRequest, UpdateCourseRequest, PaginationParams, FilterParams } from '@/types';
import { UserRole } from '@prisma/client';
export declare class CourseService {
    static createCourse(courseData: CreateCourseRequest, createdById: string, creatorRole: UserRole): Promise<CourseWithDetails>;
    static getCourseById(courseId: string, userId?: string): Promise<CourseWithDetails>;
    static getAllCourses(pagination: PaginationParams, filters: FilterParams, userId?: string, userRole?: UserRole): Promise<{
        courses: CourseWithDetails[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static updateCourse(courseId: string, updateData: UpdateCourseRequest, userId: string, userRole: UserRole): Promise<CourseWithDetails>;
    static deleteCourse(courseId: string, userId: string, userRole: UserRole): Promise<void>;
    static enrollInCourse(courseId: string, userId: string): Promise<void>;
    static unenrollFromCourse(courseId: string, userId: string): Promise<void>;
    static getUserEnrolledCourses(userId: string, pagination: PaginationParams): Promise<{
        courses: CourseWithDetails[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static getCourseStatistics(userId: string, userRole: UserRole): Promise<{
        totalCourses: number;
        publishedCourses: number;
        totalEnrollments: number;
        averageRating: number;
    }>;
    private static hasAccessToTier;
}
//# sourceMappingURL=courseService.d.ts.map