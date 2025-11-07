import { UserProfile, UpdateUserProfileRequest, PaginationParams, FilterParams } from '../types';
import { UserRole, UserStatus } from '@prisma/client';
export declare class UserService {
    static calculateUserAchievements(userId: string): Promise<{
        totalPoints: number;
        successfulTests: number;
        totalTests: number;
        completionPercentage: number;
        weeklyPoints: number;
        currentCEFRLevel: string;
        cefrSubLevel: number;
        skillLevels: {
            grammar: {
                level: string;
                subLevel: number;
                progress: number;
            };
            vocabulary: {
                level: string;
                subLevel: number;
                progress: number;
            };
            listening: {
                level: string;
                subLevel: number;
                progress: number;
            };
            reading: {
                level: string;
                subLevel: number;
                progress: number;
            };
            speaking: {
                level: string;
                subLevel: number;
                progress: number;
            };
            writing: {
                level: string;
                subLevel: number;
                progress: number;
            };
        };
        recentTests: {
            id: string;
            status: import(".prisma/client").$Enums.TestAttemptStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            duration: number | null;
            completedAt: Date | null;
            timeSpent: number | null;
            score: number | null;
            testId: string;
            startedAt: Date;
            answers: import("@prisma/client/runtime/library").JsonValue | null;
            feedback: string | null;
            correctAnswers: number | null;
            maxScore: number | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            percentage: number | null;
            timeRemaining: number | null;
        }[];
    }>;
    static calculateCEFRLevel(points: number): {
        level: string;
        subLevel: number;
    };
    static getUserById(userId: string): Promise<UserProfile>;
    static updateUserProfile(userId: string, updateData: UpdateUserProfileRequest): Promise<UserProfile>;
    static changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    static getAllUsers(pagination: PaginationParams, filters: FilterParams, requestingUserRole: UserRole): Promise<{
        users: UserProfile[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static updateUserRole(userId: string, newRole: UserRole, requestingUserRole: UserRole): Promise<UserProfile>;
    static updateUserStatus(userId: string, newStatus: UserStatus, requestingUserRole: UserRole): Promise<UserProfile>;
    static deleteUser(userId: string, requestingUserRole: UserRole): Promise<void>;
    private static calculateUserStats;
    static getUsersByManager(managerId: string, options?: PaginationParams & FilterParams): Promise<{
        users: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
            subscriptionTier: import(".prisma/client").$Enums.SubscriptionTier;
            profileImage: string;
            lastLoginAt: Date;
            createdAt: Date;
            _count: {
                courseEnrollments: number;
                testAttempts: number;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    static assignUsersToManager(managerId: string, userIds: string[], requestingUserRole: UserRole): Promise<{
        managerId: string;
        assignedCount: number;
        userIds: string[];
    }>;
    static getUserLearningAnalytics(userId: string): Promise<{
        overview: {
            totalCourses: number;
            completedCourses: number;
            averageProgress: number;
            totalTests: number;
            averageTestScore: number;
            totalStudyTime: number;
            liveSessionsAttended: number;
            achievementsEarned: number;
        };
        enrollments: ({
            course: {
                level: import(".prisma/client").$Enums.CourseLevel;
                id: string;
                title: string;
                duration: number;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            courseId: string;
            enrolledAt: Date;
            completedAt: Date | null;
            progress: number;
            lastAccessAt: Date | null;
        })[];
        testAttempts: ({
            test: {
                level: import(".prisma/client").$Enums.CourseLevel;
                id: string;
                title: string;
                type: import(".prisma/client").$Enums.TestType;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.TestAttemptStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            duration: number | null;
            completedAt: Date | null;
            timeSpent: number | null;
            score: number | null;
            testId: string;
            startedAt: Date;
            answers: import("@prisma/client/runtime/library").JsonValue | null;
            feedback: string | null;
            correctAnswers: number | null;
            maxScore: number | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            percentage: number | null;
            timeRemaining: number | null;
        })[];
        liveSessionParticipation: ({
            liveSession: {
                id: string;
                title: string;
                duration: number;
                date: Date;
            };
        } & {
            id: string;
            userId: string;
            liveSessionId: string;
            joinedAt: Date;
            leftAt: Date | null;
            engagementScore: number;
            attended: boolean;
        })[];
        achievements: any[] | ({
            achievement: {
                name: string;
                id: string;
                description: string;
                icon: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            progress: number;
            achievementId: string;
            maxProgress: number;
            isUnlocked: boolean;
            unlockedAt: Date | null;
        })[];
        recentActivity: ({
            type: string;
            title: string;
            date: Date;
            progress: number;
        } | {
            type: string;
            title: string;
            date: Date;
            score: number;
        } | {
            type: string;
            title: string;
            date: Date;
            attended: boolean;
        })[];
    }>;
    private static getUserRecentActivity;
}
//# sourceMappingURL=userService.d.ts.map