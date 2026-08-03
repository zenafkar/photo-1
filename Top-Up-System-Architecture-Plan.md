# Top Up System Architecture Plan

## Context

ZenStudio has a credit meter (3 free credits, deducted per generation) but **no way to purchase more credits**. The pricing page is marketing-only — "Beli Paket" buttons just navigate to `/studio`, and the dashboard "Top Up" badge is a dead `<div>` with no `onClick`. Users hit 0 credits and reach a dead end.

This plan builds a complete, production-grade top-up system with:
- **4-layer failure mitigation** (idempotency → atomic transactions → reconciliation → manual recovery)
- **Enterprise security** (callback token verification, rate limiting, audit trail, optimistic locking)
- **Real-time UX** (redirect to Xendit hosted invoice, optimistic credit update, polling with backoff)
- **Efficient storage** (immutable audit log, indexed lookups, minimal query surface)

## Payment Gateway: Xendit

**Why Xendit:** Leading Indonesian payment infrastructure. Single Invoice API integration covers:
- **E-Wallets:** GoPay, OVO, DANA, ShopeePay, LinkAja
- **Virtual Accounts:** BCA, Mandiri, BNI, BRI, Permata
- **Retail Outlets:** Alfamart, Indomaret
- **QRIS:** Scan-to-pay
- **Credit Cards:** Visa, Mastercard, JCB
- **Direct Debit** and **PayLater**

Xendit Invoice provides a hosted checkout page — user is redirected to pay, no iframe/Snap JS needed. Simpler CSP, simpler frontend, simpler webhook verification (static callback token vs SHA512 signature computation).

### Midtrans vs Xendit — Why the Switch

| Aspect | Midtrans | Xendit |
|---|---|---|
| Frontend integration | Snap iframe (CSP `frame-src` needed) | Redirect to hosted invoice (no CSP changes) |
| Webhook verification | SHA512 hash computation + timing-safe compare | Static `x-callback-token` header match |
| Status complexity | 7 statuses + fraud_status dimension | 5 simple statuses (PENDING/PAID/SETTLED/EXPIRED/FAILED) |
| API auth | Server key in body | Basic Auth (Base64 API key — industry standard) |
| Documentation | Good | Excellent, cleaner REST API |
| UMKM payment coverage | Full (all methods) | Full (all methods) |

---

## 1. Database Schema Changes

### Modified: `UserCredit`
```prisma
model UserCredit {
  id               String   @id @default(uuid())
  userId           String   @unique
  remainingCredits Int      @default(3)
  planType         String   @default("free") // "free", "starter", "pro"
  version          Int      @default(0)      // optimistic locking
  updatedAt        DateTime @updatedAt

  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions     CreditTransaction[]
}
```

### New: `PaymentOrder`
```prisma
model PaymentOrder {
  id                String   @id @default(uuid())
  userId            String
  idempotencyKey    String                // Client-generated UUID per purchase attempt
  xenditInvoiceId   String   @unique      // Xendit invoice ID (e.g. "66a1b2c3d4e5f6g7h8i9j0k1")
  externalId        String   @unique      // Our order reference (e.g. "ZEN-20260803-AB12CD34")
  packageId         String                // "starter" | "pro"
  credits           Int                   // credits in this package (10 | 30)
  amount            Int                   // in Rupiah (75000 | 215000)
  status            String   @default("creating") // creating|pending|paid|settled|expired|failed
  invoiceUrl        String?               // Xendit hosted checkout page URL (user redirects here)
  paymentMethod     String?               // e.g. "GOPAY", "OVO", "DANA", "BCA", "QRIS"
  paymentChannel    String?               // more specific: "GOPAY_WEB", "BCA_VA", "QRIS_DYNAMIC"
  xenditPaymentId   String?               // Xendit payment ID from webhook
  rawResponse       Json?                 // Full Xendit payload snapshot (auth token stripped)
  notifiedAt        DateTime?             // Last webhook received
  reconcileCount    Int      @default(0)  // Layer 3 reconciliation attempts
  lastReconcileAt   DateTime?
  paidAt            DateTime?
  settledAt         DateTime?
  expiredAt         DateTime?             // Server-side soft expiry (invoices expire after 24h by default)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  creditTransactions CreditTransaction[]

  @@unique([userId, idempotencyKey])       // Layer 1: idempotency scoped to user, DB-enforced
  @@index([status, createdAt])             // Layer 3: reconciliation scan query
  @@index([userId, createdAt])             // User order history
  @@index([xenditInvoiceId])               // Webhook lookup
}
```

