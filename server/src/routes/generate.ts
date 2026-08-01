import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../config/prisma";
import { z } from "zod";
import { AIService } from "../services/aiProvider";
import { saveRemoteImageLocally, saveBase64Locally, deleteLocalImage } from "../services/storage";

const router = Router();

const generateSchema = z.object({
  imageUrl: z.string().min(1),
  prompt: z.string().min(3),
  provider: z.enum(["replicate", "nanobanana", "nanobanana2", "gptimage"]).optional(),
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
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: { credits: true },
    });

    if (user && !user.credits) {
      const newCredits = await prisma.userCredit.create({
        data: {
          userId: user.id,
          remainingCredits: 3,
          planType: "free"
        }
      });
      user.credits = newCredits;
    }

    const resString = (resolution || "").toLowerCase();
    const creditsToDeduct = resString === "4k" ? 2 : 1;

    if (!user || !user.credits || user.credits.remainingCredits < creditsToDeduct) {
      return res.status(403).json({ success: false, message: `Kredit tidak cukup. Dibutuhkan ${creditsToDeduct} kredit untuk resolusi ini.` });
    }

    // Save original image base64 locally first for database history
    const localOriginalUrl = await saveBase64Locally(imageUrl, req);

    // Replicate tidak bisa mengakses http://localhost, gunakan base64 Data URI jika local URL mengandung localhost
    const validAiImageUrl = (localOriginalUrl.includes("localhost") || localOriginalUrl.includes("127.0.0.1")) 
      ? imageUrl 
      : localOriginalUrl;

    // Call modular AI Provider (Secure, server-side only)
    const { url: resultUrl, predictionId } = await AIService.generate({ 
      imageUrl: validAiImageUrl, 
      prompt, 
      provider, 
      aspectRatio,
      resolution,
      outputFormat 
    });

    // Simpan gambar hasil secara permanen ke disk VPS lokal
    const localProcessedUrl = await saveRemoteImageLocally(resultUrl, req);

    // Deduct calculated credits & Save History transactionally
    let updatedCredits, generationRecord;
    try {
      if (predictionId) {
        const existing = await prisma.generation.findUnique({
          where: { replicateId: predictionId }
        });
        if (existing) {
          updatedCredits = await prisma.userCredit.update({
            where: { userId: user.id },
            data: { remainingCredits: { decrement: creditsToDeduct } },
          });
          generationRecord = existing;
          return res.status(200).json({
            success: true,
            data: {
              generation: generationRecord,
              remainingCredits: updatedCredits.remainingCredits,
            },
          });
        }
      }

      [updatedCredits, generationRecord] = await prisma.$transaction([
        prisma.userCredit.update({
          where: { userId: user.id },
          data: { remainingCredits: { decrement: creditsToDeduct } },
        }),
        prisma.generation.create({
          data: {
            userId: user.id,
            replicateId: predictionId || null,
            originalUrl: localOriginalUrl,
            processedUrl: localProcessedUrl,
            preset: prompt,
            status: "completed",
          },
        }),
      ]);
    } catch (dbError: any) {
      console.error("Database error during transaction:", dbError);
      return res.status(500).json({ success: false, message: "Gagal menyimpan hasil generasi ke database (DB Error). Mohon coba lagi." });
    }

    res.status(200).json({
      success: true,
      data: {
        generation: generationRecord,
        remainingCredits: updatedCredits.remainingCredits,
      },
    });
  } catch (error: any) {
    console.error("Error during generation:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const id = req.params.id as string;

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

    // Hapus file dari VPS jika tersimpan lokal
    if (generation.processedUrl) {
      await deleteLocalImage(generation.processedUrl);
    }
    if (generation.originalUrl) {
      await deleteLocalImage(generation.originalUrl);
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

router.post("/sync", async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { 
        generations: {
          orderBy: { createdAt: "desc" }
        }, 
        credits: true 
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token || token.includes("...")) {
      return res.status(200).json({
        success: true,
        syncedCount: 0,
        generations: user.generations,
        remainingCredits: user.credits?.remainingCredits ?? 0,
      });
    }

    // Fast-Exit Memory Check
    const userReplicateIds = new Set(
      user.generations.map((g) => g.replicateId).filter(Boolean) as string[]
    );
    const userPresets = new Set(user.generations.map((g) => g.preset));

    // Fetch recent predictions from Replicate API
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return res.status(200).json({
        success: true,
        syncedCount: 0,
        generations: user.generations,
        remainingCredits: user.credits?.remainingCredits ?? 0,
      });
    }

    const data = await response.json();
    const predictions = data.results || [];

    // Filter succeeded predictions with output
    const succeeded = predictions.filter(
      (p: any) => p.status === "succeeded" && p.output
    );

    let newlySyncedCount = 0;

    for (const pred of succeeded) {
      // 1. Skip if prediction already belongs to this user
      if (userReplicateIds.has(pred.id)) {
        continue;
      }

      // 2. Strict User Isolation: Check if prediction belongs to ANY OTHER user
      const ownedByOther = await prisma.generation.findUnique({
        where: { replicateId: pred.id },
        select: { userId: true },
      });

      if (ownedByOther && ownedByOther.userId !== user.id) {
        // BELONGS TO ANOTHER USER -> SKIP (STRICT ISOLATION)
        continue;
      }

      let outputUrl: string | null = null;
      if (typeof pred.output === "string") {
        outputUrl = pred.output;
      } else if (Array.isArray(pred.output) && pred.output.length > 0) {
        outputUrl = pred.output[0];
      }

      if (!outputUrl) continue;

      const promptText = pred.input?.prompt || "Replicate Generated Image";

      // If not owned by other and not saved by current user
      try {
        const localProcessedUrl = await saveRemoteImageLocally(outputUrl, req);
        const inputImg = Array.isArray(pred.input?.image_input) ? pred.input.image_input[0] : (pred.input?.input_images?.[0] || localProcessedUrl);
        let localOriginalUrl = localProcessedUrl;
        if (typeof inputImg === "string" && inputImg.startsWith("data:image")) {
          localOriginalUrl = await saveBase64Locally(inputImg, req);
        } else if (typeof inputImg === "string" && inputImg.startsWith("http")) {
          localOriginalUrl = await saveRemoteImageLocally(inputImg, req).catch(() => localProcessedUrl);
        }

        await prisma.generation.create({
          data: {
            userId: user.id,
            replicateId: pred.id,
            originalUrl: localOriginalUrl,
            processedUrl: localProcessedUrl,
            preset: promptText,
            status: "completed",
            createdAt: pred.created_at ? new Date(pred.created_at) : new Date(),
          },
        });
        userReplicateIds.add(pred.id);
        newlySyncedCount++;
      } catch (saveErr) {
        console.error(`[Sync Error] Failed to save prediction ${pred.id}:`, saveErr);
      }
    }

    const updatedGenerations = newlySyncedCount > 0 
      ? await prisma.generation.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        })
      : user.generations;

    res.status(200).json({
      success: true,
      syncedCount: newlySyncedCount,
      generations: updatedGenerations,
      remainingCredits: user.credits?.remainingCredits ?? 0,
    });
  } catch (error: any) {
    console.error("Error during sync:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
});

export default router;
