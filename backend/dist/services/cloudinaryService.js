"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const cloudinary_1 = require("cloudinary");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
function parseCloudinaryConfig() {
    let cloudName;
    let apiKey;
    let apiSecret;
    if (process.env.CLOUDINARY_URL) {
        try {
            const urlMatch = process.env.CLOUDINARY_URL.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
            if (urlMatch) {
                apiKey = urlMatch[1];
                apiSecret = urlMatch[2];
                cloudName = urlMatch[3];
                logger_1.logger.info('Cloudinary configuration parsed from CLOUDINARY_URL', { cloudName });
            }
            else {
                logger_1.logger.warn('CLOUDINARY_URL format is invalid, falling back to individual variables');
            }
        }
        catch (error) {
            logger_1.logger.warn('Failed to parse CLOUDINARY_URL, falling back to individual variables', { error });
        }
    }
    cloudName = cloudName || process.env.CLOUDINARY_CLOUD_NAME;
    apiKey = apiKey || process.env.CLOUDINARY_API_KEY;
    apiSecret = apiSecret || process.env.CLOUDINARY_API_SECRET;
    return { cloudName, apiKey, apiSecret };
}
const { cloudName, apiKey, apiSecret } = parseCloudinaryConfig();
cloudinary_1.v2.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});
class CloudinaryService {
    static isConfigured() {
        if (process.env.CLOUDINARY_URL) {
            try {
                const urlMatch = process.env.CLOUDINARY_URL.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
                if (urlMatch) {
                    return true;
                }
            }
            catch (error) {
            }
        }
        return !!(process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET);
    }
    static async uploadFile(filePath, options = {}) {
        if (!this.isConfigured()) {
            const missingVars = [];
            if (!process.env.CLOUDINARY_CLOUD_NAME)
                missingVars.push('CLOUDINARY_CLOUD_NAME');
            if (!process.env.CLOUDINARY_API_KEY)
                missingVars.push('CLOUDINARY_API_KEY');
            if (!process.env.CLOUDINARY_API_SECRET)
                missingVars.push('CLOUDINARY_API_SECRET');
            logger_1.logger.error('Cloudinary not configured', { missingVars });
            throw new errors_1.ValidationError(`Cloudinary is not configured. Missing environment variables: ${missingVars.join(', ')}. ` +
                `Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.`);
        }
        try {
            const uploadOptions = {
                resource_type: options.resource_type || 'auto',
                folder: options.folder || 'tcf-tef-platform',
                use_filename: true,
                unique_filename: true,
                overwrite: false,
                ...options,
            };
            logger_1.logger.info('Uploading file to Cloudinary', {
                filePath,
                options: uploadOptions
            });
            const result = await cloudinary_1.v2.uploader.upload(filePath, uploadOptions);
            logger_1.logger.info('File uploaded to Cloudinary successfully', {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to upload file to Cloudinary', { error, filePath });
            throw new errors_1.ValidationError(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    static async uploadBuffer(buffer, options = {}) {
        try {
            const uploadOptions = {
                resource_type: options.resource_type || 'auto',
                folder: options.folder || 'tcf-tef-platform',
                use_filename: false,
                unique_filename: true,
                overwrite: false,
                ...options,
            };
            logger_1.logger.info('Uploading buffer to Cloudinary', {
                bufferSize: buffer.length,
                options: uploadOptions
            });
            return new Promise((resolve, reject) => {
                cloudinary_1.v2.uploader.upload_stream(uploadOptions, (error, result) => {
                    if (error) {
                        logger_1.logger.error('Failed to upload buffer to Cloudinary', { error });
                        reject(new errors_1.ValidationError(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`));
                    }
                    else {
                        logger_1.logger.info('Buffer uploaded to Cloudinary successfully', {
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
                }).end(buffer);
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to upload buffer to Cloudinary', { error });
            throw new errors_1.ValidationError(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    static async deleteFile(publicId, resourceType = 'image') {
        try {
            logger_1.logger.info('Deleting file from Cloudinary', { publicId, resourceType });
            const result = await cloudinary_1.v2.uploader.destroy(publicId, {
                resource_type: resourceType,
            });
            if (result.result !== 'ok') {
                throw new Error(`Failed to delete file: ${result.result}`);
            }
            logger_1.logger.info('File deleted from Cloudinary successfully', { publicId });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete file from Cloudinary', { error, publicId });
            throw new errors_1.ValidationError(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    static async getFileDetails(publicId, resourceType = 'image') {
        try {
            const result = await cloudinary_1.v2.api.resource(publicId, {
                resource_type: resourceType,
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to get file details from Cloudinary', { error, publicId });
            throw new errors_1.ValidationError(`Failed to get file details: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    static generateTransformationUrl(publicId, transformations = [], resourceType = 'image') {
        try {
            return cloudinary_1.v2.url(publicId, {
                resource_type: resourceType,
                transformation: transformations,
                secure: true,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to generate transformation URL', { error, publicId });
            throw new errors_1.ValidationError(`Failed to generate URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    static getOptimizedImageUrl(publicId, width, height, quality = 'auto') {
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
    static getVideoThumbnailUrl(publicId, width = 300, height = 200) {
        return this.generateTransformationUrl(publicId, [
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
        ], 'video');
    }
    static async testConnection() {
        try {
            await cloudinary_1.v2.api.ping();
            logger_1.logger.info('Cloudinary connection test successful');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Cloudinary connection test failed', { error });
            return false;
        }
    }
}
exports.CloudinaryService = CloudinaryService;
//# sourceMappingURL=cloudinaryService.js.map