import { Request, Response } from 'express';
export declare class CourseContentController {
    static createCourse(req: Request, res: Response): Promise<void>;
    static getCourses(req: Request, res: Response): Promise<void>;
    static getCourseById(req: Request, res: Response): Promise<void>;
    static updateCourse(req: Request, res: Response): Promise<void>;
    static deleteCourse(req: Request, res: Response): Promise<void>;
    static enrollInCourse(req: Request, res: Response): Promise<void>;
    static getUserEnrolledCourses(req: Request, res: Response): Promise<void>;
}
export declare class LessonController {
    static createLesson(req: Request, res: Response): Promise<void>;
    static markLessonCompleted(req: Request, res: Response): Promise<void>;
    static getCourseLessons(req: Request, res: Response): Promise<void>;
    static uploadCourseContent(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=courseContentController.d.ts.map