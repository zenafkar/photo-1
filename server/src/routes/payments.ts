import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../config/prisma";
import { z } from "zod";
import { createInvoice, getInvoice } from "../services/xendit";
import { getPackage, type PackageId } from "../services/paymentPackages";
import { creditOps } from "../services/credits";

const router = Router();

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
    const newCredits = await prisma.userCredit.create({
      data: { userId: user.id, remainingCredits: 3, planType: "free" },
    });
    user.credits = newCredits;
  }

  return user;
}

// ── Routes ──────────────────────────────────────────────────

/** POST /api/v1/payments/orders — create a Xendit invoice for credit purchase */
router.post("/orders", async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Silakan login terlebih dahulu." });
    }

    // Validate input
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Payload tidak valid.", errors: parsed.error.issues });
    }
    const { packageId, idempotencyKey } = parsed.data;

    // Resolve user
    const user = await ensureUserWithCredits(clerkId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan." });
    }

    const pkg = getPackage(packageId);
    if (!pkg) {
      return res.status(400).json({ success: false, message: "Paket tidak dikenal." });
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
        return res.status(409).json({
          success: false,
          message: "Pembayaran untuk permintaan ini sudah selesai diproses.",
        });
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
      return res.status(502).json({
        success: false,
        message: "Gagal menghubungi gateway pembayaran. Silakan coba lagi.",
      });
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
    return res.status(500).json({ success: false, message: "Gagal membuat pesanan. Silakan coba lagi." });
  }
});

/** GET /api/v1/payments/orders/:id — poll order status */
router.get("/orders/:id", async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Silakan login terlebih dahulu." });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan." });
    }

    const orderId = req.params.id as string;
    const order = await prisma.paymentOrder.findFirst({
      where: { externalId: orderId, userId: user.id },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Pesanan tidak ditemukan." });
    }

    // If still pending/creating, refresh from Xendit
    if ((order.status === "pending" || order.status === "creating") && order.xenditInvoiceId) {
      try {
        const invoice = await getInvoice(order.xenditInvoiceId);
        if (invoice) {
          const xStatus = invoice.status.toUpperCase();

          if (xStatus === "PAID" || xStatus === "SETTLED") {
            // ── Grant credits FIRST (idempotent via idempotencyKey) ──
            // If this fails, we do NOT settle — order stays pending for reconciliation retry.
            // This matches the webhooks.ts pattern and prevents permanent credit loss
            // if the server crashes between settlement and credit grant.
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
              // Don't settle — return current status so reconciliation can retry
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

            // ── CAS settlement SECOND (idempotent vs webhook) ──
            // Credits are already granted. CAS just marks the order as done.
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
            await prisma.paymentOrder.update({
              where: { id: order.id },
              data: {
                status: xStatus.toLowerCase(),
                expiredAt: xStatus === "EXPIRED" ? new Date() : undefined,
              },
            });
            order.status = xStatus.toLowerCase();
          }
          // PENDING — no local update needed, return current state
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
    return res.status(500).json({ success: false, message: "Gagal mengambil status pesanan." });
  }
});

/** GET /api/v1/payments/history — user's payment orders */
router.get("/history", async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Silakan login terlebih dahulu." });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan." });
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
    return res.status(500).json({ success: false, message: "Gagal mengambil riwayat pembayaran." });
  }
});

export default router;
