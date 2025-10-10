"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const searchService_1 = require("../services/searchService");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class SearchController {
    static async globalSearch(req, res) {
        try {
            const { q: query } = req.query;
            if (!query || typeof query !== 'string') {
                throw new errors_1.ValidationError('Search query is required');
            }
            if (query.length < 2) {
                throw new errors_1.ValidationError('Search query must be at least 2 characters long');
            }
            const filters = {
                contentType: req.query.contentType,
                category: req.query.category,
                level: req.query.level,
                author: req.query.author,
                dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
                dateTo: req.query.dateTo ? new Date(req.query.dateTo) : undefined,
                tags: req.query.tags ? req.query.tags.split(',') : undefined
            };
            const options = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                sortBy: req.query.sortBy || 'relevance',
                sortOrder: req.query.sortOrder || 'desc'
            };
            if (options.page < 1)
                options.page = 1;
            if (options.limit < 1 || options.limit > 100)
                options.limit = 20;
            logger_1.logger.info('Global search request', {
                query,
                filters,
                options,
                userId: req.user?.userId
            });
            const results = await searchService_1.SearchService.globalSearch(query, filters, options);
            res.json({
                success: true,
                data: results,
                message: `Found ${results.results.length} results for "${query}"`
            });
        }
        catch (error) {
            logger_1.logger.error('Global search failed', {
                query: req.query.q,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Search failed',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'SEARCH_ERROR'
                    }
                });
            }
        }
    }
    static async searchCourses(req, res) {
        try {
            const { q: query } = req.query;
            if (!query || typeof query !== 'string') {
                throw new errors_1.ValidationError('Search query is required');
            }
            const filters = {
                category: req.query.category,
                level: req.query.level,
                author: req.query.author,
                dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
                dateTo: req.query.dateTo ? new Date(req.query.dateTo) : undefined
            };
            const options = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                sortBy: req.query.sortBy || 'relevance',
                sortOrder: req.query.sortOrder || 'desc'
            };
            const results = await searchService_1.SearchService.searchCourses(query, filters, options);
            res.json({
                success: true,
                data: results,
                message: `Found ${results.results.length} courses for "${query}"`
            });
        }
        catch (error) {
            logger_1.logger.error('Course search failed', {
                query: req.query.q,
                error,
                userId: req.user?.userId
            });
            res.status(500).json({
                success: false,
                error: {
                    message: 'Course search failed',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'COURSE_SEARCH_ERROR'
                }
            });
        }
    }
    static async searchPosts(req, res) {
        try {
            const { q: query } = req.query;
            if (!query || typeof query !== 'string') {
                throw new errors_1.ValidationError('Search query is required');
            }
            const filters = {
                author: req.query.author,
                dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
                dateTo: req.query.dateTo ? new Date(req.query.dateTo) : undefined
            };
            const options = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                sortBy: req.query.sortBy || 'relevance',
                sortOrder: req.query.sortOrder || 'desc'
            };
            const results = await searchService_1.SearchService.searchPosts(query, filters, options);
            res.json({
                success: true,
                data: results,
                message: `Found ${results.results.length} posts for "${query}"`
            });
        }
        catch (error) {
            logger_1.logger.error('Post search failed', {
                query: req.query.q,
                error,
                userId: req.user?.userId
            });
            res.status(500).json({
                success: false,
                error: {
                    message: 'Post search failed',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'POST_SEARCH_ERROR'
                }
            });
        }
    }
    static async searchTests(req, res) {
        try {
            const { q: query } = req.query;
            if (!query || typeof query !== 'string') {
                throw new errors_1.ValidationError('Search query is required');
            }
            const filters = {
                category: req.query.category,
                level: req.query.level,
                author: req.query.author
            };
            const options = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                sortBy: req.query.sortBy || 'relevance',
                sortOrder: req.query.sortOrder || 'desc'
            };
            const results = await searchService_1.SearchService.searchTests(query, filters, options);
            res.json({
                success: true,
                data: results,
                message: `Found ${results.results.length} tests for "${query}"`
            });
        }
        catch (error) {
            logger_1.logger.error('Test search failed', {
                query: req.query.q,
                error,
                userId: req.user?.userId
            });
            res.status(500).json({
                success: false,
                error: {
                    message: 'Test search failed',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'TEST_SEARCH_ERROR'
                }
            });
        }
    }
    static async searchUsers(req, res) {
        try {
            const { q: query } = req.query;
            if (!query || typeof query !== 'string') {
                throw new errors_1.ValidationError('Search query is required');
            }
            const filters = {};
            const options = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                sortBy: 'date',
                sortOrder: 'desc'
            };
            const results = await searchService_1.SearchService.searchUsers(query, filters, options);
            res.json({
                success: true,
                data: results,
                message: `Found ${results.results.length} users for "${query}"`
            });
        }
        catch (error) {
            logger_1.logger.error('User search failed', {
                query: req.query.q,
                error,
                userId: req.user?.userId
            });
            res.status(500).json({
                success: false,
                error: {
                    message: 'User search failed',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'USER_SEARCH_ERROR'
                }
            });
        }
    }
    static async getSearchSuggestions(req, res) {
        try {
            const { q: query } = req.query;
            if (!query || typeof query !== 'string') {
                res.json({
                    success: true,
                    data: { suggestions: [] },
                    message: 'No query provided'
                });
                return;
            }
            if (query.length < 2) {
                res.json({
                    success: true,
                    data: { suggestions: [] },
                    message: 'Query too short'
                });
                return;
            }
            const searchResults = await searchService_1.SearchService.globalSearch(query, {}, { limit: 5 });
            const suggestions = searchResults.suggestions || [];
            res.json({
                success: true,
                data: { suggestions },
                message: `Found ${suggestions.length} suggestions for "${query}"`
            });
        }
        catch (error) {
            logger_1.logger.error('Search suggestions failed', {
                query: req.query.q,
                error,
                userId: req.user?.userId
            });
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to get search suggestions',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'SUGGESTIONS_ERROR'
                }
            });
        }
    }
    static async getSearchFacets(req, res) {
        try {
            const { q: query } = req.query;
            if (!query || typeof query !== 'string') {
                throw new errors_1.ValidationError('Search query is required for facets');
            }
            const searchResults = await searchService_1.SearchService.globalSearch(query, {}, { limit: 1 });
            res.json({
                success: true,
                data: { facets: searchResults.facets },
                message: 'Search facets retrieved successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Search facets failed', {
                query: req.query.q,
                error,
                userId: req.user?.userId
            });
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to get search facets',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'FACETS_ERROR'
                }
            });
        }
    }
}
exports.SearchController = SearchController;
//# sourceMappingURL=searchController.js.map