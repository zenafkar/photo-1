import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const RETRYABLE_PATTERNS = [
  "Can't reach database",
  "Connection terminated",
  "pool timed out",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ECONNRESET",
  "ENOTFOUND",
  "DNS resolution",
  "server closed",
  "P1017",
];

function createPrisma() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  });

  return client.$extends({
    query: {
      $allOperations: async ({ operation, args, query }) => {
        const maxRetries = 4;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await query(args);
          } catch (error: any) {
            if (attempt === maxRetries) throw error;
            const msg = error?.message || '';
            const isRetryable = RETRYABLE_PATTERNS.some(p => msg.includes(p));
            if (isRetryable) {
              const delay = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
              console.warn(`[Prisma] DB connection error, retry ${attempt}/${maxRetries} in ${delay}ms (${operation}): ${msg.slice(0, 80)}`);
              await new Promise(r => setTimeout(r, delay));
              continue;
            }
            throw error;
          }
        }
      },
    },
  });
}

export const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
