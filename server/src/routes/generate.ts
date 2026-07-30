import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../config/prisma";
import { z } from "zod";
import { AIService } from "../services/aiProvider";

const router = Router();

const generateSchema = z.object({
  imageUrl: z.string().url(),
  prompt: z.string().min(3),
  provider: z.enum(["replicate", "falai", "nanobanana", "openai"]).optional(),
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Validate Input
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid payload", errors: parsed.error.issues });
    }
    const { imageUrl, prompt, provider } = parsed.data;

    // Fetch user and check credits
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { credits: true },
    });

    if (!user || !user.credits || user.credits.remainingCredits <= 0) {
      return res.status(403).json({ success: false, message: "Insufficient credits. Please upgrade." });
    }

    // Call modular AI Provider (Secure, server-side only)
    const resultUrl = await AIService.generate({ imageUrl, prompt, provider });

    // Deduct 1 credit & Save History transactionally
    const [updatedCredits, generationRecord] = await prisma.$transaction([
      prisma.userCredit.update({
        where: { userId: user.id },
        data: { remainingCredits: { decrement: 1 } },
      }),
      prisma.generation.create({
        data: {
          userId: user.id,
          originalUrl: imageUrl,
          processedUrl: resultUrl,
          preset: prompt,
          status: "completed",
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        generation: generationRecord,
        remainingCredits: updatedCredits.remainingCredits,
      },
    });
  } catch (error) {
    console.error("Error during generation:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
