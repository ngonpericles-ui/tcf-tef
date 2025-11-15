"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentManagementService = void 0;
const connection_1 = require("@/database/connection");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const cloudinaryService_1 = require("./cloudinaryService");
const get_video_duration_1 = __importDefault(require("get-video-duration"));
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
                if (uploadData.contentType === 'VIDEO') {
                    try {
                        const durationInSeconds = await (0, get_video_duration_1.default)(uploadData.file.path);
                        extractedDuration = Math.round(durationInSeconds / 60);
                        logger_1.logger.info('Video duration extracted from file', {
                            filePath: uploadData.file.path,
                            durationSeconds: durationInSeconds,
                            durationMinutes: extractedDuration
                        });
                    }
                    catch (error) {
                        logger_1.logger.warn('Failed to extract duration from video file, will try Cloudinary', {
                            filePath: uploadData.file.path,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                }
                const uploadResult = await cloudinaryService_1.CloudinaryService.uploadFile(uploadData.file.path, {
                    folder: `tcf-tef-platform/content/${uploadData.contentType.toLowerCase()}`,
                    resource_type: this.getResourceType(uploadData.file.mimetype),
                    tags: [uploadData.contentType, uploadData.level, uploadData.category]
                });
                fileUrl = uploadResult.secure_url;
                if (uploadData.contentType === 'VIDEO') {
                    if (uploadResult.duration) {
                        const cloudinaryDuration = Math.round(uploadResult.duration / 60);
                        if (!extractedDuration) {
                            extractedDuration = cloudinaryDuration;
                            logger_1.logger.info('Video duration extracted from Cloudinary', {
                                durationSeconds: uploadResult.duration,
                                durationMinutes: extractedDuration,
                                publicId: uploadResult.public_id
                            });
                        }
                        else {
                            logger_1.logger.info('Video duration comparison', {
                                fileExtraction: extractedDuration,
                                cloudinaryExtraction: cloudinaryDuration,
                                using: extractedDuration
                            });
                        }
                    }
                    else if (!extractedDuration) {
                        logger_1.logger.error('No duration extracted from video file or Cloudinary - duration will be 0', {
                            filePath: uploadData.file.path,
                            publicId: uploadResult.public_id
                        });
                        extractedDuration = 0;
                    }
                }
                if (uploadData.contentType === 'VIDEO' && (!extractedDuration || extractedDuration === 0)) {
                    logger_1.logger.error('Video duration is 0 or undefined - this should not happen', {
                        filePath: uploadData.file.path,
                        extractedDuration
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
    static async uploadBulkCourseContent(title, description, level, category, subscriptionTier, availableLevels, availableTiers, files, userId, userRole, tags) {
        try {
            if (!['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(userRole)) {
                throw new errors_1.ForbiddenError('Insufficient permissions to upload content');
            }
            if (userRole === 'JUNIOR_MANAGER') {
                if (!['A1', 'A2', 'B1'].includes(level)) {
                    throw new errors_1.ForbiddenError('Junior managers can only create content for levels A1-B1');
                }
            }
            if (files.length === 0) {
                throw new errors_1.ValidationError('At least one file is required');
            }
            if (files.length > 20) {
                throw new errors_1.ValidationError('Maximum 20 files allowed per course');
            }
            const lessonData = [];
            let totalDuration = 0;
            let thumbnailUrl;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                let duration = 0;
                try {
                    const durationInSeconds = await (0, get_video_duration_1.default)(file.path);
                    duration = Math.round(durationInSeconds / 60);
                    totalDuration += duration;
                    logger_1.logger.info('Video duration extracted from file', {
                        filePath: file.path,
                        fileName: file.originalname,
                        durationSeconds: durationInSeconds,
                        durationMinutes: duration,
                        lessonNumber: i + 1
                    });
                }
                catch (error) {
                    logger_1.logger.warn('Failed to extract duration from video file, will try Cloudinary', {
                        filePath: file.path,
                        fileName: file.originalname,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
                const uploadResult = await cloudinaryService_1.CloudinaryService.uploadFile(file.path, {
                    folder: `tcf-tef-platform/content/video`,
                    resource_type: 'video',
                    tags: ['VIDEO', level, category, `lesson-${i + 1}`]
                });
                const fileUrl = uploadResult.secure_url;
                if (duration === 0 && uploadResult.duration) {
                    duration = Math.round(uploadResult.duration / 60);
                    totalDuration += duration;
                    logger_1.logger.info('Video duration extracted from Cloudinary (fallback)', {
                        fileName: file.originalname,
                        durationSeconds: uploadResult.duration,
                        durationMinutes: duration,
                        lessonNumber: i + 1
                    });
                }
                else if (uploadResult.duration && duration > 0) {
                    const cloudinaryDuration = Math.round(uploadResult.duration / 60);
                    logger_1.logger.info('Video duration comparison', {
                        fileName: file.originalname,
                        fileExtraction: duration,
                        cloudinaryExtraction: cloudinaryDuration,
                        using: duration
                    });
                }
                if (duration === 0) {
                    logger_1.logger.error('Video duration is 0 - extraction failed for both file and Cloudinary', {
                        fileName: file.originalname,
                        filePath: file.path
                    });
                }
                if (i === 0) {
                    thumbnailUrl = cloudinaryService_1.CloudinaryService.getVideoThumbnailUrl(uploadResult.public_id);
                }
                const lessonTitle = file.originalname.replace(/\.[^/.]+$/, "") || `${title} - Leçon ${i + 1}`;
                lessonData.push({
                    title: lessonTitle,
                    description: description || `Leçon ${i + 1} du cours ${title}`,
                    content: fileUrl,
                    videoUrl: fileUrl,
                    duration: Math.round(duration),
                    order: i + 1,
                    thumbnailUrl: i === 0 ? thumbnailUrl : undefined
                });
                try {
                    const fs = require('fs');
                    if (fs.existsSync(file.path)) {
                        await fs.promises.unlink(file.path);
                    }
                }
                catch (unlinkError) {
                    logger_1.logger.warn('Failed to delete local file after Cloudinary upload', {
                        filePath: file.path,
                        error: unlinkError
                    });
                }
            }
            const course = await connection_1.prisma.course.create({
                data: {
                    title,
                    description,
                    level,
                    category,
                    requiredTier: subscriptionTier,
                    availableLevels: availableLevels.length > 0 ? availableLevels : [level],
                    availableSubscriptions: availableTiers.length > 0 ? availableTiers : [subscriptionTier],
                    duration: Math.round(totalDuration),
                    lessons: lessonData.length,
                    tags: tags || [],
                    thumbnail: thumbnailUrl,
                    isPublished: true,
                    createdById: userId,
                    lessons_data: {
                        create: lessonData.map(lesson => ({
                            title: lesson.title,
                            description: lesson.description,
                            content: lesson.content,
                            videoUrl: lesson.videoUrl,
                            duration: lesson.duration,
                            order: lesson.order,
                            resources: tags || []
                        }))
                    }
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
            logger_1.logger.info(`Bulk course content uploaded successfully: ${course.id}`, {
                courseId: course.id,
                lessonsCount: lessonData.length,
                totalDuration,
                userId,
                userRole
            });
            return {
                content: {
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    level: course.level,
                    category: course.category,
                    subscriptionTier: course.requiredTier,
                    contentType: 'VIDEO',
                    fileUrl: lessonData[0]?.content,
                    thumbnailUrl,
                    duration: Math.round(totalDuration),
                    tags: course.tags,
                    isPublished: course.isPublished,
                    createdBy: {
                        id: course.createdBy.id,
                        firstName: course.createdBy.firstName,
                        lastName: course.createdBy.lastName,
                        role: course.createdBy.role
                    },
                    createdAt: course.createdAt,
                    updatedAt: course.updatedAt
                },
                lessons: lessonData.length
            };
        }
        catch (error) {
            logger_1.logger.error('Error uploading bulk course content:', error);
            throw error;
        }
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
            if (category)
                where.category = category;
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { tags: { hasSome: [search] } }
                ];
            }
            const [allCourses, total] = await Promise.all([
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
                    orderBy: { createdAt: 'desc' }
                }),
                connection_1.prisma.course.count({ where })
            ]);
            const courseMap = new Map();
            const studentSubscription = subscriptionTier || 'FREE';
            for (const course of allCourses) {
                const availableSubs = course.availableSubscriptions && course.availableSubscriptions.length > 0
                    ? course.availableSubscriptions
                    : [course.requiredTier];
                const hasAccess = availableSubs.includes(studentSubscription);
                if (!hasAccess)
                    continue;
                const normalizedTitle = course.title.trim().toLowerCase();
                if (!courseMap.has(normalizedTitle)) {
                    courseMap.set(normalizedTitle, course);
                }
                else {
                    const existing = courseMap.get(normalizedTitle);
                    const existingLessons = existing?.lessons_data?.length || 0;
                    const currentLessons = course.lessons_data?.length || 0;
                    if (currentLessons > existingLessons ||
                        (currentLessons === existingLessons && course.createdAt > existing.createdAt)) {
                        courseMap.set(normalizedTitle, course);
                    }
                }
            }
            const uniqueCourses = Array.from(courseMap.values());
            const paginatedCourses = uniqueCourses.slice((page - 1) * limit, page * limit);
            const content = paginatedCourses.map(course => {
                const realDuration = course.lessons_data && course.lessons_data.length > 0
                    ? course.lessons_data.reduce((total, lesson) => {
                        const lessonDuration = lesson.duration || 0;
                        return total + lessonDuration;
                    }, 0)
                    : 0;
                const availableLevels = course.availableLevels && course.availableLevels.length > 0
                    ? course.availableLevels
                    : [course.level];
                return {
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    level: availableLevels[0],
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
                total: uniqueCourses.length,
                pages: Math.ceil(uniqueCourses.length / limit)
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
            const [allCourses, tests] = await Promise.all([
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
                    orderBy: { createdAt: 'desc' }
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
            for (const course of allCourses) {
                const normalizedTitle = course.title.trim().toLowerCase();
                if (!courseGroups.has(normalizedTitle)) {
                    courseGroups.set(normalizedTitle, []);
                }
                courseGroups.get(normalizedTitle).push(course);
            }
            const unifiedCourses = Array.from(courseGroups.entries()).map(([normalizedTitle, courseGroup]) => {
                const primaryCourse = courseGroup.reduce((best, current) => {
                    const bestLessons = best.lessons_data?.length || 0;
                    const currentLessons = current.lessons_data?.length || 0;
                    if (currentLessons > bestLessons)
                        return current;
                    if (currentLessons === bestLessons && current.createdAt > best.createdAt)
                        return current;
                    return best;
                });
                const allLevelsSet = new Set();
                courseGroup.forEach(c => {
                    if (c.availableLevels && Array.isArray(c.availableLevels) && c.availableLevels.length > 0) {
                        c.availableLevels.forEach((level) => allLevelsSet.add(level));
                    }
                    else {
                        allLevelsSet.add(c.level);
                    }
                });
                const aggregatedLevels = Array.from(allLevelsSet);
                const allSubscriptionsSet = new Set();
                courseGroup.forEach(c => {
                    if (c.availableSubscriptions && Array.isArray(c.availableSubscriptions) && c.availableSubscriptions.length > 0) {
                        c.availableSubscriptions.forEach((tier) => allSubscriptionsSet.add(tier));
                    }
                    else {
                        allSubscriptionsSet.add(c.requiredTier);
                    }
                });
                const aggregatedSubscriptions = Array.from(allSubscriptionsSet);
                return {
                    ...primaryCourse,
                    level: aggregatedLevels[0] || primaryCourse.level,
                    requiredTier: aggregatedSubscriptions[0] || primaryCourse.requiredTier,
                    availableLevels: aggregatedLevels,
                    availableSubscriptions: aggregatedSubscriptions,
                };
            });
            const paginatedCourses = unifiedCourses.slice((page - 1) * limit, page * limit);
            const courseContent = paginatedCourses.map(course => {
                const realDuration = course.lessons_data && course.lessons_data.length > 0
                    ? course.lessons_data.reduce((total, lesson) => {
                        const lessonDuration = lesson.duration || 0;
                        return total + lessonDuration;
                    }, 0)
                    : 0;
                const videoLessons = course.lessons_data.filter(lesson => lesson.videoUrl);
                const totalVideoCount = videoLessons.length;
                const allLevels = course.availableLevels && Array.isArray(course.availableLevels) && course.availableLevels.length > 0
                    ? course.availableLevels
                    : [course.level];
                const allSubscriptions = course.availableSubscriptions && Array.isArray(course.availableSubscriptions) && course.availableSubscriptions.length > 0
                    ? course.availableSubscriptions
                    : [course.requiredTier];
                const mapTierToFrench = (tier) => {
                    const tierMap = {
                        'FREE': 'Gratuit',
                        'ESSENTIAL': 'Essentiel',
                        'PREMIUM': 'Premium',
                        'PRO': 'Pro+'
                    };
                    return tierMap[tier] || tier;
                };
                const subscriptionsFrench = allSubscriptions.map(mapTierToFrench);
                return {
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    level: allLevels,
                    category: course.category,
                    subscriptionTier: allSubscriptions,
                    contentType: course.lessons_data.length > 0 && course.lessons_data[0].videoUrl ? 'VIDEO' : 'NOTE',
                    fileUrl: course.lessons_data.length > 0 ? course.lessons_data[0].content : undefined,
                    thumbnailUrl: course.thumbnail,
                    duration: realDuration,
                    totalVideoCount,
                    tags: course.tags,
                    isPublished: course.isPublished,
                    createdBy: course.createdBy,
                    createdAt: course.createdAt,
                    updatedAt: course.updatedAt,
                    levels: allLevels,
                    subscriptions: subscriptionsFrench,
                    lessons_data: course.lessons_data
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
                total: unifiedCourses.length,
                pages: Math.ceil(unifiedCourses.length / limit)
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
            if (!levels || levels.length === 0) {
                throw new errors_1.ValidationError('At least one level must be provided');
            }
            if (!subscriptions || subscriptions.length === 0) {
                throw new errors_1.ValidationError('At least one subscription tier must be provided');
            }
            const mapFrenchToTier = (frenchName) => {
                const tierMap = {
                    'Gratuit': 'FREE',
                    'Essentiel': 'ESSENTIAL',
                    'Premium': 'PREMIUM',
                    'Pro+': 'PRO'
                };
                return tierMap[frenchName] || frenchName;
            };
            const backendSubscriptions = subscriptions.map(mapFrenchToTier);
            const backendLevels = levels.map(level => level);
            const realDuration = primaryCourse.lessons_data.reduce((total, lesson) => total + (lesson.duration || 0), 0);
            const videoLessons = primaryCourse.lessons_data.filter(lesson => lesson.videoUrl);
            const totalVideoCount = videoLessons.length;
            const hasFree = backendSubscriptions.includes('FREE');
            const tierHierarchy = { 'FREE': 0, 'ESSENTIAL': 1, 'PREMIUM': 2, 'PRO': 3 };
            const sortedSubscriptions = [...backendSubscriptions].sort((a, b) => {
                const aLevel = tierHierarchy[a] ?? 999;
                const bLevel = tierHierarchy[b] ?? 999;
                return aLevel - bLevel;
            });
            const requiredTier = hasFree ? 'FREE' : sortedSubscriptions[0];
            const updatedCourse = await connection_1.prisma.course.update({
                where: { id: primaryCourse.id },
                data: {
                    availableLevels: backendLevels,
                    availableSubscriptions: backendSubscriptions,
                    level: backendLevels[0],
                    requiredTier: requiredTier,
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
            const mapTierToFrench = (tier) => {
                const tierMap = {
                    'FREE': 'Gratuit',
                    'ESSENTIAL': 'Essentiel',
                    'PREMIUM': 'Premium',
                    'PRO': 'Pro+'
                };
                return tierMap[tier] || tier;
            };
            const subscriptionsFrench = backendSubscriptions.map(mapTierToFrench);
            return {
                id: updatedCourse.id,
                title: updatedCourse.title,
                description: updatedCourse.description,
                level: backendLevels,
                category: updatedCourse.category,
                subscriptionTier: backendSubscriptions,
                contentType: updatedCourse.lessons_data.length > 0 && updatedCourse.lessons_data[0].videoUrl ? 'VIDEO' : 'NOTE',
                fileUrl: updatedCourse.lessons_data.length > 0 ? updatedCourse.lessons_data[0].content : undefined,
                thumbnailUrl: updatedCourse.thumbnail,
                duration: realDuration,
                totalVideoCount,
                tags: updatedCourse.tags,
                isPublished: updatedCourse.isPublished,
                createdBy: {
                    id: updatedCourse.createdBy.id,
                    firstName: updatedCourse.createdBy.firstName,
                    lastName: updatedCourse.createdBy.lastName,
                    role: updatedCourse.createdBy.role
                },
                createdAt: updatedCourse.createdAt,
                updatedAt: updatedCourse.updatedAt,
                levels: backendLevels,
                subscriptions: subscriptionsFrench,
                lessons_data: updatedCourse.lessons_data
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