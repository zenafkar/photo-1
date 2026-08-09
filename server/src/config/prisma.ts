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

const SAFE_READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "$queryRaw",
  "$queryRawUnsafe",
]);

export function isDatabaseUnavailable(error: unknown): boolean {
  const code = (error as any)?.code;
  const message = (error as any)?.message || "";
  return code === "P1001" || code === "P1017" || RETRYABLE_PATTERNS.some(pattern => message.includes(pattern));
}

function createPrisma() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  });

  return client.$extends({
    query: {
      $allOperations: async ({ operation, args, query }) => {
        const maxAttempts = SAFE_READ_OPERATIONS.has(operation) ? 3 : 1;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            return await query(args);
          } catch (error: any) {
            if (attempt === maxAttempts || !SAFE_READ_OPERATIONS.has(operation) || !isDatabaseUnavailable(error)) throw error;

            const baseDelay = Math.min(750 * Math.pow(2, attempt - 1), 3000);
            const delay = baseDelay + Math.floor(Math.random() * 250);
            console.warn(`[Prisma] Read connection error, retry ${attempt}/${maxAttempts - 1} in ${delay}ms (${operation})`);
            await new Promise(r => setTimeout(r, delay));
          }
        }
      },
    },
  });
}

export const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
