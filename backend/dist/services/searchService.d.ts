export interface SearchFilters {
    contentType?: 'ALL' | 'COURSES' | 'POSTS' | 'TESTS' | 'USERS';
    category?: string;
    level?: string;
    author?: string;
    dateFrom?: Date;
    dateTo?: Date;
    tags?: string[];
}
export interface SearchOptions {
    page?: number;
    limit?: number;
    sortBy?: 'relevance' | 'date' | 'popularity' | 'title';
    sortOrder?: 'asc' | 'desc';
}
export interface SearchResult {
    id: string;
    type: 'course' | 'post' | 'test' | 'user';
    title: string;
    description?: string;
    excerpt?: string;
    author?: {
        firstName: string;
        lastName: string;
        role: string;
    };
    category?: string;
    level?: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
    relevanceScore?: number;
    metadata?: any;
}
export interface SearchResponse {
    results: SearchResult[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    filters: SearchFilters;
    suggestions?: string[];
    facets?: {
        categories: {
            name: string;
            count: number;
        }[];
        levels: {
            name: string;
            count: number;
        }[];
        authors: {
            name: string;
            count: number;
        }[];
        contentTypes: {
            name: string;
            count: number;
        }[];
    };
}
export declare class SearchService {
    static globalSearch(query: string, filters?: SearchFilters, options?: SearchOptions): Promise<SearchResponse>;
    static searchCourses(query: string, filters?: SearchFilters, options?: SearchOptions): Promise<SearchResponse>;
    static searchPosts(query: string, filters?: SearchFilters, options?: SearchOptions): Promise<SearchResponse>;
    static searchTests(query: string, filters?: SearchFilters, options?: SearchOptions): Promise<SearchResponse>;
    static searchUsers(query: string, filters?: SearchFilters, options?: SearchOptions): Promise<SearchResponse>;
    private static searchAllContent;
    private static generateSuggestions;
    private static generateFacets;
}
//# sourceMappingURL=searchService.d.ts.map