### New: `CreditTransaction` (immutable audit log)
```prisma
model CreditTransaction {
  id              String   @id @default(uuid())
  userId          String
  orderId         String?               // FK → PaymentOrder (null for signup bonus, generation spend)
  type            String                // "welcome_bonus" | "purchase" | "refund" | "admin_credit" | "admin_debit" | "reconcile_correction" | "generation_spend"
  amount          Int                   // signed: +N = credits added, -N = credits deducted
  balanceAfter    Int                   // snapshot of remainingCredits after this operation
  reason          String                // human-readable Indonesian description
  idempotencyKey  String?               // from PaymentOrder, for dedup
  operatorId      String?               // clerkId of admin (null for automated ops)
  metadata        Json?                 // arbitrary debug info (provider, resolution, etc.)
  createdAt       DateTime @default(now())

  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  order           PaymentOrder? @relation(fields: [orderId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@index([orderId])
  @@index([idempotencyKey])
}
```

---

## 2. New Server Routes

### Centralized Credit Service: `server/src/services/credits.ts` (NEW — all mutations go through here)

Every credit change (grant, deduct, refund, admin adjustment) routes through this single service, ensuring:
- Optimistic locking via `version` field (retry ×3 on version mismatch)
- Immutable `CreditTransaction` audit row on every mutation
- Balance-never-below-zero guard
- Shared between payments, generate, reconciliation, and admin commands

```ts
export const creditOps = {
  async add(tx: Prisma.TransactionClient, userId: string, amount: number, opts: {
    type: string; orderId?: string; reason: string;
    idempotencyKey?: string; operatorId?: string; metadata?: any;
  }) { /* increment with version check + audit log */ },

  async deduct(tx: Prisma.TransactionClient, userId: string, amount: number, opts: {...}) {
    /* decrement with WHERE remainingCredits >= amount inside transaction + audit log */
  },

  async refund(tx: Prisma.TransactionClient, userId: string, amount: number, opts: {...}) {
    /* deduct but never below 0; if insufficient, partial refund + Telegram alert (Layer 4) */
  },
};
```

This also fixes the **check-then-act race condition** in `generate.ts` — the credit check moves inside the `$transaction` with `WHERE remainingCredits >= creditsToDeduct`, making it atomic.

### Package Catalog: `server/src/services/paymentPackages.ts` (NEW)

```ts
export const CREDIT_PACKAGES = {
  starter: { credits: 10, price: 75000, label: "Starter" },
  pro:     { credits: 30, price: 215000, label: "Pro" },
} as const;
```
Server is always the authoritative source. Client mirrors prices for display only.

### `POST /api/v1/payments/orders` (Protected)
**Middleware:** `requireAuth` + `paymentLimiter` (5 req/min per **user**, keyed on `req.auth.userId`)

**Request:**
```json
{
  "packageId": "starter" | "pro",
  "idempotencyKey": "uuid-v4-client-generated"
}
```

**Logic (Layer 1 safety built in):**
1. `getAuth(req)` → 401 if missing
2. Zod validation: `packageId` enum, `idempotencyKey` UUID format → 400 on fail
3. Resolve package from `CREDIT_PACKAGES` → 400 if unknown
4. Lookup/create user + credits record (reuse existing lazy-init pattern from `user.ts`)
5. **Layer 1 — Idempotency check:** `findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey } } })`
   - Exists + `pending` → return `200` with existing `invoiceUrl` (idempotent replay)
   - Exists + `paid`/`settled` → return `409` "Pembayaran untuk permintaan ini sudah selesai diproses."
   - Exists + `failed`/`expired` → overwrite (retry path — create new Xendit invoice)
   - Null → create row with status `creating`; on `P2002` unique violation (race), re-fetch and return existing
6. Generate `externalId` (e.g. `ZEN-<timestamp>-<random6>`)
7. **Call Xendit Invoice API** — `POST https://api.xendit.co/v2/invoices` with Basic Auth:
   ```json
   {
     "external_id": "ZEN-20260803-AB12CD34",
     "amount": 75000,
     "currency": "IDR",
     "description": "ZenStudio — Paket Starter (10 Kredit)",
     "payer_email": "user@email.com",
     "success_redirect_url": "https://zenstudio.my.id/studio?payment=success",
     "failure_redirect_url": "https://zenstudio.my.id/studio?payment=failed",
     "invoice_duration": 86400,
     "items": [
       { "name": "Paket Starter — 10 Kredit AI", "quantity": 1, "price": 75000 }
     ]
   }
   ```
8. Xendit responds with `{ id, external_id, invoice_url, status, expiry_date, ... }`
9. Update order → status `pending`, store `xenditInvoiceId`, `invoiceUrl`, `rawResponse` (auth-sanitized)
10. Return `{ orderId: externalId, invoiceUrl, credits, amount, status, expiryDate }`

