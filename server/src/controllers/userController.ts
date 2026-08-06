import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../config/prisma.js";

export const getMe = async (req: Request, res: Response): Promise<any> => {
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
          planType: true
        }
      });
      user.credits = newCredits;
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error("Error fetching user /user/me:", error?.message || error);
    return res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
};
