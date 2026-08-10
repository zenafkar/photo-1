import { Request, Response } from "express";
import { createHash } from "node:crypto";
import { getAuth } from "@clerk/express";
import { isDatabaseUnavailable, prisma } from "../config/prisma.js";
import { z } from "zod";
import { AIService } from "../services/aiProvider.js";
import { saveRemoteImageLocally, saveBase64Locally, deleteLocalImage } from "../services/storage.js";
import { isAllowedUrl } from "../services/urlSafety.js";
import { creditOpsTx } from "../services/credits.js";
import { dashboardEvents } from "../services/dashboardEvents.js";
import { ErrorCodes, sendError } from "../middleware/errorContract.js";

const MAX_BASE64_SIZE = 15 * 1024 * 1024; // 15MB encoded payload (~10MB raw image)
const MAX_REMOTE_URL_SIZE = 5000;
const SYNC_TAKE = 20;

const imageUrlSchema = z.string().min(1).superRefine((value, ctx) => {
  const maxSize = value.startsWith("data:") ? MAX_BASE64_SIZE : MAX_REMOTE_URL_SIZE;
  if (value.length > maxSize) {
    ctx.addIssue({
      code: "custom",
      message: value.startsWith("data:")
        ? "Data gambar terlalu besar. Maksimal 10MB per gambar."
        : "URL gambar terlalu panjang.",
    });
  }

  if (!isAllowedUrl(value)) {
    ctx.addIssue({
      code: "custom",
      message: "URL tidak valid. Gunakan HTTPS atau data:image (PNG/JPEG/WebP) base64.",
    });
  }
});

const generateSchema = z.object({
  imageUrls: z.array(imageUrlSchema).min(1).max(5),
  prompt: z.string().trim().min(3).max(2000),
  provider: z.enum(["replicate", "nanobanana", "nanobanana2", "gptimage"]).optional(),
  aspectRatio: z.string().max(20).optional(),
  resolution: z.enum(["1k", "2k", "4k"]).optional(),
  outputFormat: z.enum(["jpg", "jpeg", "png", "webp"]).optional(),
});

const generationsSelect = {
  id: true,
  processedUrl: true,
  preset: true,
  status: true,
  createdAt: true,
} as const;

const completedGenerationsFilter = {
  status: "completed" as const,
  processedUrl: { not: null },
};

