"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const errorHandler_1 = require("@/middleware/errorHandler");
const challengeController_1 = require("@/controllers/challengeController");
const types_1 = require("@/types");
const router = (0, express_1.Router)();
router.get('/daily', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.STUDENT), (0, errorHandler_1.asyncHandler)(challengeController_1.ChallengeController.getDailyChallenges));
router.get('/progress', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.STUDENT), (0, errorHandler_1.asyncHandler)(challengeController_1.ChallengeController.getUserProgress));
router.post('/start/:challengeId', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.STUDENT), (0, errorHandler_1.asyncHandler)(challengeController_1.ChallengeController.startChallenge));
router.post('/complete/:challengeId', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.STUDENT), (0, errorHandler_1.asyncHandler)(challengeController_1.ChallengeController.completeChallenge));
exports.default = router;
//# sourceMappingURL=challenges.js.map