"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
class TeacherService {
    static async getAvailableTeachers(userId, filters) {
        try {
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: { subscriptionTier: true }
            });
            if (!user || user.subscriptionTier !== 'PRO') {
                throw new Error('Pro+ subscription required to access teachers');
            }
            const where = {
                role: {
                    in: ['JUNIOR_MANAGER', 'SENIOR_MANAGER']
                },
                status: 'ACTIVE'
            };
            if (filters.search) {
                where.OR = [
                    { firstName: { contains: filters.search, mode: 'insensitive' } },
                    { lastName: { contains: filters.search, mode: 'insensitive' } },
                    { bio: { contains: filters.search, mode: 'insensitive' } }
                ];
            }
            if (filters.specialties) {
                const specialties = filters.specialties.split(',');
                where.specialties = {
                    hasSome: specialties
                };
            }
            if (filters.rating) {
                where.rating = {
                    gte: filters.rating
                };
            }
            const teachers = await prisma_1.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    bio: true,
                    profileImage: true,
                    createdAt: true,
                    status: true
                },
                orderBy: this.getSortOrder(filters.sortBy)
            });
            const transformedTeachers = teachers.map(teacher => ({
                id: teacher.id,
                firstName: teacher.firstName,
                lastName: teacher.lastName,
                email: teacher.email,
                bio: teacher.bio || 'Experienced French teacher',
                specialties: ['Grammaire', 'Expression Orale'],
                rating: 4.5,
                totalSessions: 0,
                languages: ['Français', 'Anglais'],
                availability: ['Lun-Ven'],
                profileImage: teacher.profileImage,
                isAvailable: true,
                experience: 2,
                certifications: ['TCF/TEF Certified'],
                hourlyRate: 25000,
                responseTime: '2-4 hours'
            }));
            return transformedTeachers;
        }
        catch (error) {
            logger_1.logger.error('Error fetching teachers:', error);
            throw error;
        }
    }
    static async getTeacherProfile(teacherId, userId) {
        try {
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: { subscriptionTier: true }
            });
            if (!user || user.subscriptionTier !== 'PRO') {
                throw new Error('Pro+ subscription required to access teacher profiles');
            }
            const teacher = await prisma_1.prisma.user.findFirst({
                where: {
                    id: teacherId,
                    role: {
                        in: ['JUNIOR_MANAGER', 'SENIOR_MANAGER']
                    },
                    status: 'ACTIVE'
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    bio: true,
                    profileImage: true,
                    createdAt: true,
                    status: true
                }
            });
            if (!teacher) {
                throw new Error('Teacher not found');
            }
            return {
                id: teacher.id,
                firstName: teacher.firstName,
                lastName: teacher.lastName,
                email: teacher.email,
                bio: teacher.bio || 'Experienced French teacher',
                specialties: ['Grammaire', 'Expression Orale'],
                rating: 4.5,
                totalSessions: 0,
                languages: ['Français', 'Anglais'],
                availability: ['Lun-Ven'],
                profileImage: teacher.profileImage,
                isAvailable: true,
                experience: 2,
                certifications: ['TCF/TEF Certified'],
                hourlyRate: 25000,
                responseTime: '2-4 hours'
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching teacher profile:', error);
            throw error;
        }
    }
    static async getTeacherAvailability(teacherId, date) {
        try {
            const teacher = await prisma_1.prisma.user.findFirst({
                where: {
                    id: teacherId,
                    role: {
                        in: ['JUNIOR_MANAGER', 'SENIOR_MANAGER']
                    }
                },
                select: {
                    id: true,
                    status: true
                }
            });
            if (!teacher) {
                throw new Error('Teacher not found');
            }
            return {
                teacherId,
                availability: ['Lun-Ven'],
                timezone: 'UTC',
                availableSlots: this.generateAvailableSlots(date)
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching teacher availability:', error);
            throw error;
        }
    }
    static async bookSession(teacherId, userId, bookingData) {
        try {
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: { subscriptionTier: true }
            });
            if (!user || user.subscriptionTier !== 'PRO') {
                throw new Error('Pro+ subscription required to book sessions');
            }
            const session = await prisma_1.prisma.liveSession.create({
                data: {
                    title: `Session 1-on-1 - ${bookingData.subject}`,
                    description: `Session privée avec ${bookingData.teacherName || 'Formateur'}`,
                    instructor: bookingData.teacherName || 'Formateur',
                    coInstructors: [],
                    date: new Date(bookingData.date),
                    duration: bookingData.duration || 60,
                    maxParticipants: 1,
                    requiredTier: 'PRO',
                    level: bookingData.level,
                    category: 'ORAL',
                    tags: [bookingData.subject, 'one-on-one'],
                    createdById: teacherId,
                    status: 'SCHEDULED'
                }
            });
            await prisma_1.prisma.liveSessionParticipant.create({
                data: {
                    liveSessionId: session.id,
                    userId: userId,
                    joinedAt: new Date()
                }
            });
            return {
                sessionId: session.id,
                teacherId,
                userId,
                date: session.date,
                duration: session.duration,
                subject: bookingData.subject,
                level: bookingData.level
            };
        }
        catch (error) {
            logger_1.logger.error('Error booking session:', error);
            throw error;
        }
    }
    static getSortOrder(sortBy) {
        switch (sortBy) {
            case 'rating':
                return { rating: 'desc' };
            case 'experience':
                return { experience: 'desc' };
            case 'availability':
                return { availability: 'asc' };
            default:
                return { rating: 'desc' };
        }
    }
    static checkAvailability(availability) {
        if (!availability || availability.length === 0)
            return false;
        const now = new Date();
        const dayOfWeek = now.getDay();
        return availability.some(avail => {
            if (avail.includes('Lun-Ven')) {
                return dayOfWeek >= 1 && dayOfWeek <= 5;
            }
            if (avail.includes('Mar-Sam')) {
                return dayOfWeek >= 2 && dayOfWeek <= 6;
            }
            return true;
        });
    }
    static generateAvailableSlots(date) {
        const slots = [];
        const startHour = 9;
        const endHour = 18;
        for (let hour = startHour; hour < endHour; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        return slots;
    }
}
exports.TeacherService = TeacherService;
//# sourceMappingURL=teacherService.js.map