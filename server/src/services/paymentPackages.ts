/** Server-side authoritative source of truth for pricing.
 *  Client mirrors this for display only — never for business logic. */
export const CREDIT_PACKAGES = {
  starter: { credits: 10, price: 75000, label: "Starter" },
  pro:     { credits: 30, price: 215000, label: "Pro" },
} as const;

export type PackageId = keyof typeof CREDIT_PACKAGES;

export function getPackage(id: string): (typeof CREDIT_PACKAGES)[PackageId] | null {
  if (Object.hasOwn(CREDIT_PACKAGES, id)) return CREDIT_PACKAGES[id as PackageId];
  return null;
}
