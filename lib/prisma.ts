import { PrismaClient } from '@prisma/client';

// Use a global variable to store the Prisma instance to avoid creating multiple instances in development
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

try {
  console.log('[Prisma] Initializing Prisma Client...');

  if (!globalForPrisma.prisma) {
    console.log('[Prisma] Creating new PrismaClient instance');
    globalForPrisma.prisma = new PrismaClient({
      errorFormat: 'minimal',
    });
    console.log('[Prisma] PrismaClient created successfully');
  } else {
    console.log('[Prisma] Using existing PrismaClient from global');
  }
} catch (error) {
  console.error('[Prisma] Failed to initialize Prisma Client:', error);
  throw error;
}

export const prisma = globalForPrisma.prisma!;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

console.log('[Prisma] Module loaded, prisma exported:', !!prisma);
