import { PrismaClient } from '@prisma/client';

// Configure Prisma client with proper SSL handling for Aiven
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle SSL certificate issues for cloud databases
if (process.env.NODE_ENV === 'development') {
  // Disable SSL verification for development with cloud databases
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export { prisma };
export default prisma;