**Error handling:**
- Xendit API failure → order saved as `failed` with `rawResponse` error snapshot, return `502` "Gagal menghubungi gateway pembayaran. Silakan coba lagi."
- `P2002` unique violation (race on idempotencyKey or externalId) → re-fetch and return existing order (200)

### `POST /api/v1/webhooks/xendit` (Public — Xendit callback)

Mounted inside existing `server/src/routes/webhooks.ts`. **No Clerk auth** — Xendit calls this directly.

**Security layers on this endpoint:**
1. **Callback token verification** (primary): Compare `x-callback-token` request header against `XENDIT_WEBHOOK_TOKEN` env var using `crypto.timingSafeEqual` → 401 "Token webhook tidak valid."
2. **Amount/currency integrity**: Compare `amount` + `currency` from webhook body against stored order → 422 "Jumlah pembayaran tidak sesuai."
3. **IP allowlist** (optional): `XENDIT_ENFORCE_IP_WHITELIST=true` checks `x-forwarded-for` against Xendit known IP ranges
4. **Rate limit**: `xenditWebhookLimiter` (30/min)

**Logic (Layer 2 — atomic settlement):**
1. Verify callback token → 401 on mismatch
2. Extract `id` (invoice ID), `external_id`, `status`, `amount`, `payment_method`, `payment_channel`, `payment_id`
3. Find `PaymentOrder` by `xenditInvoiceId` or `externalId` → 404 if unknown
4. **Amount check** → 422 if mismatch (potential tampering, Telegram alert)
5. **Idempotency**: If stored status already terminal (`settled`/`expired`/`failed`), just update `notifiedAt`/`rawResponse` and return `200`
6. Dispatch by Xendit invoice status:

| Xendit status | Action |
|---|---|
| `PAID` | `settleOrder()` — atomic credit grant |
| `SETTLED` | `settleOrder()` — atomic credit grant (same handler) |
| `PENDING` | No-op (invoice created but unpaid) |
| `EXPIRED` | Mark `expired`, no credit |
| `FAILED` | Mark `failed`, no credit |

7. **`settleOrder()`** — shared by webhook + reconciliation:
```ts
// Atomic compare-and-set: only pending → paid/settled
const claimed = await tx.paymentOrder.updateMany({
  where: { xenditInvoiceId, status: { in: ["pending"] } },
  data: {
    status: "settled", settledAt: new Date(), paidAt: new Date(),
    paymentMethod: body.payment_method, paymentChannel: body.payment_channel,
    xenditPaymentId: body.payment_id, rawResponse: sanitizePayload(body), notifiedAt: new Date(),
  },
});
if (claimed.count === 0) return { skipped: true }; // already settled by concurrent webhook/cron

// Grant credits with version check + audit log
await creditOps.add(tx, userId, credits, {
  type: "purchase", orderId, reason: `Pembelian paket ${packageId}`,
  idempotencyKey, metadata: { xenditInvoiceId, paymentMethod: body.payment_method },
});
```
`sanitizePayload` strips any auth tokens/credentials before persisting to `rawResponse`.

8. **Refund handling**: If Xendit sends a refund event, use `creditOps.refund()` — deduct credits (never below 0). If balance insufficient, partial refund + Telegram alert for manual review (Layer 4).

9. Always respond `200 {"success":true}` within the handler. Xendit expects a quick response and retries on timeout.

### `GET /api/v1/payments/orders/:id` (Protected)
Client polls this to confirm payment. Includes ownership check (userId match). If order is still `pending`, calls `GET https://api.xendit.co/v2/invoices/{xenditInvoiceId}` to refresh from Xendit. Returns `{ orderId, status, credits, amount, paidAt, remainingCredits, paymentMethod }`.

### `GET /api/v1/payments/history` (Protected)
Returns user's payment orders (last 20, ordered by createdAt desc).

---

## 3. Payment Flow (Step-by-Step)

```
User clicks "Top Up" → Modal opens with package selection
  → User selects Starter (Rp 75K / 10 credits) or Pro (Rp 215K / 30 credits)
  → Client generates idempotencyKey (crypto.randomUUID())
  → POST /api/v1/payments/orders { packageId, idempotencyKey }
  → Server creates Xendit invoice → returns { orderId, invoiceUrl }
  → Client opens invoiceUrl in new tab (or redirects)
  → Xendit hosted checkout page: user selects payment method (GoPay/OVO/DANA/VA/QRIS)
  → User completes payment on Xendit page
  → Xendit redirects user back to success_redirect_url (with ?payment=success)
  → Simultaneously: Xendit calls our webhook POST /api/v1/webhooks/xendit
  → Server verifies callback token → atomic credit grant → audit log
  → Client detects return from payment tab → polls GET /payments/orders/:id
  → Credits appear in header badge
```

