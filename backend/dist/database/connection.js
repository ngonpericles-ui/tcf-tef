"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.disconnectDatabase = exports.testDatabaseConnection = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("@/utils/logger");
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
const createPrismaClient = () => {
    return new client_1.PrismaClient({
        log: [
            {
                emit: 'event',
                level: 'query',
            },
            {
                emit: 'event',
                level: 'error',
            },
            {
                emit: 'event',
                level: 'info',
            },
            {
                emit: 'event',
                level: 'warn',
            },
        ],
    });
};
const prisma = globalThis.__prisma || createPrismaClient();
exports.prisma = prisma;
if (process.env.NODE_ENV === 'development') {
    globalThis.__prisma = prisma;
}
const testDatabaseConnection = async () => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        logger_1.logger.info('Database connection successful');
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database connection failed', error);
        return false;
    }
};
exports.testDatabaseConnection = testDatabaseConnection;
const disconnectDatabase = async () => {
    try {
        await prisma.$disconnect();
        logger_1.logger.info('Database disconnected successfully');
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting from database', error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
process.on('beforeExit', async () => {
    await (0, exports.disconnectDatabase)();
});
process.on('SIGINT', async () => {
    await (0, exports.disconnectDatabase)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await (0, exports.disconnectDatabase)();
    process.exit(0);
});
exports.default = prisma;
//# sourceMappingURL=connection.js.map