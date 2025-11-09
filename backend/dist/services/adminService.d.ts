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
            currency: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
            _count: {
                comments: number;
                courseEnrollments: number;
                posts: number;
                testAttempts: number;
            };
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
            completedAt: Date | null;
            timeSpent: number | null;
            score: number | null;
            testId: string;
            startedAt: Date;
            answers: import("@prisma/client/runtime/library").JsonValue | null;
            feedback: string | null;
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
        phone: string;
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
    static deleteManager(managerId: string, deletedById: string): Promise<{
        success: boolean;
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
            id: any;
            amount: any;
            currency: any;
            status: any;
            method: any;
            customerEmail: any;
            customerName: string;
            createdAt: any;
            subscriptionTier: any;
            country: any;
            paymentProvider: any;
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
            tier: any;
            count: any;
            revenue: number;
        }[];
        geographicDistribution: {
            country: any;
            count: any;
            revenue: number;
        }[];
        userStats: {
            totalUsers: number;
            newUsers: number;
            activeUsers: number;
            subscriptionDistribution: any[];
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
    static getReviewRequests(userId: string, userRole: string): Promise<any[]>;
    static handleReviewRequest(requestId: string, action: string, data: {
        tutorId: string;
        response?: string;
        humanFeedback?: string;
        humanScore?: number;
    }): Promise<any>;
    static createSubscriptionPlan(planData: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tier: import(".prisma/client").$Enums.SubscriptionTier;
        billingCycle: string;
        description: string | null;
        descriptionEn: string | null;
        price: number;
        currency: string;
        sortOrder: number;
        nameEn: string | null;
        isActive: boolean;
        features: string[];
        limitations: string[];
        maxSimulations: number | null;
        maxLiveSessions: number | null;
        maxCourses: number | null;
        maxTests: number | null;
        stripePriceId: string | null;
        isPopular: boolean;
    }>;
    static getSubscriptionPlans(): Promise<import("../types").SubscriptionPlan[]>;
    static getSubscriptionPlanById(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tier: import(".prisma/client").$Enums.SubscriptionTier;
        billingCycle: string;
        description: string | null;
        descriptionEn: string | null;
        price: number;
        currency: string;
        sortOrder: number;
        nameEn: string | null;
        isActive: boolean;
        features: string[];
        limitations: string[];
        maxSimulations: number | null;
        maxLiveSessions: number | null;
        maxCourses: number | null;
        maxTests: number | null;
        stripePriceId: string | null;
        isPopular: boolean;
    }>;
    static updateSubscriptionPlan(id: string, updateData: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tier: import(".prisma/client").$Enums.SubscriptionTier;
        billingCycle: string;
        description: string | null;
        descriptionEn: string | null;
        price: number;
        currency: string;
        sortOrder: number;
        nameEn: string | null;
        isActive: boolean;
        features: string[];
        limitations: string[];
        maxSimulations: number | null;
        maxLiveSessions: number | null;
        maxCourses: number | null;
        maxTests: number | null;
        stripePriceId: string | null;
        isPopular: boolean;
    }>;
    static deleteSubscriptionPlan(id: string): Promise<void>;
    static getSubscriptionAnalytics(): Promise<{
        totalSubscriptions: number;
        activeSubscriptions: number;
        totalRevenue: number;
        plansCount: number;
        monthlyGrowth: number;
        churnRate: number;
    }>;
    static getAudioSimulations(filters: any): Promise<{
        simulations: {
            id: string;
            status: import(".prisma/client").$Enums.VoiceSimulationStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            duration: number;
            feedback: string | null;
            scheduledDate: Date;
            voicePreference: import(".prisma/client").$Enums.VoiceType;
            vapiSessionId: string | null;
            questionsData: import("@prisma/client/runtime/library").JsonValue | null;
            resultsData: import("@prisma/client/runtime/library").JsonValue | null;
            overallScore: number | null;
            fluencyScore: number | null;
            grammarScore: number | null;
            vocabularyScore: number | null;
            pronunciationScore: number | null;
            coherenceScore: number | null;
            notificationSent: boolean;
        }[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            totalPages: number;
        };
    }>;
    static getAudioSimulation(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.VoiceSimulationStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        duration: number;
        feedback: string | null;
        scheduledDate: Date;
        voicePreference: import(".prisma/client").$Enums.VoiceType;
        vapiSessionId: string | null;
        questionsData: import("@prisma/client/runtime/library").JsonValue | null;
        resultsData: import("@prisma/client/runtime/library").JsonValue | null;
        overallScore: number | null;
        fluencyScore: number | null;
        grammarScore: number | null;
        vocabularyScore: number | null;
        pronunciationScore: number | null;
        coherenceScore: number | null;
        notificationSent: boolean;
    }>;
    static createAudioSimulation(data: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.VoiceSimulationStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        duration: number;
        feedback: string | null;
        scheduledDate: Date;
        voicePreference: import(".prisma/client").$Enums.VoiceType;
        vapiSessionId: string | null;
        questionsData: import("@prisma/client/runtime/library").JsonValue | null;
        resultsData: import("@prisma/client/runtime/library").JsonValue | null;
        overallScore: number | null;
        fluencyScore: number | null;
        grammarScore: number | null;
        vocabularyScore: number | null;
        pronunciationScore: number | null;
        coherenceScore: number | null;
        notificationSent: boolean;
    }>;
    static updateAudioSimulation(id: string, data: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.VoiceSimulationStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        duration: number;
        feedback: string | null;
        scheduledDate: Date;
        voicePreference: import(".prisma/client").$Enums.VoiceType;
        vapiSessionId: string | null;
        questionsData: import("@prisma/client/runtime/library").JsonValue | null;
        resultsData: import("@prisma/client/runtime/library").JsonValue | null;
        overallScore: number | null;
        fluencyScore: number | null;
        grammarScore: number | null;
        vocabularyScore: number | null;
        pronunciationScore: number | null;
        coherenceScore: number | null;
        notificationSent: boolean;
    }>;
    static deleteAudioSimulation(id: string): Promise<void>;
    static getImmigrationSimulations(filters: any): Promise<{
        simulations: {
            level: string;
            id: string;
            status: string;
            country: string;
            createdAt: Date;
            userId: string;
            duration: number;
            completedAt: Date | null;
            startedAt: Date | null;
            immigrationType: string;
            personalInfo: string;
            questions: string;
            responses: string;
            currentQuestionIndex: number;
            finalScore: number | null;
            finalReport: string | null;
        }[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            totalPages: number;
        };
    }>;
    static getImmigrationSimulation(id: string): Promise<{
        level: string;
        id: string;
        status: string;
        country: string;
        createdAt: Date;
        userId: string;
        duration: number;
        completedAt: Date | null;
        startedAt: Date | null;
        immigrationType: string;
        personalInfo: string;
        questions: string;
        responses: string;
        currentQuestionIndex: number;
        finalScore: number | null;
        finalReport: string | null;
    }>;
    static createImmigrationSimulation(data: any): Promise<{
        level: string;
        id: string;
        status: string;
        country: string;
        createdAt: Date;
        userId: string;
        duration: number;
        completedAt: Date | null;
        startedAt: Date | null;
        immigrationType: string;
        personalInfo: string;
        questions: string;
        responses: string;
        currentQuestionIndex: number;
        finalScore: number | null;
        finalReport: string | null;
    }>;
    static updateImmigrationSimulation(id: string, data: any): Promise<{
        level: string;
        id: string;
        status: string;
        country: string;
        createdAt: Date;
        userId: string;
        duration: number;
        completedAt: Date | null;
        startedAt: Date | null;
        immigrationType: string;
        personalInfo: string;
        questions: string;
        responses: string;
        currentQuestionIndex: number;
        finalScore: number | null;
        finalReport: string | null;
    }>;
    static deleteImmigrationSimulation(id: string): Promise<void>;
    static getStatistics(): Promise<{
        totalUsers: number;
        activeManagers: number;
        contentCreated: number;
        monthlyGrowth: number;
    }>;
}
export {};
//# sourceMappingURL=adminService.d.ts.map