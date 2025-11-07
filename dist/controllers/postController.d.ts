import { Request, Response } from 'express';
export declare class PostController {
    static getAllPosts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getPostById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createPost: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updatePost: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deletePost: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static toggleLike: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static addComment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getComments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static sharePost: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getPostAnalytics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserPosts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getTrendingPosts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static searchPosts: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=postController.d.ts.map