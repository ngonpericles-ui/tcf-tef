import multer from 'multer';
export interface UploadedFile {
    id: string;
    originalName: string;
    filename: string;
    mimetype: string;
    size: number;
    path: string;
    url: string;
    uploadedBy: string;
    uploadedAt: Date;
    category: 'PROFILE_IMAGE' | 'COURSE_MATERIAL' | 'POST_MEDIA' | 'DOCUMENT' | 'OTHER';
    metadata?: {
        width?: number;
        height?: number;
        duration?: number;
        pages?: number;
    };
}
export interface FileUploadOptions {
    category: 'PROFILE_IMAGE' | 'COURSE_MATERIAL' | 'POST_MEDIA' | 'DOCUMENT' | 'OTHER';
    maxSize?: number;
    allowedTypes?: string[];
    resize?: {
        width: number;
        height: number;
        quality?: number;
    };
}
export declare class FileUploadService {
    private static readonly UPLOAD_DIR;
    private static readonly MAX_FILE_SIZE;
    private static readonly ALLOWED_TYPES;
    static initializeDirectories(): Promise<void>;
    static configureMulter(options?: FileUploadOptions): multer.Multer;
    static processUploadedFile(file: Express.Multer.File, userId: string, options: FileUploadOptions): Promise<UploadedFile>;
    static getFileById(fileId: string, userId?: string): Promise<UploadedFile>;
    static getUserFiles(userId: string, category?: string, page?: number, limit?: number): Promise<{
        files: UploadedFile[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static deleteFile(fileId: string, userId: string): Promise<void>;
    static updateProfileImage(userId: string, fileId: string): Promise<void>;
    static getFileStatistics(userId?: string): Promise<{
        totalFiles: number;
        totalSize: number;
        byCategory: Array<{
            category: string;
            count: number;
            size: number;
        }>;
        byMimetype: Array<{
            mimetype: string;
            count: number;
            size: number;
        }>;
    }>;
    static uploadToCloudinary(file: Express.Multer.File, userId: string, options: FileUploadOptions): Promise<UploadedFile>;
    static deleteFromCloudinary(fileId: string, userId: string): Promise<void>;
}
//# sourceMappingURL=fileUploadService.d.ts.map