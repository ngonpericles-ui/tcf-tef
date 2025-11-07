"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const cloudinaryService_1 = require("./cloudinaryService");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const crypto_1 = __importDefault(require("crypto"));
const sharp_1 = __importDefault(require("sharp"));
const prisma = new client_1.PrismaClient();
class FileUploadService {
    static async initializeDirectories() {
        try {
            const directories = [
                this.UPLOAD_DIR,
                path_1.default.join(this.UPLOAD_DIR, 'profiles'),
                path_1.default.join(this.UPLOAD_DIR, 'courses'),
                path_1.default.join(this.UPLOAD_DIR, 'posts'),
                path_1.default.join(this.UPLOAD_DIR, 'documents'),
                path_1.default.join(this.UPLOAD_DIR, 'temp')
            ];
            for (const dir of directories) {
                try {
                    await promises_1.default.access(dir);
                }
                catch {
                    await promises_1.default.mkdir(dir, { recursive: true });
                    logger_1.logger.info('Created upload directory', { directory: dir });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize upload directories', { error });
            throw error;
        }
    }
    static configureMulter(options = { category: 'OTHER' }) {
        const storage = multer_1.default.diskStorage({
            destination: (req, file, cb) => {
                let subDir = 'temp';
                switch (options.category) {
                    case 'PROFILE_IMAGE':
                        subDir = 'profiles';
                        break;
                    case 'COURSE_MATERIAL':
                        subDir = 'courses';
                        break;
                    case 'POST_MEDIA':
                        subDir = 'posts';
                        break;
                    case 'DOCUMENT':
                        subDir = 'documents';
                        break;
                }
                cb(null, path_1.default.join(this.UPLOAD_DIR, subDir));
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = crypto_1.default.randomUUID();
                const ext = path_1.default.extname(file.originalname);
                cb(null, `${uniqueSuffix}${ext}`);
            }
        });
        const fileFilter = (req, file, cb) => {
            const allowedTypes = options.allowedTypes || this.ALLOWED_TYPES;
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new errors_1.ValidationError(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`));
            }
        };
        return (0, multer_1.default)({
            storage,
            fileFilter,
            limits: {
                fileSize: options.maxSize || this.MAX_FILE_SIZE,
                files: 5
            }
        });
    }
    static async processUploadedFile(file, userId, options) {
        try {
            let processedPath = file.path;
            let metadata = {};
            if (file.mimetype.startsWith('image/')) {
                const imageInfo = await (0, sharp_1.default)(file.path).metadata();
                metadata.width = imageInfo.width;
                metadata.height = imageInfo.height;
                if (options.resize) {
                    const resizedPath = file.path.replace(path_1.default.extname(file.path), '_resized' + path_1.default.extname(file.path));
                    await (0, sharp_1.default)(file.path)
                        .resize(options.resize.width, options.resize.height, {
                        fit: 'cover',
                        position: 'center'
                    })
                        .jpeg({ quality: options.resize.quality || 80 })
                        .toFile(resizedPath);
                    await promises_1.default.unlink(file.path);
                    processedPath = resizedPath;
                }
            }
            const relativePath = path_1.default.relative(this.UPLOAD_DIR, processedPath);
            const url = `/uploads/${relativePath.replace(/\\/g, '/')}`;
            const uploadedFile = await prisma.file.create({
                data: {
                    originalName: file.originalname,
                    filename: path_1.default.basename(processedPath),
                    mimeType: file.mimetype,
                    mimetype: file.mimetype,
                    size: file.size,
                    path: processedPath,
                    url,
                    userId: userId,
                    uploadedById: userId,
                    category: options.category,
                    metadata: JSON.stringify(metadata)
                }
            });
            logger_1.logger.info('File uploaded and processed', {
                fileId: uploadedFile.id,
                originalName: file.originalname,
                category: options.category,
                userId
            });
            return {
                id: uploadedFile.id,
                originalName: uploadedFile.originalName,
                filename: uploadedFile.filename,
                mimetype: uploadedFile.mimetype,
                size: uploadedFile.size,
                path: uploadedFile.path,
                url: uploadedFile.url,
                uploadedBy: uploadedFile.userId,
                uploadedAt: uploadedFile.createdAt,
                category: uploadedFile.category,
                metadata: uploadedFile.metadata
            };
        }
        catch (error) {
            try {
                await promises_1.default.unlink(file.path);
            }
            catch (cleanupError) {
                logger_1.logger.warn('Failed to clean up file after processing error', {
                    filePath: file.path,
                    cleanupError
                });
            }
            logger_1.logger.error('Failed to process uploaded file', {
                originalName: file.originalname,
                userId,
                error
            });
            throw error;
        }
    }
    static async getFileById(fileId, userId) {
        try {
            const file = await prisma.file.findUnique({
                where: { id: fileId }
            });
            if (!file) {
                throw new errors_1.NotFoundError('File not found');
            }
            try {
                await promises_1.default.access(file.path);
            }
            catch {
                logger_1.logger.warn('File not found on disk', { fileId, path: file.path });
                throw new errors_1.NotFoundError('File not found on disk');
            }
            return {
                id: file.id,
                originalName: file.originalName,
                filename: file.filename,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path,
                url: file.url,
                uploadedBy: file.userId,
                uploadedAt: file.createdAt,
                category: file.category,
                metadata: file.metadata
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get file by ID', { fileId, userId, error });
            throw error;
        }
    }
    static async getUserFiles(userId, category, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const whereClause = { userId: userId };
            if (category) {
                whereClause.category = category;
            }
            const [files, total] = await Promise.all([
                prisma.file.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.file.count({ where: whereClause })
            ]);
            const formattedFiles = files.map(file => ({
                id: file.id,
                originalName: file.originalName,
                filename: file.filename,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path,
                url: file.url,
                uploadedBy: file.userId,
                uploadedAt: file.createdAt,
                category: file.category,
                metadata: file.metadata
            }));
            return {
                files: formattedFiles,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user files', { userId, category, error });
            throw error;
        }
    }
    static async deleteFile(fileId, userId) {
        try {
            const file = await prisma.file.findUnique({
                where: { id: fileId },
                select: {
                    id: true,
                    userId: true,
                    path: true,
                    originalName: true
                }
            });
            if (!file) {
                throw new errors_1.NotFoundError('File not found');
            }
            if (file.userId !== userId) {
                throw new errors_1.ForbiddenError('You can only delete your own files');
            }
            await prisma.file.delete({
                where: { id: fileId }
            });
            try {
                await promises_1.default.unlink(file.path);
                logger_1.logger.info('File deleted from disk', { fileId, path: file.path });
            }
            catch (diskError) {
                logger_1.logger.warn('Failed to delete file from disk', {
                    fileId,
                    path: file.path,
                    diskError
                });
            }
            logger_1.logger.info('File deleted', {
                fileId,
                originalName: file.originalName,
                userId
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete file', { fileId, userId, error });
            throw error;
        }
    }
    static async updateProfileImage(userId, fileId) {
        try {
            const file = await prisma.file.findUnique({
                where: { id: fileId },
                select: {
                    id: true,
                    userId: true,
                    category: true,
                    mimetype: true,
                    url: true
                }
            });
            if (!file) {
                throw new errors_1.NotFoundError('File not found');
            }
            if (file.userId !== userId) {
                throw new errors_1.ForbiddenError('You can only use your own uploaded files');
            }
            if (file.category !== 'PROFILE_IMAGE') {
                throw new errors_1.ValidationError('File must be a profile image');
            }
            if (!file.mimetype.startsWith('image/')) {
                throw new errors_1.ValidationError('Profile image must be an image file');
            }
            await prisma.user.update({
                where: { id: userId },
                data: { profileImage: file.url }
            });
            logger_1.logger.info('Profile image updated', { userId, fileId });
        }
        catch (error) {
            logger_1.logger.error('Failed to update profile image', { userId, fileId, error });
            throw error;
        }
    }
    static async getFileStatistics(userId) {
        try {
            const whereClause = userId ? { userId: userId } : {};
            const [totalStats, categoryStats, mimetypeStats] = await Promise.all([
                prisma.file.aggregate({
                    where: whereClause,
                    _count: { id: true },
                    _sum: { size: true }
                }),
                prisma.file.groupBy({
                    by: ['category'],
                    where: whereClause,
                    _count: { id: true },
                    _sum: { size: true }
                }),
                prisma.file.groupBy({
                    by: ['mimetype'],
                    where: whereClause,
                    _count: { id: true },
                    _sum: { size: true }
                })
            ]);
            return {
                totalFiles: totalStats._count.id,
                totalSize: totalStats._sum.size || 0,
                byCategory: categoryStats.map(stat => ({
                    category: stat.category,
                    count: stat._count.id,
                    size: stat._sum.size || 0
                })),
                byMimetype: mimetypeStats.map(stat => ({
                    mimetype: stat.mimetype,
                    count: stat._count.id,
                    size: stat._sum.size || 0
                }))
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get file statistics', { userId, error });
            throw error;
        }
    }
    static async uploadToCloudinary(file, userId, options) {
        try {
            logger_1.logger.info('Starting Cloudinary upload', {
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                userId
            });
            const folder = `tcf-tef-platform/${options.category.toLowerCase()}`;
            const cloudinaryResult = await cloudinaryService_1.CloudinaryService.uploadFile(file.path, {
                folder,
                resource_type: 'auto',
                tags: [options.category, userId],
            });
            const uploadedFile = await prisma.file.create({
                data: {
                    originalName: file.originalname,
                    filename: file.filename,
                    mimeType: file.mimetype,
                    mimetype: file.mimetype,
                    size: file.size,
                    path: file.path,
                    url: cloudinaryResult.secure_url,
                    userId: userId,
                    uploadedById: userId,
                    category: options.category.toString(),
                    metadata: JSON.stringify({
                        cloudinaryPublicId: cloudinaryResult.public_id,
                        width: cloudinaryResult.width,
                        height: cloudinaryResult.height,
                        duration: cloudinaryResult.duration,
                        format: cloudinaryResult.format,
                        resourceType: cloudinaryResult.resource_type,
                    })
                }
            });
            try {
                await promises_1.default.unlink(file.path);
            }
            catch (unlinkError) {
                logger_1.logger.warn('Failed to delete local file after Cloudinary upload', {
                    filePath: file.path,
                    error: unlinkError
                });
            }
            logger_1.logger.info('File uploaded to Cloudinary successfully', {
                fileId: uploadedFile.id,
                cloudinaryPublicId: cloudinaryResult.public_id,
                url: cloudinaryResult.secure_url
            });
            return {
                id: uploadedFile.id,
                originalName: uploadedFile.originalName,
                filename: uploadedFile.filename,
                mimetype: uploadedFile.mimetype,
                size: uploadedFile.size,
                path: uploadedFile.path,
                url: uploadedFile.url,
                uploadedBy: uploadedFile.userId,
                uploadedAt: uploadedFile.createdAt,
                category: uploadedFile.category,
                metadata: uploadedFile.metadata ? JSON.parse(uploadedFile.metadata) : null
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to upload file to Cloudinary', {
                filename: file.filename,
                userId,
                error
            });
            try {
                await promises_1.default.unlink(file.path);
            }
            catch (unlinkError) {
                logger_1.logger.warn('Failed to delete local file after upload error', {
                    filePath: file.path,
                    error: unlinkError
                });
            }
            throw error;
        }
    }
    static async deleteFromCloudinary(fileId, userId) {
        try {
            const file = await prisma.file.findUnique({
                where: { id: fileId }
            });
            if (!file) {
                throw new errors_1.NotFoundError('File not found');
            }
            if (file.userId !== userId) {
                throw new errors_1.ForbiddenError('You can only delete your own files');
            }
            if (file.metadata) {
                const metadata = JSON.parse(file.metadata);
                if (metadata.cloudinaryPublicId) {
                    await cloudinaryService_1.CloudinaryService.deleteFile(metadata.cloudinaryPublicId, metadata.resourceType || 'image');
                }
            }
            await prisma.file.delete({
                where: { id: fileId }
            });
            const metadata = file.metadata ? JSON.parse(file.metadata) : {};
            logger_1.logger.info('File deleted from Cloudinary and database', {
                fileId,
                cloudinaryPublicId: metadata.cloudinaryPublicId
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete file from Cloudinary', { fileId, userId, error });
            throw error;
        }
    }
}
exports.FileUploadService = FileUploadService;
FileUploadService.UPLOAD_DIR = process.env.UPLOAD_PATH || 'uploads/';
FileUploadService.MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760');
FileUploadService.ALLOWED_TYPES = (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif,application/pdf,video/mp4,audio/mp3').split(',');
//# sourceMappingURL=fileUploadService.js.map