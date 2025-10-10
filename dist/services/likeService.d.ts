export declare enum LikeType {
    POST = "POST",
    COMMENT = "COMMENT"
}
export declare class LikeService {
    likeContent(userId: string, contentId: string, contentType: LikeType): Promise<{
        success: boolean;
        liked: boolean;
        likeCount: number;
    }>;
    getLikeStatus(userId: string, contentId: string, contentType: LikeType): Promise<{
        liked: boolean;
        likeCount: number;
    }>;
    getContentLikes(contentId: string, contentType: LikeType, page?: number, limit?: number): Promise<{
        likes: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                profileImage: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            contentId: string;
            contentType: import(".prisma/client").$Enums.LikeType;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getUserLikes(userId: string, contentType?: LikeType, page?: number, limit?: number): Promise<{
        likes: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                profileImage: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            contentId: string;
            contentType: import(".prisma/client").$Enums.LikeType;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getLikeStats(contentId: string, contentType: LikeType): Promise<{
        totalLikes: number;
        recentLikes: number;
        engagement: string;
    }>;
}
declare const _default: LikeService;
export default _default;
//# sourceMappingURL=likeService.d.ts.map