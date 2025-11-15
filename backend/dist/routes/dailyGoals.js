"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const dailyGoalController_1 = require("../controllers/dailyGoalController");
const router = (0, express_1.Router)();
router.get('/today', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(dailyGoalController_1.DailyGoalController.getTodayGoal));
router.post('/set', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(dailyGoalController_1.DailyGoalController.setDailyGoal));
router.put('/progress', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(dailyGoalController_1.DailyGoalController.updateProgress));
router.post('/complete', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(dailyGoalController_1.DailyGoalController.completeGoal));
exports.default = router;
//# sourceMappingURL=dailyGoals.js.map