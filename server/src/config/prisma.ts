import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrisma() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  });

  // Retry transient DB connection failures (e.g. Neon auto-pause wake-up)
  return client.$extends({
    query: {
      $allOperations: async ({ operation, args, query }) => {
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await query(args);
          } catch (error: any) {
            if (attempt === maxRetries) throw error;
            // Only retry on connection errors, not on query errors
            const msg = error?.message || '';
            if (msg.includes("Can't reach database") || msg.includes("Connection terminated")) {
              console.warn(`[Prisma] DB unreachable, retry ${attempt}/${maxRetries} (${operation})...`);
              await new Promise(r => setTimeout(r, 2000 * attempt));
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
