import { Request, Response } from 'express';
export declare class TestController {
    static createTest: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getTestById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getAllTests: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static startTest: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static submitTest: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserTestAttempts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserCreatedTests: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getTestAttemptDetails: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static addQuestionsToTest: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getTestQuestions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateTestQuestion: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteTestQuestion: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static uploadTestFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static healthCheck: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=testController.d.ts.map