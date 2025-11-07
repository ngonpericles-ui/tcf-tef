"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class MarketplaceService {
    static async getTutorProfile(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    _count: {
                        select: {
                            createdLiveSessions: true,
                            createdCourses: true
                        }
                    }
                }
            });
            if (!user) {
                return {
                    success: false,
                    error: { message: 'User not found', statusCode: 404 }
                };
            }
            const profile = {
                id: user.id,
                userId: user.id,
                title: user.role === 'ADMIN' ? 'Administrateur Expert' :
                    user.role === 'SENIOR_MANAGER' ? 'Formateur Senior' : 'Formateur',
                bio: user.bio || `Formateur expérimenté en français langue étrangère avec une expertise dans la préparation aux examens TCF/TEF.`,
                specialties: ['TCF/TEF Preparation', 'French Grammar', 'Conversation Practice'],
                experience: 5,
                rating: 4.8,
                totalStudents: user._count.createdLiveSessions + user._count.createdCourses,
                languages: ['Français', 'English'],
                availability: 'Lundi-Vendredi 9h-17h',
                location: user.city || 'France',
                website: '',
                phone: user.phone || '',
                isActive: user.status === 'ACTIVE',
                hourlyRate: 45,
                joinedDate: user.createdAt.toISOString(),
                lastActive: user.lastActivityAt?.toISOString() || new Date().toISOString()
            };
            return {
                success: true,
                data: profile
            };
        }
        catch (error) {
            console.error('Error getting tutor profile:', error);
            return {
                success: false,
                error: { message: 'Failed to get tutor profile', statusCode: 500 }
            };
        }
    }
    static async getStudentRequests(tutorId) {
        try {
            return {
                success: true,
                data: []
            };
        }
        catch (error) {
            console.error('Error getting student requests:', error);
            return {
                success: false,
                error: { message: 'Failed to get student requests', statusCode: 500 }
            };
        }
    }
    static async getAllTutors() {
        try {
            const tutors = await prisma.user.findMany({
                where: {
                    role: { in: ['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'] },
                    status: 'ACTIVE'
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
            const tutorProfiles = tutors.map(user => ({
                id: user.id,
                userId: user.id,
                title: user.role === 'ADMIN' ? 'Administrateur Expert' :
                    user.role === 'SENIOR_MANAGER' ? 'Formateur Senior' : 'Formateur',
                bio: user.bio || `Formateur expérimenté en français langue étrangère.`,
                specialties: user.role === 'ADMIN' ? ['TCF/TEF Preparation', 'Advanced Grammar', 'Business French'] :
                    user.role === 'SENIOR_MANAGER' ? ['TCF/TEF Preparation', 'French Grammar', 'Conversation Practice'] :
                        ['Basic French', 'Conversation Practice'],
                experience: user.role === 'ADMIN' ? 10 : user.role === 'SENIOR_MANAGER' ? 7 : 3,
                rating: 4.5 + Math.random() * 0.5,
                totalStudents: user._count.createdLiveSessions + user._count.createdCourses,
                languages: ['Français', 'English'],
                availability: 'Disponible',
                location: user.city || 'France',
                website: '',
                phone: user.phone || '',
                isActive: true,
                hourlyRate: user.role === 'ADMIN' ? 60 : user.role === 'SENIOR_MANAGER' ? 45 : 35,
                joinedDate: user.createdAt.toISOString(),
                lastActive: user.lastActivityAt?.toISOString() || new Date().toISOString()
            }));
            return {
                success: true,
                data: tutorProfiles
            };
        }
        catch (error) {
            console.error('Error getting all tutors:', error);
            return {
                success: false,
                error: { message: 'Failed to get tutors', statusCode: 500 }
            };
        }
    }
    static async updateTutorProfile(userId, updates) {
        try {
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    bio: updates.bio,
                    phone: updates.phone,
                    city: updates.location
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
            const profile = await this.getTutorProfile(userId);
            return profile;
        }
        catch (error) {
            console.error('Error updating tutor profile:', error);
            return {
                success: false,
                error: { message: 'Failed to update tutor profile', statusCode: 500 }
            };
        }
    }
    static async activateTutorProfile(userId, isActive) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(user.role)) {
                return {
                    success: false,
                    error: { message: 'Unauthorized: Only managers and admins can manage marketplace profiles', statusCode: 403 }
                };
            }
            await prisma.user.update({
                where: { id: userId },
                data: {
                    lastActivityAt: new Date()
                }
            });
            console.log(`Tutor profile ${isActive ? 'activated' : 'deactivated'} for user ${userId}`);
            const profile = await this.getTutorProfile(userId);
            return {
                success: true,
                data: profile.data,
                message: `Profile ${isActive ? 'activated' : 'deactivated'} successfully`
            };
        }
        catch (error) {
            console.error('Error activating tutor profile:', error);
            return {
                success: false,
                error: { message: 'Failed to activate tutor profile', statusCode: 500 }
            };
        }
    }
    static async handleStudentRequest(requestId, action, managerId) {
        try {
            const manager = await prisma.user.findUnique({
                where: { id: managerId }
            });
            if (!manager || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(manager.role)) {
                return {
                    success: false,
                    error: { message: 'Unauthorized: Only managers and admins can handle requests', statusCode: 403 }
                };
            }
            console.log(`Request ${requestId} ${action}ed by manager ${managerId}`);
            return {
                success: true,
                data: {
                    requestId,
                    action,
                    managerId,
                    status: action === 'accept' ? 'accepted' : 'declined',
                    handledAt: new Date().toISOString()
                },
                message: `Request ${action}ed successfully`
            };
        }
        catch (error) {
            console.error('Error handling student request:', error);
            return {
                success: false,
                error: { message: 'Failed to handle student request', statusCode: 500 }
            };
        }
    }
}
exports.MarketplaceService = MarketplaceService;
//# sourceMappingURL=marketplaceService.js.map