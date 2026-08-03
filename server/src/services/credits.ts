import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

/** Maximum retries for optimistic lock conflicts */
const MAX_RETRIES = 3;

interface CreditOpOptions {
  type: string;
  orderId?: string;
  reason: string;
  idempotencyKey?: string;
  operatorId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Retry helper — re-runs the callback up to `maxRetries` times on:
 * - P2034: version mismatch (optimistic lock conflict)
 * - P2002: unique constraint violation (idempotencyKey duplicate — added by @unique guard)
 *
 * On P2002, the transaction is rolled back and retried; the findUnique guard
 * inside add()/deduct()/refund() will find the existing row and return it.
 */
async function withRetry<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  maxRetries = MAX_RETRIES,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: "ReadCommitted",
      });
    } catch (err: any) {
      lastError = err;
      if (
        (err?.code === "P2034" || err?.code === "P2002") &&
        attempt < maxRetries
      ) {
        await new Promise((r) => setTimeout(r, 50 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export const creditOps = {
  /**
   * Add credits to a user's balance. Creates an audit log row.
   * Idempotent by idempotencyKey — if a transaction with the same key already
   * exists (e.g., webhook + poll both fire concurrently), the operation is a
   * no-op that returns the existing transaction.
   *
   * Retries on: P2034 (version conflict), P2002 (idempotency race).
   */
  async add(
    userId: string,
    amount: number,
    opts: CreditOpOptions,
  ): Promise<{ remainingCredits: number; transactionId: string }> {
    if (amount <= 0) throw new Error("creditOps.add: amount must be positive");
    if (!userId) throw new Error("creditOps.add: userId is required");

    return withRetry(async (tx) => {
      // ── Idempotency guard ─────────────────────────────
      // With the @unique constraint on CreditTransaction.idempotencyKey,
      // this makes concurrent webhook+poll safe: first writer wins, second
      // finds the existing row on retry and returns without double-granting.
      if (opts.idempotencyKey) {
        const existing = await tx.creditTransaction.findUnique({
          where: { idempotencyKey: opts.idempotencyKey },
        });
        if (existing) {
          const current = await tx.userCredit.findUnique({ where: { userId } });
          return {
            remainingCredits: current?.remainingCredits ?? 0,
            transactionId: existing.id,
          };
        }
      }

      // Optimistic lock: increment version
      const credit = await tx.userCredit.update({
        where: { userId },
        data: {
          remainingCredits: { increment: amount },
          version: { increment: 1 },
        },
      });

      // Immutable audit log (unique idempotencyKey enforced at DB level)
      const txn = await tx.creditTransaction.create({
        data: {
          userId,
          orderId: opts.orderId || null,
          type: opts.type,
          amount: amount,
          balanceAfter: credit.remainingCredits,
          reason: opts.reason,
          idempotencyKey: opts.idempotencyKey || null,
          operatorId: opts.operatorId || null,
          metadata: (opts.metadata || undefined) as Prisma.InputJsonValue,
        },
      });

      return { remainingCredits: credit.remainingCredits, transactionId: txn.id };
    });
  },

  /**
   * Deduct credits. Uses WHERE remainingCredits >= amount inside the transaction
   * to prevent going below zero — atomic check-then-act, no race condition.
   * Retries on optimistic lock conflict.
   */
  async deduct(
    userId: string,
    amount: number,
    opts: CreditOpOptions,
  ): Promise<{ remainingCredits: number; transactionId: string }> {
    if (amount <= 0) throw new Error("creditOps.deduct: amount must be positive");
    if (!userId) throw new Error("creditOps.deduct: userId is required");

    return withRetry(async (tx) => {
      // ── Idempotency guard ─────────────────────────────
      if (opts.idempotencyKey) {
        const existing = await tx.creditTransaction.findUnique({
          where: { idempotencyKey: opts.idempotencyKey },
        });
        if (existing) {
          const current = await tx.userCredit.findUnique({ where: { userId } });
          return {
            remainingCredits: current?.remainingCredits ?? 0,
            transactionId: existing.id,
          };
        }
      }

      // Atomic guard: only update if sufficient credits remain
      const credit = await tx.userCredit.updateMany({
        where: {
          userId,
          remainingCredits: { gte: amount },
        },
        data: {
          remainingCredits: { decrement: amount },
          version: { increment: 1 },
        },
      });

      if (credit.count === 0) {
        // Check whether user has any credits at all
        const current = await tx.userCredit.findUnique({ where: { userId } });
        if (!current) {
          throw new Error("Credit record not found. Please contact support.");
        }
        throw new Error(
          `Insufficient credits. Required: ${amount}, available: ${current.remainingCredits}.`,
        );
      }

      // Re-fetch to get the actual remaining value after decrement
      const updated = await tx.userCredit.findUnique({ where: { userId } });
      if (!updated) throw new Error("Credit record disappeared during deduction.");

      const txn = await tx.creditTransaction.create({
        data: {
          userId,
          orderId: opts.orderId || null,
          type: opts.type,
          amount: -amount,
          balanceAfter: updated.remainingCredits,
          reason: opts.reason,
          idempotencyKey: opts.idempotencyKey || null,
          operatorId: opts.operatorId || null,
          metadata: (opts.metadata || undefined) as Prisma.InputJsonValue,
        },
      });

      return { remainingCredits: updated.remainingCredits, transactionId: txn.id };
    });
  },

  /**
   * Refund (reverse deduction). Never goes below 0.
   * If the user's balance is somehow less than the refund amount,
   * only the available balance is refunded and the shortfall is logged.
   */
  async refund(
    userId: string,
    amount: number,
    opts: CreditOpOptions,
  ): Promise<{ remainingCredits: number; transactionId: string; partial: boolean }> {
    if (amount <= 0) throw new Error("creditOps.refund: amount must be positive");
    if (!userId) throw new Error("creditOps.refund: userId is required");

    return withRetry(async (tx) => {
      // ── Idempotency guard ─────────────────────────────
      if (opts.idempotencyKey) {
        const existing = await tx.creditTransaction.findUnique({
          where: { idempotencyKey: opts.idempotencyKey },
        });
        if (existing) {
          const current = await tx.userCredit.findUnique({ where: { userId } });
          return {
            remainingCredits: current?.remainingCredits ?? 0,
            transactionId: existing.id,
            partial: false,
          };
        }
      }

      const current = await tx.userCredit.findUnique({ where: { userId } });
      if (!current) throw new Error("Credit record not found.");

      // Floor at zero
      const effective = Math.min(amount, current.remainingCredits);
      const partial = effective < amount;

      const credit = await tx.userCredit.update({
        where: { userId },
        data: {
          remainingCredits: { decrement: effective },
          version: { increment: 1 },
        },
      });

      const txn = await tx.creditTransaction.create({
        data: {
          userId,
          orderId: opts.orderId || null,
          type: opts.type,
          amount: -effective,
          balanceAfter: credit.remainingCredits,
          reason: partial
            ? `${opts.reason} (partial: ${effective}/${amount} — insufficient balance)`
            : opts.reason,
          idempotencyKey: opts.idempotencyKey || null,
          operatorId: opts.operatorId || null,
          metadata: { ...opts.metadata, partial, requestedAmount: amount, actualAmount: effective } as Prisma.InputJsonValue,
        },
      });

      return { remainingCredits: credit.remainingCredits, transactionId: txn.id, partial };
    });
  },
};