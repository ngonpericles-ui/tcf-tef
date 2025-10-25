export interface CloudinaryUploadOptions {
    folder?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    public_id?: string;
    transformation?: any[];
    tags?: string[];
}
export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    url: string;
    format: string;
    resource_type: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number;
    created_at: string;
}
export declare class CloudinaryService {
    static uploadFile(filePath: string, options?: CloudinaryUploadOptions): Promise<CloudinaryUploadResult>;
    static uploadBuffer(buffer: Buffer, options?: CloudinaryUploadOptions): Promise<CloudinaryUploadResult>;
    static deleteFile(publicId: string, resourceType?: string): Promise<void>;
    static getFileDetails(publicId: string, resourceType?: string): Promise<any>;
    static generateTransformationUrl(publicId: string, transformations?: any[], resourceType?: string): string;
    static getOptimizedImageUrl(publicId: string, width?: number, height?: number, quality?: string): string;
    static getVideoThumbnailUrl(publicId: string, width?: number, height?: number): string;
    static testConnection(): Promise<boolean>;
}
//# sourceMappingURL=cloudinaryService.d.ts.map