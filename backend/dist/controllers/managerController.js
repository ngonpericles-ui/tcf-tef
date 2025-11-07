"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerController = void 0;
const managerService_1 = require("../services/managerService");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class ManagerController {
}
exports.ManagerController = ManagerController;
_a = ManagerController;
ManagerController.getDashboard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const managerId = req.user?.userId;
    const timeframe = req.query.timeframe || '30d';
    const team = req.query.team;
    if (!managerId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const dashboardData = await managerService_1.ManagerService.getDashboardData(managerId, timeframe, team);
    const response = {
        success: true,
        data: dashboardData,
        message: 'Manager dashboard data retrieved successfully'
    };
    res.status(200).json(response);
});
ManagerController.getMetrics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const managerId = req.user?.userId;
    const period = req.query.period || '30d';
    const category = req.query.category;
    if (!managerId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const metrics = await managerService_1.ManagerService.getMetrics(managerId, period, category);
    const response = {
        success: true,
        data: metrics,
        message: 'Manager metrics retrieved successfully'
    };
    res.status(200).json(response);
});
ManagerController.getActivity = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const managerId = req.user?.userId;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    if (!managerId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const activity = await managerService_1.ManagerService.getActivity(managerId, limit, type);
    const response = {
        success: true,
        data: activity,
        message: 'Manager activity retrieved successfully'
    };
    res.status(200).json(response);
});
ManagerController.getAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const managerId = req.user?.userId;
    const timeframe = req.query.timeframe || '30d';
    const category = req.query.category;
    const filters = req.query.filters;
    if (!managerId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const analytics = await managerService_1.ManagerService.getAnalytics(managerId, timeframe, category, filters);
    const response = {
        success: true,
        data: analytics,
        message: 'Manager analytics retrieved successfully'
    };
    res.status(200).json(response);
});
ManagerController.generateReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const managerId = req.user?.userId;
    const reportConfig = req.body;
    if (!managerId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const report = await managerService_1.ManagerService.generateReport(managerId, reportConfig);
    const response = {
        success: true,
        data: { report },
        message: 'Report generated successfully'
    };
    res.status(200).json(response);
});
ManagerController.exportData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const managerId = req.user?.userId;
    const format = req.query.format || 'csv';
    const filters = req.query.filters;
    if (!managerId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const exportData = await managerService_1.ManagerService.exportData(managerId, format, filters);
    const response = {
        success: true,
        data: exportData,
        message: 'Data exported successfully'
    };
    res.status(200).json(response);
});
ManagerController.getManagedUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const managerId = req.user?.userId;
    const managerRole = req.user?.role;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const filters = req.query.filters;
    if (!managerId || !managerRole) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const result = await managerService_1.ManagerService.getManagedUsers(managerId, managerRole, { page, limit }, { search, filters });
    const response = {
        success: true,
        data: result.users,
        pagination: result.pagination,
        message: 'Managed users retrieved successfully'
    };
    res.status(200).json(response);
});
ManagerController.getUserAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const managerId = req.user?.userId;
    const managerRole = req.user?.role;
    if (!managerId || !managerRole) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const analytics = await managerService_1.ManagerService.getUserAnalytics(userId, managerId, managerRole);
    const response = {
        success: true,
        data: analytics,
        message: 'User analytics retrieved successfully'
    };
    res.status(200).json(response);
});
ManagerController.sendMessageToUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const managerId = req.user?.userId;
    const { title, message, type } = req.body;
    if (!managerId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await managerService_1.ManagerService.sendMessageToUser(userId, managerId, title, message, type);
    const response = {
        success: true,
        message: 'Message sent successfully'
    };
    logger_1.logger.info('Manager sent message to user', { managerId, userId });
    res.status(200).json(response);
});
ManagerController.getContentLibrary = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const managerId = req.user?.userId;
    const type = req.query.type;
    const status = req.query.status;
    const author = req.query.author;
    const date = req.query.date;
    if (!managerId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const content = await managerService_1.ManagerService.getContentLibrary(managerId, {
        type,
        status,
        author,
        date
    });
    const response = {
        success: true,
        data: content,
        message: 'Content library retrieved successfully'
    };
    res.status(200).json(response);
});
ManagerController.createContent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const managerId = req.user?.userId;
    const contentData = req.body;
    if (!managerId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const content = await managerService_1.ManagerService.createContent(managerId, contentData);
    const response = {
        success: true,
        data: { content },
        message: 'Content created successfully'
    };
    logger_1.logger.info('Manager created content', { managerId, contentId: content.id });
    res.status(201).json(response);
});
ManagerController.updateContent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { contentId } = req.params;
    const managerId = req.user?.userId;
    const updateData = req.body;
    if (!managerId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const content = await managerService_1.ManagerService.updateContent(contentId, managerId, updateData);
    const response = {
        success: true,
        data: { content },
        message: 'Content updated successfully'
    };
    logger_1.logger.info('Manager updated content', { managerId, contentId });
    res.status(200).json(response);
});
ManagerController.publishContent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { contentId } = req.params;
    const managerId = req.user?.userId;
    if (!managerId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const content = await managerService_1.ManagerService.publishContent(contentId, managerId);
    const response = {
        success: true,
        data: { content },
        message: 'Content published successfully'
    };
    logger_1.logger.info('Manager published content', { managerId, contentId });
    res.status(200).json(response);
});
ManagerController.getContentAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { contentId } = req.params;
    const managerId = req.user?.userId;
    if (!managerId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const analytics = await managerService_1.ManagerService.getContentAnalytics(contentId, managerId);
    const response = {
        success: true,
        data: analytics,
        message: 'Content analytics retrieved successfully'
    };
    res.status(200).json(response);
});
ManagerController.healthCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const response = {
        success: true,
        data: {
            service: 'manager',
            status: 'healthy',
            timestamp: new Date().toISOString()
        },
        message: 'Manager service is healthy'
    };
    res.status(200).json(response);
});
//# sourceMappingURL=managerController.js.map