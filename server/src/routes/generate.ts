import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../config/prisma";
import { z } from "zod";
import { AIService } from "../services/aiProvider";

const router = Router();

const generateSchema = z.object({
  imageUrl: z.string().min(1),
  prompt: z.string().min(3),
  provider: z.enum(["replicate", "falai", "nanobanana", "nanobanana2", "openai", "huggingface", "pollinations", "gptimage"]).optional(),
  aspectRatio: z.string().optional(),
  resolution: z.string().optional(),
  outputFormat: z.string().optional(),
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
    const { imageUrl, prompt, provider, aspectRatio, resolution, outputFormat } = parsed.data;

    // Fetch user and check credits
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { credits: true },
    });

    const resString = (resolution || "").toLowerCase();
    const creditsToDeduct = resString === "4k" ? 2 : 1;

    if (!user || !user.credits || user.credits.remainingCredits < creditsToDeduct) {
      return res.status(403).json({ success: false, message: `Kredit tidak cukup. Dibutuhkan ${creditsToDeduct} kredit untuk resolusi ini.` });
    }

    // Call modular AI Provider (Secure, server-side only)
    const resultUrl = await AIService.generate({ 
      imageUrl, 
      prompt, 
      provider, 
      aspectRatio,
      resolution,
      outputFormat 
    });

    // Deduct calculated credits & Save History transactionally
    const [updatedCredits, generationRecord] = await prisma.$transaction([
      prisma.userCredit.update({
        where: { userId: user.id },
        data: { remainingCredits: { decrement: creditsToDeduct } },
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

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const generation = await prisma.generation.findUnique({
      where: { id }
    });

    if (!generation || generation.userId !== user.id) {
      return res.status(404).json({ success: false, message: "Generation not found or unauthorized" });
    }

    await prisma.generation.delete({
      where: { id }
    });

    res.status(200).json({ success: true, message: "Generation deleted successfully" });
  } catch (error) {
    console.error("Error deleting generation:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
