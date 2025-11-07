"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.get('/tutors', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || !['PRO', 'PREMIUM'].includes(user.subscriptionTier)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Pro+ subscription required for marketplace access' }
            });
        }
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
            rating: 4.5 + Math.random() * 0.5,
            reviewCount: Math.floor(Math.random() * 100) + 10,
            responseTime: '< 24h',
            isAvailable: true
        }));
        res.json({
            success: true,
            data: tutorProfiles
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/requests', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const tutor = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!tutor || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(tutor.role)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Only tutors can view review requests' }
            });
        }
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
            priority: 'normal'
        }));
        res.json({
            success: true,
            data: {
                requests,
                total: requests.length
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/review-requests', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { feedbackId, message, priority, tutorId } = req.body;
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !['PRO', 'PREMIUM'].includes(user.subscriptionTier)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Pro+ subscription required for human reviews' }
            });
        }
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
        await prisma.aIFeedback.update({
            where: { id: feedbackId },
            data: {
                status: 'PENDING_HUMAN',
                humanReviewerId: tutorId || null
            }
        });
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/my-requests', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
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
    }
    catch (error) {
        next(error);
    }
});
router.post('/tutor-response', auth_1.authenticate, async (req, res, next) => {
    try {
        const tutorId = req.user.userId;
        const { feedbackId, humanScore, humanFeedback } = req.body;
        const tutor = await prisma.user.findUnique({
            where: { id: tutorId }
        });
        if (!tutor || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(tutor.role)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Only tutors can respond to review requests' }
            });
        }
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
    }
    catch (error) {
        next(error);
    }
});
async function sendTutorNotification(tutorId, notification) {
    if (!tutorId)
        return;
    console.log(`Sending notification to tutor ${tutorId}:`, notification);
}
async function sendStudentNotification(studentId, notification) {
    console.log(`Sending notification to student ${studentId}:`, notification);
}
exports.default = router;
//# sourceMappingURL=marketplace.js.map