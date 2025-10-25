"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const adminService_1 = require("../services/adminService");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class AdminController {
}
exports.AdminController = AdminController;
_a = AdminController;
AdminController.getDashboard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const timeframe = req.query.timeframe || '30d';
    const metrics = req.query.metrics;
    const dashboardData = await adminService_1.AdminService.getDashboardData(timeframe, metrics);
    const response = {
        success: true,
        data: dashboardData,
        message: 'Admin dashboard data retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.getSystemHealth = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const healthData = await adminService_1.AdminService.getSystemHealth();
    const response = {
        success: true,
        data: healthData,
        message: 'System health data retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.getBusinessMetrics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const period = req.query.period || '30d';
    const category = req.query.category;
    const metrics = await adminService_1.AdminService.getBusinessMetrics(period, category);
    const response = {
        success: true,
        data: metrics,
        message: 'Business metrics retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.getTechnicalMetrics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const metrics = await adminService_1.AdminService.getTechnicalMetrics();
    const response = {
        success: true,
        data: metrics,
        message: 'Technical metrics retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.getAllUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const role = req.query.role;
    const status = req.query.status;
    const subscription = req.query.subscription;
    const filters = {
        search,
        role,
        status,
        subscription
    };
    const result = await adminService_1.AdminService.getAllUsers({ page, limit }, filters);
    const response = {
        success: true,
        data: result.users,
        pagination: result.pagination,
        message: 'Users retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.getUserAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const period = req.query.period || '30d';
    const analytics = await adminService_1.AdminService.getUserAnalytics(userId, period);
    const response = {
        success: true,
        data: analytics,
        message: 'User analytics retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.getManagers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const role = req.query.role;
    const team = req.query.team;
    const performance = req.query.performance;
    const filters = { role, team, performance };
    const managers = await adminService_1.AdminService.getManagers(filters);
    const response = {
        success: true,
        data: managers,
        message: 'Managers retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.createManager = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const managerData = req.body;
    const createdById = req.user?.userId;
    if (!createdById) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const manager = await adminService_1.AdminService.createManager(managerData, createdById);
    const response = {
        success: true,
        data: { manager },
        message: 'Manager created successfully'
    };
    logger_1.logger.info('Manager created', { managerId: manager.id, createdById });
    res.status(201).json(response);
});
AdminController.updateManager = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { managerId } = req.params;
    const updateData = req.body;
    const updatedById = req.user?.userId;
    if (!updatedById) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const manager = await adminService_1.AdminService.updateManager(managerId, updateData, updatedById);
    const response = {
        success: true,
        data: { manager },
        message: 'Manager updated successfully'
    };
    logger_1.logger.info('Manager updated', { managerId, updatedById });
    res.status(200).json(response);
});
AdminController.getManagerPerformance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { managerId } = req.params;
    const period = req.query.period || '30d';
    const performance = await adminService_1.AdminService.getManagerPerformance(managerId, period);
    const response = {
        success: true,
        data: performance,
        message: 'Manager performance retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.getAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const category = req.query.category;
    const timeframe = req.query.timeframe || '30d';
    const filters = req.query.filters;
    const analytics = await adminService_1.AdminService.getAnalytics(category, timeframe, filters);
    const response = {
        success: true,
        data: analytics,
        message: 'Analytics data retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.generateReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const reportConfig = req.body;
    const generatedById = req.user?.userId;
    if (!generatedById) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const report = await adminService_1.AdminService.generateReport(reportConfig, generatedById);
    const response = {
        success: true,
        data: { report },
        message: 'Report generated successfully'
    };
    res.status(200).json(response);
});
AdminController.exportData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const format = req.query.format || 'csv';
    const filters = req.query.filters;
    const exportedById = req.user?.userId;
    if (!exportedById) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const exportData = await adminService_1.AdminService.exportData(format, filters, exportedById);
    const response = {
        success: true,
        data: exportData,
        message: 'Data exported successfully'
    };
    res.status(200).json(response);
});
AdminController.healthCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const response = {
        success: true,
        data: {
            service: 'admin',
            status: 'healthy',
            timestamp: new Date().toISOString()
        },
        message: 'Admin service is healthy'
    };
    res.status(200).json(response);
});
AdminController.getReviewRequests = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const reviewRequests = await adminService_1.AdminService.getReviewRequests(userId, userRole);
    const response = {
        success: true,
        data: reviewRequests,
        message: 'Review requests retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.handleReviewRequest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { action, response: responseMessage, humanFeedback, humanScore } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const result = await adminService_1.AdminService.handleReviewRequest(id, action, {
        tutorId: userId,
        response: responseMessage,
        humanFeedback,
        humanScore
    });
    const response = {
        success: true,
        data: result,
        message: `Review request ${action}ed successfully`
    };
    res.status(200).json(response);
});
AdminController.createSubscriptionPlan = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const planData = req.body;
    const plan = await adminService_1.AdminService.createSubscriptionPlan(planData);
    const response = {
        success: true,
        data: plan,
        message: 'Subscription plan created successfully'
    };
    res.status(201).json(response);
});
AdminController.getSubscriptionPlans = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const plans = await adminService_1.AdminService.getSubscriptionPlans();
    const response = {
        success: true,
        data: plans,
        message: 'Subscription plans retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.getSubscriptionPlanById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const plan = await adminService_1.AdminService.getSubscriptionPlanById(id);
    const response = {
        success: true,
        data: plan,
        message: 'Subscription plan retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.updateSubscriptionPlan = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const plan = await adminService_1.AdminService.updateSubscriptionPlan(id, updateData);
    const response = {
        success: true,
        data: plan,
        message: 'Subscription plan updated successfully'
    };
    res.status(200).json(response);
});
AdminController.deleteSubscriptionPlan = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await adminService_1.AdminService.deleteSubscriptionPlan(id);
    const response = {
        success: true,
        data: null,
        message: 'Subscription plan deleted successfully'
    };
    res.status(200).json(response);
});
AdminController.getSubscriptionAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const analytics = await adminService_1.AdminService.getSubscriptionAnalytics();
    const response = {
        success: true,
        data: analytics,
        message: 'Subscription analytics retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.getAudioSimulations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, status, level, search } = req.query;
    const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        status: status,
        level: level,
        search: search
    };
    const result = await adminService_1.AdminService.getAudioSimulations(filters);
    const response = {
        success: true,
        data: result,
        message: 'Audio simulations retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.getAudioSimulation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const simulation = await adminService_1.AdminService.getAudioSimulation(id);
    const response = {
        success: true,
        data: simulation,
        message: 'Audio simulation retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.createAudioSimulation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const simulationData = req.body;
    const simulation = await adminService_1.AdminService.createAudioSimulation(simulationData);
    const response = {
        success: true,
        data: simulation,
        message: 'Audio simulation created successfully'
    };
    res.status(201).json(response);
});
AdminController.updateAudioSimulation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const simulation = await adminService_1.AdminService.updateAudioSimulation(id, updateData);
    const response = {
        success: true,
        data: simulation,
        message: 'Audio simulation updated successfully'
    };
    res.status(200).json(response);
});
AdminController.deleteAudioSimulation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await adminService_1.AdminService.deleteAudioSimulation(id);
    const response = {
        success: true,
        data: null,
        message: 'Audio simulation deleted successfully'
    };
    res.status(200).json(response);
});
AdminController.getImmigrationSimulations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, status, country, immigrationType, level, search } = req.query;
    const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        status: status,
        country: country,
        immigrationType: immigrationType,
        level: level,
        search: search
    };
    const result = await adminService_1.AdminService.getImmigrationSimulations(filters);
    const response = {
        success: true,
        data: result,
        message: 'Immigration simulations retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.getImmigrationSimulation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const simulation = await adminService_1.AdminService.getImmigrationSimulation(id);
    const response = {
        success: true,
        data: simulation,
        message: 'Immigration simulation retrieved successfully'
    };
    res.status(200).json(response);
});
AdminController.createImmigrationSimulation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const simulationData = req.body;
    const simulation = await adminService_1.AdminService.createImmigrationSimulation(simulationData);
    const response = {
        success: true,
        data: simulation,
        message: 'Immigration simulation created successfully'
    };
    res.status(201).json(response);
});
AdminController.updateImmigrationSimulation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const simulation = await adminService_1.AdminService.updateImmigrationSimulation(id, updateData);
    const response = {
        success: true,
        data: simulation,
        message: 'Immigration simulation updated successfully'
    };
    res.status(200).json(response);
});
AdminController.deleteImmigrationSimulation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await adminService_1.AdminService.deleteImmigrationSimulation(id);
    const response = {
        success: true,
        data: null,
        message: 'Immigration simulation deleted successfully'
    };
    res.status(200).json(response);
});
//# sourceMappingURL=adminController.js.map