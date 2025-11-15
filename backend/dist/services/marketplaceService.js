"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceService = void 0;
const connection_1 = require("../database/connection");
class MarketplaceService {
    static async getTutorProfile(userId) {
        try {
            console.log('📋 getTutorProfile called for userId:', userId);
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                console.error('❌ User not found for getTutorProfile:', userId);
                return {
                    success: false,
                    error: { message: 'User not found', statusCode: 404 }
                };
            }
            console.log('✅ User found for getTutorProfile:', {
                userId: user.id,
                email: user.email,
                hasPreferences: !!user.preferences
            });
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Formateur';
            let preferences = {};
            try {
                if (user.preferences) {
                    if (typeof user.preferences === 'string') {
                        preferences = JSON.parse(user.preferences);
                    }
                    else if (typeof user.preferences === 'object') {
                        preferences = user.preferences;
                    }
                }
            }
            catch (parseError) {
                console.error('❌ Error parsing user preferences:', {
                    error: parseError.message,
                    userId: user.id,
                    preferencesType: typeof user.preferences,
                    preferencesPreview: typeof user.preferences === 'string' ? user.preferences.substring(0, 100) : 'object'
                });
                preferences = {};
            }
            const marketplaceProfile = preferences.marketplaceProfile || {};
            const isActive = marketplaceProfile.isActive === true;
            const isCurrentlyOnline = user.status === 'ONLINE';
            const displayStatus = user.status || 'OFFLINE';
            const profileLocation = marketplaceProfile.location !== undefined && marketplaceProfile.location !== null
                ? marketplaceProfile.location
                : (user.city || null);
            const acceptsMessages = marketplaceProfile.acceptsMessages === true;
            const profile = {
                id: user.id,
                userId: user.id,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                fullName: fullName,
                bio: marketplaceProfile.bio !== undefined && marketplaceProfile.bio !== null
                    ? marketplaceProfile.bio
                    : (user.bio || `Formateur expérimenté en français langue étrangère avec une expertise dans la préparation aux examens TCF/TEF.`),
                title: marketplaceProfile.title !== undefined && marketplaceProfile.title !== null ? marketplaceProfile.title : undefined,
                phone: marketplaceProfile.phone !== undefined && marketplaceProfile.phone !== null ? marketplaceProfile.phone : undefined,
                website: marketplaceProfile.website !== undefined && marketplaceProfile.website !== null ? marketplaceProfile.website : undefined,
                acceptsMessages: acceptsMessages,
                specialties: Array.isArray(marketplaceProfile.specialties)
                    ? marketplaceProfile.specialties
                    : marketplaceProfile.specialties
                        ? [marketplaceProfile.specialties]
                        : [],
                languages: Array.isArray(marketplaceProfile.languages)
                    ? marketplaceProfile.languages
                    : marketplaceProfile.languages
                        ? [marketplaceProfile.languages]
                        : ['Français', 'English'],
                subjects: Array.isArray(marketplaceProfile.subjects)
                    ? marketplaceProfile.subjects
                    : marketplaceProfile.subjects
                        ? [marketplaceProfile.subjects]
                        : [],
                availability: Array.isArray(marketplaceProfile.availability)
                    ? marketplaceProfile.availability
                    : marketplaceProfile.availability
                        ? [marketplaceProfile.availability]
                        : ['Disponible'],
                workingHours: Array.isArray(marketplaceProfile.workingHours)
                    ? marketplaceProfile.workingHours
                    : marketplaceProfile.workingHours
                        ? [marketplaceProfile.workingHours]
                        : [],
                location: profileLocation,
                profilePicture: user.profilePicture || null,
                isActive: isActive,
                status: displayStatus
            };
            console.log('✅ getTutorProfile - Profile created:', {
                userId: user.id,
                isActive: isActive,
                hasSpecialties: profile.specialties.length > 0,
                hasLocation: !!profile.location
            });
            return {
                success: true,
                data: profile
            };
        }
        catch (error) {
            console.error('❌ Error getting tutor profile:', {
                error: error.message,
                code: error.code,
                meta: error.meta,
                stack: error.stack?.substring(0, 1000),
                userId,
                errorType: error.constructor?.name,
                errorKeys: Object.keys(error)
            });
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to get tutor profile',
                    statusCode: 500,
                    code: error.code
                }
            };
        }
    }
    static async getStudentRequests(tutorId, status, requestType) {
        try {
            console.log('📋 getStudentRequests called for tutorId:', tutorId, 'status:', status);
            if (!tutorId) {
                console.error('❌ tutorId is missing in getStudentRequests');
                return {
                    success: false,
                    error: { message: 'Tutor ID is required', statusCode: 400 }
                };
            }
            const where = { tutorId };
            if (status) {
                where.status = status;
            }
            if (requestType) {
                where.requestType = requestType;
            }
            let requests;
            try {
                const prismaAny = connection_1.prisma;
                if (!prismaAny.marketplaceRequest) {
                    console.error('❌ marketplaceRequest not found on Prisma client:', {
                        prismaKeys: Object.keys(connection_1.prisma).filter(k => !k.startsWith('$')),
                        tutorId
                    });
                    return {
                        success: false,
                        error: {
                            message: 'MarketplaceRequest model not available. Please ensure database migrations are applied.',
                            statusCode: 500
                        }
                    };
                }
                requests = await prismaAny.marketplaceRequest.findMany({
                    where,
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                profilePicture: true,
                                subscriptionTier: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });
            }
            catch (prismaError) {
                console.error('❌ Prisma query error in getStudentRequests:', {
                    error: prismaError.message,
                    code: prismaError.code,
                    meta: prismaError.meta,
                    tutorId,
                    where,
                    stack: prismaError.stack?.substring(0, 1000),
                    prismaHasMarketplaceRequest: !!connection_1.prisma.marketplaceRequest,
                    prismaKeys: Object.keys(connection_1.prisma).filter(k => !k.startsWith('$') && k.includes('marketplace'))
                });
                if (prismaError.code === 'P2021' || prismaError.code === 'P2025') {
                    return {
                        success: false,
                        error: {
                            message: 'Marketplace table not found. Please run database migrations.',
                            statusCode: 500,
                            code: prismaError.code
                        }
                    };
                }
                return {
                    success: false,
                    error: {
                        message: prismaError.message || 'Database error while fetching requests',
                        statusCode: 500,
                        code: prismaError.code
                    }
                };
            }
            console.log('✅ Found marketplace requests:', requests?.length || 0);
            if (!requests || !Array.isArray(requests)) {
                console.warn('⚠️ Requests query returned invalid data:', requests);
                return {
                    success: true,
                    data: []
                };
            }
            const studentRequests = requests.map((request) => {
                try {
                    if (!request || !request.student) {
                        console.error('⚠️ Request missing student relation:', {
                            requestId: request?.id || 'unknown',
                            hasRequest: !!request,
                            hasStudent: !!request?.student,
                            requestKeys: request ? Object.keys(request) : []
                        });
                        return null;
                    }
                    const studentRequest = {
                        id: request.id,
                        studentId: request.studentId,
                        tutorId: request.tutorId,
                        requestType: (request.requestType?.toLowerCase() || 'session'),
                        subject: request.subject || '',
                        description: request.description || '',
                        urgency: (request.urgency?.toLowerCase() || 'medium'),
                        requestedDate: request.requestedDate?.toISOString() || request.createdAt?.toISOString() || new Date().toISOString(),
                        status: (request.status?.toLowerCase() || 'pending'),
                        createdAt: request.createdAt?.toISOString() || new Date().toISOString(),
                        studentName: `${request.student?.firstName || ''} ${request.student?.lastName || ''}`.trim() || 'Student',
                        studentEmail: request.student?.email || '',
                        studentAvatar: request.student?.profilePicture || undefined,
                        feedbackId: request.feedbackId || undefined,
                        response: request.response || undefined
                    };
                    return studentRequest;
                }
                catch (transformError) {
                    console.error('❌ Error transforming request:', {
                        requestId: request?.id || 'unknown',
                        error: transformError.message,
                        request: JSON.stringify(request).substring(0, 200)
                    });
                    return null;
                }
            }).filter((req) => req !== null);
            console.log('✅ Retrieved student requests:', {
                tutorId,
                count: studentRequests.length,
                status,
                firstRequest: studentRequests.length > 0 ? studentRequests[0] : null
            });
            return {
                success: true,
                data: studentRequests
            };
        }
        catch (error) {
            console.error('❌ Error getting student requests:', {
                error: error.message,
                code: error.code,
                meta: error.meta,
                stack: error.stack?.substring(0, 1000),
                tutorId,
                errorType: error.constructor?.name,
                errorKeys: Object.keys(error)
            });
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to fetch student requests',
                    statusCode: 500,
                    code: error.code
                }
            };
        }
    }
    static async getAllTutors() {
        try {
            console.log('📚 Fetching all tutors for marketplace...');
            const tutors = await connection_1.prisma.user.findMany({
                where: {
                    role: { in: ['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'] }
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    bio: true,
                    phone: true,
                    city: true,
                    role: true,
                    status: true,
                    profilePicture: true,
                    profileImage: true,
                    preferences: true,
                    createdAt: true,
                    lastActivityAt: true,
                    _count: {
                        select: {
                            createdLiveSessions: true,
                            createdCourses: true
                        }
                    }
                }
            });
            console.log(`✅ Found ${tutors.length} total tutors (ADMIN, SENIOR_MANAGER, JUNIOR_MANAGER)`);
            tutors.forEach(tutor => {
                console.log(`📋 Tutor found: ${tutor.email} (${tutor.role}, status=${tutor.status})`);
            });
            const activatedTutors = tutors.filter(user => {
                if (user.role === 'ADMIN') {
                    console.log(`✅ Including ADMIN ${user.email} (${user.firstName} ${user.lastName}) - always visible, status=${user.status}`);
                    return true;
                }
                if (user.role !== 'SENIOR_MANAGER') {
                    console.log(`⚠️ Excluding ${user.email} - role: ${user.role}`);
                    return false;
                }
                let preferences = {};
                try {
                    if (user.preferences) {
                        if (typeof user.preferences === 'string') {
                            preferences = JSON.parse(user.preferences);
                        }
                        else if (typeof user.preferences === 'object') {
                            preferences = user.preferences;
                        }
                    }
                }
                catch (parseError) {
                    console.error(`❌ Error parsing preferences for ${user.email}:`, parseError.message);
                    preferences = {};
                }
                const marketplaceProfile = preferences.marketplaceProfile || {};
                const isActive = marketplaceProfile.isActive;
                console.log(`🔍 Checking ${user.email} (${user.role}): isActive=${isActive}, type=${typeof isActive}, strict=${isActive === true}`);
                const passes = isActive === true;
                if (!passes) {
                    console.log(`   ❌ Filtered out: isActive is not exactly true`);
                }
                return passes;
            });
            console.log(`✅ Filtered to ${activatedTutors.length} activated tutors`);
            if (activatedTutors.length === 0) {
                console.warn('⚠️ WARNING: No activated tutors found! Check if profiles are activated.');
                console.log('📋 All tutors found:', tutors.map(u => {
                    let prefs = {};
                    try {
                        if (u.preferences) {
                            prefs = typeof u.preferences === 'string' ? JSON.parse(u.preferences) : u.preferences;
                        }
                    }
                    catch (e) { }
                    return `${u.email} (${u.role}, status=${u.status}, isActive=${prefs.marketplaceProfile?.isActive})`;
                }));
            }
            else {
                console.log('📋 Activated tutors:', activatedTutors.map(u => `${u.email} (${u.firstName} ${u.lastName}, ${u.role}, status=${u.status})`));
            }
            const tutorProfiles = activatedTutors.map(user => {
                let preferences = {};
                try {
                    if (user.preferences) {
                        if (typeof user.preferences === 'string') {
                            preferences = JSON.parse(user.preferences);
                        }
                        else if (typeof user.preferences === 'object') {
                            preferences = user.preferences;
                        }
                    }
                }
                catch (parseError) {
                    console.error(`❌ Error parsing preferences for ${user.email} in mapping:`, parseError.message);
                    preferences = {};
                }
                const marketplaceProfile = preferences.marketplaceProfile || {};
                const isActive = marketplaceProfile.isActive === true;
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Formateur';
                const specialties = Array.isArray(marketplaceProfile.specialties)
                    ? marketplaceProfile.specialties
                    : marketplaceProfile.specialties
                        ? [marketplaceProfile.specialties]
                        : [];
                const isCurrentlyOnline = user.status === 'ONLINE';
                const displayStatus = user.status || 'OFFLINE';
                const tutorLocation = marketplaceProfile.location || user.city || null;
                const acceptsMessages = marketplaceProfile.acceptsMessages !== false;
                return {
                    id: user.id,
                    userId: user.id,
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    fullName: fullName,
                    bio: marketplaceProfile.bio || user.bio || `Formateur expérimenté en français langue étrangère.`,
                    title: marketplaceProfile.title || undefined,
                    phone: marketplaceProfile.phone || undefined,
                    website: marketplaceProfile.website || undefined,
                    acceptsMessages: acceptsMessages,
                    specialties: specialties,
                    location: tutorLocation,
                    profilePicture: user.profileImage || user.profilePicture || null,
                    status: displayStatus,
                    isActive: isActive,
                    languages: Array.isArray(marketplaceProfile.languages)
                        ? marketplaceProfile.languages
                        : marketplaceProfile.languages
                            ? [marketplaceProfile.languages]
                            : ['Français', 'English'],
                    subjects: Array.isArray(marketplaceProfile.subjects)
                        ? marketplaceProfile.subjects
                        : marketplaceProfile.subjects
                            ? [marketplaceProfile.subjects]
                            : [],
                    availability: Array.isArray(marketplaceProfile.availability)
                        ? marketplaceProfile.availability
                        : marketplaceProfile.availability
                            ? [marketplaceProfile.availability]
                            : ['Disponible'],
                    workingHours: Array.isArray(marketplaceProfile.workingHours)
                        ? marketplaceProfile.workingHours
                        : marketplaceProfile.workingHours
                            ? [marketplaceProfile.workingHours]
                            : []
                };
            });
            console.log(`✅ Returning ${tutorProfiles.length} tutor profiles`);
            if (tutorProfiles.length > 0) {
                console.log('📋 Sample tutor profile:', {
                    id: tutorProfiles[0].id,
                    fullName: tutorProfiles[0].fullName,
                    isActive: tutorProfiles[0].isActive,
                    status: tutorProfiles[0].status,
                    specialties: tutorProfiles[0].specialties,
                    location: tutorProfiles[0].location
                });
            }
            else {
                console.warn('⚠️ WARNING: No tutor profiles returned despite filtering!');
            }
            return {
                success: true,
                data: tutorProfiles
            };
        }
        catch (error) {
            console.error('❌ Error getting all tutors:', error);
            console.error('Error stack:', error.stack);
            return {
                success: false,
                error: { message: error.message || 'Failed to get tutors', statusCode: 500 }
            };
        }
    }
    static async updateTutorProfile(userId, updates) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                return {
                    success: false,
                    error: { message: 'User not found', statusCode: 404 }
                };
            }
            let currentPreferences = {};
            try {
                if (user.preferences) {
                    if (typeof user.preferences === 'string') {
                        currentPreferences = JSON.parse(user.preferences);
                    }
                    else if (typeof user.preferences === 'object') {
                        currentPreferences = user.preferences;
                    }
                }
            }
            catch (parseError) {
                console.error('Error parsing preferences:', parseError);
                currentPreferences = {};
            }
            const updatedPreferences = {
                ...currentPreferences,
                marketplaceProfile: {
                    ...(currentPreferences.marketplaceProfile || {}),
                    ...(updates.bio !== undefined && { bio: updates.bio }),
                    ...(updates.acceptsMessages !== undefined && { acceptsMessages: updates.acceptsMessages }),
                    ...(updates.title !== undefined && { title: updates.title }),
                    ...(updates.phone !== undefined && { phone: updates.phone }),
                    ...(updates.website !== undefined && { website: updates.website }),
                    ...(updates.location !== undefined && { location: updates.location }),
                    ...(updates.specialties !== undefined && { specialties: Array.isArray(updates.specialties) ? updates.specialties : [] }),
                    ...(updates.subjects !== undefined && { subjects: Array.isArray(updates.subjects) ? updates.subjects : [] }),
                    ...(updates.languages !== undefined && { languages: Array.isArray(updates.languages) ? updates.languages : [] }),
                    ...(updates.availability !== undefined && { availability: Array.isArray(updates.availability) ? updates.availability : [] }),
                    ...(updates.workingHours !== undefined && { workingHours: Array.isArray(updates.workingHours) ? updates.workingHours : [] })
                }
            };
            console.log('💾 Saving location update:', {
                userId,
                location: updates.location,
                currentLocation: currentPreferences.marketplaceProfile?.location,
                updatedLocation: updatedPreferences.marketplaceProfile?.location,
                willUpdateCity: updates.location !== undefined
            });
            const updatedUser = await connection_1.prisma.user.update({
                where: { id: userId },
                data: {
                    bio: updates.bio !== undefined ? updates.bio : user.bio,
                    city: updates.location !== undefined ? (updates.location || null) : user.city,
                    preferences: updatedPreferences
                },
                include: {
                    _count: {
                        select: {
                            createdLiveSessions: true,
                            createdCourses: true
                        }
                    }
                }
            });
            console.log('✅ Tutor profile updated:', {
                userId,
                hasSpecialties: !!updates.specialties,
                specialtiesCount: updates.specialties?.length || 0,
                location: updates.location,
                hasLocation: !!updates.location,
                savedLocation: updatedPreferences.marketplaceProfile?.location
            });
            const profile = await this.getTutorProfile(userId);
            return profile;
        }
        catch (error) {
            console.error('Error updating tutor profile:', error);
            return {
                success: false,
                error: { message: error.message || 'Failed to update tutor profile', statusCode: 500 }
            };
        }
    }
    static async activateTutorProfile(userId, isActive) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(user.role)) {
                return {
                    success: false,
                    error: { message: 'Unauthorized: Only managers and admins can manage marketplace profiles', statusCode: 403 }
                };
            }
            const currentPreferences = user.preferences
                ? (typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences)
                : {};
            const updatedPreferences = {
                ...currentPreferences,
                marketplaceProfile: {
                    ...(currentPreferences.marketplaceProfile || {}),
                    isActive: isActive,
                    activatedAt: isActive ? new Date().toISOString() : (currentPreferences.marketplaceProfile?.activatedAt || null),
                    deactivatedAt: !isActive ? new Date().toISOString() : (currentPreferences.marketplaceProfile?.deactivatedAt || null)
                }
            };
            console.log('🔧 Activating tutor profile:', {
                userId,
                isActive,
                currentPreferences: JSON.stringify(currentPreferences),
                updatedPreferences: JSON.stringify(updatedPreferences),
                preferencesType: typeof user.preferences
            });
            await connection_1.prisma.user.update({
                where: { id: userId },
                data: {
                    preferences: updatedPreferences,
                    lastActivityAt: new Date()
                }
            });
            console.log('✅ Preferences updated in database for user:', userId);
            console.log(`✅ Tutor profile ${isActive ? 'activated' : 'deactivated'} for user ${userId}`);
            const profile = await this.getTutorProfile(userId);
            return {
                success: true,
                data: profile.data,
                message: `Profile ${isActive ? 'activated' : 'deactivated'} successfully`
            };
        }
        catch (error) {
            console.error('❌ Error activating tutor profile:', {
                error: error.message,
                stack: error.stack,
                userId
            });
            return {
                success: false,
                error: { message: 'Failed to activate tutor profile', statusCode: 500 }
            };
        }
    }
    static async createStudentRequest(studentId, tutorId, requestData) {
        try {
            console.log('📝 Creating student request:', { studentId, tutorId, requestData });
            const student = await connection_1.prisma.user.findUnique({
                where: { id: studentId },
                select: { subscriptionTier: true, role: true }
            });
            if (!student || !['PRO', 'PREMIUM'].includes(student.subscriptionTier)) {
                return {
                    success: false,
                    error: { message: 'Pro+ subscription required to request tutors', statusCode: 403 }
                };
            }
            const tutor = await connection_1.prisma.user.findUnique({
                where: { id: tutorId },
                select: { role: true, status: true }
            });
            if (!tutor || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(tutor.role)) {
                return {
                    success: false,
                    error: { message: 'Invalid tutor selected', statusCode: 404 }
                };
            }
            const request = await connection_1.prisma.marketplaceRequest.create({
                data: {
                    studentId,
                    tutorId,
                    requestType: requestData.requestType,
                    subject: requestData.subject,
                    description: requestData.description,
                    urgency: requestData.urgency || 'MEDIUM',
                    requestedDate: requestData.requestedDate || null,
                    feedbackId: requestData.feedbackId || null,
                    metadata: requestData.metadata || null,
                    status: 'PENDING'
                },
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            profilePicture: true
                        }
                    }
                }
            });
            const studentRequest = {
                id: request.id,
                studentId: request.studentId,
                tutorId: request.tutorId,
                requestType: request.requestType.toLowerCase(),
                subject: request.subject,
                description: request.description,
                urgency: request.urgency.toLowerCase(),
                requestedDate: request.requestedDate?.toISOString() || request.createdAt.toISOString(),
                status: request.status.toLowerCase(),
                createdAt: request.createdAt.toISOString(),
                studentName: `${request.student.firstName} ${request.student.lastName}`,
                studentEmail: request.student.email,
                studentAvatar: request.student.profilePicture || undefined,
                feedbackId: request.feedbackId || undefined
            };
            console.log('✅ Student request created:', { requestId: request.id });
            try {
                const { NotificationService } = await Promise.resolve().then(() => __importStar(require('./notificationService')));
                const { NotificationType } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
                await NotificationService.sendSystemNotification(tutorId, 'Nouvelle demande d\'expertise', `${request.student.firstName} ${request.student.lastName} a soumis une nouvelle demande "${request.subject}" (${request.requestType.toLowerCase()}).`, NotificationType.INFO, {
                    requestId: request.id,
                    studentId: request.studentId,
                    studentName: `${request.student.firstName} ${request.student.lastName}`,
                    subject: request.subject,
                    requestType: request.requestType,
                    urgency: request.urgency
                });
                console.log(`📧 Notification sent to tutor ${tutorId} about new request ${request.id}`);
            }
            catch (notificationError) {
                console.error('❌ Failed to send notification to tutor:', {
                    error: notificationError.message,
                    requestId: request.id,
                    tutorId
                });
            }
            return {
                success: true,
                data: studentRequest,
                message: 'Request submitted successfully'
            };
        }
        catch (error) {
            console.error('❌ Error creating student request:', {
                error: error.message,
                stack: error.stack
            });
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to create student request',
                    statusCode: 500
                }
            };
        }
    }
    static async handleStudentRequest(requestId, action, managerId, response) {
        try {
            console.log(`🔧 Handling request ${requestId} with action: ${action} by manager: ${managerId}`);
            const manager = await connection_1.prisma.user.findUnique({
                where: { id: managerId }
            });
            if (!manager || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(manager.role)) {
                return {
                    success: false,
                    error: { message: 'Unauthorized: Only managers and admins can handle requests', statusCode: 403 }
                };
            }
            const request = await connection_1.prisma.marketplaceRequest.findUnique({
                where: { id: requestId },
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });
            if (!request) {
                return {
                    success: false,
                    error: { message: 'Request not found', statusCode: 404 }
                };
            }
            if (request.tutorId !== managerId && manager.role !== 'ADMIN') {
                return {
                    success: false,
                    error: { message: 'Unauthorized: You can only handle requests assigned to you', statusCode: 403 }
                };
            }
            const statusMap = {
                'accept': 'ACCEPTED',
                'decline': 'DECLINED',
                'complete': 'COMPLETED',
                'cancel': 'CANCELLED'
            };
            const updateData = {
                status: statusMap[action] || 'PENDING',
                updatedAt: new Date()
            };
            if (response) {
                updateData.response = response;
            }
            if (action === 'complete') {
                updateData.completedDate = new Date();
            }
            const updatedRequest = await connection_1.prisma.marketplaceRequest.update({
                where: { id: requestId },
                data: updateData,
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });
            console.log(`✅ Request ${requestId} ${action}ed successfully`);
            try {
                const { NotificationService } = await Promise.resolve().then(() => __importStar(require('./notificationService')));
                const prismaClient = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
                const NotificationType = prismaClient.NotificationType;
                let notificationTitle = '';
                let notificationMessage = '';
                let notificationType = NotificationType.INFO;
                if (action === 'accept') {
                    notificationTitle = 'Demande acceptée';
                    notificationMessage = `${request.student.firstName}, votre demande "${updatedRequest.subject}" a été acceptée par ${manager.firstName} ${manager.lastName}.${updatedRequest.response ? ` Réponse: ${updatedRequest.response}` : ''}`;
                    notificationType = NotificationType.SUCCESS;
                }
                else if (action === 'decline') {
                    notificationTitle = 'Demande déclinée';
                    notificationMessage = `${request.student.firstName}, votre demande "${updatedRequest.subject}" a été déclinée par ${manager.firstName} ${manager.lastName}.${updatedRequest.response ? ` Raison: ${updatedRequest.response}` : ''}`;
                    notificationType = NotificationType.WARNING;
                }
                else if (action === 'complete') {
                    notificationTitle = 'Demande complétée';
                    notificationMessage = `${request.student.firstName}, votre demande "${updatedRequest.subject}" a été marquée comme complétée par ${manager.firstName} ${manager.lastName}.${updatedRequest.response ? ` Notes: ${updatedRequest.response}` : ''}`;
                    notificationType = NotificationType.SUCCESS;
                }
                await NotificationService.sendSystemNotification(request.studentId, notificationTitle, notificationMessage, notificationType, {
                    requestId: updatedRequest.id,
                    action,
                    tutorId: managerId,
                    tutorName: `${manager.firstName} ${manager.lastName}`,
                    subject: updatedRequest.subject,
                    requestType: updatedRequest.requestType,
                    response: updatedRequest.response
                });
                console.log(`📧 Notification sent to student ${request.studentId} about request ${requestId} ${action}`);
            }
            catch (notificationError) {
                console.error('❌ Failed to send notification:', {
                    error: notificationError.message,
                    requestId,
                    studentId: request.studentId
                });
            }
            return {
                success: true,
                data: {
                    id: updatedRequest.id,
                    status: updatedRequest.status.toLowerCase(),
                    action,
                    managerId,
                    handledAt: updatedRequest.updatedAt.toISOString(),
                    response: updatedRequest.response,
                    completedDate: updatedRequest.completedDate?.toISOString()
                },
                message: `Request ${action}ed successfully`
            };
        }
        catch (error) {
            console.error('❌ Error handling student request:', {
                error: error.message,
                stack: error.stack,
                requestId,
                action
            });
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to handle student request',
                    statusCode: 500
                }
            };
        }
    }
    static async getStudentOwnRequests(studentId, status) {
        try {
            const where = { studentId };
            if (status) {
                where.status = status;
            }
            const requests = await connection_1.prisma.marketplaceRequest.findMany({
                where,
                include: {
                    tutor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            profilePicture: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            const studentRequests = requests.map(request => ({
                id: request.id,
                studentId: request.studentId,
                tutorId: request.tutorId,
                requestType: request.requestType.toLowerCase(),
                subject: request.subject,
                description: request.description,
                urgency: request.urgency.toLowerCase(),
                requestedDate: request.requestedDate?.toISOString() || request.createdAt.toISOString(),
                status: request.status.toLowerCase(),
                createdAt: request.createdAt.toISOString(),
                tutorName: `${request.tutor.firstName} ${request.tutor.lastName}`,
                tutorEmail: request.tutor.email,
                tutorAvatar: request.tutor.profilePicture || undefined,
                feedbackId: request.feedbackId || undefined,
                response: request.response || undefined
            }));
            return {
                success: true,
                data: studentRequests
            };
        }
        catch (error) {
            console.error('❌ Error getting student own requests:', error);
            return {
                success: false,
                error: { message: 'Failed to get student requests', statusCode: 500 }
            };
        }
    }
    static async getAllSpecialties() {
        try {
            console.log('📋 Returning available specialties: TCF, TEF');
            const specialtiesArray = ['TCF', 'TEF'];
            return {
                success: true,
                data: specialtiesArray
            };
        }
        catch (error) {
            console.error('❌ Error getting all specialties:', error);
            return {
                success: false,
                error: { message: error.message || 'Failed to get specialties', statusCode: 500 }
            };
        }
    }
    static async getAllSubjects() {
        try {
            console.log('📚 Getting all unique subjects from tutors...');
            const tutors = await connection_1.prisma.user.findMany({
                where: {
                    role: { in: ['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'] },
                    status: { in: ['ACTIVE', 'ONLINE'] }
                },
                select: {
                    preferences: true
                }
            });
            const allSubjects = new Set();
            tutors.forEach(user => {
                try {
                    let preferences = {};
                    if (user.preferences) {
                        preferences = typeof user.preferences === 'string'
                            ? JSON.parse(user.preferences)
                            : user.preferences;
                    }
                    const marketplaceProfile = preferences.marketplaceProfile || {};
                    const subjects = marketplaceProfile.subjects || marketplaceProfile.specialties || [];
                    if (Array.isArray(subjects)) {
                        subjects.forEach((subject) => {
                            if (subject && typeof subject === 'string') {
                                allSubjects.add(subject);
                            }
                        });
                    }
                }
                catch (err) {
                    console.error('Error parsing preferences for subjects:', err);
                }
            });
            const defaultSubjects = [
                'Grammaire',
                'Expression Orale',
                'Méthodologie TCF/TEF',
                'Vocabulaire',
                'Phonétique',
                'Conversation',
                'Compréhension Orale',
                'Compréhension Écrite',
                'Expression Écrite',
                'TCF',
                'TEF'
            ];
            const subjectsArray = Array.from(allSubjects);
            const finalSubjects = subjectsArray.length > 0 ? subjectsArray : defaultSubjects;
            console.log(`✅ Returning ${finalSubjects.length} subjects`);
            return {
                success: true,
                data: finalSubjects
            };
        }
        catch (error) {
            console.error('❌ Error getting all subjects:', error);
            return {
                success: false,
                error: { message: error.message || 'Failed to get subjects', statusCode: 500 }
            };
        }
    }
    static async getAllAvailabilityOptions() {
        try {
            console.log('📅 Getting all unique availability options from tutors...');
            const tutors = await connection_1.prisma.user.findMany({
                where: {
                    role: { in: ['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'] },
                    status: { in: ['ACTIVE', 'ONLINE'] }
                },
                select: {
                    preferences: true
                }
            });
            const allAvailability = new Set();
            tutors.forEach(user => {
                try {
                    let preferences = {};
                    if (user.preferences) {
                        preferences = typeof user.preferences === 'string'
                            ? JSON.parse(user.preferences)
                            : user.preferences;
                    }
                    const marketplaceProfile = preferences.marketplaceProfile || {};
                    const availability = marketplaceProfile.availability || [];
                    if (Array.isArray(availability)) {
                        availability.forEach((avail) => {
                            if (avail && typeof avail === 'string') {
                                allAvailability.add(avail);
                            }
                        });
                    }
                }
                catch (err) {
                    console.error('Error parsing preferences for availability:', err);
                }
            });
            const defaultAvailability = [
                'Lun-Ven',
                'Mar-Sam',
                'Lun-Dim',
                'Mer-Dim',
                'Lun-Sam',
                'Lun-Ven 18h-23h',
                'Week-end',
                'Soirées',
                'Disponible maintenant'
            ];
            const availabilityArray = Array.from(allAvailability);
            const finalAvailability = availabilityArray.length > 0 ? availabilityArray : defaultAvailability;
            console.log(`✅ Returning ${finalAvailability.length} availability options`);
            return {
                success: true,
                data: finalAvailability
            };
        }
        catch (error) {
            console.error('❌ Error getting availability options:', error);
            return {
                success: false,
                error: { message: error.message || 'Failed to get availability options', statusCode: 500 }
            };
        }
    }
}
exports.MarketplaceService = MarketplaceService;
//# sourceMappingURL=marketplaceService.js.map