import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../config/prisma";
import { z } from "zod";
import { AIService } from "../services/aiProvider";
import { saveRemoteImageLocally, saveBase64Locally, deleteLocalImage } from "../services/storage";
import { isAllowedUrl } from "../services/urlSafety";

const router = Router();

const generateSchema = z.object({
  imageUrls: z.array(
    z.string().min(1).max(5000).refine(isAllowedUrl, {
      message: "URL tidak valid. Gunakan HTTPS atau data:image (PNG/JPEG/WebP) base64.",
    })
  ).min(1).max(5),
  prompt: z.string().min(3).max(2000),
  provider: z.enum(["replicate", "nanobanana", "nanobanana2", "gptimage"]).optional(),
  aspectRatio: z.string().max(20).optional(),
  resolution: z.enum(["1k", "2k", "4k"]).optional(),
  outputFormat: z.enum(["jpg", "jpeg", "png", "webp"]).optional(),
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
    const { imageUrls, prompt, provider, aspectRatio, resolution, outputFormat } = parsed.data;

    // Server-side size validation: reject base64 images larger than ~10MB each
    const MAX_BASE64_SIZE = 15 * 1024 * 1024; // 15MB (~10MB raw image + base64 overhead)
    for (const imageUrl of imageUrls) {
      if (imageUrl.startsWith("data:") && imageUrl.length > MAX_BASE64_SIZE) {
        return res.status(413).json({ success: false, message: "Ukuran salah satu gambar terlalu besar (maksimal 10MB per gambar). Silakan gunakan gambar dengan ukuran lebih kecil." });
      }
    }

    // Fetch user and check credits
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: { credits: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan." });
    }

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

    // ── Early credit check: fail BEFORE any expensive work ──
    const currentCredits = user.credits?.remainingCredits ?? 0;
    if (currentCredits < creditsToDeduct) {
      return res.status(403).json({
        success: false,
        message: `Kredit tidak cukup. Dibutuhkan ${creditsToDeduct}, tersedia ${currentCredits}.`,
      });
    }

    // ── Deduct credits atomically BEFORE the AI call ──
    // If the AI call fails later, we refund. This prevents zero-credit users
    // from consuming paid Replicate inference + disk writes.
    let deductionResult: { credits: { remainingCredits: number }; generation: any };
    try {
      deductionResult = await prisma.$transaction(async (tx) => {
        const deducted = await tx.userCredit.updateMany({
          where: {
            userId: user!.id,
            remainingCredits: { gte: creditsToDeduct },
          },
          data: {
            remainingCredits: { decrement: creditsToDeduct },
            version: { increment: 1 },
          },
        });

        if (deducted.count === 0) {
          const current = await tx.userCredit.findUnique({ where: { userId: user!.id } });
          throw new Error(
            `Kredit tidak cukup. Dibutuhkan ${creditsToDeduct}, tersedia ${current?.remainingCredits ?? 0}.`
          );
        }

        // Re-fetch updated balance
        const updated = await tx.userCredit.findUnique({ where: { userId: user!.id } });
        if (!updated) throw new Error("Credit record disappeared during deduction.");

        // Immutable audit log
        await tx.creditTransaction.create({
          data: {
            userId: user!.id,
            type: "generation_spend",
            amount: -creditsToDeduct,
            balanceAfter: updated.remainingCredits,
            reason: `Generasi gambar: ${prompt.slice(0, 60)}`,
          },
        });

        // Save generation record with "pending" status
        const gen = await tx.generation.create({
          data: {
            userId: user!.id,
            originalUrl: "",
            processedUrl: null,
            preset: prompt,
            status: "pending",
          },
        });

        return { credits: updated, generation: gen };
      });
    } catch (dbError: any) {
      if (dbError?.message?.includes("Kredit tidak cukup")) {
        return res.status(403).json({ success: false, message: dbError.message });
      }
      console.error("Database error during credit deduction:", dbError);
      return res.status(500).json({ success: false, message: "Gagal memproses kredit. Mohon coba lagi." });
    }

    // ── Now do the expensive work: save original, call AI, save result ──
    let localOriginalUrls: string[] = [];
    let localProcessedUrl = "";
    let predictionId: string | undefined;

    try {
      // Save original images locally
      for (const imageUrl of imageUrls) {
        const localUrl = await saveBase64Locally(imageUrl, req);
        localOriginalUrls.push(localUrl);
      }

      // Replicate tidak bisa mengakses http://localhost, gunakan base64 Data URI jika local URL mengandung localhost
      const validAiImageUrls = localOriginalUrls.map((localUrl, i) =>
        (localUrl.includes("localhost") || localUrl.includes("127.0.0.1"))
          ? imageUrls[i]
          : localUrl
      );

      // Call modular AI Provider (Secure, server-side only)
      const result = await AIService.generate({
        imageUrls: validAiImageUrls,
        prompt,
        provider,
        aspectRatio,
        resolution,
        outputFormat
      });
      predictionId = result.predictionId;

      // Dedup: if this prediction already exists for this user, refund and return existing
      if (predictionId) {
        const existing = await prisma.generation.findFirst({
          where: { replicateId: predictionId, userId: user!.id }
        });
        if (existing) {
          // Clean up the original files we already saved (would otherwise leak)
          for (const url of localOriginalUrls) {
            try { await deleteLocalImage(url); } catch (e: any) {
              console.warn("[Generate] Failed to clean up leaked original file:", e?.message);
            }
          }

          // Refund the credits we just deducted
          const refundResult = await prisma.$transaction(async (tx) => {
            await tx.userCredit.update({
              where: { userId: user!.id },
              data: {
                remainingCredits: { increment: creditsToDeduct },
                version: { increment: 1 },
              },
            });
            const updated = await tx.userCredit.findUnique({ where: { userId: user!.id } });
            await tx.creditTransaction.create({
              data: {
                userId: user!.id,
                type: "refund",
                amount: creditsToDeduct,
                balanceAfter: updated!.remainingCredits,
                reason: "Refund: duplicate replicateId — generation already exists",
              },
            });
            // Clean up the pending generation row
            await tx.generation.delete({ where: { id: deductionResult.generation.id } });
            return updated;
          });

          return res.status(200).json({
            success: true,
            data: {
              generation: existing,
              remainingCredits: refundResult!.remainingCredits,
            },
          });
        }
      }

      // Save processed image locally
      localProcessedUrl = await saveRemoteImageLocally(result.url, req);

      // Update generation to "completed"
      await prisma.generation.update({
        where: { id: deductionResult.generation.id },
        data: {
          replicateId: predictionId || null,
          originalUrl: JSON.stringify(localOriginalUrls),
          processedUrl: localProcessedUrl,
          status: "completed",
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          generation: {
            ...deductionResult.generation,
            replicateId: predictionId || null,
            originalUrl: JSON.stringify(localOriginalUrls),
            processedUrl: localProcessedUrl,
            status: "completed",
          },
          remainingCredits: deductionResult.credits.remainingCredits,
        },
      });
    } catch (aiError: any) {
      console.error("AI generation failed after credit deduction:", aiError);

      // ── Refund credits on AI failure ──
      let refunded = false;
      try {
        await prisma.$transaction(async (tx) => {
          // Refund the spent credits
          await tx.userCredit.update({
            where: { userId: user!.id },
            data: {
              remainingCredits: { increment: creditsToDeduct },
              version: { increment: 1 },
            },
          });

          // Audit the refund
          const updated = await tx.userCredit.findUnique({ where: { userId: user!.id } });
          await tx.creditTransaction.create({
            data: {
              userId: user!.id,
              type: "refund",
              amount: creditsToDeduct,
              balanceAfter: updated!.remainingCredits,
              reason: `Refund: AI generation gagal — ${(aiError?.message || "unknown error").slice(0, 60)}`,
            },
          });

          // Mark generation as failed
          await tx.generation.update({
            where: { id: deductionResult.generation.id },
            data: { status: "failed" },
          });
        });
        refunded = true;

        // Clean up saved files (outside transaction — file ops shouldn't roll back DB)
        for (const url of localOriginalUrls) {
          try { await deleteLocalImage(url); } catch {}
        }
        if (localProcessedUrl) {
          try { await deleteLocalImage(localProcessedUrl); } catch {}
        }
      } catch (refundError) {
        console.error("CRITICAL: Failed to refund credits after AI failure:", refundError);
      }

      return res.status(500).json({
        success: false,
        message: refunded
          ? "Gagal menghasilkan gambar. Kredit telah dikembalikan. Mohon coba lagi."
          : "Gagal menghasilkan gambar dan gagal mengembalikan kredit. Mohon hubungi support.",
      });
    }
  } catch (error: any) {
    console.error("Error during generation:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan internal. Mohon coba lagi." });
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
      try {
        const parsed = JSON.parse(generation.originalUrl);
        if (Array.isArray(parsed)) {
          for (const url of parsed) {
            await deleteLocalImage(url);
          }
        } else {
          await deleteLocalImage(generation.originalUrl);
        }
      } catch {
        await deleteLocalImage(generation.originalUrl);
      }
    }

    await prisma.generation.delete({
      where: { id }
    });

    res.status(200).json({ success: true, message: "Generation deleted successfully" });
  } catch (error) {
    console.error("Error deleting generation:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan internal." });
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
    res.status(500).json({ success: false, message: "Terjadi kesalahan internal." });
  }
});

export default router;
