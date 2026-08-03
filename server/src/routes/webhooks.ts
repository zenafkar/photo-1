import { Router, Request, Response } from "express";
import { Webhook } from "svix";
import { prisma } from "../config/prisma";
import { verifyXenditCallback, sanitizeWebhookPayload } from "../services/xenditWebhook";
import { creditOps } from "../services/credits";
import { paymentEvents } from "../services/paymentEvents";

const router = Router();

/**
 * Clerk Webhook Handler
 * Endpoint: /api/v1/webhooks/clerk
 * Ensures 2-way real-time synchronization between Clerk Dashboard and Neon PostgreSQL (Prisma DB).
 *
 * SECURITY: Verifies Svix webhook signatures to prevent forged events.
 * Requires CLERK_WEBHOOK_SECRET from Clerk Dashboard → Webhooks.
 */
router.post("/clerk", async (req: Request, res: Response) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || "";

    // Verify webhook signature if secret is configured
    if (WEBHOOK_SECRET) {
      const svixId = req.headers["svix-id"] as string;
      const svixTimestamp = req.headers["svix-timestamp"] as string;
      const svixSignature = req.headers["svix-signature"] as string;

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.warn("[Clerk Webhook] Missing Svix headers — rejecting request");
        return res.status(400).json({ success: false, message: "Missing Svix headers" });
      }

      // Use the raw body captured by the verify middleware for signature verification
      try {
        const rawBody = (req as any).rawBody || JSON.stringify(req.body);
        const wh = new Webhook(WEBHOOK_SECRET);
        wh.verify(rawBody, {
          "svix-id": svixId,
          "svix-timestamp": svixTimestamp,
          "svix-signature": svixSignature,
        });
      } catch (verifyErr: any) {
        console.error("[Clerk Webhook] Signature verification failed:", verifyErr.message);
        return res.status(401).json({ success: false, message: "Invalid webhook signature" });
      }
    } else {
      console.warn("[Clerk Webhook] CLERK_WEBHOOK_SECRET not set — running without signature verification (insecure)");
    }

    const event = req.body;
    const eventType = event?.type;
    const data = event?.data;

    console.log(`[Clerk Webhook] Event received: ${eventType}`);

    if (!data) {
      return res.status(400).json({ success: false, message: "No data payload" });
    }

    if (eventType === "user.deleted") {
      const clerkId = data.id;
      if (clerkId) {
        console.log(`[Clerk Webhook] Deleting user from Prisma DB: ${clerkId}`);
        const existing = await prisma.user.findUnique({ where: { clerkId } });
        if (existing) {
          await prisma.user.delete({ where: { clerkId } });
          console.log(`[Clerk Webhook] User ${clerkId} deleted successfully from Prisma DB.`);
        }
      }
    } else if (eventType === "user.created") {
      const clerkId = data.id;
      const email = data.email_addresses?.[0]?.email_address || `${clerkId}@placeholder.com`;
      const name = `${data.first_name || ""} ${data.last_name || ""}`.trim() || undefined;

      if (clerkId) {
        console.log(`[Clerk Webhook] Creating/Syncing new user: ${clerkId}`);
        await prisma.user.upsert({
          where: { clerkId },
          update: { email, name },
          create: {
            clerkId,
            email,
            name,
            credits: {
              create: {
                remainingCredits: 3,
                planType: "free"
              }
            }
          }
        });
      }
    } else if (eventType === "user.updated") {
      const clerkId = data.id;
      const email = data.email_addresses?.[0]?.email_address;
      const name = `${data.first_name || ""} ${data.last_name || ""}`.trim() || undefined;

      if (clerkId) {
        const existing = await prisma.user.findUnique({ where: { clerkId } });
        if (existing) {
          await prisma.user.update({
            where: { clerkId },
            data: {
              ...(email ? { email } : {}),
              ...(name ? { name } : {})
            }
          });
        }
      }
    }

    return res.status(200).json({ success: true, message: "Webhook processed successfully" });
  } catch (error: any) {
    console.error("[Clerk Webhook Error]", error);
    return res.status(500).json({ success: false, message: error?.message || "Webhook processing error" });
  }
});

// ── Xendit Payment Webhook ──────────────────────────────────

/**
 * POST /api/v1/webhooks/xendit
 * Handles payment status callbacks from Xendit.
 * Security: callback token verification via timingSafeEqual.
 * Idempotent: terminal-status orders are no-ops.
 */
