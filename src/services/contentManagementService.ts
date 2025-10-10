import { PrismaClient, CourseLevel, CourseCategory, TestType, SubscriptionTier } from '@prisma/client';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { CloudinaryService } from './cloudinaryService';
// import { QuestionBankService } from './questionBankService';

const prisma = new PrismaClient();

export interface ContentUploadData {
  title: string;
  description: string;
  level: CourseLevel;
  category: CourseCategory | 'TEST' | 'CORRIGER_TCF';
  subscriptionTier: SubscriptionTier;
  language: 'fr' | 'en';
  contentType: 'NOTE' | 'VIDEO' | 'TEST' | 'CORRIGER_TCF' | 'SIMULATION';
  file?: Express.Multer.File;
  tags?: string[];
  duration?: number;
  maxScore?: number;
  passingScore?: number;
}

export interface ContentAnalysisResult {
  extractedText: string;
  questionBankId: string;
  aiAnalysis: {
    topics: string[];
    difficulty: string;
    keyPoints: string[];
    suggestedQuestions: any[];
  };
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  level: CourseLevel;
  category: string;
  subscriptionTier: SubscriptionTier;
  contentType: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  tags: string[];
  isPublished: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ContentManagementService {
  /**
   * Upload and process content with AI analysis
   */
  static async uploadContent(
    uploadData: ContentUploadData,
    userId: string,
    userRole: string
  ): Promise<{ content: ContentItem; analysis?: ContentAnalysisResult }> {
    try {
      // Validate user permissions
      if (!['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(userRole)) {
        throw new ForbiddenError('Insufficient permissions to upload content');
      }

      // Validate junior manager restrictions
      if (userRole === 'JUNIOR_MANAGER') {
        if (!['A1', 'A2', 'B1'].includes(uploadData.level)) {
          throw new ForbiddenError('Junior managers can only create content for levels A1-B1');
        }
        if (uploadData.contentType === 'SIMULATION' && uploadData.category !== 'TEST') {
          throw new ForbiddenError('Junior managers cannot create audio simulations');
        }
      }

      let fileUrl: string | undefined;
      let thumbnailUrl: string | undefined;

      // Upload file to Cloudinary if provided
      if (uploadData.file) {
        const uploadResult = await CloudinaryService.uploadFile(uploadData.file.path, {
          folder: `tcf-tef-platform/content/${uploadData.contentType.toLowerCase()}`,
          resource_type: this.getResourceType(uploadData.file.mimetype),
          tags: [uploadData.contentType, uploadData.level, uploadData.category as string]
        });

        fileUrl = uploadResult.secure_url;

        // Generate thumbnail for videos
        if (uploadData.contentType === 'VIDEO') {
          thumbnailUrl = CloudinaryService.getVideoThumbnailUrl(uploadResult.public_id);
        }
      }

      // Create content based on type
      let content: ContentItem;
      let analysis: ContentAnalysisResult | undefined;

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
          throw new ValidationError('Invalid content type');
      }

      // Perform AI analysis if file was uploaded
      if (uploadData.file && fileUrl) {
        analysis = await this.performAIAnalysis(uploadData.file, content.id, userId);
      }

      logger.info(`Content uploaded successfully: ${content.id}`, {
        contentType: uploadData.contentType,
        userId,
        userRole
      });

      return { content, analysis };
    } catch (error) {
      logger.error('Error uploading content:', error);
      throw error;
    }
  }

  /**
   * Create course content (notes, videos)
   */
  private static async createCourseContent(
    uploadData: ContentUploadData,
    userId: string,
    fileUrl?: string,
    thumbnailUrl?: string
  ): Promise<ContentItem> {
    const course = await prisma.course.create({
      data: {
        title: uploadData.title,
        description: uploadData.description,
        level: uploadData.level,
        category: uploadData.category as CourseCategory,
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

  /**
   * Create test content
   */
  private static async createTestContent(
    uploadData: ContentUploadData,
    userId: string,
    fileUrl?: string
  ): Promise<ContentItem> {
    const test = await prisma.test.create({
      data: {
        title: uploadData.title,
        description: uploadData.description,
        level: uploadData.level,
        type: uploadData.category === 'CORRIGER_TCF' ? 'PRACTICE' : 'QUICK',
        category: uploadData.category as CourseCategory,
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
      fileUrl: undefined, // Tests don't have fileUrl in schema
      duration: test.duration,
      tags: test.tags,
      isPublished: test.isPublished,
      createdBy: test.createdById,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt
    };
  }

  /**
   * Create simulation content
   */
  private static async createSimulationContent(
    uploadData: ContentUploadData,
    userId: string,
    fileUrl?: string
  ): Promise<ContentItem> {
    // For now, create as a test with simulation type
    const simulation = await prisma.test.create({
      data: {
        title: uploadData.title,
        description: uploadData.description,
        level: uploadData.level,
        type: 'SIMULATION',
        category: uploadData.category as CourseCategory,
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
      fileUrl: undefined, // Tests don't have fileUrl in schema
      duration: simulation.duration,
      tags: simulation.tags,
      isPublished: simulation.isPublished,
      createdBy: simulation.createdById,
      createdAt: simulation.createdAt,
      updatedAt: simulation.updatedAt
    };
  }

  /**
   * Perform AI analysis on uploaded content
   */
  private static async performAIAnalysis(
    file: Express.Multer.File,
    contentId: string,
    userId: string
  ): Promise<ContentAnalysisResult> {
    try {
      // Extract text from file (implementation depends on file type)
      const extractedText = await this.extractTextFromFile(file);

      // Store in question bank using VAPI logic (placeholder for now)
      const questionBankEntry = {
        id: `qb_${contentId}`,
        title: `Content Analysis - ${contentId}`,
        content: extractedText,
        contentId,
        uploadedBy: userId,
        tags: ['ai-analysis', 'content-extraction']
      };

      // Perform AI analysis (mock implementation - replace with actual AI service)
      const aiAnalysis = {
        topics: this.extractTopics(extractedText),
        difficulty: this.assessDifficulty(extractedText),
        keyPoints: this.extractKeyPoints(extractedText),
        suggestedQuestions: this.generateSuggestedQuestions(extractedText)
      };

      logger.info(`AI analysis completed for content: ${contentId}`);

      return {
        extractedText,
        questionBankId: questionBankEntry.id,
        aiAnalysis
      };
    } catch (error) {
      logger.error('Error performing AI analysis:', error);
      throw error;
    }
  }

  /**
   * Get resource type for Cloudinary upload
   */
  private static getResourceType(mimetype: string): 'image' | 'video' | 'raw' | 'auto' {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'video'; // Cloudinary handles audio as video
    return 'raw';
  }

  /**
   * Extract text from file (placeholder implementation)
   */
  private static async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    // This would use libraries like pdf-parse, mammoth, etc. based on file type
    // For now, return a placeholder
    return `Extracted text from ${file.originalname}`;
  }

  /**
   * Extract topics from text (placeholder implementation)
   */
  private static extractTopics(text: string): string[] {
    // This would use NLP libraries or AI services
    return ['grammar', 'vocabulary', 'comprehension'];
  }

  /**
   * Assess difficulty level (placeholder implementation)
   */
  private static assessDifficulty(text: string): string {
    // This would analyze text complexity
    return 'intermediate';
  }

  /**
   * Extract key points (placeholder implementation)
   */
  private static extractKeyPoints(text: string): string[] {
    // This would identify main concepts
    return ['Key point 1', 'Key point 2', 'Key point 3'];
  }

  /**
   * Generate suggested questions (placeholder implementation)
   */
  private static generateSuggestedQuestions(text: string): any[] {
    // This would generate questions based on content
    return [
      { type: 'multiple_choice', question: 'Sample question?', options: ['A', 'B', 'C', 'D'] }
    ];
  }

  /**
   * Get content for student course pages
   */
  static async getContentForCourses(
    level?: CourseLevel,
    category?: CourseCategory,
    subscriptionTier?: SubscriptionTier,
    search?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ content: ContentItem[]; total: number; pages: number }> {
    try {
      const where: any = {
        isPublished: true
      };

      // Filter by subscription tier access
      if (subscriptionTier) {
        const tierHierarchy = ['FREE', 'ESSENTIAL', 'PREMIUM', 'PRO'];
        const userTierIndex = tierHierarchy.indexOf(subscriptionTier);
        const allowedTiers = tierHierarchy.slice(0, userTierIndex + 1);
        where.requiredTier = { in: allowedTiers };
      } else {
        where.requiredTier = 'FREE';
      }

      if (level) where.level = level;
      if (category) where.category = category;
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
    } catch (error) {
      logger.error('Error fetching course content:', error);
      throw error;
    }
  }

  /**
   * Get content for student test pages
   */
  static async getContentForTests(
    level?: CourseLevel,
    type?: string,
    subscriptionTier?: SubscriptionTier,
    search?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ content: ContentItem[]; total: number; pages: number }> {
    try {
      const where: any = {
        isPublished: true
      };

      // Filter by subscription tier access
      if (subscriptionTier) {
        const tierHierarchy = ['FREE', 'ESSENTIAL', 'PREMIUM', 'PRO'];
        const userTierIndex = tierHierarchy.indexOf(subscriptionTier);
        const allowedTiers = tierHierarchy.slice(0, userTierIndex + 1);
        where.requiredTier = { in: allowedTiers };
      } else {
        where.requiredTier = 'FREE';
      }

      if (level) where.level = level;
      if (type) where.type = type;
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
        fileUrl: undefined, // Tests don't have fileUrl in schema
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
    } catch (error) {
      logger.error('Error fetching test content:', error);
      throw error;
    }
  }

  /**
   * Get content for admin/manager content pages
   */
  static async getContentForManagement(
    userRole: string,
    userId?: string,
    contentType?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ content: ContentItem[]; total: number; pages: number }> {
    try {
      const where: any = {};

      // Junior managers can only see their own content and A1-B1 levels
      if (userRole === 'JUNIOR_MANAGER') {
        where.createdById = userId;
        where.level = { in: ['A1', 'A2', 'B1'] };
      }

      // Get both courses and tests
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
        fileUrl: undefined, // Tests don't have fileUrl in schema
        duration: test.duration,
        tags: test.tags,
        isPublished: test.isPublished,
        createdBy: test.createdById,
        createdAt: test.createdAt,
        updatedAt: test.updatedAt
      }));

      const allContent = [...courseContent, ...testContent]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Filter by content type if specified
      const filteredContent = contentType
        ? allContent.filter(item => item.contentType === contentType)
        : allContent;

      return {
        content: filteredContent,
        total: filteredContent.length,
        pages: Math.ceil(filteredContent.length / limit)
      };
    } catch (error) {
      logger.error('Error fetching management content:', error);
      throw error;
    }
  }

  /**
   * Publish content
   */
  static async publishContent(
    contentId: string,
    contentType: string,
    userId: string,
    userRole: string
  ): Promise<ContentItem> {
    try {
      // Validate permissions
      if (!['ADMIN', 'SENIOR_MANAGER'].includes(userRole)) {
        throw new ForbiddenError('Only admins and senior managers can publish content');
      }

      let updatedContent;

      if (contentType === 'TEST' || contentType === 'SIMULATION') {
        updatedContent = await prisma.test.update({
          where: { id: contentId },
          data: { isPublished: true, status: 'PUBLISHED' }
        });
      } else {
        updatedContent = await prisma.course.update({
          where: { id: contentId },
          data: { isPublished: true }
        });
      }

      logger.info(`Content published: ${contentId}`, { userId, userRole });

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
    } catch (error) {
      logger.error('Error publishing content:', error);
      throw error;
    }
  }

  /**
   * Delete content
   */
  static async deleteContent(
    contentId: string,
    contentType: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    try {
      // Validate permissions
      if (userRole === 'JUNIOR_MANAGER') {
        // Junior managers can only delete their own content
        const content = contentType === 'TEST' || contentType === 'SIMULATION'
          ? await prisma.test.findUnique({ where: { id: contentId } })
          : await prisma.course.findUnique({ where: { id: contentId } });

        if (!content || content.createdById !== userId) {
          throw new ForbiddenError('You can only delete your own content');
        }
      }

      if (contentType === 'TEST' || contentType === 'SIMULATION') {
        await prisma.test.delete({ where: { id: contentId } });
      } else {
        await prisma.course.delete({ where: { id: contentId } });
      }

      logger.info(`Content deleted: ${contentId}`, { userId, userRole });
    } catch (error) {
      logger.error('Error deleting content:', error);
      throw error;
    }
  }
}
