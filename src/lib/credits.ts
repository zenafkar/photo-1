/**
 * Compute credits to deduct based on model and resolution.
 * Mirrors the logic in StudioDashboard.tsx and server/src/routes/generate.ts.
 */
export function computeCreditsToDeduct(resolution: string, provider: string): number {
  // Nano Banana models always cost 2 credits
  if (provider === "nanobanana" || provider === "nanobanana2") {
    return 2;
  }
  // 4K costs 2 credits for other providers
  const resString = (resolution || "").toLowerCase();
  if (resString === "4k") {
    return 2;
  }
  return 1;
}
