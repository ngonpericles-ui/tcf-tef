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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connection_1 = require("../database/connection");
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const auth_1 = require("../middleware/auth");
const levelDeterminationService_1 = require("../services/levelDeterminationService");
const aiService_1 = require("../services/aiService");
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/ai-files/';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/wave',
            'audio/x-wav',
            'audio/ogg',
            'audio/webm',
            'audio/mp4',
            'audio/m4a',
            'audio/x-m4a'
        ];
        if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only PDF, TXT, DOC, DOCX, and audio files (MP3, WAV, OGG, etc.) are allowed.'));
        }
    }
});
router.get('/feedbacks', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            console.error('❌ User ID not found in AI feedbacks request');
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        console.log('📋 Fetching AI feedbacks for user:', userId);
        let feedbacks = [];
        try {
            feedbacks = await connection_1.prisma.aIFeedback.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });
        }
        catch (prismaError) {
            console.error('❌ Prisma error fetching AI feedbacks:', {
                error: prismaError.message,
                code: prismaError.code,
                meta: prismaError.meta
            });
            feedbacks = [];
        }
        console.log(`✅ Found ${feedbacks.length} feedbacks for user ${userId}`);
        const transformedFeedbacks = feedbacks.map(feedback => {
            let simulationTitle = 'Unknown Simulation';
            if (feedback.submissionType) {
                simulationTitle = `Soumission ${feedback.submissionType}`;
            }
            else if (feedback.voiceSimulationId) {
                simulationTitle = `Simulation Vocale #${feedback.voiceSimulationId.substring(0, 8)}`;
            }
            else {
                simulationTitle = `Feedback #${feedback.id.substring(0, 8)}`;
            }
            const percentage = feedback.maxScore && feedback.maxScore > 0
                ? Math.round((feedback.aiScore / feedback.maxScore) * 100)
                : feedback.aiScore || 0;
            return {
                id: feedback.id,
                simulationTitle,
                submissionDate: feedback.createdAt.toISOString(),
                aiScore: feedback.aiScore || 0,
                maxScore: feedback.maxScore || 100,
                percentage,
                aiConfidence: feedback.aiConfidence || 0,
                status: feedback.status,
                feedback: {
                    overall: feedback.overallFeedback || '',
                    strengths: feedback.strengths || [],
                    weaknesses: feedback.weaknesses || [],
                    recommendations: feedback.recommendations || [],
                    detailedAnalysis: feedback.detailedAnalysis || {}
                },
                originalWork: {
                    type: feedback.submissionType || 'general',
                    content: feedback.submissionContent || '',
                    fileUrl: feedback.submissionFileUrl || null
                },
                humanReview: feedback.humanReviewerId ? {
                    tutorName: feedback.humanReviewerName || 'Expert Tutor',
                    tutorFeedback: feedback.humanFeedback || '',
                    reviewDate: feedback.humanReviewDate?.toISOString() || '',
                    finalScore: feedback.humanScore || feedback.aiScore || 0
                } : undefined
            };
        });
        res.json({
            success: true,
            data: transformedFeedbacks
        });
    }
    catch (error) {
        const userId = req.user?.userId || req.user?.id;
        console.error('❌ Error fetching AI feedbacks:', {
            error: error.message,
            stack: error.stack,
            userId
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch AI feedbacks',
                statusCode: 500
            }
        });
    }
});
router.get('/feedbacks/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const feedback = await connection_1.prisma.aIFeedback.findFirst({
            where: {
                id,
                userId
            },
            include: {
                simulationResult: {
                    include: {
                        testAttempt: {
                            include: {
                                test: true
                            }
                        }
                    }
                }
            }
        });
        if (!feedback) {
            return res.status(404).json({
                success: false,
                error: { message: 'Feedback not found' }
            });
        }
        const transformedFeedback = {
            id: feedback.id,
            overallScore: feedback.aiScore,
            maxScore: feedback.maxScore,
            confidence: feedback.aiConfidence,
            canGradeTo100Percent: feedback.status !== 'PENDING_HUMAN',
            overallFeedback: feedback.overallFeedback,
            strengths: feedback.strengths,
            weaknesses: feedback.weaknesses,
            recommendations: feedback.recommendations,
            detailedAnalysis: feedback.detailedAnalysis,
            status: feedback.status,
            createdAt: feedback.createdAt.toISOString(),
            simulationTitle: feedback.simulationResult?.testAttempt?.test?.title || 'Unknown Simulation'
        };
        res.json({
            success: true,
            data: transformedFeedback
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/feedbacks', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const { simulationResultId, submissionType, submissionContent, submissionFileUrl } = req.body;
        const aiAnalysis = await generateAIFeedback(submissionContent, submissionType);
        const feedback = await connection_1.prisma.aIFeedback.create({
            data: {
                userId,
                simulationResultId,
                submissionType,
                submissionContent,
                submissionFileUrl,
                aiScore: aiAnalysis.score,
                maxScore: 100,
                aiConfidence: aiAnalysis.confidence,
                overallFeedback: aiAnalysis.overall,
                strengths: aiAnalysis.strengths,
                weaknesses: aiAnalysis.weaknesses,
                recommendations: aiAnalysis.recommendations,
                detailedAnalysis: aiAnalysis.detailedAnalysis,
                status: 'AI_COMPLETED'
            }
        });
        res.json({
            success: true,
            data: feedback
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/feedbacks/:id/report', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const feedback = await connection_1.prisma.aIFeedback.findFirst({
            where: {
                id,
                userId
            },
            include: {
                simulationResult: {
                    include: {
                        testAttempt: {
                            include: {
                                test: true
                            }
                        }
                    }
                }
            }
        });
        if (!feedback) {
            return res.status(404).json({
                success: false,
                error: { message: 'Feedback not found' }
            });
        }
        const reportBuffer = await generatePDFReport(feedback);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="feedback-report-${id}.pdf"`);
        res.send(reportBuffer);
    }
    catch (error) {
        next(error);
    }
});
router.post('/analyze-document', auth_1.authenticate, async (req, res, next) => {
    try {
        const { documentUrl, documentType, contentId } = req.body;
        const extractedText = await extractTextFromDocument(documentUrl, documentType);
        const analysis = await analyzeDocumentWithAI(extractedText);
        await connection_1.prisma.questionBank.create({
            data: {
                content: extractedText,
                contentType: documentType || 'DOCUMENT',
                level: 'B1',
                contentId,
                extractedText,
                aiAnalysis: analysis,
                documentUrl,
                documentType,
                createdAt: new Date()
            }
        });
        res.json({
            success: true,
            data: {
                extractedText,
                analysis,
                message: 'Document analyzed and stored in question bank'
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/assistant/context', auth_1.authenticate, async (req, res, next) => {
    try {
        const { query, limit = 10 } = req.query;
        const contextEntries = await connection_1.prisma.questionBank.findMany({
            where: query ? {
                OR: [
                    { extractedText: { contains: query, mode: 'insensitive' } },
                    { aiAnalysis: { path: ['summary'], string_contains: query } }
                ]
            } : {},
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            data: contextEntries
        });
    }
    catch (error) {
        next(error);
    }
});
async function generateAIFeedback(content, type) {
    if (!content || typeof content !== 'string') {
        content = 'Sample content for analysis';
    }
    const wordCount = content.split(' ').length;
    const score = Math.min(100, Math.max(20, 60 + Math.random() * 30));
    return {
        score: Math.round(score),
        confidence: Math.random() * 0.3 + 0.7,
        overall: `Votre travail montre une bonne compréhension du sujet. Vous avez écrit ${wordCount} mots avec une structure claire.`,
        strengths: [
            'Bonne structure générale',
            'Vocabulaire approprié',
            'Idées bien développées'
        ],
        weaknesses: [
            'Quelques erreurs grammaticales',
            'Transitions à améliorer',
            'Conclusion pourrait être renforcée'
        ],
        recommendations: [
            'Pratiquez les temps verbaux',
            'Utilisez plus de connecteurs logiques',
            'Relisez votre travail avant de soumettre'
        ],
        detailedAnalysis: {
            grammar: {
                score: Math.round(score * 0.9),
                feedback: 'Grammaire généralement correcte avec quelques erreurs mineures'
            },
            vocabulary: {
                score: Math.round(score * 1.1),
                feedback: 'Bon usage du vocabulaire avec quelques répétitions'
            },
            structure: {
                score: Math.round(score * 0.95),
                feedback: 'Structure claire et logique'
            },
            coherence: {
                score: Math.round(score * 0.85),
                feedback: 'Idées bien liées mais transitions à améliorer'
            }
        }
    };
}
async function generatePDFReport(feedback) {
    const reportContent = `
    Rapport de Feedback IA
    
    Simulation: ${feedback.simulationResult?.testAttempt?.test?.title}
    Score: ${feedback.aiScore}/${feedback.maxScore}
    Date: ${feedback.createdAt.toLocaleDateString()}
    
    Feedback: ${feedback.overallFeedback}
    
    Points forts:
    ${feedback.strengths.map(s => `- ${s}`).join('\n')}
    
    Points à améliorer:
    ${feedback.weaknesses.map(w => `- ${w}`).join('\n')}
    
    Recommandations:
    ${feedback.recommendations.map(r => `- ${r}`).join('\n')}
  `;
    return Buffer.from(reportContent, 'utf-8');
}
async function extractTextFromDocument(url, type) {
    return `Extracted text from ${type} document at ${url}. This would contain the actual document content.`;
}
async function analyzeDocumentWithAI(text) {
    return {
        summary: `Document summary: ${text.substring(0, 100)}...`,
        keyPoints: ['Point 1', 'Point 2', 'Point 3'],
        difficulty: 'Intermediate',
        topics: ['Grammar', 'Vocabulary', 'Reading Comprehension']
    };
}
router.post('/feedbacks/:id/request-review', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const feedback = await connection_1.prisma.aIFeedback.findFirst({
            where: {
                id,
                userId
            }
        });
        if (!feedback) {
            return res.status(404).json({
                success: false,
                error: { message: 'Feedback not found' }
            });
        }
        const updatedFeedback = await connection_1.prisma.aIFeedback.update({
            where: { id },
            data: {
                status: 'PENDING_HUMAN'
            }
        });
        res.json({
            success: true,
            data: {
                id: updatedFeedback.id,
                status: updatedFeedback.status,
                message: 'Human review requested successfully'
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/level-assessment', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const assessment = await levelDeterminationService_1.LevelDeterminationService.determineStudentLevel(userId);
        res.json({
            success: true,
            data: assessment
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/assess-level', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const { responses } = req.body;
        const totalQuestions = responses?.length || 1;
        const correctAnswers = Math.floor(totalQuestions * (0.6 + Math.random() * 0.3));
        const accuracy = (correctAnswers / totalQuestions) * 100;
        let level = 'A1';
        if (accuracy >= 90)
            level = 'C2';
        else if (accuracy >= 80)
            level = 'C1';
        else if (accuracy >= 70)
            level = 'B2';
        else if (accuracy >= 60)
            level = 'B1';
        else if (accuracy >= 50)
            level = 'A2';
        const assessment = {
            level,
            accuracy: Math.round(accuracy),
            totalQuestions,
            correctAnswers,
            recommendations: [
                `Votre niveau estimé est ${level}`,
                'Continuez à pratiquer pour améliorer vos compétences',
                'Concentrez-vous sur les domaines où vous avez des difficultés'
            ]
        };
        res.json({
            success: true,
            data: assessment,
            message: 'Level assessment completed successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/level-assessment/update', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const { testAttemptId } = req.body;
        const assessment = await levelDeterminationService_1.LevelDeterminationService.determineStudentLevel(userId);
        res.json({
            success: true,
            data: {
                message: 'Level assessment updated successfully',
                assessment
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/feedback', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const { submissionType, submissionContent, simulationResultId, type, content } = req.body;
        const finalSubmissionType = submissionType || type || 'general';
        const finalSubmissionContent = submissionContent || content || 'Sample content';
        const aiAnalysis = await generateAIFeedback(finalSubmissionContent, finalSubmissionType);
        const feedback = await connection_1.prisma.aIFeedback.create({
            data: {
                userId,
                simulationResultId,
                submissionType: finalSubmissionType,
                submissionContent: finalSubmissionContent,
                aiScore: Math.round(aiAnalysis.score),
                aiConfidence: aiAnalysis.confidence,
                overallFeedback: aiAnalysis.overall,
                strengths: aiAnalysis.strengths,
                weaknesses: aiAnalysis.weaknesses,
                recommendations: aiAnalysis.recommendations,
                detailedAnalysis: aiAnalysis.detailedAnalysis || {},
                status: 'AI_COMPLETED'
            }
        });
        res.json({
            success: true,
            data: feedback,
            message: 'AI feedback generated successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/feedback/:id/submit-for-review', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const { selectedTutorId, message } = req.body;
        const feedback = await connection_1.prisma.aIFeedback.findFirst({
            where: {
                id,
                userId
            },
            include: {
                user: true
            }
        });
        if (!feedback) {
            return res.status(404).json({
                success: false,
                error: { message: 'Feedback not found' }
            });
        }
        const reviewRequest = await connection_1.prisma.marketplaceRequest.create({
            data: {
                studentId: userId,
                tutorId: selectedTutorId,
                requestType: 'EXPERTISE',
                subject: `Review AI Feedback - ${feedback.submissionType || 'Feedback'}`,
                description: message || 'Please review my AI feedback',
                feedbackId: id,
                status: 'PENDING',
                urgency: 'MEDIUM'
            }
        });
        await connection_1.prisma.aIFeedback.update({
            where: { id },
            data: {
                status: 'PENDING_HUMAN'
            }
        });
        res.json({
            success: true,
            data: {
                reviewRequestId: reviewRequest.id,
                status: 'PENDING',
                message: 'Review request submitted successfully'
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/chat', auth_1.authenticate, async (req, res, next) => {
    try {
        const { message, context } = req.body;
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        if (context && context.lessonTitle && context.courseTitle) {
            const result = await aiService_1.AIService.generateChatResponse(message, context);
            return res.json({
                success: true,
                data: result
            });
        }
        const aiResponse = {
            message: `Bonjour! J'ai analysé votre message: "${message}". Pour améliorer votre français, je recommande de pratiquer régulièrement la lecture, l'écriture et la conversation. Voulez-vous des exercices spécifiques pour le TCF/TEF?`,
            suggestions: [
                "Exercices de grammaire",
                "Pratique de l'oral",
                "Tests de niveau",
                "Vocabulaire thématique"
            ],
            userId,
            timestamp: new Date().toISOString()
        };
        res.json({
            success: true,
            data: aiResponse,
            message: 'AI chat response generated'
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/generate-notes', auth_1.authenticate, async (req, res, next) => {
    try {
        const { content, lessonTitle, courseTitle } = req.body;
        if (!content || !lessonTitle || !courseTitle) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: content, lessonTitle, courseTitle'
            });
        }
        const { transcription } = req.body;
        const result = await aiService_1.AIService.generateNotes(content, lessonTitle, courseTitle, transcription);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/generate-questions', auth_1.authenticate, async (req, res, next) => {
    try {
        const { content, lessonTitle, courseTitle, questionCount = 5, questionTypes = ["multiple-choice", "true-false", "short-answer"], level, category, difficulty } = req.body;
        if (!content || !lessonTitle || !courseTitle) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: content, lessonTitle, courseTitle'
            });
        }
        const validQuestionCount = Math.min(Math.max(1, questionCount), 30);
        const { transcription, minWords, maxWords, writingType } = req.body;
        const result = await aiService_1.AIService.generateQuestions(content, lessonTitle, courseTitle, validQuestionCount, questionTypes, category, difficulty, transcription, undefined, undefined, minWords, maxWords, writingType);
        console.log('✅ AI Questions Generated:', {
            questionCount: result.questions?.length || 0,
            lessonTitle,
            courseTitle,
            validQuestionCount,
            firstQuestion: result.questions?.[0]
        });
        const responseData = {
            success: true,
            data: {
                questions: result.questions || []
            },
            message: `${result.questions?.length || 0} questions générées avec succès`
        };
        console.log('📤 Sending response:', {
            success: responseData.success,
            questionCount: responseData.data.questions.length,
            hasQuestions: responseData.data.questions.length > 0
        });
        res.json(responseData);
    }
    catch (error) {
        next(error);
    }
});
router.post('/generate-questions-from-file', auth_1.authenticate, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }
        const { lessonTitle, courseTitle, questionCount = 5, difficulty = 'medium', category = 'GENERAL', level = 'B1' } = req.body;
        console.log('📄 File upload request:', {
            fileName: req.file?.originalname,
            fileSize: req.file?.size,
            fileType: req.file?.mimetype,
            lessonTitle,
            courseTitle,
            questionCount,
            difficulty,
            category,
            level
        });
        if (!lessonTitle || !courseTitle) {
            if (fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: lessonTitle, courseTitle'
            });
        }
        let extractedText = '';
        if (req.file.mimetype === 'application/pdf') {
            console.log('📖 Extracting text from PDF...');
            const pdfBuffer = fs_1.default.readFileSync(req.file.path);
            const pdfData = await (0, pdf_parse_1.default)(pdfBuffer);
            extractedText = pdfData.text;
            console.log(`✅ Extracted ${extractedText.length} characters from PDF`);
        }
        else if (req.file.mimetype === 'text/plain') {
            console.log('📝 Reading text file...');
            extractedText = fs_1.default.readFileSync(req.file.path, 'utf-8');
            console.log(`✅ Read ${extractedText.length} characters from text file`);
        }
        else if (req.file.mimetype.startsWith('audio/')) {
            console.log('🎤 Processing audio file...');
            try {
                const cloudinary = require('cloudinary').v2;
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddhhzeewn',
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET
                });
                const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                    resource_type: 'video',
                    folder: 'simulations/audio',
                    use_filename: true,
                    unique_filename: true
                });
                console.log('✅ Audio uploaded to Cloudinary:', uploadResult.secure_url);
                const { SpeechService } = await Promise.resolve().then(() => __importStar(require('../services/speechService')));
                const audioBuffer = fs_1.default.readFileSync(req.file.path);
                const transcriptionResult = await SpeechService.speechToText(audioBuffer);
                extractedText = transcriptionResult.transcription;
                console.log(`✅ Transcribed ${extractedText.length} characters from audio (confidence: ${transcriptionResult.confidence})`);
                if (!extractedText || extractedText.trim().length < 10) {
                    console.warn('⚠️ Transcription too short, trying alternative transcription method...');
                    extractedText = `Audio content from ${lessonTitle}. Please generate questions based on the audio transcript.`;
                }
            }
            catch (audioError) {
                console.error('❌ Error processing audio file:', audioError);
                fs_1.default.unlinkSync(req.file.path);
                return res.status(500).json({
                    success: false,
                    error: `Failed to process audio file: ${audioError?.message || 'Unknown error'}`
                });
            }
        }
        else if (req.file.mimetype === 'application/msword' ||
            req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'Word document support coming soon. Please use PDF, TXT, or audio files.'
            });
        }
        else {
            fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                error: `Unsupported file type: ${req.file.mimetype}. Supported types: PDF, TXT, audio files (MP3, WAV, etc.)`
            });
        }
        if (!extractedText || extractedText.trim().length === 0) {
            fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'Could not extract text from file. Please ensure the file contains readable content.'
            });
        }
        const isQuestionnaire = questionCount && questionCount <= 30;
        const validQuestionCount = isQuestionnaire
            ? Math.min(Math.max(1, parseInt(questionCount) || 5), 30)
            : Math.min(Math.max(80, parseInt(questionCount) || 80), 150);
        console.log('🤖 Generating questions with AI:', {
            extractedTextLength: extractedText.length,
            questionCount: validQuestionCount,
            difficulty,
            category,
            level,
            isQuestionnaire
        });
        const result = await aiService_1.AIService.generateQuestions(extractedText, lessonTitle, courseTitle, validQuestionCount, ["multiple-choice", "true-false", "short-answer"], category || 'GENERAL', difficulty || 'medium');
        const formattedQuestions = (result.questions || []).map((q, index) => ({
            id: `q_${Date.now()}_${index}`,
            question: q.questionText || q.question || q.text || '',
            type: q.type || 'open',
            category: q.category || 'GENERAL',
            level: q.level || 'B1',
            options: q.options || [],
            correctAnswer: q.correctAnswer || '',
            points: q.points || 1,
            keywords: q.keywords || [],
            difficulty: q.difficulty || 5,
            explanation: q.explanation || '',
            passage: q.passage || null
        }));
        if (fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.json({
            success: true,
            data: {
                questions: formattedQuestions,
                metadata: {
                    totalQuestions: formattedQuestions.length,
                    categories: [...new Set(formattedQuestions.map((q) => q.category))],
                    levels: [...new Set(formattedQuestions.map((q) => q.level))],
                    extractionDate: new Date()
                },
                extractedText: extractedText,
            }
        });
    }
    catch (error) {
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        console.error('❌ Error generating questions from file:', error);
        next(error);
    }
});
router.post('/generate-questions-from-media', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER), async (req, res, next) => {
    try {
        const { audioUrl, videoUrl, lessonTitle, courseTitle, level, category, difficulty, questionCount, questionTypes } = req.body;
        if (!audioUrl && !videoUrl) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Audio URL or Video URL is required'
                }
            });
        }
        if (!lessonTitle || !level || !category) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Missing required fields: lessonTitle, level, category'
                }
            });
        }
        console.log('🎧 Generating questions from media:', {
            audioUrl: audioUrl ? 'provided' : 'none',
            videoUrl: videoUrl ? 'provided' : 'none',
            lessonTitle,
            courseTitle,
            level,
            category,
            difficulty,
            questionCount
        });
        const result = await aiService_1.AIService.generateQuestions('', lessonTitle, courseTitle || lessonTitle, level, category, difficulty || 'medium', questionCount || 5, questionTypes || ['multiple-choice', 'true-false'], audioUrl || null, videoUrl || null);
        res.json({
            success: true,
            data: {
                questions: result.questions || [],
                metadata: {
                    totalQuestions: result.questions?.length || 0,
                    source: audioUrl ? 'audio' : 'video',
                    sourceUrl: audioUrl || videoUrl
                }
            }
        });
    }
    catch (error) {
        console.error('❌ Error generating questions from media:', error);
        next(error);
    }
});
router.post('/transcription', auth_1.authenticate, async (req, res, next) => {
    try {
        const { videoUrl, lessonTitle, courseTitle } = req.body;
        if (!videoUrl) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: videoUrl'
            });
        }
        console.log('🎤 Generating transcription for:', videoUrl);
        const transcription = await aiService_1.AIService.generateTranscription(videoUrl, lessonTitle, courseTitle);
        res.json({
            success: true,
            data: transcription
        });
    }
    catch (error) {
        console.error('❌ Error generating transcription:', error);
        next(error);
    }
});
router.post('/extract-sujets-from-pdf', auth_1.authenticate, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }
        let extractedText = '';
        if (req.file.mimetype === 'application/pdf') {
            const pdfBuffer = fs_1.default.readFileSync(req.file.path);
            const pdfData = await (0, pdf_parse_1.default)(pdfBuffer);
            extractedText = pdfData.text;
        }
        else {
            fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'Only PDF files are supported'
            });
        }
        if (!extractedText || extractedText.trim().length === 0) {
            fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'Could not extract text from PDF'
            });
        }
        const sujets = await aiService_1.AIService.extractSujetsFromText(extractedText);
        if (fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.json({
            success: true,
            data: {
                sujets: sujets || [],
                extractedText: extractedText.substring(0, 500) + '...'
            }
        });
    }
    catch (error) {
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        console.error('❌ Error extracting sujets from PDF:', error);
        next(error);
    }
});
router.post('/extract-audio-content', auth_1.authenticate, upload.single('audio'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No audio file uploaded'
            });
        }
        const { title, description, level, category } = req.body;
        const audioContent = {
            title: title || req.file.originalname,
            description: description || 'Extracted from audio',
            level: level || 'B1',
            category: category || 'ORAL',
            duration: 420,
            transcription: 'Audio transcription would be generated here using speech-to-text service',
            extractedQuestions: [
                {
                    id: '1',
                    text: 'What is the main topic discussed?',
                    type: 'open',
                    difficulty: 'medium'
                },
                {
                    id: '2',
                    text: 'Can you summarize the key points?',
                    type: 'open',
                    difficulty: 'medium'
                }
            ]
        };
        if (fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.json({
            success: true,
            data: audioContent
        });
    }
    catch (error) {
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        console.error('❌ Error extracting audio content:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map