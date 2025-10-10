import { Request, Response } from 'express';
export declare class CommentController {
    static getPostComments(req: Request, res: Response): Promise<void>;
    static createComment(req: Request, res: Response): Promise<void>;
    static updateComment(req: Request, res: Response): Promise<void>;
    static deleteComment(req: Request, res: Response): Promise<void>;
    static toggleCommentLike(req: Request, res: Response): Promise<void>;
    static getCommentById(req: Request, res: Response): Promise<void>;
}
export declare class SocialController {
    static togglePostLike(req: Request, res: Response): Promise<void>;
    static sharePost(req: Request, res: Response): Promise<void>;
    static getPostEngagement(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=commentController.d.ts.map