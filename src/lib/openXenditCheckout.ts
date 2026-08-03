/**
 * Open the Xendit hosted invoice URL for payment.
 * Tries a new tab first; falls back to same-tab redirect if the popup is blocked.
 */
export function openXenditCheckout(invoiceUrl: string): void {
  const popup = window.open(invoiceUrl, "_blank", "noopener,noreferrer");

  // If popup was blocked (returns null or closed immediately), redirect in the same tab
  if (!popup || popup.closed || typeof popup.closed === "undefined") {
    window.location.href = invoiceUrl;
  }
}
