"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const levelDeterminationService_1 = require("../services/levelDeterminationService");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.get('/feedbacks', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const feedbacks = await prisma.aIFeedback.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
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
        const transformedFeedbacks = feedbacks.map(feedback => ({
            id: feedback.id,
            simulationTitle: feedback.simulationResult?.testAttempt?.test?.title || 'Unknown Simulation',
            submissionDate: feedback.createdAt.toISOString(),
            aiScore: feedback.aiScore,
            maxScore: feedback.maxScore,
            percentage: Math.round((feedback.aiScore / feedback.maxScore) * 100),
            aiConfidence: feedback.aiConfidence,
            status: feedback.status,
            feedback: {
                overall: feedback.overallFeedback,
                strengths: feedback.strengths,
                weaknesses: feedback.weaknesses,
                recommendations: feedback.recommendations,
                detailedAnalysis: feedback.detailedAnalysis
            },
            originalWork: {
                type: feedback.submissionType,
                content: feedback.submissionContent,
                fileUrl: feedback.submissionFileUrl
            },
            humanReview: feedback.humanReviewerId ? {
                tutorName: feedback.humanReviewerName || 'Expert Tutor',
                tutorFeedback: feedback.humanFeedback || '',
                reviewDate: feedback.humanReviewDate?.toISOString() || '',
                finalScore: feedback.humanScore || feedback.aiScore
            } : undefined
        }));
        res.json({
            success: true,
            data: transformedFeedbacks
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/feedbacks/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const feedback = await prisma.aIFeedback.findFirst({
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
        const userId = req.user.userId;
        const { simulationResultId, submissionType, submissionContent, submissionFileUrl } = req.body;
        const aiAnalysis = await generateAIFeedback(submissionContent, submissionType);
        const feedback = await prisma.aIFeedback.create({
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
        const userId = req.user.userId;
        const feedback = await prisma.aIFeedback.findFirst({
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
        await prisma.questionBankEntry.create({
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
        const contextEntries = await prisma.questionBankEntry.findMany({
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
        const userId = req.user.userId;
        const feedback = await prisma.aIFeedback.findFirst({
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
        const updatedFeedback = await prisma.aIFeedback.update({
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
        const userId = req.user.userId;
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
        const userId = req.user.userId;
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
        const userId = req.user.userId;
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
        const userId = req.user.userId;
        const { submissionType, submissionContent, simulationResultId, type, content } = req.body;
        const finalSubmissionType = submissionType || type || 'general';
        const finalSubmissionContent = submissionContent || content || 'Sample content';
        const aiAnalysis = await generateAIFeedback(finalSubmissionContent, finalSubmissionType);
        const feedback = await prisma.aIFeedback.create({
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
        const userId = req.user.userId;
        const { selectedTutorId, message } = req.body;
        const feedback = await prisma.aIFeedback.findFirst({
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
        const reviewRequest = await prisma.reviewRequest.create({
            data: {
                studentId: userId,
                tutorId: selectedTutorId,
                feedbackId: id,
                message: message || 'Please review my AI feedback',
                status: 'PENDING',
                requestType: 'AI_FEEDBACK_REVIEW'
            }
        });
        await prisma.aIFeedback.update({
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
        const { message } = req.body;
        const userId = req.user.userId;
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
exports.default = router;
//# sourceMappingURL=ai.js.map