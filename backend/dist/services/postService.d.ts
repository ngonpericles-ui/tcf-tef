interface PaginationOptions {
    page: number;
    limit: number;
}
interface PostFilters {
    category?: string;
    level?: string;
    status?: string;
    search?: string;
    authorId?: string;
}
interface SortOptions {
    sortBy: string;
    sortOrder: string;
}
interface UserPostFilters {
    status?: string;
}
interface SearchFilters {
    category?: string;
    level?: string;
    author?: string;
}
export declare class PostService {
    static getAllPosts(pagination: PaginationOptions, filters: PostFilters, sort: SortOptions): Promise<{
        posts: ({
            _count: {
                comments: number;
                likes: number;
                shares: number;
            };
            author: {
                id: string;
                firstName: string;
                lastName: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            level: import(".prisma/client").$Enums.CourseLevel | null;
            id: string;
            status: import(".prisma/client").$Enums.PostStatus;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            category: string | null;
            tags: string[];
            scheduledAt: Date | null;
            content: string;
            excerpt: string | null;
            media: string | null;
            visibility: import(".prisma/client").$Enums.PostVisibility;
            authorId: string;
            objectives: string[];
            keyPoints: string[];
            targetTier: import(".prisma/client").$Enums.SubscriptionTier;
            publishedAt: Date | null;
            viewCount: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static getPostById(postId: string, userId?: string): Promise<{
        userLiked: boolean;
        comments: ({
            _count: {
                replies: number;
            };
            author: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            authorId: string;
            postId: string;
            parentId: string | null;
        })[];
        _count: {
            comments: number;
            likes: number;
            shares: number;
        };
        author: {
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        level: import(".prisma/client").$Enums.CourseLevel | null;
        id: string;
        status: import(".prisma/client").$Enums.PostStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        category: string | null;
        tags: string[];
        scheduledAt: Date | null;
        content: string;
        excerpt: string | null;
        media: string | null;
        visibility: import(".prisma/client").$Enums.PostVisibility;
        authorId: string;
        objectives: string[];
        keyPoints: string[];
        targetTier: import(".prisma/client").$Enums.SubscriptionTier;
        publishedAt: Date | null;
        viewCount: number;
    }>;
    static createPost(authorId: string, postData: any): Promise<{
        author: {
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        level: import(".prisma/client").$Enums.CourseLevel | null;
        id: string;
        status: import(".prisma/client").$Enums.PostStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        category: string | null;
        tags: string[];
        scheduledAt: Date | null;
        content: string;
        excerpt: string | null;
        media: string | null;
        visibility: import(".prisma/client").$Enums.PostVisibility;
        authorId: string;
        objectives: string[];
        keyPoints: string[];
        targetTier: import(".prisma/client").$Enums.SubscriptionTier;
        publishedAt: Date | null;
        viewCount: number;
    }>;
    static updatePost(postId: string, userId: string, updateData: any): Promise<{
        author: {
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        level: import(".prisma/client").$Enums.CourseLevel | null;
        id: string;
        status: import(".prisma/client").$Enums.PostStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        category: string | null;
        tags: string[];
        scheduledAt: Date | null;
        content: string;
        excerpt: string | null;
        media: string | null;
        visibility: import(".prisma/client").$Enums.PostVisibility;
        authorId: string;
        objectives: string[];
        keyPoints: string[];
        targetTier: import(".prisma/client").$Enums.SubscriptionTier;
        publishedAt: Date | null;
        viewCount: number;
    }>;
    static deletePost(postId: string, userId: string): Promise<void>;
    static toggleLike(postId: string, userId: string): Promise<{
        liked: boolean;
        likeCount: number;
    }>;
    static addComment(postId: string, userId: string, content: string, parentId?: string): Promise<{
        _count: {
            replies: number;
        };
        author: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        postId: string;
        parentId: string | null;
    }>;
    static getComments(postId: string, pagination: PaginationOptions): Promise<{
        comments: ({
            _count: {
                replies: number;
            };
            author: {
                id: string;
                firstName: string;
                lastName: string;
            };
            replies: ({
                author: {
                    id: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                content: string;
                authorId: string;
                postId: string;
                parentId: string | null;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            authorId: string;
            postId: string;
            parentId: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static sharePost(postId: string, userId: string, platform?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        postId: string;
        platform: string | null;
    }>;
    static getPostAnalytics(postId: string, userId: string): Promise<{
        postId: string;
        views: number;
        likes: number;
        comments: number;
        shares: number;
        engagement: number;
        engagementRate: number;
    }>;
    static getUserPosts(userId: string, pagination: PaginationOptions, filters: UserPostFilters): Promise<{
        posts: ({
            _count: {
                comments: number;
                likes: number;
                shares: number;
            };
        } & {
            level: import(".prisma/client").$Enums.CourseLevel | null;
            id: string;
            status: import(".prisma/client").$Enums.PostStatus;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            category: string | null;
            tags: string[];
            scheduledAt: Date | null;
            content: string;
            excerpt: string | null;
            media: string | null;
            visibility: import(".prisma/client").$Enums.PostVisibility;
            authorId: string;
            objectives: string[];
            keyPoints: string[];
            targetTier: import(".prisma/client").$Enums.SubscriptionTier;
            publishedAt: Date | null;
            viewCount: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static getTrendingPosts(limit: number, timeframe: string): Promise<{
        engagementScore: number;
        _count: {
            comments: number;
            likes: number;
            shares: number;
        };
        author: {
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        level: import(".prisma/client").$Enums.CourseLevel | null;
        id: string;
        status: import(".prisma/client").$Enums.PostStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        category: string | null;
        tags: string[];
        scheduledAt: Date | null;
        content: string;
        excerpt: string | null;
        media: string | null;
        visibility: import(".prisma/client").$Enums.PostVisibility;
        authorId: string;
        objectives: string[];
        keyPoints: string[];
        targetTier: import(".prisma/client").$Enums.SubscriptionTier;
        publishedAt: Date | null;
        viewCount: number;
    }[]>;
    static searchPosts(query: string, pagination: PaginationOptions, filters: SearchFilters): Promise<{
        posts: ({
            _count: {
                comments: number;
                likes: number;
                shares: number;
            };
            author: {
                id: string;
                firstName: string;
                lastName: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            level: import(".prisma/client").$Enums.CourseLevel | null;
            id: string;
            status: import(".prisma/client").$Enums.PostStatus;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            category: string | null;
            tags: string[];
            scheduledAt: Date | null;
            content: string;
            excerpt: string | null;
            media: string | null;
            visibility: import(".prisma/client").$Enums.PostVisibility;
            authorId: string;
            objectives: string[];
            keyPoints: string[];
            targetTier: import(".prisma/client").$Enums.SubscriptionTier;
            publishedAt: Date | null;
            viewCount: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    private static getStartDate;
}
export {};
//# sourceMappingURL=postService.d.ts.map