import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { verifyToken } from "@clerk/backend";
import { prisma } from "../config/prisma.js";
import { z } from "zod";
import { createInvoice, getInvoice } from "../services/xendit.js";
import { getPackage, type PackageId } from "../services/paymentPackages.js";
import { creditOps } from "../services/credits.js";
import { paymentEvents, type SettlementEvent } from "../services/paymentEvents.js";
import { ErrorCodes, sendError } from "../middleware/errorContract.js";

// ── Validation ──────────────────────────────────────────────
const createOrderSchema = z.object({
  packageId: z.enum(["starter", "pro"]),
  idempotencyKey: z.string().uuid(),
});

// ── Helpers ─────────────────────────────────────────────────
function generateExternalId(): string {
  const ts = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ZEN-${ts}-${rand}`;
}

/** Find or create user + credit record (reuse pattern from generate.ts) */
async function ensureUserWithCredits(clerkId: string) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
    include: { credits: true },
  });

  if (user && !user.credits) {
    try {
      const newCredits = await prisma.userCredit.create({
        data: { userId: user.id, remainingCredits: 3, planType: "free" },
      });
      user.credits = newCredits;
    } catch (e: any) {
      if (e.code === "P2002") {
        // Handled concurrently by another request
        const existingCredits = await prisma.userCredit.findUnique({
          where: { userId: user.id },
        });
        if (existingCredits) user.credits = existingCredits;
      } else {
        throw e;
      }
    }
  }

  return user;
}

/**
 * Verify a Clerk session JWT and extract the userId (for EventSource which can't set headers).
 * Uses Clerk's cryptographic verification against the JWKS endpoint.
 * Returns null if the token is invalid, expired, or tampered with.
 */
async function resolveToken(token: string): Promise<string | null> {
  try {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      console.error("[SSE] CLERK_SECRET_KEY not set — cannot verify token");
      return null;
    }
    const verified = await verifyToken(token, {
      secretKey,
      authorizedParties: (process.env.CLERK_AUTHORIZED_PARTIES || "").split(",").filter(Boolean).length > 0
        ? process.env.CLERK_AUTHORIZED_PARTIES!.split(",").filter(Boolean)
        : undefined,
    });
    return verified?.sub || null;
  } catch {
    return null;
  }
}

export const createOrder = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return sendError(res, 401, ErrorCodes.UNAUTHORIZED, "Silakan login terlebih dahulu.");
    }

    // Validate input
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(
        res,
        400,
        ErrorCodes.INVALID_PAYLOAD,
        "Payload tidak valid.",
        parsed.error.issues,
      );
    }
    const { packageId, idempotencyKey } = parsed.data;

    // Resolve user
    const user = await ensureUserWithCredits(clerkId);
    if (!user) {
      return sendError(res, 404, ErrorCodes.USER_NOT_FOUND, "User tidak ditemukan.");
    }

    const pkg = getPackage(packageId);
    if (!pkg) {
      return sendError(res, 400, ErrorCodes.INVALID_PAYLOAD, "Paket tidak dikenal.");
    }

    // ── Layer 1: Idempotency ──────────────────────────────
    const existing = await prisma.paymentOrder.findUnique({
      where: { userId_idempotencyKey: { userId: user.id, idempotencyKey } },
    });

    if (existing) {
      if (existing.status === "pending" || existing.status === "creating") {
        // Idempotent replay — return existing invoice URL
        return res.status(200).json({
          success: true,
          data: {
            orderId: existing.externalId,
            invoiceUrl: existing.invoiceUrl,
            credits: existing.credits,
            amount: existing.amount,
            status: existing.status,
          },
        });
      }
      if (existing.status === "paid" || existing.status === "settled") {
        return sendError(
          res,
          409,
          ErrorCodes.PAYMENT_ALREADY_SETTLED,
          "Pembayaran untuk permintaan ini sudah selesai diproses.",
        );
      }
      // failed/expired — allow retry, fall through to create new invoice
    }

    // ── Create payment order (status: creating) ───────────
    const externalId = generateExternalId();
    const order = await prisma.paymentOrder.create({
      data: {
        userId: user.id,
        idempotencyKey,
        xenditInvoiceId: null, // placeholder — updated after Xendit call succeeds
        externalId,
        packageId,
        credits: pkg.credits,
        amount: pkg.price,
        status: "creating",
      },
    });

    // ── Call Xendit ───────────────────────────────────────
    let invoice;
    try {
      invoice = await createInvoice({ externalId, packageId: packageId as PackageId, payerEmail: user.email });
    } catch (xenditErr: any) {
      // Mark order as failed
      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: "failed", rawResponse: { error: xenditErr?.message } as any },
      });
      console.error("[Payments] Xendit invoice creation failed:", xenditErr?.message);
      return sendError(
        res,
        502,
        ErrorCodes.UPSTREAM_UNAVAILABLE,
        "Gagal menghubungi gateway pembayaran. Silakan coba lagi.",
      );
    }

    // ── Update order with Xendit response ─────────────────
    const updated = await prisma.paymentOrder.update({
      where: { id: order.id },
      data: {
        xenditInvoiceId: invoice.id,
        invoiceUrl: invoice.invoice_url,
        status: "pending",
        rawResponse: invoice as any,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        orderId: updated.externalId,
        invoiceUrl: updated.invoiceUrl,
        credits: updated.credits,
        amount: updated.amount,
        status: updated.status,
        expiryDate: invoice.expiry_date,
      },
    });
  } catch (err: any) {
    // P2002 = unique constraint violation (race on idempotencyKey)
    if (err?.code === "P2002") {
      // Re-fetch and return the existing order
      const { userId: clerkId } = getAuth(req);
      if (clerkId) {
        const user = await prisma.user.findUnique({ where: { clerkId } });
        if (user) {
          const body = req.body;
          const existing = await prisma.paymentOrder.findUnique({
            where: { userId_idempotencyKey: { userId: user.id, idempotencyKey: body.idempotencyKey } },
          });
          if (existing) {
            return res.status(200).json({
              success: true,
              data: {
                orderId: existing.externalId,
                invoiceUrl: existing.invoiceUrl,
                credits: existing.credits,
                amount: existing.amount,
                status: existing.status,
              },
            });
          }
        }
      }
    }

    console.error("[Payments] Create order error:", err);
    return sendError(res, 500, ErrorCodes.INTERNAL_ERROR, "Gagal membuat pesanan. Silakan coba lagi.");
  }
};

export const getOrderStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return sendError(res, 401, ErrorCodes.UNAUTHORIZED, "Silakan login terlebih dahulu.");
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return sendError(res, 404, ErrorCodes.USER_NOT_FOUND, "User tidak ditemukan.");
    }

    const orderId = req.params.id as string;
    const order = await prisma.paymentOrder.findFirst({
      where: { externalId: orderId, userId: user.id },
    });

    if (!order) {
      return sendError(res, 404, ErrorCodes.ORDER_NOT_FOUND, "Pesanan tidak ditemukan.");
    }

    // If still pending/creating, refresh from Xendit
    if ((order.status === "pending" || order.status === "creating") && order.xenditInvoiceId) {
      try {
        const invoice = await getInvoice(order.xenditInvoiceId);
        if (invoice) {
          const xStatus = invoice.status.toUpperCase();

          if (xStatus === "PAID" || xStatus === "SETTLED") {
            // ── Grant credits FIRST (idempotent via idempotencyKey) ──
            try {
              await creditOps.add(order.userId, order.credits, {
                type: "purchase",
                orderId: order.id,
                reason: `Pembelian paket ${order.packageId} (poll)`,
                idempotencyKey: order.idempotencyKey,
                metadata: { xenditInvoiceId: order.xenditInvoiceId, source: "poll" },
              });
            } catch (creditErr: any) {
              console.error(`[Payments] Poll credit grant failed for ${order.externalId}:`, creditErr?.message);
              return res.status(200).json({
                success: true,
                data: {
                  orderId: order.externalId,
                  status: order.status,
                  credits: order.credits,
                  amount: order.amount,
                  paidAt: order.paidAt,
                  paymentMethod: order.paymentMethod,
                },
              });
            }

            // ── CAS settlement SECOND ──
            await prisma.paymentOrder.updateMany({
              where: {
                id: order.id,
                status: { in: ["pending", "creating"] },
              },
              data: {
                status: "settled",
                settledAt: new Date(),
                paidAt: invoice.paid_at ? new Date(invoice.paid_at) : new Date(),
                paymentMethod: invoice.payment_method || null,
                paymentChannel: invoice.payment_channel || null,
                xenditPaymentId: invoice.payment_id || null,
                notifiedAt: new Date(),
              },
            });

            order.status = "settled";
          } else if (xStatus === "EXPIRED" || xStatus === "FAILED") {
            const updated = await prisma.paymentOrder.updateMany({
              where: {
                id: order.id,
                status: { in: ["pending", "creating"] },
              },
              data: {
                status: xStatus.toLowerCase(),
                expiredAt: xStatus === "EXPIRED" ? new Date() : undefined,
              },
            });
            if (updated.count > 0) {
              order.status = xStatus.toLowerCase();
            }
          }
        }
      } catch {
        // Xendit call failed — return whatever we have locally
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.externalId,
        status: order.status,
        credits: order.credits,
        amount: order.amount,
        paidAt: order.paidAt,
        paymentMethod: order.paymentMethod,
      },
    });
  } catch (err: any) {
    console.error("[Payments] Get order error:", err);
    return sendError(res, 500, ErrorCodes.INTERNAL_ERROR, "Gagal mengambil status pesanan.");
  }
};

export const getHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return sendError(res, 401, ErrorCodes.UNAUTHORIZED, "Silakan login terlebih dahulu.");
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return sendError(res, 404, ErrorCodes.USER_NOT_FOUND, "User tidak ditemukan.");
    }

    const orders = await prisma.paymentOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return res.status(200).json({
      success: true,
      data: orders.map((o) => ({
        orderId: o.externalId,
        packageId: o.packageId,
        credits: o.credits,
        amount: o.amount,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paidAt: o.paidAt,
        createdAt: o.createdAt,
      })),
    });
  } catch (err: any) {
    console.error("[Payments] History error:", err);
    return sendError(res, 500, ErrorCodes.INTERNAL_ERROR, "Gagal mengambil riwayat pembayaran.");
  }
};

export const streamPaymentEvents = async (req: Request, res: Response): Promise<any> => {
  const token = (req.query.token as string) || null;

  const clerkId = token
    ? await resolveToken(token)
    : getAuth(req).userId;

  if (!clerkId) {
    return sendError(res, 401, ErrorCodes.UNAUTHORIZED, "Silakan login terlebih dahulu.");
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return sendError(res, 404, ErrorCodes.USER_NOT_FOUND, "User tidak ditemukan.");
  }

  const orderId = req.params.orderId as string;

  const order = await prisma.paymentOrder.findFirst({
    where: { externalId: orderId, userId: user.id },
  });
  if (!order) {
    return sendError(res, 404, ErrorCodes.ORDER_NOT_FOUND, "Pesanan tidak ditemukan.");
  }

  if (order.status === "settled") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(`data: ${JSON.stringify({
      externalId: order.externalId,
      status: order.status,
      credits: order.credits,
      paidAt: order.paidAt?.toISOString() ?? null,
      paymentMethod: order.paymentMethod ?? null,
    } as SettlementEvent)}\n\n`);
    res.end();
    return;
  }

  if (order.status === "expired" || order.status === "failed") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(`data: ${JSON.stringify({
      externalId: order.externalId,
      status: order.status,
      credits: 0,
      paidAt: null,
      paymentMethod: null,
    })}\n\n`);
    res.end();
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ orderId })}\n\n`);

  const eventName = `settled:${orderId}`;

  const onSettled = (event: SettlementEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    res.end();
  };

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 25_000);

  paymentEvents.once(eventName, onSettled);

  req.on("close", () => {
    clearInterval(heartbeat);
    paymentEvents.off(eventName, onSettled);
  });
};
