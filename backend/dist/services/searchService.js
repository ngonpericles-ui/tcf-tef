"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
class SearchService {
    static async globalSearch(query, filters = {}, options = {}) {
        try {
            const { page = 1, limit = 20, sortBy = 'relevance', sortOrder = 'desc' } = options;
            const skip = (page - 1) * limit;
            logger_1.logger.info('Global search initiated', { query, filters, options });
            let results = [];
            let total = 0;
            switch (filters.contentType) {
                case 'COURSES':
                    const courseResults = await this.searchCourses(query, filters, { page, limit, sortBy, sortOrder });
                    results = courseResults.results;
                    total = courseResults.pagination.total;
                    break;
                case 'POSTS':
                    const postResults = await this.searchPosts(query, filters, { page, limit, sortBy, sortOrder });
                    results = postResults.results;
                    total = postResults.pagination.total;
                    break;
                case 'TESTS':
                    const testResults = await this.searchTests(query, filters, { page, limit, sortBy, sortOrder });
                    results = testResults.results;
                    total = testResults.pagination.total;
                    break;
                case 'USERS':
                    const userResults = await this.searchUsers(query, filters, { page, limit, sortBy, sortOrder });
                    results = userResults.results;
                    total = userResults.pagination.total;
                    break;
                default:
                    const allResults = await this.searchAllContent(query, filters, options);
                    results = allResults.results;
                    total = allResults.pagination.total;
            }
            const suggestions = await this.generateSuggestions(query);
            const facets = await this.generateFacets(query, filters);
            logger_1.logger.info('Global search completed', {
                query,
                resultsCount: results.length,
                total
            });
            return {
                results,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                filters,
                suggestions,
                facets
            };
        }
        catch (error) {
            logger_1.logger.error('Global search failed', { query, filters, error });
            throw error;
        }
    }
    static async searchCourses(query, filters = {}, options = {}) {
        try {
            const { page = 1, limit = 20, sortBy = 'relevance', sortOrder = 'desc' } = options;
            const skip = (page - 1) * limit;
            const whereClause = {
                isPublished: true,
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { tags: { hasSome: query.split(' ') } }
                ]
            };
            if (filters.category) {
                whereClause.category = filters.category;
            }
            if (filters.level) {
                whereClause.level = filters.level;
            }
            if (filters.author) {
                whereClause.createdBy = filters.author;
            }
            if (filters.dateFrom || filters.dateTo) {
                whereClause.createdAt = {};
                if (filters.dateFrom)
                    whereClause.createdAt.gte = filters.dateFrom;
                if (filters.dateTo)
                    whereClause.createdAt.lte = filters.dateTo;
            }
            let orderBy = { createdAt: 'desc' };
            switch (sortBy) {
                case 'title':
                    orderBy = { title: sortOrder };
                    break;
                case 'date':
                    orderBy = { createdAt: sortOrder };
                    break;
                case 'popularity':
                    orderBy = { enrollments: { _count: sortOrder } };
                    break;
            }
            const [courses, total] = await Promise.all([
                connection_1.prisma.course.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy,
                    include: {
                        createdBy: {
                            select: {
                                firstName: true,
                                lastName: true,
                                role: true
                            }
                        },
                        _count: {
                            select: {
                                enrollments: true
                            }
                        }
                    }
                }),
                connection_1.prisma.course.count({ where: whereClause })
            ]);
            const results = courses.map(course => ({
                id: course.id,
                type: 'course',
                title: course.title,
                description: course.description,
                author: course.createdBy ? {
                    firstName: course.createdBy.firstName,
                    lastName: course.createdBy.lastName,
                    role: course.createdBy.role
                } : undefined,
                category: course.category,
                level: course.level,
                tags: course.tags,
                createdAt: course.createdAt,
                updatedAt: course.updatedAt,
                metadata: {
                    enrollmentCount: course._count.enrollments,
                    lessonCount: course._count?.lesson_items || 0,
                    duration: course.duration,
                    price: course.price
                }
            }));
            return {
                results,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                filters
            };
        }
        catch (error) {
            logger_1.logger.error('Course search failed', { query, filters, error });
            throw error;
        }
    }
    static async searchPosts(query, filters = {}, options = {}) {
        try {
            const { page = 1, limit = 20, sortBy = 'relevance', sortOrder = 'desc' } = options;
            const skip = (page - 1) * limit;
            const whereClause = {
                status: 'PUBLISHED',
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { content: { contains: query, mode: 'insensitive' } },
                    { excerpt: { contains: query, mode: 'insensitive' } }
                ]
            };
            if (filters.author) {
                whereClause.authorId = filters.author;
            }
            if (filters.dateFrom || filters.dateTo) {
                whereClause.createdAt = {};
                if (filters.dateFrom)
                    whereClause.createdAt.gte = filters.dateFrom;
                if (filters.dateTo)
                    whereClause.createdAt.lte = filters.dateTo;
            }
            let orderBy = { createdAt: 'desc' };
            switch (sortBy) {
                case 'title':
                    orderBy = { title: sortOrder };
                    break;
                case 'date':
                    orderBy = { createdAt: sortOrder };
                    break;
                case 'popularity':
                    orderBy = { likes: { _count: sortOrder } };
                    break;
            }
            const [posts, total] = await Promise.all([
                connection_1.prisma.post.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy,
                    include: {
                        author: {
                            select: {
                                firstName: true,
                                lastName: true,
                                role: true
                            }
                        },
                        _count: {
                            select: {
                                likes: true,
                                comments: true,
                                shares: true
                            }
                        }
                    }
                }),
                connection_1.prisma.post.count({ where: whereClause })
            ]);
            const results = posts.map(post => ({
                id: post.id,
                type: 'post',
                title: post.title,
                description: post.content,
                excerpt: post.excerpt,
                author: {
                    firstName: post.author.firstName,
                    lastName: post.author.lastName,
                    role: post.author.role
                },
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                metadata: {
                    likeCount: post._count.likes,
                    commentCount: post._count.comments,
                    shareCount: post._count.shares,
                    visibility: post.visibility,
                    status: post.status
                }
            }));
            return {
                results,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                filters
            };
        }
        catch (error) {
            logger_1.logger.error('Post search failed', { query, filters, error });
            throw error;
        }
    }
    static async searchTests(query, filters = {}, options = {}) {
        try {
            const { page = 1, limit = 20, sortBy = 'relevance', sortOrder = 'desc' } = options;
            const skip = (page - 1) * limit;
            const whereClause = {
                isPublished: true,
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                ]
            };
            if (filters.category) {
                whereClause.category = filters.category;
            }
            if (filters.level) {
                whereClause.level = filters.level;
            }
            const [tests, total] = await Promise.all([
                connection_1.prisma.test.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy: { createdAt: sortOrder },
                    include: {
                        createdBy: {
                            select: {
                                firstName: true,
                                lastName: true,
                                role: true
                            }
                        },
                        _count: {
                            select: {
                                attempts: true,
                                questions: true
                            }
                        }
                    }
                }),
                connection_1.prisma.test.count({ where: whereClause })
            ]);
            const results = tests.map(test => ({
                id: test.id,
                type: 'test',
                title: test.title,
                description: test.description,
                author: test.createdBy ? {
                    firstName: test.createdBy.firstName,
                    lastName: test.createdBy.lastName,
                    role: test.createdBy.role
                } : undefined,
                category: test.category,
                level: test.level,
                createdAt: test.createdAt,
                updatedAt: test.updatedAt,
                metadata: {
                    attemptCount: test._count.attempts,
                    questionCount: test._count.questions,
                    duration: test.duration,
                    type: test.type
                }
            }));
            return {
                results,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                filters
            };
        }
        catch (error) {
            logger_1.logger.error('Test search failed', { query, filters, error });
            throw error;
        }
    }
    static async searchUsers(query, filters = {}, options = {}) {
        try {
            const { page = 1, limit = 20 } = options;
            const skip = (page - 1) * limit;
            const whereClause = {
                status: 'ACTIVE',
                OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ]
            };
            const [users, total] = await Promise.all([
                connection_1.prisma.user.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        profileImage: true,
                        bio: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }),
                connection_1.prisma.user.count({ where: whereClause })
            ]);
            const results = users.map(user => ({
                id: user.id,
                type: 'user',
                title: `${user.firstName} ${user.lastName}`,
                description: user.bio || '',
                author: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                },
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                metadata: {
                    email: user.email,
                    profileImage: user.profileImage,
                    role: user.role
                }
            }));
            return {
                results,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                filters
            };
        }
        catch (error) {
            logger_1.logger.error('User search failed', { query, filters, error });
            throw error;
        }
    }
    static async searchAllContent(query, filters, options) {
        const { page = 1, limit = 20 } = options;
        const itemsPerType = Math.ceil(limit / 4);
        const [courseResults, postResults, testResults, userResults] = await Promise.all([
            this.searchCourses(query, filters, { ...options, limit: itemsPerType }),
            this.searchPosts(query, filters, { ...options, limit: itemsPerType }),
            this.searchTests(query, filters, { ...options, limit: itemsPerType }),
            this.searchUsers(query, filters, { ...options, limit: itemsPerType })
        ]);
        const allResults = [
            ...courseResults.results,
            ...postResults.results,
            ...testResults.results,
            ...userResults.results
        ];
        allResults.forEach(result => {
            const titleMatch = result.title.toLowerCase().includes(query.toLowerCase());
            const descriptionMatch = result.description?.toLowerCase().includes(query.toLowerCase());
            result.relevanceScore = (titleMatch ? 2 : 0) + (descriptionMatch ? 1 : 0);
        });
        allResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        const skip = (page - 1) * limit;
        const paginatedResults = allResults.slice(skip, skip + limit);
        const totalResults = courseResults.pagination.total +
            postResults.pagination.total +
            testResults.pagination.total +
            userResults.pagination.total;
        return {
            results: paginatedResults,
            pagination: {
                page,
                limit,
                total: totalResults,
                totalPages: Math.ceil(totalResults / limit)
            },
            filters
        };
    }
    static async generateSuggestions(query) {
        try {
            const suggestions = [];
            const popularCourses = await connection_1.prisma.course.findMany({
                where: { isPublished: true },
                select: { title: true },
                orderBy: { enrollments: { _count: 'desc' } },
                take: 5
            });
            const popularPosts = await connection_1.prisma.post.findMany({
                where: { status: 'PUBLISHED' },
                select: { title: true },
                orderBy: { likes: { _count: 'desc' } },
                take: 5
            });
            const allTitles = [
                ...popularCourses.map(c => c.title),
                ...popularPosts.map(p => p.title)
            ];
            allTitles.forEach(title => {
                const words = title.toLowerCase().split(' ');
                words.forEach(word => {
                    if (word.length > 3 && word.includes(query.toLowerCase()) && !suggestions.includes(word)) {
                        suggestions.push(word);
                    }
                });
            });
            return suggestions.slice(0, 5);
        }
        catch (error) {
            logger_1.logger.error('Failed to generate suggestions', { query, error });
            return [];
        }
    }
    static async generateFacets(query, filters) {
        try {
            const [categories, levels, authors, contentTypes] = await Promise.all([
                connection_1.prisma.course.groupBy({
                    by: ['category'],
                    where: { isPublished: true },
                    _count: { category: true }
                }),
                connection_1.prisma.course.groupBy({
                    by: ['level'],
                    where: { isPublished: true },
                    _count: { level: true }
                }),
                connection_1.prisma.user.findMany({
                    where: {
                        OR: [
                            { role: { not: 'STUDENT' } }
                        ]
                    },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    },
                    take: 10
                }),
                Promise.all([
                    connection_1.prisma.course.count({ where: { isPublished: true } }),
                    connection_1.prisma.post.count({ where: { status: 'PUBLISHED' } }),
                    connection_1.prisma.test.count({ where: { isPublished: true } }),
                    connection_1.prisma.user.count({ where: { status: 'ACTIVE' } })
                ])
            ]);
            return {
                categories: categories.map(c => ({ name: c.category, count: c._count.category })),
                levels: levels.map(l => ({ name: l.level, count: l._count.level })),
                authors: authors.map(a => ({
                    name: `${a.firstName} ${a.lastName}`,
                    count: 1
                })),
                contentTypes: [
                    { name: 'COURSES', count: contentTypes[0] },
                    { name: 'POSTS', count: contentTypes[1] },
                    { name: 'TESTS', count: contentTypes[2] },
                    { name: 'USERS', count: contentTypes[3] }
                ]
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate facets', { query, filters, error });
            return {
                categories: [],
                levels: [],
                authors: [],
                contentTypes: []
            };
        }
    }
}
exports.SearchService = SearchService;
//# sourceMappingURL=searchService.js.map