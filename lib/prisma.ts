import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton to avoid multiple instances in development.
 * 
 * In development, hot reloading can create multiple PrismaClient instances,
 * exhausting database connections. This pattern ensures a single instance
 * is reused across hot reloads.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
