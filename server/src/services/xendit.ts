import { CREDIT_PACKAGES, getPackage, type PackageId } from "./paymentPackages";

const XENDIT_API_KEY = process.env.XENDIT_API_KEY || "";
const XENDIT_IS_PRODUCTION = process.env.XENDIT_IS_PRODUCTION === "true";

// Xendit uses the same API base URL for both sandbox and production.
// Environments are differentiated by the API key prefix:
//   xnd_development_... → sandbox
//   xnd_production_...  → production
function baseUrl(): string {
  return "https://api.xendit.co";
}

function authHeader(): string {
  // Xendit expects Basic Auth with API key as username, empty password
  return `Basic ${Buffer.from(XENDIT_API_KEY + ":").toString("base64")}`;
}

export interface XenditInvoice {
  id: string;
  external_id: string;
  user_id: string;
  status: string;
  amount: number;
  currency: string;
  invoice_url: string;
  expiry_date: string;
  payment_method?: string;
  payment_channel?: string;
  payment_id?: string;
  paid_at?: string;
  description?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
}

export interface CreateInvoiceParams {
  externalId: string;
  packageId: PackageId;
  payerEmail?: string;
}

/** Create a Xendit invoice and return the invoice object. */
export async function createInvoice(params: CreateInvoiceParams): Promise<XenditInvoice> {
  if (!XENDIT_API_KEY) {
    throw new Error("XENDIT_API_KEY is not configured. Set it in environment variables.");
  }

  const pkg = getPackage(params.packageId);
  if (!pkg) {
    throw new Error(`Unknown package: ${params.packageId}`);
  }

  const body = {
    external_id: params.externalId,
    amount: pkg.price,
    currency: "IDR",
    description: `ZenStudio — Paket ${pkg.label} (${pkg.credits} Kredit)`,
    payer_email: params.payerEmail || undefined,
    success_redirect_url: "https://zenstudio.my.id/studio?payment=success",
    failure_redirect_url: "https://zenstudio.my.id/studio?payment=failed",
    invoice_duration: 86400, // 24 hours
    items: [
      {
        name: `Paket ${pkg.label} — ${pkg.credits} Kredit AI`,
        quantity: 1,
        price: pkg.price,
      },
    ],
  };

  const response = await fetch(`${baseUrl()}/v2/invoices`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Xendit invoice creation failed (${response.status}): ${errText}`);
  }

  return response.json() as Promise<XenditInvoice>;
}

/** Fetch an existing invoice by its Xendit ID. */
export async function getInvoice(xenditInvoiceId: string): Promise<XenditInvoice | null> {
  if (!XENDIT_API_KEY) {
    throw new Error("XENDIT_API_KEY is not configured.");
  }

  const response = await fetch(`${baseUrl()}/v2/invoices/${encodeURIComponent(xenditInvoiceId)}`, {
    method: "GET",
    headers: {
      Authorization: authHeader(),
    },
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Xendit getInvoice failed (${response.status}): ${errText}`);
  }

  return response.json() as Promise<XenditInvoice>;
}
