import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";

const router = Router();

/**
 * Clerk Webhook Handler
 * Endpoint: /api/v1/webhooks/clerk
 * Ensures 2-way real-time synchronization between Clerk Dashboard and Neon PostgreSQL (Prisma DB).
 */
router.post("/clerk", async (req: Request, res: Response) => {
  try {
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

export default router;