### UX Detail: Two-Pronged Detection

Since the user pays on a Xendit hosted page (separate tab/window), the client needs two ways to detect completion:

1. **Polling on focus:** When the user returns to the ZenStudio tab, `visibilitychange` event triggers `loadProfile()` (already implemented) + poll any pending order
2. **Webhook pushes state:** Server state is updated immediately by webhook; next poll catches it
3. **Redirect URL param:** `?payment=success` on return URL triggers immediate status check

---

## 4. Webhook Security (Xendit Callback)

### Callback Token Verification (in `server/src/services/xenditWebhook.ts`)

Xendit's webhook verification is simpler and more secure than hash-based schemes — a static token set in the Xendit Dashboard that Xendit sends as an HTTP header on every callback:

```ts
import crypto from "node:crypto";

export function verifyXenditCallback(
  receivedToken: string | undefined,
  storedToken: string
): boolean {
  if (!receivedToken || !storedToken) return false;
  // Timing-safe comparison prevents timing side-channel attacks
  const bufA = Buffer.from(receivedToken);
  const bufB = Buffer.from(storedToken);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
```

### Webhook endpoint security:
- **Primary:** `x-callback-token` header must match `process.env.XENDIT_WEBHOOK_TOKEN` (set in Xendit Dashboard → Webhooks → Callback Token)
- **Secondary (optional):** IP allowlist via `XENDIT_ENFORCE_IP_WHITELIST`
- Reject with `401 {"success":false,"message":"Token webhook tidak valid."}` on mismatch
- Respond within 10 seconds (Xendit timeout) — `res.status(200).end()` immediately if processing is heavy
- Xendit retries webhooks for non-200 responses with exponential backoff

---

## 5. Reconciliation System (Layer 3)

### New service: `server/src/reconciliation/reconcilePayments.ts`

Registered in `startScheduler()` in `server/src/agent/scheduler.ts`:

```ts
cron.schedule('*/15 * * * *', async () => {
  await reconcilePayments();
});
```

### Algorithm (with PostgreSQL advisory lock for single-instance safety under PM2):

```ts
export async function reconcilePayments() {
  // Single-instance guard (safe under PM2 cluster/multi-instance):
  const locked = await prisma.$queryRaw`SELECT pg_try_advisory_lock(72491) AS locked`;
  if (!locked[0].locked) return;

  try {
    // Candidates: stuck in "creating" >10min, or pending unreconciled >15min
    const orders = await prisma.paymentOrder.findMany({
      where: {
        OR: [
          { status: "creating", createdAt: { lt: new Date(Date.now() - 10 * 60_000) } },
          { status: "pending", lastReconcileAt: { lt: new Date(Date.now() - 15 * 60_000) } },
          { status: "pending", lastReconcileAt: null, createdAt: { lt: new Date(Date.now() - 15 * 60_000) } },
        ],
      },
      take: 50, orderBy: { createdAt: "asc" },
    });

    for (const order of orders) {
      // Query Xendit: GET /v2/invoices/{xenditInvoiceId}
      const invoice = await xenditService.getInvoice(order.xenditInvoiceId);
      if (!invoice) continue; // API failure, retry next tick

      switch (invoice.status) {
        case "PAID":
        case "SETTLED":
          await settleOrder(order.xenditInvoiceId, invoice);
          break;
        case "EXPIRED":
        case "FAILED":
          await markTerminal(order, invoice.status.toLowerCase());
          break;
        case "PENDING":
          // If created >24h ago, Xendit auto-expires — soft-expire server-side
          if (order.createdAt < new Date(Date.now() - 24 * 60 * 60_000)) {
            await markTerminal(order, "expired");
          }
          break;
      }

      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: { reconcileCount: { increment: 1 }, lastReconcileAt: new Date() },
      });
    }

    // Escalation: orders with ≥8 failed reconcile attempts (~2 hours)
    const critical = await prisma.paymentOrder.findMany({
      where: {
        reconcileCount: { gte: 8 },
        status: { notIn: ["settled", "expired", "failed"] },
      },
    });
    for (const order of critical) {
      await telegramBot.sendFullActionReport({
        time: new Date().toISOString(),
        component: "Xendit Reconciliation",
        rootCause: `Pesanan ${order.externalId} tidak sinkron (status DB: ${order.status}, percobaan: ${order.reconcileCount})`,
        action: "Perlu tindakan manual via bot: /credit fix <orderId>",
        status: "CRITICAL_PAYMENT_MISMATCH",
      });
    }
  } finally {
    await prisma.$queryRaw`SELECT pg_advisory_unlock(72491)`;
  }
}
```

