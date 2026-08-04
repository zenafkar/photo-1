import { prisma } from "../config/prisma";
import { getInvoice } from "../services/xendit";
import { creditOps } from "../services/credits";

/**
 * Reconciliation cron — runs every 15 minutes.
 * Finds payment orders stuck in "creating" or "pending" states,
 * checks their actual status with Xendit, and corrects the local state.
 *
 * Uses an in-memory lock guard with a 14-minute timeout to prevent
 * overlapping reconciliation runs (safe for single-process deployments).
 * Replaces the previous pg_try_advisory_lock which leaked locks through
 * Prisma's connection pool (each query may use a different session).
 */
let reconciling = false;
let reconcilingStartedAt = 0;

export async function reconcilePayments(): Promise<void> {
  // Single-instance guard — prevent concurrent reconciliation runs
  if (reconciling) {
    // If the previous run has been going for >14 min, it's probably stuck — reset
    if (Date.now() - reconcilingStartedAt > 14 * 60_000) {
      console.warn("[Reconciliation] Previous run appears stuck (>14 min) — resetting lock");
      reconciling = false;
    } else {
      console.log("[Reconciliation] Skipping — previous run still in progress");
      return;
    }
  }

  reconciling = true;
  reconcilingStartedAt = Date.now();

  try {
    console.log("[Reconciliation] Starting payment reconciliation...");

    // Candidates: stuck in "creating" >10min, or pending unreconciled >15min
    const orders = await prisma.paymentOrder.findMany({
      where: {
        OR: [
          { status: "creating", createdAt: { lt: new Date(Date.now() - 10 * 60_000) } },
          { status: "pending", lastReconcileAt: { lt: new Date(Date.now() - 15 * 60_000) } },
          { status: "pending", lastReconcileAt: null, createdAt: { lt: new Date(Date.now() - 15 * 60_000) } },
        ],
      },
      take: 50,
      orderBy: { createdAt: "asc" },
    });

    if (orders.length === 0) {
      console.log("[Reconciliation] No pending orders to reconcile.");
      return;
    }

    console.log(`[Reconciliation] Found ${orders.length} orders to reconcile.`);

    let settled = 0;
    let expired = 0;
    let failed = 0;

    for (const order of orders) {
      try {
        // Skip orders that never got an invoice (Xendit creation failed)
        if (!order.xenditInvoiceId) {
          console.warn(`[Reconciliation] Skipping ${order.externalId}: no xenditInvoiceId assigned`);
          continue;
        }

        const invoice = await getInvoice(order.xenditInvoiceId);
        if (!invoice) {
          // API call failed — retry next tick
          continue;
        }

        const xStatus = invoice.status.toUpperCase();

        if (xStatus === "PAID" || xStatus === "SETTLED") {
          // ── Grant credits FIRST (idempotent via idempotencyKey) ──
          // If this fails, we do NOT settle — order stays pending for next reconciliation run.
          // This matches webhooks.ts and prevents permanent credit loss on crash.
          try {
            await creditOps.add(order.userId, order.credits, {
              type: "purchase",
              orderId: order.id,
              reason: `Pembelian paket ${order.packageId} (reconciliation)`,
              idempotencyKey: order.idempotencyKey,
              metadata: { xenditInvoiceId: order.xenditInvoiceId, source: "reconciliation" },
            });
          } catch (creditErr: any) {
            console.error(`[Reconciliation] Credit grant failed for ${order.externalId}:`, creditErr?.message);
            // Don't settle — retry next reconciliation tick
            continue;
          }

          // ── CAS settlement SECOND ──
          const claimed = await prisma.paymentOrder.updateMany({
            where: {
              xenditInvoiceId: order.xenditInvoiceId,
              status: { in: ["pending", "creating"] },
            },
            data: {
              status: "settled",
              settledAt: new Date(),
              paidAt: invoice.paid_at ? new Date(invoice.paid_at) : new Date(),
              paymentMethod: invoice.payment_method || null,
              paymentChannel: invoice.payment_channel || null,
              xenditPaymentId: invoice.payment_id || null,
            },
          });

          if (claimed.count > 0) {
            settled++;
            console.log(`[Reconciliation] Settled: ${order.externalId}`);
          }
        } else if (xStatus === "EXPIRED") {
          await prisma.paymentOrder.update({
            where: { id: order.id },
            data: { status: "expired", expiredAt: new Date() },
          });
          expired++;
        } else if (xStatus === "FAILED") {
          await prisma.paymentOrder.update({
            where: { id: order.id },
            data: { status: "failed" },
          });
          failed++;
        } else if (xStatus === "PENDING") {
          // If created >24h ago, soft-expire server-side
          if (order.createdAt < new Date(Date.now() - 24 * 60 * 60_000)) {
            await prisma.paymentOrder.update({
              where: { id: order.id },
              data: { status: "expired", expiredAt: new Date() },
            });
            expired++;
          }
        }

        // Update reconcile counter
        await prisma.paymentOrder.update({
          where: { id: order.id },
          data: { reconcileCount: { increment: 1 }, lastReconcileAt: new Date() },
        });
      } catch (err: any) {
        console.error(`[Reconciliation] Error reconciling ${order.externalId}:`, err?.message);
      }
    }

    console.log(
      `[Reconciliation] Done — settled: ${settled}, expired: ${expired}, failed: ${failed}`
    );

    // ── Escalation: orders with ≥8 failed reconcile attempts (~2 hours) ──
    const critical = await prisma.paymentOrder.findMany({
      where: {
        reconcileCount: { gte: 8 },
        status: { notIn: ["settled", "expired", "failed"] },
      },
    });

    for (const order of critical) {
      console.error(
        `[Reconciliation] CRITICAL: Order ${order.externalId} stuck (status: ${order.status}, attempts: ${order.reconcileCount})`
      );
      const { telegramBot } = await import("../agent/telegramBot.js");
      await telegramBot.sendFullActionReport({
        time: new Date().toISOString(),
        component: "Payment Reconciliation",
        rootCause: `Order ${order.externalId} stuck in "${order.status}" after ${order.reconcileCount} reconciliation attempts`,
        action: `Manual intervention required — verify Xendit invoice ${order.xenditInvoiceId} and grant credits manually if paid`,
        status: "CRITICAL_ORDER_STUCK",
      });
    }
  } catch (err: any) {
    console.error("[Reconciliation] Fatal error:", err?.message);
  } finally {
    reconciling = false;
  }
}
