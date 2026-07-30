import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../config/prisma";

const router = Router();

router.get("/me", async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);
    
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Try to find the user in our DB
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: { credits: true },
    });

    // If user doesn't exist yet, we create them (Lazy initialization)
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId,
          email: "synced_from_clerk_webhook@placeholder.com", // Usually synced via Clerk Webhooks
          credits: {
            create: {
              remainingCredits: 3,
              planType: "free"
            }
          }
        },
        include: { credits: true },
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