---

## 6. Manual Recovery (Layer 4)

### New Telegram bot commands in `telegramBot.ts`:
- `/credit add <email> <amount>` — admin grants credits manually, creates CreditTransaction with source "admin_credit"
- `/credit check <email>` — shows user's credit balance, plan type, and last 10 transactions
- `/credit fix <orderId>` — forces reconciliation for a specific order (calls Xendit API + runs settle logic)
- `/order <orderId>` — shows full payment order details + current Xendit invoice status

### Integration with existing approval flow:
- Large grants (>100 credits) require Telegram inline-keyboard approval (reuse existing `sendApprovalRequest`)
- All admin actions logged to CreditTransaction with `operatorId` (clerkId of admin)

---

## 7. Frontend Changes

### New: `src/components/TopUpModal.tsx`
Reuse the exact modal pattern from `PromptGeneratorModal.tsx`:
- `isOpen` / `onClose` props; early return `if (!isOpen) return null`
- Fixed overlay: `fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md`
- Panel: `bg-white rounded-3xl max-w-lg w-full shadow-2xl`
- Two package cards: Starter (Rp 75K → 10 credits) and Pro (Rp 215K → 30 credits), Pro highlighted with "PALING POPULER" badge
- State machine: `idle → creating (POST order) → redirecting → polling → done | error`
- "Bayar Sekarang" button triggers API call, then opens `invoiceUrl` in new tab
- Shows "Menunggu pembayaran..." status with spinner while polling
- Success state: green checkmark + "Pembayaran berhasil! Kredit telah ditambahkan."
- Error state with Indonesian message + retry button
- On unmount/close during pending: continues polling in background

### New: `src/lib/xendit.ts`
```ts
// Thin wrapper for opening Xendit invoice in new tab
// Falls back to window.location redirect if popup blocked
export function openXenditCheckout(invoiceUrl: string): Window | null
```
No CDN script injection needed (Xendit Invoice is a hosted page, not a JS SDK).

### New: `src/hooks/usePaymentStatus.ts`
- Polls `GET /api/v1/payments/orders/:id` with exponential backoff: `[2s, 4s, 8s, 15s, 30s]` (max 5 attempts ≈ 1 minute)
- Clears timer on unmount or terminal status
- Accelerates polling on `visibilitychange` (user returning from payment tab)
- Detects `?payment=success` URL param on mount for immediate check
- Exposes `{ status, isPolling, error }`

### New: `src/context/TopUpContext.tsx`
Minimal provider exposing `openTopUp(packageId?)` → opens `TopUpModal` — so both `PricingSection.tsx` (landing) and `StudioDashboard.tsx` (studio) can trigger the same modal. Wrap at `App.tsx` level.

### New: `src/lib/packages.ts`
Client-side mirror of `CREDIT_PACKAGES` for display only (server is authoritative):
```ts
export const PACKAGES = {
  starter: { credits: 10, price: 75000, label: "Starter" },
  pro:     { credits: 30, price: 215000, label: "Pro" },
} as const;
```

### Modified: `src/pages/StudioDashboard.tsx`
- **Line 328-330:** Replace dead `<div>Top Up</div>` with `onClick={() => openTopUp()}` + `role="button"` + `cursor-pointer`
- Add `const { openTopUp } = useTopUp()`
- After successful settlement in modal: `onCreditsUpdate` callback calls `setCredits` + triggers `loadProfile()` to sync
- **Line 622:** "Kredit Habis - Upgrade" disabled button → onClick opens `openTopUp()`
- **Payment URL detection:** Check for `?payment=success` or `?payment=failed` on mount — show appropriate toast/banner, trigger status refresh

### Modified: `src/components/PricingSection.tsx`
- Replace Starter and Pro "Beli Paket" `<Link to="/studio">` with `onClick={() => openTopUp("starter" | "pro")}`
- Keep `SignedOut` path: Clerk auth modal → redirect to `/studio`, user can then open Top Up from dashboard badge

### Modified: `src/services/api.ts`
```ts
createPaymentOrder: (payload: { packageId: string; idempotencyKey: string }) =>
  request("/payments/orders", { method: "POST", body: JSON.stringify(payload) }),
getPaymentOrder: (id: string) =>
  request(`/payments/orders/${id}`),
```

### CSP Update — `index.html`
Xendit Invoice is a full-page redirect (not an iframe), so **no `frame-src` change is needed**. Only addition:

```
connect-src 'self'
  https://api.zenstudio.my.id https://clerk.zenstudio.my.id https://clerk.com https://*.clerk.accounts.dev
  https://api.xendit.co;                   ← NEW: server-side API calls to Xendit
```