router.post("/xendit", async (req: Request, res: Response) => {
  try {
    const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN || "";

    // 1. Verify callback token
    const receivedToken = req.headers["x-callback-token"] as string | undefined;
    if (!verifyXenditCallback(receivedToken, XENDIT_WEBHOOK_TOKEN)) {
      console.warn("[Xendit Webhook] Invalid callback token");
      return res.status(401).json({ success: false, message: "Token webhook tidak valid." });
    }

    const body = req.body;
    const xenditInvoiceId: string | undefined = body?.id;
    const status: string | undefined = body?.status;
    const amount: number | undefined = body?.amount;

    if (!xenditInvoiceId) {
      return res.status(400).json({ success: false, message: "Missing invoice ID." });
    }

    // 2. Find payment order
    const order = await prisma.paymentOrder.findUnique({
      where: { xenditInvoiceId },
    });

    if (!order) {
      console.warn(`[Xendit Webhook] Unknown invoice: ${xenditInvoiceId}`);
      return res.status(404).json({ success: false, message: "Pesanan tidak ditemukan." });
    }

    // 3. Amount/currency integrity check
    if (amount !== undefined && amount !== order.amount) {
      console.error(
        `[Xendit Webhook] Amount mismatch! Expected ${order.amount}, got ${amount} for ${xenditInvoiceId}`
      );
      // Telegram alert for potential tampering
      const { telegramBot } = await import("../agent/telegramBot.js");
      await telegramBot.sendFullActionReport({
        time: new Date().toISOString(),
        component: "Xendit Webhook",
        rootCause: `Amount mismatch for invoice ${xenditInvoiceId}: expected ${order.amount}, got ${amount}`,
        action: "Manual investigation required — possible tampering or Xendit configuration error",
        status: "CRITICAL_AMOUNT_MISMATCH",
      });
      return res.status(422).json({ success: false, message: "Jumlah pembayaran tidak sesuai." });
    }

    // Currency validation — only IDR is supported
    const currency: string | undefined = body?.currency;
    if (currency && currency !== "IDR") {
      console.error(
        `[Xendit Webhook] Currency mismatch! Expected IDR, got ${currency} for ${xenditInvoiceId}`
      );
      return res.status(422).json({ success: false, message: "Mata uang tidak valid." });
    }

    // 4. Idempotency — terminal orders are no-ops
    if (["settled", "expired", "failed"].includes(order.status)) {
      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: {
          notifiedAt: new Date(),
          rawResponse: sanitizeWebhookPayload(body) as any,
        },
      });
      return res.status(200).json({ success: true, message: "Already processed." });
    }

    // 5. Dispatch by Xendit status
    const xStatus = (status || "").toUpperCase();

    if (xStatus === "PAID" || xStatus === "SETTLED") {
      // ── Grant credits FIRST ──────────────────────────
      // If this fails, we do NOT settle — order stays pending so reconciliation will retry.
      try {
        await creditOps.add(order.userId, order.credits, {
          type: "purchase",
          orderId: order.id,
          reason: `Pembelian paket ${order.packageId}`,
          idempotencyKey: order.idempotencyKey,
          metadata: {
            xenditInvoiceId,
            paymentMethod: body?.payment_method,
            paymentChannel: body?.payment_channel,
          },
        });
      } catch (creditErr: any) {
        console.error(`[Xendit Webhook] Credit grant failed for ${xenditInvoiceId}:`, creditErr?.message);
        // Order stays pending — reconciliation will retry
        return res.status(200).json({ success: false, message: "Credit grant failed — will reconcile." });
      }

      // ── CAS settlement ──────────────────────────────
      // Only settle AFTER credits are granted. CAS prevents double-settling
      // if a concurrent poll/webhook already processed this order.
      await prisma.$transaction(async (tx) => {
        const claimed = await tx.paymentOrder.updateMany({
          where: {
            xenditInvoiceId,
            status: { in: ["pending", "creating"] },
          },
          data: {
            status: "settled",
            settledAt: new Date(),
            paidAt: body?.paid_at ? new Date(body.paid_at) : new Date(),
            paymentMethod: body?.payment_method || null,
            paymentChannel: body?.payment_channel || null,
            xenditPaymentId: body?.payment_id || null,
            rawResponse: sanitizeWebhookPayload(body) as any,
            notifiedAt: new Date(),
          },
        });

        if (claimed.count === 0) {
          // Credits already granted by concurrent request — no-op
          return;
        }
      });

      console.log(`[Xendit Webhook] Settled: ${xenditInvoiceId} (${order.packageId}, +${order.credits} credits)`);

      // ── Push real-time SSE event to connected clients ──
      paymentEvents.emit(`settled:${order.externalId}`, {
        externalId: order.externalId,
        status: "settled",
        credits: order.credits,
        paidAt: body?.paid_at ? new Date(body.paid_at).toISOString() : new Date().toISOString(),
        paymentMethod: body?.payment_method ?? null,
      });
    } else if (xStatus === "EXPIRED") {
      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: "expired",
          expiredAt: new Date(),
          rawResponse: sanitizeWebhookPayload(body) as any,
          notifiedAt: new Date(),
        },
      });
      paymentEvents.emit(`settled:${order.externalId}`, {
        externalId: order.externalId,
        status: "expired",
        credits: 0,
        paidAt: null,
        paymentMethod: null,
      });
    } else if (xStatus === "FAILED") {
      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: "failed",
          rawResponse: sanitizeWebhookPayload(body) as any,
          notifiedAt: new Date(),
        },
      });
      paymentEvents.emit(`settled:${order.externalId}`, {
        externalId: order.externalId,
        status: "failed",
        credits: 0,
        paidAt: null,
        paymentMethod: null,
      });
    }
    // PENDING: no-op

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("[Xendit Webhook] Error:", err);
    // Always return 200 to Xendit to prevent retry storms
    return res.status(200).json({ success: false, message: "Internal error — will reconcile." });
  }
});

export default router;
