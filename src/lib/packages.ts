/**
 * Client-side mirror of server/src/services/paymentPackages.ts.
 * Used for display and API calls ONLY — the server remains authoritative
 * for business logic (price validation, credit amounts).
 */
export const PACKAGES = {
  starter: { id: "starter" as const, credits: 10, price: 75000, label: "Starter" },
  pro:     { id: "pro" as const,     credits: 30, price: 215000, label: "Pro" },
} as const;

export type PackageId = keyof typeof PACKAGES;

export function getPackage(id: string): (typeof PACKAGES)[PackageId] | null {
  if (id in PACKAGES) return PACKAGES[id as PackageId];
  return null;
}

/** Format Rupiah for display: 75000 → "Rp 75.000" */
export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}