That's it. No `script-src`, `img-src`, or `frame-src` changes. The user interacts with Xendit on Xendit's own domain (browser navigates away), not inside our page.

### New env vars (frontend `.env`):
```
VITE_XENDIT_ENV=sandbox                      # "sandbox" or "production"
```

### New env vars (server `.env`):
```
XENDIT_API_KEY=xnd_development_...           # SECRET — never exposed to client
XENDIT_WEBHOOK_TOKEN=wh_token_from_dashboard # Callback verification token
XENDIT_IS_PRODUCTION=false
XENDIT_ENFORCE_IP_WHITELIST=false
TELEGRAM_ADMIN_CHAT_IDS=123456789             # chat IDs allowed to run /credit commands
```

---

## 8. Security Measures (Comprehensive)

| Layer | Measure | Implementation |
|---|---|---|
| Transport | HTTPS-only | Already via Nginx |
| Auth | Clerk token on all user-facing routes | Existing `requireAuth` middleware |
| Input | Zod validation on all endpoints | Pattern from `generate.ts:10-30` |
| Rate limit | 5 payment creates/min/user | New `paymentLimiter` keyed on `req.auth.userId` |
| Rate limit | 30 webhook calls/min/IP | New `xenditWebhookLimiter` |
| Webhook auth | Callback token via `timingSafeEqual` | `x-callback-token` header vs `XENDIT_WEBHOOK_TOKEN` |
| Amount integrity | Compare webhook `amount` + `currency` against stored order | 422 on mismatch + Telegram alert |
| Idempotency | UUID key per purchase attempt + DB unique constraint | `@@unique([userId, idempotencyKey])` |
| Atomicity | Prisma `$transaction` for credit grant | `settleOrder()` with compare-and-set |
| Optimistic lock | `version` field on UserCredit | Prevents lost updates (retry ×3) |
| Audit | Immutable CreditTransaction log | Every credit change recorded with reason, operator, balance snapshot |
| Secrets | API key never leaves server | Only Basic Auth header on server-side requests |
| CSP | Minimal — only `connect-src` addition | `https://api.xendit.co` for server-side API (also allows health-check from browser if needed) |
| Webhook IP | Optional IP allowlist | `XENDIT_ENFORCE_IP_WHITELIST` |

---

## 9. Error Handling at Every Failure Point

| Failure | User sees | System does |
|---|---|---|
| Xendit API down (invoice creation) | "Gagal menghubungi gateway pembayaran. Silakan coba lagi." (502) | Order saved as `failed`, client retries with new idempotencyKey |
| Duplicate idempotency key (pending) | Existing `invoiceUrl` returned (200) — opens payment tab | No duplicate invoice created |
| Duplicate idempotency key (settled) | "Pembayaran untuk permintaan ini sudah selesai diproses." (409) | Client shows success state, refreshes credits |
| Idempotency key race (P2002) | First order returned (200) | Re-fetch and return existing |
| Webhook callback token invalid | (attacker sees 401) | Rejected silently, logged to telemetry |
| Webhook amount mismatch | (422) | Marked for review + Telegram alert (potential tampering) |
| Webhook for unknown invoice | 404 | Logged; alert if repeated (probe) |
| Webhook duplicate notification | 200, no-op | Status transition guard prevents double-settlement |
| Webhook vs reconciliation race | One wins, other skips | `updateMany` CAS returns count 0 for loser |
| DB error during credit grant | Xendit gets 500, retries | Reconciliation cron fixes within 15 min |
| Optimistic lock conflict | Transparent (server retries ×3) | Version check catches race on concurrent credit mutations |
| User closes payment tab without paying | Order stays `pending` | Reconciliation marks `expired` after 24h (Xendit invoice TTL) |
| Popup blocked by browser | Falls back to same-tab redirect | User returns via `success_redirect_url` → detected via URL param |
| User pays but webhook never arrives | Credits appear on next poll (within 30s) | Client polls with exponential backoff; reconciliation as ultimate fallback |
| Credits granted but client didn't see it | Next profile load catches up | `loadProfile()` on dashboard mount + focus/visibility sync |
| User pays but Xendit redirect fails | Polling detects PAID status | Webhook + polling independently converge |
| Reconciliation finds paid-but-uncredited | Telegram alert sent | Auto-grants credits + audit log |
| Reconciliation fails ×8 (2 hours) | — | Telegram CRITICAL_PAYMENT_MISMATCH alert |
| Refund with insufficient balance | — | Partial deduction + Telegram alert for manual review (Layer 4) |

---

## 10. File Structure

