import { Request, Response } from 'express';
export declare class AgoraController {
    static generateRTCToken(req: Request, res: Response): Promise<void>;
    static generateRTMToken(req: Request, res: Response): Promise<void>;
    static startRecording(req: Request, res: Response): Promise<void>;
    static stopRecording(req: Request, res: Response): Promise<void>;
    static getRecordingStatus(req: Request, res: Response): Promise<void>;
    static getConfig(req: Request, res: Response): Promise<void>;
    static healthCheck(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=agoraController.d.ts.map