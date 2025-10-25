import { Request, Response } from 'express';
export declare class FavoriteController {
    static getFavorites: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static addToFavorites: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static removeFromFavorites: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateFavorite: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getFolders: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createFolder: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateFolder: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteFolder: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static checkFavorite: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getFavoriteStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static bulkOperation: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=favoriteController.d.ts.map