### New Files
```
server/src/
├── routes/
│   └── payments.ts                       # POST/GET payment endpoints
├── services/
│   ├── xendit.ts                         # Xendit API client (Invoice create, getInvoice, Basic Auth)
│   ├── xenditWebhook.ts                  # Callback token verification, status mapping (pure functions)
│   ├── credits.ts                        # Centralized credit ops: add/deduct/refund with version lock + audit log
│   └── paymentPackages.ts                # CREDIT_PACKAGES catalog (server-side source of truth)
├── reconciliation/
│   ├── reconcilePayments.ts              # Layer 3 cron job
│   └── adminCommands.ts                  # Layer 4: /credit add|check|fix Telegram handlers

src/
├── components/
│   └── TopUpModal.tsx                    # Package selection + payment flow (opens Xendit invoice URL)
├── context/
│   └── TopUpContext.tsx                  # Cross-component modal access (openTopUp)
├── hooks/
│   └── usePaymentStatus.ts              # Exponential backoff polling hook
├── lib/
│   ├── packages.ts                       # Client mirror of CREDIT_PACKAGES (display only)
│   └── openXenditCheckout.ts             # Opens invoice URL in new tab with popup-blocker fallback
```

### Modified Files
```
server/prisma/schema.prisma               # +PaymentOrder, +CreditTransaction, UserCredit.version
server/src/app.ts                         # paymentLimiter, route mounting
server/src/routes/webhooks.ts             # + /xendit subroute
server/src/routes/generate.ts             # credit deduction → via credits.ts (atomic check-then-deduct)
server/src/agent/scheduler.ts             # + reconcilePayments cron
server/src/agent/telegramBot.ts           # + /credit, /order commands
src/services/api.ts                       # + createPaymentOrder, getPaymentOrder
src/pages/StudioDashboard.tsx             # Wire Top Up button + modal + credit refresh + payment URL detection
src/components/PricingSection.tsx         # Wire "Beli Paket" → openTopUp
src/App.tsx                               # TopUpProvider wrap
index.html                                # CSP: +connect-src for api.xendit.co
.env (root)                               # + VITE_XENDIT_ENV
server/.env                               # + XENDIT_API_KEY, XENDIT_WEBHOOK_TOKEN, etc.
```

---

## 11. Implementation Order

### Phase 1: Foundation (server-side, no visible change)
1. **Schema + migration** — `prisma migrate dev --name add-payment-orders` → `prisma generate`
2. **Centralized credit service** (`credits.ts`) — add/deduct/refund with version lock + audit log
3. **Refactor `generate.ts`** — route credit deduction through `creditOps.deduct()` (fixes check-then-act race)

### Phase 2: Payment backend
4. **Package catalog** (`paymentPackages.ts`)
5. **Xendit service** (`xendit.ts` + `xenditWebhook.ts`) — Invoice create, getInvoice, callback token verify, status mapping
6. **Payment routes** (`payments.ts`) — create-order, status polling
7. **Webhook endpoint** — add `/xendit` subroute in `webhooks.ts`
8. **Wire `app.ts`** — `paymentLimiter`, route mounting

### Phase 3: Safety net
9. **Reconciliation** (`reconcilePayments.ts`) — register cron in `scheduler.ts` with advisory lock
10. **Telegram admin commands** (`adminCommands.ts` + extend `telegramBot.ts`) — `/credit add|check|fix`, `/order`

### Phase 4: Frontend
11. **`openXenditCheckout.ts`** + **`packages.ts`** — client-side libs
12. **`usePaymentStatus.ts`** hook
13. **`TopUpContext.tsx`** — wrap in `App.tsx`
14. **`TopUpModal.tsx`** — modal with full payment flow (API → new tab → poll)
15. **Wire `StudioDashboard.tsx`** — Top Up badge + "Kredit Habis" button + `?payment=success` detection
16. **Wire `PricingSection.tsx`** — "Beli Paket" buttons
17. **CSP update** (`index.html`) — `connect-src` for `api.xendit.co`

### Phase 5: Testing & config
18. **Server tests** — xenditWebhook, payments, reconciliation, credits
19. **Frontend tests** — TopUpModal, usePaymentStatus, openXenditCheckout
20. **Env vars** — `.env` (server + frontend), `.env.example` update
21. **Xendit Sandbox E2E** — ngrok webhook test with simulated payments

---

## 12. Verification Plan

