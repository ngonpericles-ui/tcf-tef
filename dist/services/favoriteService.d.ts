import { ContentType } from '@prisma/client';
interface PaginationOptions {
    page: number;
    limit: number;
}
interface FavoriteFilters {
    contentType?: string;
    folder?: string;
    search?: string;
}
interface AddFavoriteData {
    contentId: string;
    contentType: ContentType;
    folder?: string;
    tags?: string[];
    notes?: string;
}
interface FolderData {
    name: string;
    description?: string;
    color?: string;
}
export declare class FavoriteService {
    static getFavorites(userId: string, pagination: PaginationOptions, filters: FavoriteFilters): Promise<{
        favorites: {
            id: string;
            createdAt: Date;
            userId: string;
            tags: string[];
            contentId: string;
            contentType: import(".prisma/client").$Enums.ContentType;
            notes: string | null;
            folder: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static addToFavorites(userId: string, data: AddFavoriteData): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        tags: string[];
        contentId: string;
        contentType: import(".prisma/client").$Enums.ContentType;
        notes: string | null;
        folder: string | null;
    }>;
    static removeFromFavorites(favoriteId: string, userId: string): Promise<void>;
    static updateFavorite(favoriteId: string, userId: string, updateData: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        tags: string[];
        contentId: string;
        contentType: import(".prisma/client").$Enums.ContentType;
        notes: string | null;
        folder: string | null;
    }>;
    static getFolders(userId: string): Promise<{
        name: string;
        count: number;
    }[]>;
    static createFolder(userId: string, data: FolderData): Promise<{
        id: string;
        name: string;
        description: string;
        color: string;
        userId: string;
        createdAt: Date;
    }>;
    static updateFolder(folderId: string, userId: string, updateData: any): Promise<any>;
    static deleteFolder(folderId: string, userId: string): Promise<void>;
    static checkFavorite(userId: string, contentId: string, contentType: string): Promise<boolean>;
    static getFavoriteStats(userId: string): Promise<{
        totalFavorites: number;
        favoritesByType: {
            type: import(".prisma/client").$Enums.ContentType;
            count: number;
        }[];
        favoritesByFolder: {
            folder: string;
            count: number;
        }[];
        recentFavorites: {
            id: string;
            createdAt: Date;
            contentType: import(".prisma/client").$Enums.ContentType;
        }[];
    }>;
    static bulkOperation(userId: string, operation: string, favoriteIds: string[], targetFolder?: string): Promise<{
        moved: number;
        deleted?: undefined;
        updated?: undefined;
    } | {
        deleted: number;
        moved?: undefined;
        updated?: undefined;
    } | {
        updated: number;
        moved?: undefined;
        deleted?: undefined;
    }>;
    private static verifyContentExists;
}
export {};
//# sourceMappingURL=favoriteService.d.ts.map