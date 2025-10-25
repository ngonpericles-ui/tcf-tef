export interface CreateCommentData {
    content: string;
    postId: string;
    parentId?: string;
}
export interface UpdateCommentData {
    content: string;
}
export interface CommentWithReplies {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
        profileImage?: string;
    };
    post: {
        id: string;
        title: string;
    };
    parent?: {
        id: string;
        author: {
            firstName: string;
            lastName: string;
        };
    };
    replies: CommentWithReplies[];
    _count: {
        replies: number;
    };
    isLiked?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
}
export declare class CommentService {
    static getPostComments(postId: string, userId?: string, page?: number, limit?: number): Promise<{
        comments: CommentWithReplies[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static createComment(data: CreateCommentData, userId: string): Promise<CommentWithReplies>;
    static updateComment(commentId: string, data: UpdateCommentData, userId: string): Promise<CommentWithReplies>;
    static deleteComment(commentId: string, userId: string): Promise<void>;
    static toggleCommentLike(commentId: string, userId: string): Promise<{
        isLiked: boolean;
        likeCount: number;
    }>;
    static getCommentById(commentId: string, userId?: string): Promise<CommentWithReplies>;
}
export declare class SocialInteractionService {
    static togglePostLike(postId: string, userId: string): Promise<{
        isLiked: boolean;
        likeCount: number;
    }>;
    static sharePost(postId: string, userId: string, platform?: string): Promise<{
        shareCount: number;
    }>;
    static getPostEngagement(postId: string, userId?: string): Promise<{
        likeCount: number;
        commentCount: number;
        shareCount: number;
        isLiked?: boolean;
        hasShared?: boolean;
    }>;
}
//# sourceMappingURL=commentService.d.ts.map