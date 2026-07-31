import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../config/prisma";

const router = Router();

router.get("/me", async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);
    
    console.log("[DEBUG] /user/me called with clerkId:", clerkId);

    if (!clerkId) {
      console.log("[DEBUG] /user/me Unauthorized - no clerkId");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Try to find the user in our DB
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: { 
        credits: {
          select: {
            remainingCredits: true,
            planType: true
          }
        },
        generations: {
          take: 15, // Membatasi jumlah data history agar lebih cepat
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            processedUrl: true,
            preset: true,
            status: true,
            createdAt: true
          }
        }
      },
    });

    console.log("[DEBUG] /user/me findUnique result:", user ? `Found user with ${user.credits?.remainingCredits} credits and ${user.generations?.length} generations` : "Not found");

    // If user doesn't exist yet, we create them (Lazy initialization)
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId,
          email: `${clerkId}@placeholder.com`, // Usually synced via Clerk Webhooks
          credits: {
            create: {
              remainingCredits: 3,
              planType: "free"
            }
          }
        },
        include: { 
          credits: {
            select: {
              remainingCredits: true,
              planType: true
            }
          }, 
          generations: {
            take: 15,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              processedUrl: true,
              preset: true,
              status: true,
              createdAt: true
            }
          } 
        },
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
