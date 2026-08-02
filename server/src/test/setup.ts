import { beforeAll, afterAll, afterEach } from "vitest";

// Dummy env vars for tests — prevents Clerk/Prisma from crashing at import time
beforeAll(() => {
  process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test";
  process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "sk_test_dummy";
  process.env.CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY || "pk_test_dummy";
  process.env.REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || "test-token";
  process.env.PORT = process.env.PORT || "0"; // random port for tests
});

afterEach(() => {
  // Restore all mocks between tests
});

afterAll(() => {
  // Cleanup
});
