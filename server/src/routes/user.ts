import { Router, Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { prisma } from "../config/prisma";

const router = Router();

// ... existing code ...

router.delete("/account", async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log("[DEBUG] Deleting account for clerkId:", clerkId);

    // 1. Delete from Prisma DB
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      await prisma.user.delete({
        where: { clerkId },
      });
      console.log("[DEBUG] Successfully deleted user from Prisma DB:", clerkId);
    } else {
      console.log("[DEBUG] User not found in DB during deletion:", clerkId);
    }

    // 2. Delete from Clerk Authentication system to keep DBs in sync
    try {
      await clerkClient.users.deleteUser(clerkId);
      console.log("[DEBUG] Successfully deleted user from Clerk Auth:", clerkId);
    } catch (clerkErr: any) {
      console.warn("[DEBUG] Notice deleting user from Clerk Auth:", clerkErr?.message || clerkErr);
    }

    res.status(200).json({
      success: true,
      message: "Akun dan seluruh data pengguna berhasil dihapus secara permanen.",
    });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

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
      try {
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
      } catch (createError) {
        console.warn("[DEBUG] Concurrent creation detected for clerkId:", clerkId, "retrying findUnique...");
        user = await prisma.user.findUnique({
          where: { clerkId },
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
        if (!user) {
          throw createError;
        }
      }
    } else if (!user.credits) {
      // User exists but credits record is missing, create default credits
      const newCredits = await prisma.userCredit.create({
        data: {
          userId: user.id,
          remainingCredits: 3,
          planType: "free"
        },
        select: {
          remainingCredits: true,
          planType: "free" as any
        }
      });
      user.credits = newCredits;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error("Error fetching user /user/me:", error?.message || error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
});

export default router;

