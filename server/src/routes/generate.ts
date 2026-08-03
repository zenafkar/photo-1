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

    // Server-side size validation: reject base64 images larger than ~10MB
    const MAX_BASE64_SIZE = 15 * 1024 * 1024; // 15MB (~10MB raw image + base64 overhead)
    if (imageUrl && imageUrl.startsWith("data:") && imageUrl.length > MAX_BASE64_SIZE) {
      return res.status(413).json({ success: false, message: "Ukuran gambar terlalu besar (maksimal 10MB). Silakan gunakan gambar dengan ukuran lebih kecil." });
    }

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
    let creditsToDeduct = resString === "4k" ? 2 : 1;
    if (provider === "nanobanana" || provider === "nanobanana2") {
      creditsToDeduct = 2;
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan." });
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

    // Atomic credit deduction + generation save (fixes check-then-act race)
    let updatedCredits: { remainingCredits: number };
    let generationRecord;
    try {
      if (predictionId) {
        const existing = await prisma.generation.findFirst({
          where: { replicateId: predictionId, userId: user.id }
        });
        if (existing) {
          return res.status(200).json({
            success: true,
            data: {
              generation: existing,
              remainingCredits: user.credits!.remainingCredits,
            },
          });
        }
      }

      // Atomic: deduct credits only if sufficient balance remains
      const result = await prisma.$transaction(async (tx) => {
        const deducted = await tx.userCredit.updateMany({
          where: {
            userId: user.id,
            remainingCredits: { gte: creditsToDeduct },
          },
          data: {
            remainingCredits: { decrement: creditsToDeduct },
            version: { increment: 1 },
          },
        });

        if (deducted.count === 0) {
          const current = await tx.userCredit.findUnique({ where: { userId: user.id } });
          throw new Error(
            `Kredit tidak cukup. Dibutuhkan ${creditsToDeduct}, tersedia ${current?.remainingCredits ?? 0}.`
          );
        }

        // Re-fetch updated balance
        const updated = await tx.userCredit.findUnique({ where: { userId: user.id } });
        if (!updated) throw new Error("Credit record disappeared during deduction.");

        // Immutable audit log
        await tx.creditTransaction.create({
          data: {
            userId: user.id,
            type: "generation_spend",
            amount: -creditsToDeduct,
            balanceAfter: updated.remainingCredits,
            reason: `Generasi gambar: ${prompt.slice(0, 60)}`,
          },
        });

        // Save generation record
        const gen = await tx.generation.create({
          data: {
            userId: user.id,
            replicateId: predictionId || null,
            originalUrl: localOriginalUrl,
            processedUrl: localProcessedUrl,
            preset: prompt,
            status: "completed",
          },
        });

        return { credits: updated, generation: gen };
      });

      updatedCredits = { remainingCredits: result.credits.remainingCredits };
      generationRecord = result.generation;

    } catch (dbError: any) {
      // Check for insufficient credits error thrown from inside the transaction
      if (dbError?.message?.includes("Kredit tidak cukup")) {
        return res.status(403).json({ success: false, message: dbError.message });
      }
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

    res.status(200).json({
      success: true,
      syncedCount: 0,
      generations: user.generations,
      remainingCredits: user.credits?.remainingCredits ?? 0,
    });
  } catch (error: any) {
    console.error("Error during sync:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
  }
});

export default router;
