"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.checkDatabaseHealth = void 0;
const client_1 = require("@prisma/client");
const getDatabaseUrl = () => {
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
        throw new Error('DATABASE_URL is not defined');
    }
    const url = new URL(baseUrl);
    if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '100');
    }
    if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '60');
    }
    if (!url.searchParams.has('connect_timeout')) {
        url.searchParams.set('connect_timeout', '60');
    }
    if (!url.searchParams.has('statement_timeout')) {
        url.searchParams.set('statement_timeout', '30000');
    }
    if (!url.searchParams.has('idle_in_transaction_session_timeout')) {
        url.searchParams.set('idle_in_transaction_session_timeout', '30000');
    }
    if (!url.searchParams.has('tcp_keepalives_idle')) {
        url.searchParams.set('tcp_keepalives_idle', '600');
    }
    if (!url.searchParams.has('tcp_keepalives_interval')) {
        url.searchParams.set('tcp_keepalives_interval', '30');
    }
    if (!url.searchParams.has('tcp_keepalives_count')) {
        url.searchParams.set('tcp_keepalives_count', '3');
    }
    return url.toString();
};
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: getDatabaseUrl(),
        },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
exports.prisma = prisma;
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
const connectWithRetry = async (maxRetries = 3, delay = 2000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await prisma.$connect();
            console.log('✅ Database connected successfully');
            return true;
        }
        catch (error) {
            console.error(`❌ Database connection attempt ${i + 1}/${maxRetries} failed:`, error.message);
            if (i < maxRetries - 1) {
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 1.5;
            }
            else {
                console.error('❌ All database connection attempts failed');
                throw error;
            }
        }
    }
    return false;
};
connectWithRetry().catch(err => {
    console.error('❌ Failed to connect to database:', err);
});
let connectionPoolHealthy = true;
const monitorConnectionPool = async () => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        if (!connectionPoolHealthy) {
            console.log('✅ Database connection pool recovered');
            connectionPoolHealthy = true;
        }
    }
    catch (error) {
        if (connectionPoolHealthy) {
            console.error('❌ Database connection pool issues detected:', error);
            connectionPoolHealthy = false;
        }
    }
};
setInterval(monitorConnectionPool, 30000);
const checkDatabaseHealth = async () => {
    try {
        const start = Date.now();
        await prisma.$queryRaw `SELECT 1 as health_check`;
        const duration = Date.now() - start;
        return {
            healthy: true,
            details: {
                status: 'connected',
                responseTime: `${duration}ms`,
                timestamp: new Date().toISOString(),
                connectionPoolHealthy
            }
        };
    }
    catch (error) {
        return {
            healthy: false,
            details: {
                status: 'error',
                error: error.message,
                code: error.code,
                timestamp: new Date().toISOString(),
                connectionPoolHealthy
            }
        };
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
const originalQuery = prisma.$queryRaw;
prisma.$queryRaw = async (query, ...args) => {
    const maxRetries = 3;
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await originalQuery.call(prisma, query, ...args);
        }
        catch (error) {
            lastError = error;
            if (error.code === 'P2024' || error.code === 'P1001' || error.code === 'P1008') {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                console.error(`🚨 Database connection issue (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, error.message);
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            throw error;
        }
    }
    throw lastError;
};
process.on('beforeExit', async () => {
    console.log('🔄 Disconnecting from database...');
    await prisma.$disconnect();
});
process.on('SIGINT', async () => {
    console.log('🔄 Received SIGINT, disconnecting from database...');
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('🔄 Received SIGTERM, disconnecting from database...');
    await prisma.$disconnect();
    process.exit(0);
});
exports.default = prisma;
//# sourceMappingURL=database.js.map