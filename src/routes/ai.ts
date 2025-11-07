import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { LevelDeterminationService } from '../services/levelDeterminationService';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/ai/feedbacks
 * @desc Get AI feedbacks for authenticated user
 * @access Private
 */
router.get('/feedbacks', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

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
      aiConfidence: feedback.aiConfidence, // Add AI confidence for submission filter
      status: feedback.status,
      feedback: {
        overall: feedback.overallFeedback,
        strengths: feedback.strengths as string[],
        weaknesses: feedback.weaknesses as string[],
        recommendations: feedback.recommendations as string[],
        detailedAnalysis: feedback.detailedAnalysis as any
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
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/ai/feedbacks/:id
 * @desc Get specific AI feedback by ID
 * @access Private
 */
router.get('/feedbacks/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

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
      strengths: feedback.strengths as string[],
      weaknesses: feedback.weaknesses as string[],
      recommendations: feedback.recommendations as string[],
      detailedAnalysis: feedback.detailedAnalysis as any,
      status: feedback.status,
      createdAt: feedback.createdAt.toISOString(),
      simulationTitle: feedback.simulationResult?.testAttempt?.test?.title || 'Unknown Simulation'
    };

    res.json({
      success: true,
      data: transformedFeedback
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/feedbacks
 * @desc Create AI feedback for a submission
 * @access Private
 */
router.post('/feedbacks', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const {
      simulationResultId,
      submissionType,
      submissionContent,
      submissionFileUrl
    } = req.body;

    // Generate AI feedback (mock implementation)
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
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/ai/feedbacks/:id/report
 * @desc Generate and download feedback report
 * @access Private
 */
router.get('/feedbacks/:id/report', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

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

    // Generate PDF report (mock implementation)
    const reportBuffer = await generatePDFReport(feedback);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="feedback-report-${id}.pdf"`);
    res.send(reportBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/analyze-document
 * @desc Analyze uploaded document with AI
 * @access Private
 */
router.post('/analyze-document', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentUrl, documentType, contentId } = req.body;

    // Extract text from document
    const extractedText = await extractTextFromDocument(documentUrl, documentType);

    // Analyze with AI
    const analysis = await analyzeDocumentWithAI(extractedText);

    // Store in question bank for AI assistant
    await prisma.questionBankEntry.create({
      data: {
        content: extractedText,
        contentType: documentType || 'DOCUMENT',
        level: 'B1', // Default level, can be determined by AI
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
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/ai/assistant/context
 * @desc Get context for AI assistant from question bank
 * @access Private
 */
router.get('/assistant/context', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, limit = 10 } = req.query;

    const contextEntries = await prisma.questionBankEntry.findMany({
      where: query ? {
        OR: [
          { extractedText: { contains: query as string, mode: 'insensitive' } },
          { aiAnalysis: { path: ['summary'], string_contains: query as string } }
        ]
      } : {},
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: contextEntries
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions
async function generateAIFeedback(content: string, type: string) {
  // Mock AI analysis - in production, this would call actual AI service
  if (!content || typeof content !== 'string') {
    content = 'Sample content for analysis';
  }
  const wordCount = content.split(' ').length;
  const score = Math.min(100, Math.max(20, 60 + Math.random() * 30));
  
  return {
    score: Math.round(score),
    confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
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

async function generatePDFReport(feedback: any): Promise<Buffer> {
  // Mock PDF generation - in production, use a library like puppeteer or pdfkit
  const reportContent = `
    Rapport de Feedback IA
    
    Simulation: ${feedback.simulationResult?.testAttempt?.test?.title}
    Score: ${feedback.aiScore}/${feedback.maxScore}
    Date: ${feedback.createdAt.toLocaleDateString()}
    
    Feedback: ${feedback.overallFeedback}
    
    Points forts:
    ${(feedback.strengths as string[]).map(s => `- ${s}`).join('\n')}
    
    Points à améliorer:
    ${(feedback.weaknesses as string[]).map(w => `- ${w}`).join('\n')}
    
    Recommandations:
    ${(feedback.recommendations as string[]).map(r => `- ${r}`).join('\n')}
  `;
  
  return Buffer.from(reportContent, 'utf-8');
}

async function extractTextFromDocument(url: string, type: string): Promise<string> {
  // Mock text extraction - in production, use appropriate libraries
  return `Extracted text from ${type} document at ${url}. This would contain the actual document content.`;
}

async function analyzeDocumentWithAI(text: string) {
  // Mock AI analysis - in production, call actual AI service
  return {
    summary: `Document summary: ${text.substring(0, 100)}...`,
    keyPoints: ['Point 1', 'Point 2', 'Point 3'],
    difficulty: 'Intermediate',
    topics: ['Grammar', 'Vocabulary', 'Reading Comprehension']
  };
}

/**
 * @route POST /api/ai/feedbacks/:id/request-review
 * @desc Request human review for AI feedback
 * @access Private
 */
router.post('/feedbacks/:id/request-review', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if feedback exists and belongs to user
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

    // Update status to request human review
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
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/ai/level-assessment
 * @desc Get AI-powered level assessment for student
 * @access Private
 */
router.get('/level-assessment', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    // Get comprehensive level assessment
    const assessment = await LevelDeterminationService.determineStudentLevel(userId);

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/assess-level
 * @desc Assess student level based on responses
 * @access Private
 */
router.post('/assess-level', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { responses } = req.body;

    // Mock level assessment - in production, this would use actual AI
    const totalQuestions = responses?.length || 1;
    const correctAnswers = Math.floor(totalQuestions * (0.6 + Math.random() * 0.3));
    const accuracy = (correctAnswers / totalQuestions) * 100;

    let level = 'A1';
    if (accuracy >= 90) level = 'C2';
    else if (accuracy >= 80) level = 'C1';
    else if (accuracy >= 70) level = 'B2';
    else if (accuracy >= 60) level = 'B1';
    else if (accuracy >= 50) level = 'A2';

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
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/level-assessment/update
 * @desc Update student level based on new test results
 * @access Private
 */
router.post('/level-assessment/update', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { testAttemptId } = req.body;

    // Trigger level reassessment after new test
    const assessment = await LevelDeterminationService.determineStudentLevel(userId);

    res.json({
      success: true,
      data: {
        message: 'Level assessment updated successfully',
        assessment
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/ai/feedback
 * @desc    Create AI feedback for student submission (single endpoint)
 * @access Private
 */
router.post('/feedback', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const {
      submissionType,
      submissionContent,
      simulationResultId,
      // Also accept alternative field names for compatibility
      type,
      content
    } = req.body;

    // Use alternative field names if primary ones are not provided
    const finalSubmissionType = submissionType || type || 'general';
    const finalSubmissionContent = submissionContent || content || 'Sample content';

    // Generate AI feedback (mock implementation)
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
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/ai/feedback/:id/submit-for-review
 * @desc    Submit AI feedback for human review via marketplace
 * @access Private
 */
router.post('/feedback/:id/submit-for-review', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { selectedTutorId, message } = req.body;

    // Check if feedback exists and belongs to user
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

    // Create a review request
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

    // Update feedback status
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
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/ai/chat
 * @desc    AI chat assistant for students
 * @access Private
 */
router.post('/chat', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    const userId = req.user!.userId;

    // Mock AI chat response based on user message
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
  } catch (error) {
    next(error);
  }
});

export default router;
