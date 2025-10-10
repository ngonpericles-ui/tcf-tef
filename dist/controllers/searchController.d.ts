import { Request, Response } from 'express';
export declare class SearchController {
    static globalSearch(req: Request, res: Response): Promise<void>;
    static searchCourses(req: Request, res: Response): Promise<void>;
    static searchPosts(req: Request, res: Response): Promise<void>;
    static searchTests(req: Request, res: Response): Promise<void>;
    static searchUsers(req: Request, res: Response): Promise<void>;
    static getSearchSuggestions(req: Request, res: Response): Promise<void>;
    static getSearchFacets(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=searchController.d.ts.map