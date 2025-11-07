"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const homeController_1 = require("../controllers/homeController");
const router = (0, express_1.Router)();
router.get('/dashboard', auth_1.authenticate, homeController_1.HomeController.getDashboardData);
router.get('/ai-messages', auth_1.authenticate, homeController_1.HomeController.getAIMessages);
router.get('/study-session', auth_1.authenticate, homeController_1.HomeController.getStudySession);
router.post('/study-session/start', auth_1.authenticate, homeController_1.HomeController.startStudySession);
router.post('/study-session/stop', auth_1.authenticate, homeController_1.HomeController.stopStudySession);
router.post('/study-session/reset', auth_1.authenticate, homeController_1.HomeController.resetStudySession);
router.get('/days-on-platform', auth_1.authenticate, homeController_1.HomeController.getDaysOnPlatform);
router.get('/regional-time', auth_1.authenticate, homeController_1.HomeController.getRegionalTime);
exports.default = router;
//# sourceMappingURL=home.js.map