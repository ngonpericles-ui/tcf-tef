import { Request, Response } from 'express';
export declare class FileUploadController {
    static uploadProfileImage(req: Request, res: Response): Promise<void>;
    static uploadCourseMaterial(req: Request, res: Response): Promise<void>;
    static uploadPostMedia(req: Request, res: Response): Promise<void>;
    static uploadDocument(req: Request, res: Response): Promise<void>;
    static getFileById(req: Request, res: Response): Promise<void>;
    static downloadFile(req: Request, res: Response): Promise<void>;
    static getUserFiles(req: Request, res: Response): Promise<void>;
    static deleteFile(req: Request, res: Response): Promise<void>;
    static getFileStatistics(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=fileUploadController.d.ts.map