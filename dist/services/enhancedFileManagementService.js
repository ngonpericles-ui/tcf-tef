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
exports.EnhancedFileManagementService = void 0;
const client_1 = require("@prisma/client");
const cloudinaryService_1 = require("./cloudinaryService");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const fs = __importStar(require("fs"));
const pdfParse = __importStar(require("pdf-parse"));
const prisma = new client_1.PrismaClient();
class EnhancedFileManagementService {
    static async uploadAndProcess(file, metadata) {
        try {
            logger_1.logger.info(`Starting enhanced file upload and processing for: ${file.originalname}`);
            const uploadResult = await cloudinaryService_1.CloudinaryService.uploadFile(file.path, {
                folder: `tcf-tef-platform/enhanced/${metadata.contentType.toLowerCase()}`,
                resource_type: this.getResourceType(file.mimetype),
                tags: [metadata.contentType, metadata.level, metadata.category]
            });
            let thumbnailUrl;
            if (file.mimetype.startsWith('video/')) {
                thumbnailUrl = cloudinaryService_1.CloudinaryService.getVideoThumbnailUrl(uploadResult.public_id);
            }
            let extractedText;
            if (file.mimetype === 'application/pdf') {
                extractedText = await this.extractTextFromPDF(file.path);
            }
            const fileRecord = await prisma.file.create({
                data: {
                    originalName: file.originalname,
                    filename: uploadResult.public_id,
                    path: file.path,
                    url: uploadResult.secure_url,
                    mimeType: file.mimetype,
                    mimetype: file.mimetype,
                    size: file.size,
                    userId: metadata.userId,
                    uploadedById: metadata.userId,
                    category: metadata.category || 'OTHER',
                    metadata: {
                        cloudinaryPublicId: uploadResult.public_id,
                        thumbnailUrl,
                        extractedText: extractedText?.substring(0, 10000),
                    }
                }
            });
            let aiAnalysis;
            if (extractedText) {
                aiAnalysis = await this.performAIAnalysis(extractedText, metadata.level, metadata.category);
                if (aiAnalysis.questions.length > 0) {
                    logger_1.logger.info('Questions extracted from file', {
                        questionCount: aiAnalysis.questions.length,
                        fileId: fileRecord.id
                    });
                }
            }
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            const result = {
                fileId: fileRecord.id,
                originalName: file.originalname,
                cloudinaryUrl: uploadResult.secure_url,
                thumbnailUrl,
                extractedText,
                metadata: {
                    size: file.size,
                    mimeType: file.mimetype,
                    dimensions: uploadResult.width && uploadResult.height ?
                        { width: uploadResult.width, height: uploadResult.height } : undefined,
                    duration: uploadResult.duration,
                },
                aiAnalysis,
                status: 'COMPLETED',
                processedAt: new Date()
            };
            logger_1.logger.info(`Enhanced file processing completed for: ${file.originalname}`);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Enhanced file processing failed:', error);
            throw error;
        }
    }
    static async extractTextFromPDF(filePath) {
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse.default(dataBuffer);
            return data.text;
        }
        catch (error) {
            logger_1.logger.error('PDF text extraction failed:', error);
            return '';
        }
    }
    static async performAIAnalysis(text, level, category) {
        try {
            const questions = this.extractQuestionsFromText(text, level, category);
            const summary = this.generateSummary(text);
            const topics = this.extractTopics(text);
            return {
                questions,
                summary,
                topics
            };
        }
        catch (error) {
            logger_1.logger.error('AI analysis failed:', error);
            return {
                questions: [],
                summary: 'Analysis failed',
                topics: []
            };
        }
    }
    static extractQuestionsFromText(text, level, category) {
        const questions = [];
        const questionPatterns = [
            /\d+\.\s*(.+?\?)/g,
            /Question\s*\d*:?\s*(.+?\?)/gi,
            /Q\d*:?\s*(.+?\?)/gi
        ];
        for (const pattern of questionPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null && questions.length < 10) {
                questions.push({
                    question: match[1].trim(),
                    answer: 'Answer extracted from context',
                    explanation: 'Explanation based on document content',
                    difficulty: level,
                    category: category
                });
            }
        }
        return questions;
    }
    static generateSummary(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const summary = sentences.slice(0, 3).join('. ');
        return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
    }
    static extractTopics(text) {
        const commonTopics = [
            'grammaire', 'vocabulaire', 'conjugaison', 'orthographe', 'syntaxe',
            'compréhension', 'expression', 'communication', 'culture', 'littérature'
        ];
        const foundTopics = commonTopics.filter(topic => text.toLowerCase().includes(topic));
        return foundTopics.slice(0, 5);
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
    static async searchFiles(filters, pagination) {
        try {
            const where = {};
            if (filters.category)
                where.category = filters.category;
            if (filters.level)
                where.level = filters.level;
            if (filters.contentType)
                where.contentType = filters.contentType;
            if (filters.createdBy)
                where.uploadedById = filters.createdBy;
            if (filters.dateFrom || filters.dateTo) {
                where.createdAt = {};
                if (filters.dateFrom)
                    where.createdAt.gte = filters.dateFrom;
                if (filters.dateTo)
                    where.createdAt.lte = filters.dateTo;
            }
            const total = await prisma.file.count({ where });
            const files = await prisma.file.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (pagination.page - 1) * pagination.limit,
                take: pagination.limit
            });
            return {
                files,
                total,
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    totalPages: Math.ceil(total / pagination.limit),
                    hasNext: pagination.page * pagination.limit < total,
                    hasPrev: pagination.page > 1
                }
            };
        }
        catch (error) {
            logger_1.logger.error('File search failed:', error);
            throw error;
        }
    }
    static async processFile(fileId) {
        try {
            const file = await prisma.file.findUnique({
                where: { id: fileId }
            });
            if (!file) {
                throw new errors_1.NotFoundError('File not found');
            }
            if (file.mimeType === 'application/pdf') {
                logger_1.logger.info(`Reprocessing file: ${file.originalName}`);
            }
            return {
                fileId: file.id,
                originalName: file.originalName,
                cloudinaryUrl: file.url,
                metadata: {
                    size: file.size,
                    mimeType: file.mimeType
                },
                status: 'COMPLETED',
                processedAt: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('File reprocessing failed:', error);
            throw error;
        }
    }
}
exports.EnhancedFileManagementService = EnhancedFileManagementService;
//# sourceMappingURL=enhancedFileManagementService.js.map