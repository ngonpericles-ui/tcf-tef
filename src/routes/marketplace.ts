import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/marketplace/tutors
 * @desc Get available tutors for Pro+ students
 * @access Private (Pro+ only)
 */
router.get('/tutors', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    // Check if user has Pro+ subscription
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !['PRO', 'PREMIUM'].includes(user.subscriptionTier)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Pro+ subscription required for marketplace access' }
      });
    }

    // Get tutor profiles (managers and admins)
    const tutors = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'] },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profilePicture: true,
        createdAt: true,
        // Add tutor-specific fields if they exist
      }
    });

    const tutorProfiles = tutors.map(tutor => ({
      id: tutor.id,
      name: `${tutor.firstName} ${tutor.lastName}`,
      email: tutor.email,
      role: tutor.role,
      profilePicture: tutor.profilePicture,
      experience: tutor.role === 'ADMIN' ? 'Expert' : tutor.role === 'SENIOR_MANAGER' ? 'Senior' : 'Junior',
      specialties: tutor.role === 'JUNIOR_MANAGER' ? ['A1', 'A2', 'B1'] : ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      rating: 4.5 + Math.random() * 0.5, // Mock rating
      reviewCount: Math.floor(Math.random() * 100) + 10,
      responseTime: '< 24h',
      isAvailable: true
    }));

    res.json({
      success: true,
      data: tutorProfiles
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/marketplace/requests
 * @desc Get all pending review requests for tutors
 * @access Private (Tutors only)
 */
router.get('/requests', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    // Check if user is a tutor (admin, senior manager, or junior manager)
    const tutor = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!tutor || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(tutor.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Only tutors can view review requests' }
      });
    }

    // Get all pending review requests
    const pendingRequests = await prisma.aIFeedback.findMany({
      where: {
        status: 'PENDING_HUMAN'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            subscriptionTier: true
          }
        },
        simulationResult: {
          include: {
            testAttempt: {
              include: {
                test: {
                  select: {
                    title: true,
                    type: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const requests = pendingRequests.map(request => ({
      id: request.id,
      studentId: request.userId,
      studentName: `${request.user.firstName} ${request.user.lastName}`,
      studentEmail: request.user.email,
      subscriptionPlan: request.user.subscriptionTier || 'FREE',
      simulationTitle: request.simulationResult?.testAttempt?.test?.title || 'Unknown',
      simulationType: request.simulationResult?.testAttempt?.test?.type || 'Unknown',
      submissionType: request.submissionType,
      submissionContent: request.submissionContent,
      submissionFileUrl: request.submissionFileUrl,
      aiScore: request.aiScore,
      aiConfidence: request.aiConfidence,
      overallFeedback: request.overallFeedback,
      strengths: request.strengths,
      weaknesses: request.weaknesses,
      recommendations: request.recommendations,
      submissionDate: request.createdAt,
      priority: 'normal' // Could be enhanced with actual priority field
    }));

    res.json({
      success: true,
      data: {
        requests,
        total: requests.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/marketplace/review-requests
 * @desc Submit work for human review
 * @access Private (Pro+ only)
 */
router.post('/review-requests', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { feedbackId, message, priority, tutorId } = req.body;

    // Check if user has Pro+ subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !['PRO', 'PREMIUM'].includes(user.subscriptionTier)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Pro+ subscription required for human reviews' }
      });
    }

    // Verify the feedback belongs to the user
    const feedback = await prisma.aIFeedback.findFirst({
      where: {
        id: feedbackId,
        userId
      }
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: { message: 'Feedback not found' }
      });
    }

    // Update feedback status to pending human review
    await prisma.aIFeedback.update({
      where: { id: feedbackId },
      data: {
        status: 'PENDING_HUMAN',
        humanReviewerId: tutorId || null
      }
    });

    // Create review request record (you might want to add this model)
    const reviewRequest = {
      id: `req_${Date.now()}`,
      feedbackId,
      userId,
      tutorId,
      message,
      priority,
      status: 'PENDING',
      createdAt: new Date()
    };

    // Send notification to tutor (implement notification system)
    await sendTutorNotification(tutorId, {
      type: 'REVIEW_REQUEST',
      message: `New review request from ${user.firstName} ${user.lastName}`,
      priority,
      feedbackId
    });

    res.json({
      success: true,
      data: reviewRequest,
      message: 'Review request submitted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/marketplace/my-requests
 * @desc Get user's review requests
 * @access Private
 */
router.get('/my-requests', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const feedbacks = await prisma.aIFeedback.findMany({
      where: {
        userId,
        status: { in: ['PENDING_HUMAN', 'HUMAN_COMPLETED'] }
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
      },
      orderBy: { createdAt: 'desc' }
    });

    const requests = feedbacks.map(feedback => ({
      id: feedback.id,
      simulationTitle: feedback.simulationResult?.testAttempt?.test?.title || 'Unknown',
      status: feedback.status,
      submissionDate: feedback.createdAt,
      tutorName: feedback.humanReviewerName,
      humanScore: feedback.humanScore,
      humanFeedback: feedback.humanFeedback,
      reviewDate: feedback.humanReviewDate
    }));

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/marketplace/tutor-response
 * @desc Tutor responds to review request
 * @access Private (Tutors only)
 */
router.post('/tutor-response', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tutorId = req.user!.userId;
    const { feedbackId, humanScore, humanFeedback } = req.body;

    // Verify user is a tutor
    const tutor = await prisma.user.findUnique({
      where: { id: tutorId }
    });

    if (!tutor || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(tutor.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Only tutors can respond to review requests' }
      });
    }

    // Update feedback with human review
    const updatedFeedback = await prisma.aIFeedback.update({
      where: { id: feedbackId },
      data: {
        status: 'HUMAN_COMPLETED',
        humanReviewerId: tutorId,
        humanReviewerName: `${tutor.firstName} ${tutor.lastName}`,
        humanScore,
        humanFeedback,
        humanReviewDate: new Date()
      },
      include: {
        user: true
      }
    });

    // Send notification to student
    await sendStudentNotification(updatedFeedback.userId, {
      type: 'REVIEW_COMPLETED',
      message: `Your review has been completed by ${tutor.firstName} ${tutor.lastName}`,
      feedbackId
    });

    res.json({
      success: true,
      data: updatedFeedback,
      message: 'Review completed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions
async function sendTutorNotification(tutorId: string | null, notification: any) {
  if (!tutorId) return;
  
  // Implement notification system
  console.log(`Sending notification to tutor ${tutorId}:`, notification);
  
  // You can implement email notifications here
  // await sendEmail(tutorEmail, 'New Review Request', notification.message);
}

async function sendStudentNotification(studentId: string, notification: any) {
  // Implement notification system
  console.log(`Sending notification to student ${studentId}:`, notification);
  
  // You can implement email notifications here
  // await sendEmail(studentEmail, 'Review Completed', notification.message);
}

export default router;
