import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

export class CloudinaryService {
  /**
   * Upload file to Cloudinary
   */
  static async uploadFile(
    filePath: string,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      const uploadOptions = {
        resource_type: options.resource_type || 'auto',
        folder: options.folder || 'tcf-tef-platform',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        ...options,
      };

      logger.info('Uploading file to Cloudinary', { 
        filePath, 
        options: uploadOptions 
      });

      const result = await cloudinary.uploader.upload(filePath, uploadOptions);

      logger.info('File uploaded to Cloudinary successfully', {
        public_id: result.public_id,
        secure_url: result.secure_url,
        bytes: result.bytes,
      });

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
        created_at: result.created_at,
      };
    } catch (error) {
      logger.error('Failed to upload file to Cloudinary', { error, filePath });
      throw new ValidationError(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload file buffer to Cloudinary
   */
  static async uploadBuffer(
    buffer: Buffer,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      const uploadOptions = {
        resource_type: options.resource_type || 'auto',
        folder: options.folder || 'tcf-tef-platform',
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        ...options,
      };

      logger.info('Uploading buffer to Cloudinary', { 
        bufferSize: buffer.length,
        options: uploadOptions 
      });

      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              logger.error('Failed to upload buffer to Cloudinary', { error });
              reject(new ValidationError(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`));
            } else {
              logger.info('Buffer uploaded to Cloudinary successfully', {
                public_id: result.public_id,
                secure_url: result.secure_url,
                bytes: result.bytes,
              });

              resolve({
                public_id: result.public_id,
                secure_url: result.secure_url,
                url: result.url,
                format: result.format,
                resource_type: result.resource_type,
                bytes: result.bytes,
                width: result.width,
                height: result.height,
                duration: result.duration,
                created_at: result.created_at,
              });
            }
          }
        ).end(buffer);
      });
    } catch (error) {
      logger.error('Failed to upload buffer to Cloudinary', { error });
      throw new ValidationError(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file from Cloudinary
   */
  static async deleteFile(publicId: string, resourceType: string = 'image'): Promise<void> {
    try {
      logger.info('Deleting file from Cloudinary', { publicId, resourceType });

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      if (result.result !== 'ok') {
        throw new Error(`Failed to delete file: ${result.result}`);
      }

      logger.info('File deleted from Cloudinary successfully', { publicId });
    } catch (error) {
      logger.error('Failed to delete file from Cloudinary', { error, publicId });
      throw new ValidationError(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file details from Cloudinary
   */
  static async getFileDetails(publicId: string, resourceType: string = 'image'): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get file details from Cloudinary', { error, publicId });
      throw new ValidationError(`Failed to get file details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate transformation URL
   */
  static generateTransformationUrl(
    publicId: string,
    transformations: any[] = [],
    resourceType: string = 'image'
  ): string {
    try {
      return cloudinary.url(publicId, {
        resource_type: resourceType,
        transformation: transformations,
        secure: true,
      });
    } catch (error) {
      logger.error('Failed to generate transformation URL', { error, publicId });
      throw new ValidationError(`Failed to generate URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get optimized image URL
   */
  static getOptimizedImageUrl(
    publicId: string,
    width?: number,
    height?: number,
    quality: string = 'auto'
  ): string {
    const transformations = [];

    if (width || height) {
      transformations.push({
        width,
        height,
        crop: 'fill',
        gravity: 'auto',
      });
    }

    transformations.push({
      quality,
      fetch_format: 'auto',
    });

    return this.generateTransformationUrl(publicId, transformations);
  }

  /**
   * Get video thumbnail URL
   */
  static getVideoThumbnailUrl(publicId: string, width: number = 300, height: number = 200): string {
    return this.generateTransformationUrl(
      publicId,
      [
        {
          width,
          height,
          crop: 'fill',
          gravity: 'auto',
          start_offset: '10%',
        },
        {
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
      'video'
    );
  }

  /**
   * Test Cloudinary connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      await cloudinary.api.ping();
      logger.info('Cloudinary connection test successful');
      return true;
    } catch (error) {
      logger.error('Cloudinary connection test failed', { error });
      return false;
    }
  }
}
