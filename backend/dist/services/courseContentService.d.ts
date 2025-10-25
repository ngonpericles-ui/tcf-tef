import { CourseLevel, CourseCategory } from '@prisma/client';
import { CourseWithDetails } from '../types';
export interface CreateCourseData {
    title: string;
    description: string;
    level: CourseLevel;
    category: CourseCategory;
    duration?: number;
    price?: number;
    tags?: string[];
    thumbnail?: string;
}
export interface UpdateCourseData {
    title?: string;
    description?: string;
    level?: CourseLevel;
    category?: CourseCategory;
    duration?: number;
    price?: number;
    tags?: string[];
    thumbnail?: string;
    isPublished?: boolean;
}
export interface CreateLessonData {
    title: string;
    content: string;
    videoUrl?: string;
    duration?: number;
    order: number;
    resources?: string[];
}
export interface UpdateLessonData {
    title?: string;
    content?: string;
    videoUrl?: string;
    duration?: number;
    order?: number;
    resources?: string[];
}
export declare class CourseContentService {
    static createCourse(data: CreateCourseData, createdById: string): Promise<CourseWithDetails>;
    static updateCourse(courseId: string, data: UpdateCourseData, userId: string): Promise<CourseWithDetails>;
    static getCourseById(courseId: string, userId?: string): Promise<CourseWithDetails>;
    static getCourses(filters?: {
        level?: CourseLevel;
        category?: CourseCategory;
        isPublished?: boolean;
        createdBy?: string;
        search?: string;
    }, options?: {
        page?: number;
        limit?: number;
        sortBy?: 'title' | 'createdAt' | 'enrollments';
        sortOrder?: 'asc' | 'desc';
    }, userId?: string): Promise<{
        courses: CourseWithDetails[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static deleteCourse(courseId: string, userId: string): Promise<void>;
    static enrollInCourse(courseId: string, userId: string): Promise<{
        enrollment: {
            id: string;
            enrolledAt: Date;
            progress: {
                completedLessons: number;
                totalLessons: number;
                percentage: number;
            };
        };
    }>;
    static getUserEnrolledCourses(userId: string, page?: number, limit?: number): Promise<{
        courses: Array<CourseWithDetails & {
            enrollment: {
                id: string;
                enrolledAt: Date;
            };
        }>;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
export declare class LessonService {
    static createLesson(courseId: string, data: CreateLessonData, userId: string): Promise<{
        id: string;
        title: string;
        content: string;
        videoUrl?: string;
        duration?: number;
        order: number;
        resources: string[];
    }>;
    static markLessonCompleted(lessonId: string, userId: string): Promise<{
        completed: boolean;
        progress: {
            completedLessons: number;
            totalLessons: number;
            percentage: number;
        };
    }>;
    static getCourseLessons(courseId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        duration: number;
        order: number;
        content: string;
        videoUrl: string;
        resources: string[];
    }[]>;
}
//# sourceMappingURL=courseContentService.d.ts.map