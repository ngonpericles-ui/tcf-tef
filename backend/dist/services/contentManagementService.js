"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentManagementService = void 0;
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const cloudinaryService_1 = require("./cloudinaryService");
class ContentManagementService {
    static async uploadContent(uploadData, userId, userRole) {
        try {
            if (!['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(userRole)) {
                throw new errors_1.ForbiddenError('Insufficient permissions to upload content');
            }
            if (userRole === 'JUNIOR_MANAGER') {
                if (!['A1', 'A2', 'B1'].includes(uploadData.level)) {
                    throw new errors_1.ForbiddenError('Junior managers can only create content for levels A1-B1');
                }
                if (uploadData.contentType === 'SIMULATION' && uploadData.category !== 'TEST') {
                    throw new errors_1.ForbiddenError('Junior managers cannot create audio simulations');
                }
            }
            let fileUrl;
            let thumbnailUrl;
            let extractedDuration = undefined;
            if (uploadData.file) {
                const uploadResult = await cloudinaryService_1.CloudinaryService.uploadFile(uploadData.file.path, {
                    folder: `tcf-tef-platform/content/${uploadData.contentType.toLowerCase()}`,
                    resource_type: this.getResourceType(uploadData.file.mimetype),
                    tags: [uploadData.contentType, uploadData.level, uploadData.category]
                });
                fileUrl = uploadResult.secure_url;
                if (uploadData.contentType === 'VIDEO' && uploadResult.duration) {
                    extractedDuration = Math.round((uploadResult.duration / 60) * 10) / 10;
                    logger_1.logger.info('Video duration extracted from Cloudinary', {
                        durationSeconds: uploadResult.duration,
                        durationMinutes: extractedDuration,
                        publicId: uploadResult.public_id
                    });
                }
                if (uploadData.contentType === 'VIDEO') {
                    thumbnailUrl = cloudinaryService_1.CloudinaryService.getVideoThumbnailUrl(uploadResult.public_id);
                }
                try {
                    const fs = require('fs');
                    if (fs.existsSync(uploadData.file.path)) {
                        await fs.promises.unlink(uploadData.file.path);
                        logger_1.logger.info('Local file deleted after Cloudinary upload', {
                            filePath: uploadData.file.path,
                            contentType: uploadData.contentType
                        });
                    }
                }
                catch (unlinkError) {
                    logger_1.logger.warn('Failed to delete local file after Cloudinary upload', {
                        filePath: uploadData.file.path,
                        error: unlinkError
                    });
                }
            }
            let content;
            let analysis;
            const finalDuration = uploadData.contentType === 'VIDEO' && extractedDuration
                ? extractedDuration
                : (uploadData.contentType === 'TEST' || uploadData.contentType === 'CORRIGER_TCF')
                    ? uploadData.duration
                    : undefined;
            switch (uploadData.contentType) {
                case 'NOTE':
                case 'VIDEO':
                    content = await this.createCourseContent(uploadData, userId, fileUrl, thumbnailUrl, finalDuration);
                    break;
                case 'TEST':
                case 'CORRIGER_TCF':
                    content = await this.createTestContent(uploadData, userId, fileUrl, finalDuration);
                    break;
                case 'SIMULATION':
                    content = await this.createSimulationContent(uploadData, userId, fileUrl);
                    break;
                default:
                    throw new errors_1.ValidationError('Invalid content type');
            }
            if (uploadData.file && fileUrl) {
                analysis = await this.performAIAnalysis(uploadData.file, content.id, userId);
            }
            logger_1.logger.info(`Content uploaded successfully: ${content.id}`, {
                contentType: uploadData.contentType,
                userId,
                userRole
            });
            return { content, analysis };
        }
        catch (error) {
            logger_1.logger.error('Error uploading content:', error);
            throw error;
        }
    }
    static async createCourseContent(uploadData, userId, fileUrl, thumbnailUrl, duration) {
        const course = await connection_1.prisma.course.create({
            data: {
                title: uploadData.title,
                description: uploadData.description,
                level: uploadData.level,
                category: uploadData.category,
                requiredTier: uploadData.subscriptionTier,
                duration: duration || 0,
                lessons: 1,
                tags: uploadData.tags || [],
                thumbnail: thumbnailUrl,
                isPublished: true,
                createdById: userId,
                lessons_data: fileUrl ? {
                    create: {
                        title: uploadData.title,
                        description: uploadData.description,
                        content: fileUrl,
                        videoUrl: uploadData.contentType === 'VIDEO' ? fileUrl : undefined,
                        duration: duration ? Math.round(duration) : 0,
                        order: 1,
                        resources: uploadData.tags || []
                    }
                } : undefined
            },
            include: {
                lessons_data: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                }
            }
        });
        return {
            id: course.id,
            title: course.title,
            description: course.description,
            level: course.level,
            category: course.category,
            subscriptionTier: course.requiredTier,
            contentType: uploadData.contentType,
            fileUrl,
            thumbnailUrl,
            duration: course.duration,
            tags: course.tags,
            isPublished: course.isPublished,
            createdBy: course.createdBy,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt
        };
    }
    static async createTestContent(uploadData, userId, fileUrl, duration) {
        const test = await connection_1.prisma.test.create({
            data: {
                title: uploadData.title,
                description: uploadData.description,
                level: uploadData.level,
                type: uploadData.category === 'CORRIGER_TCF' ? 'PRACTICE' : 'QUICK',
                category: uploadData.category,
                requiredTier: uploadData.subscriptionTier,
                duration: duration || uploadData.duration || 60,
                questionCount: 10,
                passingScore: uploadData.passingScore || 60,
                tags: uploadData.tags || [],
                isPublished: true,
                createdById: userId,
                status: 'PUBLISHED'
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                }
            }
        });
        return {
            id: test.id,
            title: test.title,
            description: test.description,
            level: test.level,
            category: test.category,
            subscriptionTier: test.requiredTier,
            contentType: uploadData.contentType,
            fileUrl: undefined,
            duration: test.duration,
            tags: test.tags,
            isPublished: test.isPublished,
            createdBy: test.createdBy,
            createdAt: test.createdAt,
            updatedAt: test.updatedAt
        };
    }
    static async createSimulationContent(uploadData, userId, fileUrl) {
        const simulation = await connection_1.prisma.test.create({
            data: {
                title: uploadData.title,
                description: uploadData.description,
                level: uploadData.level,
                type: 'SIMULATION',
                category: uploadData.category,
                requiredTier: uploadData.subscriptionTier,
                duration: uploadData.duration || 120,
                questionCount: 20,
                passingScore: uploadData.passingScore || 60,
                tags: uploadData.tags || [],
                isPublished: true,
                createdById: userId,
                status: 'PUBLISHED'
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                }
            }
        });
        return {
            id: simulation.id,
            title: simulation.title,
            description: simulation.description,
            level: simulation.level,
            category: 'SIMULATION',
            subscriptionTier: simulation.requiredTier,
            contentType: uploadData.contentType,
            fileUrl: undefined,
            duration: simulation.duration,
            tags: simulation.tags,
            isPublished: simulation.isPublished,
            createdBy: simulation.createdBy,
            createdAt: simulation.createdAt,
            updatedAt: simulation.updatedAt
        };
    }
    static async performAIAnalysis(file, contentId, userId) {
        try {
            const extractedText = await this.extractTextFromFile(file);
            const questionBankEntry = {
                id: `qb_${contentId}`,
                title: `Content Analysis - ${contentId}`,
                content: extractedText,
                contentId,
                uploadedBy: userId,
                tags: ['ai-analysis', 'content-extraction']
            };
            const aiAnalysis = {
                topics: this.extractTopics(extractedText),
                difficulty: this.assessDifficulty(extractedText),
                keyPoints: this.extractKeyPoints(extractedText),
                suggestedQuestions: this.generateSuggestedQuestions(extractedText)
            };
            logger_1.logger.info(`AI analysis completed for content: ${contentId}`);
            return {
                extractedText,
                questionBankId: questionBankEntry.id,
                aiAnalysis
            };
        }
        catch (error) {
            logger_1.logger.error('Error performing AI analysis:', error);
            throw error;
        }
    }
    static getResourceType(mimetype) {
        if (mimetype.startsWith('image/'))
            return 'image';
        if (mimetype.startsWith('video/'))
            return 'video';
        if (mimetype.startsWith('audio/'))
            return 'video';
        return 'raw';
    }
    static async extractTextFromFile(file) {
        return `Extracted text from ${file.originalname}`;
    }
    static extractTopics(text) {
        return ['grammar', 'vocabulary', 'comprehension'];
    }
    static assessDifficulty(text) {
        return 'intermediate';
    }
    static extractKeyPoints(text) {
        return ['Key point 1', 'Key point 2', 'Key point 3'];
    }
    static generateSuggestedQuestions(text) {
        return [
            { type: 'multiple_choice', question: 'Sample question?', options: ['A', 'B', 'C', 'D'] }
        ];
    }
    static async getContentForCourses(level, category, subscriptionTier, search, page = 1, limit = 20) {
        try {
            const where = {
                isPublished: true
            };
            if (level) {
                where.level = level;
            }
            if (subscriptionTier) {
                const tierHierarchy = ['FREE', 'ESSENTIAL', 'PREMIUM', 'PRO'];
                const userTierIndex = tierHierarchy.indexOf(subscriptionTier);
                const allowedTiers = tierHierarchy.slice(0, userTierIndex + 1);
                where.requiredTier = { in: allowedTiers };
            }
            else {
                where.requiredTier = 'FREE';
            }
            if (category)
                where.category = category;
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { tags: { hasSome: [search] } }
                ];
            }
            const [courses, total] = await Promise.all([
                connection_1.prisma.course.findMany({
                    where,
                    include: {
                        lessons_data: true,
                        createdBy: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit
                }),
                connection_1.prisma.course.count({ where })
            ]);
            const content = courses.map(course => {
                const realDuration = course.lessons_data.reduce((total, lesson) => total + (lesson.duration || 0), 0);
                return {
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    level: course.level,
                    category: course.category,
                    subscriptionTier: course.requiredTier,
                    contentType: course.lessons_data.length > 0 && course.lessons_data[0].videoUrl ? 'VIDEO' : 'NOTE',
                    fileUrl: course.lessons_data.length > 0 ? course.lessons_data[0].content : undefined,
                    thumbnailUrl: course.thumbnail,
                    duration: realDuration,
                    tags: course.tags,
                    isPublished: course.isPublished,
                    createdBy: course.createdBy,
                    createdAt: course.createdAt,
                    updatedAt: course.updatedAt,
                    lessons_data: course.lessons_data.map(lesson => ({
                        id: lesson.id,
                        title: lesson.title,
                        content: lesson.content,
                        videoUrl: lesson.videoUrl,
                        duration: lesson.duration,
                        order: lesson.order,
                        resources: lesson.resources
                    }))
                };
            });
            return {
                content,
                total,
                pages: Math.ceil(total / limit)
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching course content:', error);
            throw error;
        }
    }
    static async getContentForTests(level, type, subscriptionTier, search, page = 1, limit = 20) {
        try {
            const where = {
                isPublished: true
            };
            if (subscriptionTier) {
                const tierHierarchy = ['FREE', 'ESSENTIAL', 'PREMIUM', 'PRO'];
                const userTierIndex = tierHierarchy.indexOf(subscriptionTier);
                const allowedTiers = tierHierarchy.slice(0, userTierIndex + 1);
                where.requiredTier = { in: allowedTiers };
            }
            else {
                where.requiredTier = 'FREE';
            }
            if (level)
                where.level = level;
            if (type)
                where.type = type;
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } }
                ];
            }
            const [tests, total] = await Promise.all([
                connection_1.prisma.test.findMany({
                    where,
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit
                }),
                connection_1.prisma.test.count({ where })
            ]);
            const content = tests.map(test => ({
                id: test.id,
                title: test.title,
                description: test.description,
                level: test.level,
                category: test.category,
                subscriptionTier: test.requiredTier,
                contentType: test.type === 'SIMULATION' ? 'SIMULATION' : 'TEST',
                fileUrl: undefined,
                duration: test.duration,
                tags: test.tags,
                isPublished: test.isPublished,
                createdBy: test.createdBy,
                createdAt: test.createdAt,
                updatedAt: test.updatedAt
            }));
            return {
                content,
                total,
                pages: Math.ceil(total / limit)
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching test content:', error);
            throw error;
        }
    }
    static async getContentForManagement(userRole, userId, contentType, page = 1, limit = 20) {
        try {
            console.log('🔍 ContentManagementService.getContentForManagement called:', {
                userRole,
                userId,
                contentType,
                page,
                limit
            });
            const where = {};
            if (userRole === 'JUNIOR_MANAGER') {
                where.createdById = userId;
                where.level = { in: ['A1', 'A2', 'B1'] };
            }
            const [courses, tests] = await Promise.all([
                connection_1.prisma.course.findMany({
                    where,
                    include: {
                        lessons_data: true,
                        createdBy: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit
                }),
                connection_1.prisma.test.findMany({
                    where,
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit
                })
            ]);
            const courseGroups = new Map();
            courses.forEach(course => {
                const key = course.title;
                if (!courseGroups.has(key)) {
                    courseGroups.set(key, []);
                }
                courseGroups.get(key).push(course);
            });
            const courseContent = Array.from(courseGroups.entries()).map(([title, courseGroup]) => {
                const primaryCourse = courseGroup[0];
                const allLevels = [...new Set(courseGroup.map(c => c.level))];
                const allSubscriptions = [...new Set(courseGroup.map(c => c.requiredTier))];
                return {
                    id: primaryCourse.id,
                    title: primaryCourse.title,
                    description: primaryCourse.description,
                    level: allLevels,
                    category: primaryCourse.category,
                    subscriptionTier: allSubscriptions,
                    contentType: primaryCourse.lessons_data.length > 0 && primaryCourse.lessons_data[0].videoUrl ? 'VIDEO' : 'NOTE',
                    fileUrl: primaryCourse.lessons_data.length > 0 ? primaryCourse.lessons_data[0].content : undefined,
                    thumbnailUrl: primaryCourse.thumbnail,
                    duration: primaryCourse.duration,
                    tags: primaryCourse.tags,
                    isPublished: primaryCourse.isPublished,
                    createdBy: primaryCourse.createdBy,
                    createdAt: primaryCourse.createdAt,
                    updatedAt: primaryCourse.updatedAt,
                    levels: allLevels,
                    subscriptions: allSubscriptions,
                    totalVariants: courseGroup.length
                };
            });
            const testContent = tests.map(test => ({
                id: test.id,
                title: test.title,
                description: test.description,
                level: test.level,
                category: test.category,
                subscriptionTier: test.requiredTier,
                contentType: test.type === 'SIMULATION' ? 'SIMULATION' : 'TEST',
                fileUrl: undefined,
                duration: test.duration,
                tags: test.tags,
                isPublished: test.isPublished,
                createdBy: test.createdBy,
                createdAt: test.createdAt,
                updatedAt: test.updatedAt
            }));
            const allContent = [...courseContent, ...testContent]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const filteredContent = contentType
                ? allContent.filter(item => item.contentType === contentType)
                : allContent;
            return {
                content: filteredContent,
                total: filteredContent.length,
                pages: Math.ceil(filteredContent.length / limit)
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching management content:', error);
            throw error;
        }
    }
    static async updateCourseLevelsAndSubscriptions(courseId, levels, subscriptions, userId, userRole) {
        try {
            const primaryCourse = await connection_1.prisma.course.findUnique({
                where: { id: courseId },
                include: {
                    lessons_data: true,
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    }
                }
            });
            if (!primaryCourse) {
                throw new errors_1.NotFoundError('Course not found');
            }
            if (userRole !== 'ADMIN' && primaryCourse.createdById !== userId) {
                throw new errors_1.ForbiddenError('You can only update your own courses');
            }
            const allCourses = await connection_1.prisma.course.findMany({
                where: { title: primaryCourse.title },
                include: {
                    lessons_data: true,
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    }
                }
            });
            if (!levels || levels.length === 0) {
                throw new errors_1.ValidationError('At least one level must be provided');
            }
            if (!subscriptions || subscriptions.length === 0) {
                throw new errors_1.ValidationError('At least one subscription tier must be provided');
            }
            const selectedLevel = levels.includes('ALL') || levels.length === 6
                ? 'A1'
                : levels[0];
            const selectedTier = subscriptions.includes('ALL') || subscriptions.length === 4
                ? 'FREE'
                : subscriptions[0];
            const updatedCourse = await connection_1.prisma.course.update({
                where: { id: courseId },
                data: {
                    level: selectedLevel,
                    requiredTier: selectedTier,
                },
                include: {
                    lessons_data: true,
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    }
                }
            });
            return {
                id: updatedCourse.id,
                title: updatedCourse.title,
                description: updatedCourse.description,
                level: updatedCourse.level,
                category: updatedCourse.category,
                subscriptionTier: updatedCourse.requiredTier,
                requiredTier: updatedCourse.requiredTier,
                contentType: updatedCourse.lessons_data.length > 0 && updatedCourse.lessons_data[0].videoUrl ? 'VIDEO' : 'NOTE',
                fileUrl: updatedCourse.lessons_data.length > 0 ? updatedCourse.lessons_data[0].content : undefined,
                thumbnailUrl: updatedCourse.thumbnail,
                duration: updatedCourse.duration,
                tags: updatedCourse.tags,
                isPublished: updatedCourse.isPublished,
                createdBy: updatedCourse.createdBy,
                createdAt: updatedCourse.createdAt,
                updatedAt: updatedCourse.updatedAt
            };
        }
        catch (error) {
            logger_1.logger.error('Error updating course levels and subscriptions:', error);
            throw error;
        }
    }
    static async publishContent(contentId, contentType, userId, userRole) {
        try {
            if (!['ADMIN', 'SENIOR_MANAGER'].includes(userRole)) {
                throw new errors_1.ForbiddenError('Only admins and senior managers can publish content');
            }
            let updatedContent;
            if (contentType === 'TEST' || contentType === 'SIMULATION') {
                updatedContent = await connection_1.prisma.test.update({
                    where: { id: contentId },
                    data: { isPublished: true, status: 'PUBLISHED' }
                });
            }
            else {
                updatedContent = await connection_1.prisma.course.update({
                    where: { id: contentId },
                    data: { isPublished: true }
                });
            }
            logger_1.logger.info(`Content published: ${contentId}`, { userId, userRole });
            return {
                id: updatedContent.id,
                title: updatedContent.title,
                description: updatedContent.description,
                level: updatedContent.level,
                category: updatedContent.category || updatedContent.type,
                subscriptionTier: updatedContent.subscriptionTier,
                contentType,
                fileUrl: updatedContent.fileUrl,
                duration: updatedContent.duration,
                tags: updatedContent.tags,
                isPublished: updatedContent.isPublished,
                createdBy: updatedContent.createdBy,
                createdAt: updatedContent.createdAt,
                updatedAt: updatedContent.updatedAt
            };
        }
        catch (error) {
            logger_1.logger.error('Error publishing content:', error);
            throw error;
        }
    }
    static async deleteContent(contentId, contentType, userId, userRole) {
        try {
            if (userRole === 'JUNIOR_MANAGER') {
                const content = contentType === 'TEST' || contentType === 'SIMULATION'
                    ? await connection_1.prisma.test.findUnique({ where: { id: contentId } })
                    : await connection_1.prisma.course.findUnique({ where: { id: contentId } });
                if (!content || content.createdById !== userId) {
                    throw new errors_1.ForbiddenError('You can only delete your own content');
                }
            }
            if (contentType === 'TEST' || contentType === 'SIMULATION') {
                await connection_1.prisma.test.delete({ where: { id: contentId } });
            }
            else {
                await connection_1.prisma.course.delete({ where: { id: contentId } });
            }
            logger_1.logger.info(`Content deleted: ${contentId}`, { userId, userRole });
        }
        catch (error) {
            logger_1.logger.error('Error deleting content:', error);
            throw error;
        }
    }
}
exports.ContentManagementService = ContentManagementService;
//# sourceMappingURL=contentManagementService.js.map