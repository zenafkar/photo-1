import { vi } from "vitest";

/**
 * Creates a mock Prisma client where every operation is a vi.fn().
 * Route tests can configure return values per test:
 *   mockPrisma.user.findUnique.mockResolvedValue({ id: "u1", clerkId: "c1", credits: { remainingCredits: 5 } });
 */
export function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    userCredit: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    generation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => {
      // Default: exec the callback and return its result (mimics interactive transaction)
      if (typeof fn === "function") {
        const result = fn(mockPrisma);
        return Array.isArray(result) ? Promise.all(result) : Promise.resolve(result);
      }
      // Array mode: run all promises
      return Promise.all(fn);
    }),
  };
}

// Singleton so the same instance ref is used; tests reset individual mocks
const mockPrisma = createMockPrisma();

export { mockPrisma };
