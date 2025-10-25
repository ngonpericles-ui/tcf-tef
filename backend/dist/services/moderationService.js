"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationService = void 0;
const connection_1 = require("../database/connection");
class ModerationService {
    static async getUserReports() {
        try {
            const mockReports = [
                {
                    id: 1,
                    reporterId: 'user1',
                    reportedUserId: 'user2',
                    reason: 'Inappropriate behavior',
                    description: 'User was being disruptive in chat',
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    reporterName: 'John Doe',
                    reportedUserName: 'Jane Smith'
                },
                {
                    id: 2,
                    reporterId: 'user3',
                    reportedUserId: 'user4',
                    reason: 'Spam',
                    description: 'User posting spam messages',
                    status: 'resolved',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    resolvedAt: new Date().toISOString(),
                    notes: 'Warning issued to user',
                    reporterName: 'Bob Wilson',
                    reportedUserName: 'Alice Brown'
                }
            ];
            return {
                success: true,
                data: mockReports,
                message: 'User reports retrieved successfully'
            };
        }
        catch (error) {
            console.error('Error getting user reports:', error);
            return {
                success: false,
                error: { message: 'Failed to get user reports', statusCode: 500 }
            };
        }
    }
    static async getContentReports() {
        try {
            const mockContentReports = [
                {
                    id: 1,
                    reporterId: 'user1',
                    contentId: 123,
                    contentType: 'post',
                    reason: 'Inappropriate content',
                    description: 'Post contains offensive language',
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    reporterName: 'John Doe',
                    contentTitle: 'French Grammar Tips'
                },
                {
                    id: 2,
                    reporterId: 'user2',
                    contentId: 456,
                    contentType: 'comment',
                    reason: 'Misinformation',
                    description: 'Comment contains false information',
                    status: 'approved',
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    moderatedAt: new Date().toISOString(),
                    reporterName: 'Jane Smith',
                    contentTitle: 'TCF Preparation Guide'
                }
            ];
            return {
                success: true,
                data: mockContentReports,
                message: 'Content reports retrieved successfully'
            };
        }
        catch (error) {
            console.error('Error getting content reports:', error);
            return {
                success: false,
                error: { message: 'Failed to get content reports', statusCode: 500 }
            };
        }
    }
    static async getModerationActions() {
        try {
            const mockActions = [
                {
                    id: 1,
                    sessionId: 'session123',
                    participantId: 456,
                    action: 'warn',
                    reason: 'Disruptive behavior',
                    timestamp: new Date().toISOString(),
                    moderator: 'admin',
                    moderatorName: 'Admin User'
                },
                {
                    id: 2,
                    sessionId: 'session124',
                    participantId: 789,
                    action: 'mute',
                    reason: 'Inappropriate language',
                    timestamp: new Date(Date.now() - 1800000).toISOString(),
                    moderator: 'manager',
                    moderatorName: 'Manager User'
                }
            ];
            return {
                success: true,
                data: mockActions,
                message: 'Moderation actions retrieved successfully'
            };
        }
        catch (error) {
            console.error('Error getting moderation actions:', error);
            return {
                success: false,
                error: { message: 'Failed to get moderation actions', statusCode: 500 }
            };
        }
    }
    static async moderateLiveSession(sessionId, participantId, action, reason, moderatorId) {
        try {
            const moderator = await connection_1.prisma.user.findUnique({
                where: { id: moderatorId }
            });
            if (!moderator || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(moderator.role)) {
                return {
                    success: false,
                    error: { message: 'Unauthorized: Only managers and admins can moderate sessions', statusCode: 403 }
                };
            }
            console.log(`Moderation action applied: ${action} on participant ${participantId} in session ${sessionId} by ${moderatorId}`);
            const moderationAction = {
                sessionId,
                participantId,
                action,
                reason,
                moderatorId,
                moderatorName: `${moderator.firstName} ${moderator.lastName}`,
                timestamp: new Date().toISOString()
            };
            return {
                success: true,
                data: moderationAction,
                message: `Moderation action ${action} applied successfully`
            };
        }
        catch (error) {
            console.error('Error moderating live session:', error);
            return {
                success: false,
                error: { message: 'Failed to moderate live session', statusCode: 500 }
            };
        }
    }
    static async moderatePost(postId, action, reason, moderatorId) {
        try {
            const moderator = await connection_1.prisma.user.findUnique({
                where: { id: moderatorId }
            });
            if (!moderator || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(moderator.role)) {
                return {
                    success: false,
                    error: { message: 'Unauthorized: Only managers and admins can moderate content', statusCode: 403 }
                };
            }
            console.log(`Post moderation: ${action} on post ${postId} by ${moderatorId}`);
            return {
                success: true,
                data: {
                    postId,
                    action,
                    reason,
                    moderatorId,
                    moderatedAt: new Date().toISOString()
                },
                message: `Post ${action}ed successfully`
            };
        }
        catch (error) {
            console.error('Error moderating post:', error);
            return {
                success: false,
                error: { message: 'Failed to moderate post', statusCode: 500 }
            };
        }
    }
    static async moderateComment(commentId, action, reason, moderatorId) {
        try {
            const moderator = await connection_1.prisma.user.findUnique({
                where: { id: moderatorId }
            });
            if (!moderator || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(moderator.role)) {
                return {
                    success: false,
                    error: { message: 'Unauthorized: Only managers and admins can moderate content', statusCode: 403 }
                };
            }
            console.log(`Comment moderation: ${action} on comment ${commentId} by ${moderatorId}`);
            return {
                success: true,
                data: {
                    commentId,
                    action,
                    reason,
                    moderatorId,
                    moderatedAt: new Date().toISOString()
                },
                message: `Comment ${action}ed successfully`
            };
        }
        catch (error) {
            console.error('Error moderating comment:', error);
            return {
                success: false,
                error: { message: 'Failed to moderate comment', statusCode: 500 }
            };
        }
    }
    static async handleReport(reportId, action, notes, moderatorId) {
        try {
            const moderator = await connection_1.prisma.user.findUnique({
                where: { id: moderatorId }
            });
            if (!moderator || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(moderator.role)) {
                return {
                    success: false,
                    error: { message: 'Unauthorized: Only managers and admins can handle reports', statusCode: 403 }
                };
            }
            console.log(`Report ${reportId} ${action}ed by ${moderatorId}`);
            return {
                success: true,
                data: {
                    reportId,
                    action,
                    notes,
                    moderatorId,
                    handledAt: new Date().toISOString()
                },
                message: `Report ${action}ed successfully`
            };
        }
        catch (error) {
            console.error('Error handling report:', error);
            return {
                success: false,
                error: { message: 'Failed to handle report', statusCode: 500 }
            };
        }
    }
}
exports.ModerationService = ModerationService;
exports.default = ModerationService;
//# sourceMappingURL=moderationService.js.map