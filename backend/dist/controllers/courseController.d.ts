import { Request, Response } from 'express';
export declare class CourseController {
    static createCourse: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getCourseById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getAllCourses: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateCourse: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteCourse: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static enrollInCourse: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static unenrollFromCourse: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserEnrolledCourses: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserCreatedCourses: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getCourseStatistics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static healthCheck: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=courseController.d.ts.map