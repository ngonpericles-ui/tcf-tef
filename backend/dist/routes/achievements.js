"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const achievementController_1 = require("../controllers/achievementController");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.get('/recent', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.STUDENT), achievementController_1.AchievementController.getRecentAchievements);
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.STUDENT), achievementController_1.AchievementController.getAllAchievements);
router.get('/progress', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.STUDENT), achievementController_1.AchievementController.getAchievementProgress);
exports.default = router;
//# sourceMappingURL=achievements.js.map