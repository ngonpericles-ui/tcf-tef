"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentManagementService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const cloudinaryService_1 = require("./cloudinaryService");
const prisma = new client_1.PrismaClient();
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
            if (uploadData.file) {
                const uploadResult = await cloudinaryService_1.CloudinaryService.uploadFile(uploadData.file.path, {
                    folder: `tcf-tef-platform/content/${uploadData.contentType.toLowerCase()}`,
                    resource_type: this.getResourceType(uploadData.file.mimetype),
                    tags: [uploadData.contentType, uploadData.level, uploadData.category]
                });
                fileUrl = uploadResult.secure_url;
                if (uploadData.contentType === 'VIDEO') {
                    thumbnailUrl = cloudinaryService_1.CloudinaryService.getVideoThumbnailUrl(uploadResult.public_id);
                }
            }
            let content;
            let analysis;
            switch (uploadData.contentType) {
                case 'NOTE':
                case 'VIDEO':
                    content = await this.createCourseContent(uploadData, userId, fileUrl, thumbnailUrl);
                    break;
                case 'TEST':
                case 'CORRIGER_TCF':
                    content = await this.createTestContent(uploadData, userId, fileUrl);
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
    static async createCourseContent(uploadData, userId, fileUrl, thumbnailUrl) {
        const course = await prisma.course.create({
            data: {
                title: uploadData.title,
                description: uploadData.description,
                level: uploadData.level,
                category: uploadData.category,
                requiredTier: uploadData.subscriptionTier,
                duration: uploadData.duration || 0,
                lessons: 1,
                tags: uploadData.tags || [],
                thumbnail: thumbnailUrl,
                isPublished: false,
                createdById: userId,
                lessons_data: fileUrl ? {
                    create: {
                        title: uploadData.title,
                        description: uploadData.description,
                        content: fileUrl,
                        videoUrl: uploadData.contentType === 'VIDEO' ? fileUrl : undefined,
                        duration: uploadData.duration || 0,
                        order: 1,
                        resources: uploadData.tags || []
                    }
                } : undefined
            },
            include: {
                lessons_data: true
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
            createdBy: course.createdById,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt
        };
    }
    static async createTestContent(uploadData, userId, fileUrl) {
        const test = await prisma.test.create({
            data: {
                title: uploadData.title,
                description: uploadData.description,
                level: uploadData.level,
                type: uploadData.category === 'CORRIGER_TCF' ? 'PRACTICE' : 'QUICK',
                category: uploadData.category,
                requiredTier: uploadData.subscriptionTier,
                duration: uploadData.duration || 60,
                questionCount: 10,
                passingScore: uploadData.passingScore || 60,
                tags: uploadData.tags || [],
                isPublished: false,
                createdById: userId,
                status: 'DRAFT'
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
            createdBy: test.createdById,
            createdAt: test.createdAt,
            updatedAt: test.updatedAt
        };
    }
    static async createSimulationContent(uploadData, userId, fileUrl) {
        const simulation = await prisma.test.create({
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
                isPublished: false,
                createdById: userId,
                status: 'DRAFT'
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
            createdBy: simulation.createdById,
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
                prisma.course.findMany({
                    where,
                    include: { lessons_data: true },
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit
                }),
                prisma.course.count({ where })
            ]);
            const content = courses.map(course => ({
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level,
                category: course.category,
                subscriptionTier: course.requiredTier,
                contentType: course.lessons_data.length > 0 && course.lessons_data[0].videoUrl ? 'VIDEO' : 'NOTE',
                fileUrl: course.lessons_data.length > 0 ? course.lessons_data[0].content : undefined,
                thumbnailUrl: course.thumbnail,
                duration: course.duration,
                tags: course.tags,
                isPublished: course.isPublished,
                createdBy: course.createdById,
                createdAt: course.createdAt,
                updatedAt: course.updatedAt
            }));
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
                prisma.test.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit
                }),
                prisma.test.count({ where })
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
                createdBy: test.createdById,
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
            const where = {};
            if (userRole === 'JUNIOR_MANAGER') {
                where.createdById = userId;
                where.level = { in: ['A1', 'A2', 'B1'] };
            }
            const [courses, tests] = await Promise.all([
                prisma.course.findMany({
                    where,
                    include: { lessons_data: true },
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit
                }),
                prisma.test.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit
                })
            ]);
            const courseContent = courses.map(course => ({
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level,
                category: course.category,
                subscriptionTier: course.requiredTier,
                contentType: course.lessons_data.length > 0 && course.lessons_data[0].videoUrl ? 'VIDEO' : 'NOTE',
                fileUrl: course.lessons_data.length > 0 ? course.lessons_data[0].content : undefined,
                thumbnailUrl: course.thumbnail,
                duration: course.duration,
                tags: course.tags,
                isPublished: course.isPublished,
                createdBy: course.createdById,
                createdAt: course.createdAt,
                updatedAt: course.updatedAt
            }));
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
                createdBy: test.createdById,
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
    static async publishContent(contentId, contentType, userId, userRole) {
        try {
            if (!['ADMIN', 'SENIOR_MANAGER'].includes(userRole)) {
                throw new errors_1.ForbiddenError('Only admins and senior managers can publish content');
            }
            let updatedContent;
            if (contentType === 'TEST' || contentType === 'SIMULATION') {
                updatedContent = await prisma.test.update({
                    where: { id: contentId },
                    data: { isPublished: true, status: 'PUBLISHED' }
                });
            }
            else {
                updatedContent = await prisma.course.update({
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
                    ? await prisma.test.findUnique({ where: { id: contentId } })
                    : await prisma.course.findUnique({ where: { id: contentId } });
                if (!content || content.createdById !== userId) {
                    throw new errors_1.ForbiddenError('You can only delete your own content');
                }
            }
            if (contentType === 'TEST' || contentType === 'SIMULATION') {
                await prisma.test.delete({ where: { id: contentId } });
            }
            else {
                await prisma.course.delete({ where: { id: contentId } });
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