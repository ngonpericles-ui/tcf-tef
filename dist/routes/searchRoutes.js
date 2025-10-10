"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const searchController_1 = require("../controllers/searchController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
const searchQuerySchema = {
    query: joi_1.default.object({
        q: joi_1.default.string().min(2).max(100).required().messages({
            'string.min': 'Search query must be at least 2 characters long',
            'string.max': 'Search query must not exceed 100 characters',
            'any.required': 'Search query is required'
        }),
        contentType: joi_1.default.string().valid('ALL', 'COURSES', 'POSTS', 'TESTS', 'USERS').optional(),
        category: joi_1.default.string().max(50).optional(),
        level: joi_1.default.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').optional(),
        author: joi_1.default.string().uuid().optional(),
        dateFrom: joi_1.default.date().iso().optional(),
        dateTo: joi_1.default.date().iso().min(joi_1.default.ref('dateFrom')).optional(),
        tags: joi_1.default.string().optional(),
        page: joi_1.default.number().integer().min(1).max(1000).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(20),
        sortBy: joi_1.default.string().valid('relevance', 'date', 'popularity', 'title').default('relevance'),
        sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc')
    })
};
const suggestionQuerySchema = {
    query: joi_1.default.object({
        q: joi_1.default.string().min(1).max(100).optional(),
        limit: joi_1.default.number().integer().min(1).max(20).default(5)
    })
};
router.get('/', (0, validation_1.validate)(searchQuerySchema), searchController_1.SearchController.globalSearch);
router.get('/courses', (0, validation_1.validate)(searchQuerySchema), searchController_1.SearchController.searchCourses);
router.get('/posts', (0, validation_1.validate)(searchQuerySchema), searchController_1.SearchController.searchPosts);
router.get('/tests', (0, validation_1.validate)(searchQuerySchema), searchController_1.SearchController.searchTests);
router.get('/users', auth_1.authenticate, (0, validation_1.validate)(searchQuerySchema), searchController_1.SearchController.searchUsers);
router.get('/suggestions', (0, validation_1.validate)(suggestionQuerySchema), searchController_1.SearchController.getSearchSuggestions);
router.get('/facets', (0, validation_1.validate)(searchQuerySchema), searchController_1.SearchController.getSearchFacets);
exports.default = router;
//# sourceMappingURL=searchRoutes.js.map