export const createGeneration = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return sendError(res, 401, ErrorCodes.UNAUTHORIZED, "Unauthorized");
    }

    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(
        res,
        400,
        ErrorCodes.INVALID_PAYLOAD,
        "Invalid payload",
        parsed.error.issues,
      );
    }
    const { imageUrls, prompt, provider, aspectRatio, resolution, outputFormat } = parsed.data;
    const idempotencyKey = req.get("Idempotency-Key")?.trim() || null;
    if (idempotencyKey && (idempotencyKey.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(idempotencyKey))) {
      return sendError(
        res,
        400,
        ErrorCodes.INVALID_IDEMPOTENCY_KEY,
        "Idempotency-Key tidak valid.",
      );
    }
    const requestFingerprint = createHash("sha256")
      .update(JSON.stringify({ imageUrls, prompt, provider, aspectRatio, resolution, outputFormat }))
      .digest("hex");

    for (const imageUrl of imageUrls) {
      if (imageUrl.startsWith("data:") && imageUrl.length > MAX_BASE64_SIZE) {
        return sendError(
          res,
          413,
          ErrorCodes.INVALID_PAYLOAD,
          "Ukuran salah satu gambar terlalu besar (maksimal 10MB per gambar). Silakan gunakan gambar dengan ukuran lebih kecil.",
        );
      }
    }

    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: { credits: true },
    });

    if (!user) {
      return sendError(res, 404, ErrorCodes.USER_NOT_FOUND, "User tidak ditemukan.");
    }

    if (user && !user.credits) {
      try {
        const newCredits = await prisma.userCredit.create({
          data: { userId: user.id, remainingCredits: 3, planType: "free" },
        });
        user.credits = newCredits;
      } catch (e: any) {
        if (e.code === "P2002") {
          const existingCredits = await prisma.userCredit.findUnique({ where: { userId: user.id } });
          if (existingCredits) user.credits = existingCredits;
        } else {
          throw e;
        }
      }
    }

    if (idempotencyKey) {
      const existingTransaction = await prisma.creditTransaction.findFirst({
        where: { userId: user.id, idempotencyKey },
      });
      if (existingTransaction) {
        if (existingTransaction.type !== "generation_spend") {
          return sendError(
            res,
            409,
            ErrorCodes.IDEMPOTENCY_KEY_REUSED,
            "Idempotency-Key sudah digunakan untuk operasi lain.",
          );
        }

        const metadata = (existingTransaction.metadata && typeof existingTransaction.metadata === "object")
          ? existingTransaction.metadata as Record<string, unknown>
          : {};
        if (metadata.requestFingerprint && metadata.requestFingerprint !== requestFingerprint) {
          return sendError(
            res,
            409,
            ErrorCodes.IDEMPOTENCY_KEY_REUSED,
            "Idempotency-Key digunakan dengan payload yang berbeda.",
          );
        }

        const existingGenerationId = typeof metadata.generationId === "string" ? metadata.generationId : null;
        const existingGeneration = existingGenerationId
          ? await prisma.generation.findUnique({ where: { id: existingGenerationId } })
          : null;
        if (existingGeneration) {
          const currentCredits = await prisma.userCredit.findUnique({ where: { userId: user.id } });
          return res.status(200).json({
            success: true,
            data: {
              generation: existingGeneration,
              remainingCredits: currentCredits?.remainingCredits ?? 0,
              idempotentReplay: true,
            },
          });
        }

        return sendError(
          res,
          409,
          ErrorCodes.GENERATION_OUTCOME_UNKNOWN,
          "Permintaan generation sebelumnya sedang diverifikasi. Silakan tunggu sebelum mencoba lagi.",
          { retryable: true },
        );
      }
    }

    const resString = (resolution || "").toLowerCase();
    let creditsToDeduct = resString === "4k" ? 2 : 1;
    if (provider === "nanobanana2") {
      creditsToDeduct = 2;
    } else if (provider === "nanobanana" || provider === "replicate" || !provider) {
      creditsToDeduct = resString === "4k" ? 3 : 2;
    }

    const currentCredits = user.credits?.remainingCredits ?? 0;
    if (currentCredits < creditsToDeduct) {
      return sendError(
        res,
        403,
        ErrorCodes.INSUFFICIENT_CREDITS,
        `Kredit tidak cukup. Dibutuhkan ${creditsToDeduct}, tersedia ${currentCredits}.`,
      );
    }

    let deductionResult: { credits: { remainingCredits: number; version: number }; generation: any; existing?: boolean };
    try {
      deductionResult = await prisma.$transaction(async (tx) => {
        const result = await creditOpsTx.deduct(tx, user!.id, creditsToDeduct, {
          type: "generation_spend",
          reason: `Generasi gambar: ${prompt.slice(0, 60)}`,
          idempotencyKey: idempotencyKey || undefined,
          metadata: { requestFingerprint },
        });

        if (idempotencyKey) {
          const transaction = await tx.creditTransaction.findUnique({ where: { id: result.transactionId } });
          const metadata = (transaction?.metadata && typeof transaction.metadata === "object")
            ? transaction.metadata as Record<string, unknown>
            : {};
          const existingGenerationId = typeof metadata.generationId === "string" ? metadata.generationId : null;
          if (existingGenerationId) {
            const existingGeneration = await tx.generation.findUnique({ where: { id: existingGenerationId } });
            if (existingGeneration) {
              return {
                credits: { remainingCredits: result.remainingCredits, version: result.version ?? 0 },
                generation: existingGeneration,
                existing: true,
              };
            }
          }
        }

        const gen = await tx.generation.create({
          data: {
            userId: user!.id,
            originalUrl: "",
            processedUrl: null,
            preset: prompt,
            status: "pending",
          },
        });

        if (idempotencyKey) {
          await tx.creditTransaction.update({
            where: { id: result.transactionId },
            data: { metadata: { requestFingerprint, generationId: gen.id } },
          });
        }

        return {
          credits: { remainingCredits: result.remainingCredits, version: result.version ?? 0 },
          generation: gen,
        };
      });
    } catch (dbError: any) {
      if (dbError?.message?.includes("Kredit tidak cukup")) {
        return sendError(
          res,
          403,
          ErrorCodes.INSUFFICIENT_CREDITS,
          dbError.message,
        );
      }
      console.error("Database error during credit deduction:", dbError);
      res.setHeader("Retry-After", "5");
      return sendError(
        res,
        503,
        ErrorCodes.DATABASE_UNAVAILABLE,
        "Database sedang tidak tersedia. Mohon coba lagi beberapa saat.",
        { retryable: true, retryAfter: 5 },
      );
    }

    if (deductionResult.existing) {
      return res.status(200).json({
        success: true,
        data: {
          generation: deductionResult.generation,
          remainingCredits: deductionResult.credits.remainingCredits,
          idempotentReplay: true,
        },
      });
    }

    let localOriginalUrls: string[] = [];
    let localProcessedUrl: string | null = null;
    let predictionId: string | undefined;

    try {
      for (const imageUrl of imageUrls) {
        const localUrl = await saveBase64Locally(imageUrl, req);
        localOriginalUrls.push(localUrl);
      }

      const validAiImageUrls = localOriginalUrls.map((localUrl, i) =>
        (localUrl.includes("localhost") || localUrl.includes("127.0.0.1"))
          ? imageUrls[i]
          : localUrl
      );

      const result = await AIService.generate({
        imageUrls: validAiImageUrls,
        prompt,
        provider,
        aspectRatio,
        resolution,
        outputFormat,
      });
      predictionId = result.predictionId;

      if (predictionId) {
        const existing = await prisma.generation.findFirst({
          where: { replicateId: predictionId, userId: user!.id },
        });
        if (existing) {
          for (const url of localOriginalUrls) {
            try { await deleteLocalImage(url); } catch (e: any) {
              console.warn("[Generate] Failed to clean up leaked original file:", e?.message);
            }
          }

          const refundResult = await prisma.$transaction(async (tx) => {
            const refund = await creditOpsTx.refund(tx, user!.id, creditsToDeduct, {
              type: "refund",
              reason: "Refund: duplicate replicateId — generation already exists",
              idempotencyKey: `generation:${deductionResult.generation.id}:refund`,
            });
            await tx.generation.update({
              where: { id: deductionResult.generation.id },
              data: { status: "failed" },
            });
            return refund;
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

      localProcessedUrl = await saveRemoteImageLocally(result.url, req);
      if (!localProcessedUrl) {
        throw new Error("Output gambar berhasil dibuat tetapi gagal disimpan ke storage permanen.");
      }

      await prisma.generation.update({
        where: { id: deductionResult.generation.id },
        data: {
          replicateId: predictionId || null,
          originalUrl: JSON.stringify(localOriginalUrls),
          processedUrl: localProcessedUrl,
          status: "completed",
        },
      });

      const completedGeneration = {
        ...deductionResult.generation,
        replicateId: predictionId || null,
        originalUrl: JSON.stringify(localOriginalUrls),
        processedUrl: localProcessedUrl,
        status: "completed",
      };

      dashboardEvents.emit("event", {
        type: "generation.completed",
        userId: user!.id,
        version: deductionResult.credits.version,
        generationsLatestTs: completedGeneration.createdAt?.toISOString?.() ?? new Date().toISOString(),
        data: {
          generation: completedGeneration,
          remainingCredits: deductionResult.credits.remainingCredits,
        },
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        data: {
          generation: completedGeneration,
          remainingCredits: deductionResult.credits.remainingCredits,
        },
      });
    } catch (aiError: any) {
      console.error("AI generation failed after credit deduction:", aiError);

      let refunded = false;
      try {
        const refundResult = await prisma.$transaction(async (tx) => {
          const refund = await creditOpsTx.refund(tx, user!.id, creditsToDeduct, {
            type: "refund",
            reason: `Refund: AI generation gagal — ${(aiError?.message || "unknown error").slice(0, 60)}`,
            idempotencyKey: `generation:${deductionResult.generation.id}:refund`,
          });

          await tx.generation.update({
            where: { id: deductionResult.generation.id },
            data: { status: "failed" },
          });

          return refund;
        });
        refunded = true;

        for (const url of localOriginalUrls) {
          try { await deleteLocalImage(url); } catch {}
        }
        if (localProcessedUrl) {
          try { await deleteLocalImage(localProcessedUrl); } catch {}
        }

        dashboardEvents.emit("event", {
          type: "credits.updated",
          userId: user!.id,
          version: refundResult?.version ?? 0,
          timestamp: new Date().toISOString(),
        });
      } catch (refundError) {
        console.error("CRITICAL: Failed to refund credits after AI failure:", refundError);
      }

      return sendError(
        res,
        500,
        ErrorCodes.GENERATION_FAILED,
        refunded
          ? "Gagal menghasilkan gambar. Kredit telah dikembalikan. Mohon coba lagi."
          : "Gagal menghasilkan gambar dan gagal mengembalikan kredit. Mohon hubungi support.",
      );
    }
  } catch (error: any) {
    console.error("Error during generation:", error);
    if (isDatabaseUnavailable(error)) {
      res.setHeader("Retry-After", "5");
      return sendError(
        res,
        503,
        ErrorCodes.DATABASE_UNAVAILABLE,
        "Database sedang tidak tersedia. Mohon coba lagi beberapa saat.",
        { retryable: true, retryAfter: 5 },
      );
    }
    return sendError(res, 500, ErrorCodes.INTERNAL_ERROR, "Terjadi kesalahan internal. Mohon coba lagi.");
  }
};

export const deleteGeneration = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return sendError(res, 401, ErrorCodes.UNAUTHORIZED, "Unauthorized");
    }

    const id = req.params.id as string;

    const user = await prisma.user.findUnique({ where: { clerkId } });

    if (!user) {
      return sendError(res, 404, ErrorCodes.USER_NOT_FOUND, "User not found");
    }

    const generation = await prisma.generation.findUnique({ where: { id } });

    if (!generation || generation.userId !== user.id) {
      return sendError(
        res,
        404,
        ErrorCodes.GENERATION_NOT_FOUND,
        "Generation not found or unauthorized",
      );
    }

    if (generation.processedUrl) {
      await deleteLocalImage(generation.processedUrl);
    }
    if (generation.originalUrl && generation.originalUrl.trim() !== "") {
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

    await prisma.generation.delete({ where: { id } });

    dashboardEvents.emit("event", {
      type: "generation.deleted",
      userId: user.id,
      data: { generationId: id },
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, message: "Generation deleted successfully" });
  } catch (error) {
    console.error("Error deleting generation:", error);
    return sendError(res, 500, ErrorCodes.INTERNAL_ERROR, "Terjadi kesalahan internal.");
  }
};

export const syncGenerations = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return sendError(res, 401, ErrorCodes.UNAUTHORIZED, "Unauthorized");
    }

    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        generations: {
          where: completedGenerationsFilter,
          take: SYNC_TAKE,
          orderBy: { createdAt: "desc" },
          select: generationsSelect,
        },
        credits: true,
      },
    });

    if (!user) {
      return sendError(res, 404, ErrorCodes.USER_NOT_FOUND, "User not found");
    }

    if (!user.credits) {
      const newCredits = await prisma.userCredit.create({
        data: { userId: user.id, remainingCredits: 3, planType: "free" },
      });
      user = { ...user, credits: newCredits };
    }

    const generationsLatestTs =
      user.generations.length > 0
        ? user.generations[0].createdAt.toISOString()
        : null;

    return res.status(200).json({
      success: true,
      syncedCount: 0,
      generations: user.generations,
      remainingCredits: user.credits!.remainingCredits,
      creditsVersion: user.credits!.version,
      generationsLatestTs,
    });
  } catch (error: any) {
    console.error("Error during sync:", error);
    return sendError(res, 500, ErrorCodes.INTERNAL_ERROR, "Terjadi kesalahan internal.");
  }
};
