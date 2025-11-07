import { UserRole } from '@prisma/client';
interface PaginationOptions {
    page: number;
    limit: number;
}
interface UserFilters {
    search?: string;
    role?: UserRole;
    status?: string;
    subscription?: string;
}
interface ManagerFilters {
    role?: UserRole;
    team?: string;
    performance?: string;
}
export declare class AdminService {
    static getDashboardData(timeframe: string, metrics?: string): Promise<{
        stats: {
            totalUsers: number;
            activeUsers: number;
            totalCourses: number;
            totalTests: number;
            totalRevenue: number;
            successRate: number;
            userGrowthRate: number;
            systemStatus: string;
        };
        charts: {
            userGrowth: {
                date: string;
                users: number;
            }[];
            subscriptionDistribution: {
                tier: import(".prisma/client").$Enums.SubscriptionTier;
                count: number;
            }[];
        };
        recentUsers: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            lastLoginAt: Date;
            createdAt: Date;
        }[];
        recentActivities: any[];
        recentPayments: ({
            user: {
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            paymentMethod: string;
            type: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            currency: string;
            subscriptionId: string | null;
            amount: number;
            transactionId: string | null;
            paymentGateway: string | null;
            stripePaymentIntentId: string | null;
            processedAt: Date | null;
            failureReason: string | null;
            refundedAt: Date | null;
            refundAmount: number | null;
        })[];
        systemHealth: {
            status: string;
            database: {
                status: string;
                size: string;
                activeConnections: number;
            };
            performance: {
                avgResponseTime: number;
                errorCount: number;
                uptime: number;
            };
            memory: {
                used: number;
                total: number;
            };
            error?: undefined;
        } | {
            status: string;
            error: string;
            database?: undefined;
            performance?: undefined;
            memory?: undefined;
        };
    }>;
    static calculateSuccessRate(startDate: Date): Promise<number>;
    static getEnhancedRecentActivities(startDate: Date): Promise<any[]>;
    static getSystemHealth(): Promise<{
        status: string;
        database: {
            status: string;
            size: string;
            activeConnections: number;
        };
        performance: {
            avgResponseTime: number;
            errorCount: number;
            uptime: number;
        };
        memory: {
            used: number;
            total: number;
        };
        error?: undefined;
    } | {
        status: string;
        error: string;
        database?: undefined;
        performance?: undefined;
        memory?: undefined;
    }>;
    static getBusinessMetrics(period: string, category?: string): Promise<{
        revenue: {
            total: number;
            transactions: number;
            averageTransaction: number;
        };
        subscriptions: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.SubscriptionGroupByOutputType, ("status" | "tier")[]> & {
            _count: number;
        })[];
        userEngagement: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.AnalyticsEventGroupByOutputType, "eventType"[]> & {
            _count: number;
        })[];
        contentStats: {
            courses: number;
            tests: number;
            liveSessions: number;
        };
    }>;
    static getTechnicalMetrics(): Promise<{
        api: {
            totalEndpoints: number;
            averageResponseTime: number;
            errorRate: number;
        };
        security: {
            activeTokens: number;
            failedLogins: number;
            lastSecurityScan: Date;
        };
        status: string;
        database: {
            status: string;
            size: string;
            activeConnections: number;
        };
        performance: {
            avgResponseTime: number;
            errorCount: number;
            uptime: number;
        };
        memory: {
            used: number;
            total: number;
        };
        error?: undefined;
    } | {
        api: {
            totalEndpoints: number;
            averageResponseTime: number;
            errorRate: number;
        };
        security: {
            activeTokens: number;
            failedLogins: number;
            lastSecurityScan: Date;
        };
        status: string;
        error: string;
        database?: undefined;
        performance?: undefined;
        memory?: undefined;
    }>;
    static getAllUsers(pagination: PaginationOptions, filters: UserFilters): Promise<{
        users: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
            subscriptionTier: import(".prisma/client").$Enums.SubscriptionTier;
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
            totalPages: number;
        };
    }>;
    static getUserAnalytics(userId: string, period: string): Promise<{
        user: {
            subscriptions: {
                id: string;
                status: import(".prisma/client").$Enums.SubscriptionStatus;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                tier: import(".prisma/client").$Enums.SubscriptionTier;
                startDate: Date;
                endDate: Date | null;
                autoRenew: boolean;
                paymentMethod: string | null;
                billingCycle: string;
                stripeSubscriptionId: string | null;
                stripeCustomerId: string | null;
                currentPeriodStart: Date | null;
                currentPeriodEnd: Date | null;
            }[];
            _count: {
                comments: number;
                courseEnrollments: number;
                posts: number;
                testAttempts: number;
            };
        } & {
            email: string;
            id: string;
            passwordHash: string | null;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
            subscriptionTier: import(".prisma/client").$Enums.SubscriptionTier;
            currentLevel: string | null;
            profileImage: string | null;
            phone: string | null;
            dateOfBirth: Date | null;
            country: string | null;
            city: string | null;
            bio: string | null;
            preferences: import("@prisma/client/runtime/library").JsonValue | null;
            lastLoginAt: Date | null;
            lastActivityAt: Date | null;
            emailVerifiedAt: Date | null;
            socialAuthProvider: string | null;
            socialAuthId: string | null;
            profilePicture: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        courseProgress: ({
            course: {
                level: import(".prisma/client").$Enums.CourseLevel;
                title: string;
                category: import(".prisma/client").$Enums.CourseCategory;
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
        testResults: ({
            test: {
                level: import(".prisma/client").$Enums.CourseLevel;
                title: string;
                category: import(".prisma/client").$Enums.CourseCategory;
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
        activityLog: {
            id: string;
            createdAt: Date;
            userId: string | null;
            sessionId: string | null;
            eventType: string;
            eventData: import("@prisma/client/runtime/library").JsonValue;
            userAgent: string | null;
            ipAddress: string | null;
        }[];
        summary: {
            totalCourses: number;
            totalTests: number;
            averageScore: number;
            totalActivity: number;
        };
    }>;
    private static getStartDate;
    private static getUserGrowthData;
    private static calculateGrowthRate;
    static getManagers(filters: ManagerFilters): Promise<{
        email: string;
        id: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        lastLoginAt: Date;
        createdAt: Date;
        _count: {
            createdCourses: number;
            createdLiveSessions: number;
            posts: number;
            createdTests: number;
        };
    }[]>;
    static createManager(managerData: any, createdById: string): Promise<{
        email: string;
        id: string;
        passwordHash: string | null;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        subscriptionTier: import(".prisma/client").$Enums.SubscriptionTier;
        currentLevel: string | null;
        profileImage: string | null;
        phone: string | null;
        dateOfBirth: Date | null;
        country: string | null;
        city: string | null;
        bio: string | null;
        preferences: import("@prisma/client/runtime/library").JsonValue | null;
        lastLoginAt: Date | null;
        lastActivityAt: Date | null;
        emailVerifiedAt: Date | null;
        socialAuthProvider: string | null;
        socialAuthId: string | null;
        profilePicture: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    static updateManager(managerId: string, updateData: any, updatedById: string): Promise<{
        email: string;
        id: string;
        passwordHash: string | null;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        subscriptionTier: import(".prisma/client").$Enums.SubscriptionTier;
        currentLevel: string | null;
        profileImage: string | null;
        phone: string | null;
        dateOfBirth: Date | null;
        country: string | null;
        city: string | null;
        bio: string | null;
        preferences: import("@prisma/client/runtime/library").JsonValue | null;
        lastLoginAt: Date | null;
        lastActivityAt: Date | null;
        emailVerifiedAt: Date | null;
        socialAuthProvider: string | null;
        socialAuthId: string | null;
        profilePicture: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    static getManagerPerformance(managerId: string, period: string): Promise<{
        contentCreated: {
            courses: number;
            tests: number;
            liveSessions: number;
            posts: number;
        };
        userEngagement: number;
        performanceMetrics: {
            averageRating: number;
            totalViews: number;
            completionRate: number;
        };
        period: string;
    }>;
    static getAnalytics(category?: string, timeframe?: string, filters?: string): Promise<{
        totalRevenue: number;
        monthlyRevenue: number;
        totalTransactions: number;
        successfulPayments: number;
        failedPayments: number;
        averageOrderValue: number;
        revenueGrowth: number;
        userGrowth: number;
        conversionRate: number;
        churnRate: number;
        payments: {
            id: string;
            amount: number;
            currency: string;
            status: string;
            method: string;
            customerEmail: string;
            customerName: string;
            createdAt: string;
            subscriptionTier: import(".prisma/client").$Enums.SubscriptionTier;
            country: string;
            paymentProvider: string;
        }[];
        revenueByPeriod: {
            date: string;
            revenue: number;
        }[];
        paymentsByMethod: {
            method: string;
            count: number;
            percentage: number;
        }[];
        subscriptionDistribution: {
            tier: import(".prisma/client").$Enums.SubscriptionTier;
            count: number;
            revenue: number;
        }[];
        geographicDistribution: {
            country: string;
            count: number;
            revenue: number;
        }[];
        userStats: {
            totalUsers: number;
            newUsers: number;
            activeUsers: number;
            subscriptionDistribution: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.UserGroupByOutputType, "subscriptionTier"[]> & {
                _count: number;
            })[];
        };
        timeframe: string;
        category: string;
        filters: string;
    }>;
    static generateReport(reportConfig: any, generatedById: string): Promise<{
        id: string;
        type: any;
        generatedAt: Date;
        generatedById: string;
        data: {
            summary: string;
            metrics: {
                totalUsers: number;
                totalCourses: number;
                totalTests: number;
            };
        };
    }>;
    static exportData(format: string, filters?: string, exportedById?: string): Promise<{
        format: string;
        filename: string;
        url: string;
        data: {
            users: {
                email: string;
                id: string;
                firstName: string;
                lastName: string;
                role: import(".prisma/client").$Enums.UserRole;
                status: import(".prisma/client").$Enums.UserStatus;
                subscriptionTier: import(".prisma/client").$Enums.SubscriptionTier;
                lastLoginAt: Date;
                createdAt: Date;
            }[];
            courses: {
                level: import(".prisma/client").$Enums.CourseLevel;
                id: string;
                createdAt: Date;
                title: string;
                isPublished: boolean;
                _count: {
                    enrollments: number;
                };
            }[];
            tests: {
                level: import(".prisma/client").$Enums.CourseLevel;
                id: string;
                createdAt: Date;
                title: string;
                isPublished: boolean;
                type: import(".prisma/client").$Enums.TestType;
                _count: {
                    attempts: number;
                };
            }[];
            payments: {
                id: string;
                createdAt: Date;
                userId: string;
                currency: string;
                subscriptionId: string;
                amount: number;
            }[];
            sessions: {
                id: string;
                status: import(".prisma/client").$Enums.LiveSessionStatus;
                title: string;
                duration: number;
                date: Date;
                maxParticipants: number;
                _count: {
                    participants: number;
                };
            }[];
            exportedAt: Date;
            exportedById: string;
        };
        generatedAt: Date;
        exportedById: string;
        recordCount: {
            users: number;
            courses: number;
            tests: number;
            payments: number;
            sessions: number;
        };
    }>;
    static getReviewRequests(userId: string, userRole: string): Promise<({
        feedback: {
            id: string;
            createdAt: Date;
            maxScore: number;
            submissionType: string;
            aiScore: number;
            aiConfidence: number;
            overallFeedback: string;
            strengths: import("@prisma/client/runtime/library").JsonValue;
            weaknesses: import("@prisma/client/runtime/library").JsonValue;
            recommendations: import("@prisma/client/runtime/library").JsonValue;
        };
        student: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            profileImage: string;
        };
        tutor: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        message: string;
        id: string;
        status: import(".prisma/client").$Enums.ReviewRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        tutorId: string;
        feedbackId: string | null;
        requestType: string;
        response: string | null;
    })[]>;
    static handleReviewRequest(requestId: string, action: string, data: {
        tutorId: string;
        response?: string;
        humanFeedback?: string;
        humanScore?: number;
    }): Promise<{
        feedback: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            maxScore: number;
            simulationResultId: string | null;
            submissionType: string;
            submissionContent: string | null;
            submissionFileUrl: string | null;
            aiScore: number;
            aiConfidence: number;
            overallFeedback: string;
            strengths: import("@prisma/client/runtime/library").JsonValue;
            weaknesses: import("@prisma/client/runtime/library").JsonValue;
            recommendations: import("@prisma/client/runtime/library").JsonValue;
            detailedAnalysis: import("@prisma/client/runtime/library").JsonValue;
            humanReviewerId: string | null;
            humanReviewerName: string | null;
            humanFeedback: string | null;
            humanScore: number | null;
            humanReviewDate: Date | null;
        };
        student: {
            email: string;
            id: string;
            passwordHash: string | null;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
            subscriptionTier: import(".prisma/client").$Enums.SubscriptionTier;
            currentLevel: string | null;
            profileImage: string | null;
            phone: string | null;
            dateOfBirth: Date | null;
            country: string | null;
            city: string | null;
            bio: string | null;
            preferences: import("@prisma/client/runtime/library").JsonValue | null;
            lastLoginAt: Date | null;
            lastActivityAt: Date | null;
            emailVerifiedAt: Date | null;
            socialAuthProvider: string | null;
            socialAuthId: string | null;
            profilePicture: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        message: string;
        id: string;
        status: import(".prisma/client").$Enums.ReviewRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        tutorId: string;
        feedbackId: string | null;
        requestType: string;
        response: string | null;
    }>;
}
export {};
//# sourceMappingURL=adminService.d.ts.map