### Xendit Sandbox Setup
1. Register at [xendit.co](https://www.xendit.co/) → Dashboard → Settings → API Keys
2. Copy API Key (starts with `xnd_development_...` for sandbox)
3. Set webhook URL in Dashboard → Webhooks → `https://<ngrok-url>/api/v1/webhooks/xendit`
4. Set Callback Token in Dashboard → copy to `XENDIT_WEBHOOK_TOKEN` env var

### Local Testing
1. Set `XENDIT_IS_PRODUCTION=false`, start dev server
2. Open dashboard, click "Top Up" → select package → click "Bayar Sekarang"
3. New tab opens with Xendit sandbox invoice page
4. Use Xendit test credentials:
   - **GoPay/OVO/DANA:** Simulated e-wallet payment (auto-success in sandbox)
   - **Virtual Account:** Use test VA numbers provided by Xendit
   - **QRIS:** Static test QR
   - **Credit Card:** `5555 5555 5555 4444` (sandbox test card)
5. Complete simulated payment on Xendit page
6. Xendit redirects back to app with `?payment=success`
7. Webhook fires → credits increment
8. Check DB: PaymentOrder status = "settled", CreditTransaction row created, remainingCredits +10/30
9. Close/reopen dashboard → credit badge shows new balance

### Edge Case Testing
1. Close payment tab mid-payment → return to app → focus triggers poll → status detected within 30s
2. Submit same idempotencyKey twice → second call returns existing `invoiceUrl`
3. Simulate webhook with wrong callback token → rejected 401
4. Kill server between payment and webhook → reconciliation cron fixes within 15 min
5. Concurrent webhooks for same invoice → only one credit grant (CAS guard)
6. Popup blocked → user redirected in same tab → `success_redirect_url` brings them back
7. Invoice expires (24h) → reconciliation marks `expired`

### Production Verification
1. Deploy to VPS
2. Set `XENDIT_IS_PRODUCTION=true`, use production API key (`xnd_production_...`)
3. Set webhook URL to `https://zenstudio.my.id/api/v1/webhooks/xendit`
4. Make a real minimum payment (Rp 75.000 Starter)
5. Verify end-to-end: invoice → payment → webhook → credits → Telegram notification
6. Monitor reconciliation cron output in logs

---

## 13. Xendit API Reference (Quick Reference for Implementation)

### Create Invoice
```
POST https://api.xendit.co/v2/invoices
Authorization: Basic <base64(API_KEY:)>
Content-Type: application/json

{
  "external_id": "ZEN-20260803-AB12CD34",
  "amount": 75000,
  "currency": "IDR",
  "description": "ZenStudio — Paket Starter (10 Kredit)",
  "payer_email": "user@email.com",
  "success_redirect_url": "https://zenstudio.my.id/studio?payment=success",
  "failure_redirect_url": "https://zenstudio.my.id/studio?payment=failed",
  "invoice_duration": 86400,
  "items": [{ "name": "Paket Starter — 10 Kredit AI", "quantity": 1, "price": 75000 }]
}
```

Response: `{ id, external_id, user_id, status, invoice_url, amount, expiry_date, ... }`

### Get Invoice by ID
```
GET https://api.xendit.co/v2/invoices/{invoice_id}
Authorization: Basic <base64(API_KEY:)>
```

Response: `{ id, external_id, status, amount, payment_method, payment_channel, payment_id, paid_at, ... }`

### Webhook Payload (POST to our server)
```json
{
  "id": "66a1b2c3d4e5f6g7h8i9j0k1",
  "external_id": "ZEN-20260803-AB12CD34",
  "user_id": "xendit_user_id",
  "status": "PAID",
  "amount": 75000,
  "currency": "IDR",
  "payment_method": "GOPAY",
  "payment_channel": "GOPAY_WEB",
  "payment_id": "gopay-payment-id-xxx",
  "paid_at": "2026-08-03T12:00:00.000Z",
  "description": "ZenStudio — Paket Starter (10 Kredit)"
}
```
Callback token sent as HTTP header: `x-callback-token: <your_webhook_token>`

### Status Mapping for Our System

| Xendit Invoice Status | Our PaymentOrder.status | Action |
|---|---|---|
| `PENDING` | `pending` | Waiting for payment |
| `PAID` | `settled` | Credit granted |
| `SETTLED` | `settled` | Credit granted (funds settled to merchant) |
| `EXPIRED` | `expired` | No credit |
| `FAILED` | `failed` | No credit |

---

## Bug Fixes Included (from credit system analysis)

These pre-existing issues get fixed as part of this work:

1. **Check-then-act race condition** in `generate.ts`: The credit check (L62) and deduction (L110) are non-atomic. Fix by moving the check inside the `$transaction` with a `WHERE remainingCredits >= creditsToDeduct`.
2. **Triplicated pricing logic**: Remove inline copies in `StudioDashboard.tsx` and `generate.ts`, import from shared `src/lib/credits.ts` (extend it to be usable server-side).
3. **UserCredit.version**: Already added by this plan for optimistic locking — also prevents the concurrent double-spend bug.
