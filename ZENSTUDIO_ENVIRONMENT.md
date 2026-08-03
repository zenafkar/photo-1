# 🎨 ZenStudio — Complete Environment Documentation

> [!NOTE]
> **Last Updated:** 2026-08-03 · **Product:** AI-powered professional product photography for e-commerce marketplaces  
> **Purpose:** Full-stack technical environment reference for developers, DevOps, and onboarding.

---

## 📋 Table of Contents

| # | Section |
|---|---------|
| 1 | [Project Overview](#1-project-overview) |
| 2 | [Monorepo Structure](#2-monorepo-structure) |
| 3 | [Tech Stack — Frontend](#3-tech-stack--frontend) |
| 4 | [Tech Stack — Backend](#4-tech-stack--backend) |
| 5 | [Database Schema](#5-database-schema) |
| 6 | [API Endpoints](#6-api-endpoints) |
| 7 | [Authentication & Authorization](#7-authentication--authorization) |
| 8 | [AI Image Generation Pipeline](#8-ai-image-generation-pipeline) |
| 9 | [Payment System (Xendit)](#9-payment-system-xendit) |
| 10 | [Credit System](#10-credit-system) |
| 11 | [AI SRE Agent (Self-Healing)](#11-ai-sre-agent-self-healing) |
| 12 | [Telemetry & Monitoring](#12-telemetry--monitoring) |
| 13 | [Telegram Bot Integration](#13-telegram-bot-integration) |
| 14 | [Cron Scheduler](#14-cron-scheduler) |
| 15 | [File Storage](#15-file-storage) |
| 16 | [Security Architecture](#16-security-architecture) |
| 17 | [Environment Variables](#17-environment-variables) |
| 18 | [Testing Infrastructure](#18-testing-infrastructure) |
| 19 | [Build & Deployment](#19-build--deployment) |
| 20 | [Third-Party Integrations](#20-third-party-integrations) |
| 21 | [Feature Flags](#21-feature-flags) |
| 22 | [Infrastructure & Hosting](#22-infrastructure--hosting) |

---

## 1. Project Overview

**ZenStudio** is a full-stack web application that transforms raw product photos into professional, marketplace-ready images using AI. It targets Indonesian e-commerce sellers on platforms like Tokopedia and Shopee.

### ✨ Core Capabilities

- 🖼️ AI image generation (background replacement, enhancement, restyling)
- 🤖 Multiple AI providers via Replicate.com (Nano Banana Pro, Nano Banana 2, GPT Image 1.5)
- 💳 Credit-based monetization with Xendit payment gateway
- 💰 Pay-as-you-go pricing: **Starter** (10 credits = Rp 75,000) and **Pro** (30 credits = Rp 215,000)
- 🛡️ Self-healing AI SRE agent with Telegram alerts and interactive remediation
- 📊 Full observability stack (telemetry, cron health checks, reconciliation)

### 🌐 Production URL

**➜ https://zenstudio.my.id**

---

## 2. Monorepo Structure

```
zen-dev/
├── index.html                          # SPA entry point
├── package.json                        # Root workspace (frontend)
├── tsconfig.json                       # Frontend TypeScript config (bundler mode)
├── tsconfig.node.json                  # TypeScript config for Vite/Node tooling
├── vite.config.ts                      # Vite build config with code splitting
├── vitest.config.ts                    # Frontend test config (jsdom)
├── tailwind.config.js                  # Tailwind CSS theme
├── postcss.config.js                   # PostCSS plugins
├── .env                                # Frontend env vars
│
├── server/
│   ├── package.json                    # Backend (CommonJS)
│   ├── tsconfig.json                   # Backend TypeScript config (Node16)
│   ├── vitest.config.ts                # Backend test config (node)
│   ├── .env                            # Server env vars
│   ├── .env.example                    # Server env template
│   └── prisma/
│       └── schema.prisma               # Database schema (PostgreSQL)
│
├── src/                                # Frontend source
│   ├── main.tsx                        # React entry (ClerkProvider)
│   ├── App.tsx                         # Router (LandingPage, StudioDashboard)
│   ├── pages/
│   │   ├── LandingPage.tsx             # Marketing/landing page
│   │   └── StudioDashboard.tsx         # Main app dashboard
│   ├── components/                     # React components
│   ├── services/api.ts                 # API client with Clerk auth token
│   ├── lib/                            # Shared utilities
│   └── test/                           # Test setup & mocks
│
└── server/src/
    ├── index.ts                        # Express server entry point
    ├── app.ts                          # Express app factory
    ├── config/
    │   └── prisma.ts                   # Prisma client singleton
    ├── middleware/
    │   ├── auth.ts                     # Clerk requireAuth middleware
    │   ├── error.ts                    # Global error handler
    │   └── telemetry.ts                # Telemetry event emitter
    ├── routes/
    │   ├── health.ts                   # Health check endpoint
    │   ├── user.ts                     # User profile
    │   ├── generate.ts                 # AI image generation
    │   ├── payments.ts                 # Payment order management
    │   ├── webhooks.ts                 # Clerk + Xendit webhooks
    │   └── telemetry.ts                # Client telemetry ingestion
    ├── services/
    │   ├── aiProvider.ts               # AI generation (Replicate)
    │   ├── credits.ts                  # Atomic credit operations
    │   ├── paymentPackages.ts          # Pricing source of truth
    │   ├── storage.ts                  # Local disk image storage
    │   ├── xendit.ts                   # Xendit API client
    │   └── xenditWebhook.ts            # Webhook verification & sanitization
    ├── agent/
    │   ├── agent.ts                    # SRE agent (Gemini 2.0 Flash)
    │   ├── guardrails.ts               # Feature flags, rate limits, data sanitization
    │   ├── scheduler.ts                # Cron jobs (health, reconciliation)
    │   ├── telegramBot.ts              # Telegram bot with admin commands
    │   └── tools/
    │       └── remediationTools.ts      # Auto-fix actions (git push, PM2, GitHub issues)
    ├── reconciliation/
    │   └── reconcilePayments.ts        # Payment reconciliation cron
    └── test/
        ├── setup.ts                    # Test environment setup
        └── prismaMock.ts               # Prisma mock helper
```

---

## 3. Tech Stack — Frontend

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | React | ^19.2.8 | UI library |
| **Language** | TypeScript | ^7.0.2 | Type-safe development |
| **Build Tool** | Vite | ^8.1.5 | Dev server & bundler |
| **Routing** | React Router DOM | ^7.18.2 | Client-side routing (2 pages) |
| **Auth** | Clerk React | ^5.61.9 | User authentication UI |
| **CSS** | Tailwind CSS | ^3.4.19 | Utility-first styling |
| **CSS Post-process** | Autoprefixer | ^10.5.4 | Vendor prefixes |
| **Animation** | Framer Motion | ^12.43.0 | Declarative animations |
| **Icons** | Lucide React | ^1.27.0 | Icon library |
| **Testing** | Vitest | ^4.1.10 | Test runner |
| **Testing** | Testing Library | ^16.3.2 | Component testing |
| **Testing** | jsdom | ^26.1.0 | DOM simulation |
| **Testing** | Puppeteer | ^25.4.0 | Headless browser |
| **HTTP** | undici | ^7.29.0 | HTTP client |

### ⚙️ Build Configuration

| Setting | Value |
|---------|-------|
| TypeScript target | ES2020 |
| Module system | ESNext (bundler resolution) |
| JSX | react-jsx (automatic runtime) |
| Path alias | `@/*` → `./src/*` |
| Code splitting | 3 vendor chunks — `react-vendor`, `ui-vendor`, `auth-vendor` |

### 🎨 Design System (Tailwind)

```css
/* Color Palette */
background:     #FFFFFF
surface:        #FFFFFF
surface-border: #F1F5F9
primary:        #4F46E5   /* Indigo */
primary-dark:   #4338CA
secondary:      #0EA5E9   /* Sky blue */
text:           #0F172A
text-muted:     #64748B

/* Typography */
Font: Inter (sans-serif)
```

### 📄 Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `LandingPage` | Marketing page with hero, features, pricing, testimonials |
| `/studio` | `StudioDashboard` | Authenticated AI photo editing workspace |

---

## 4. Tech Stack — Backend

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Runtime** | Node.js | — | Server runtime |
| **Framework** | Express | ^5.2.1 | HTTP server |
| **Language** | TypeScript | ^7.0.2 | Type-safe development |
| **Dev Runner** | tsx | ^4.23.1 | TypeScript execution (watch mode) |
| **Production** | tsc → Node.js | — | Compiled JS via `tsc` |
| **ORM** | Prisma | ^5.22.0 | Database toolkit |
| **Database** | PostgreSQL (Neon) | — | Serverless PostgreSQL |
| **Auth** | Clerk Express | ^2.1.48 | Server-side auth middleware |
| **Validation** | Zod | ^4.4.3 | Schema validation |
| **Security** | Helmet | ^8.3.0 | HTTP security headers |
| **Security** | CORS | ^2.8.6 | Cross-origin requests |
| **Security** | express-rate-limit | ^8.6.1 | Rate limiting |
| **Compression** | compression | ^1.8.1 | Gzip response compression |
| **Webhook Verify** | Svix | ^1.99.1 | Clerk webhook signature verification |
| **Cron** | node-cron | ^4.6.0 | Scheduled tasks |
| **Telegram** | node-telegram-bot-api | ^1.2.0 | Telegram bot API |
| **AI Agent** | @google/genai | ^2.15.0 | Gemini 2.0 Flash AI |
| **Testing** | Vitest | ^4.1.10 | Test runner |
| **Testing** | Supertest | ^7.2.2 | HTTP integration tests |
| **Env** | dotenv | ^17.4.2 | Environment variable loading |

### ⚙️ TypeScript Configuration

| Setting | Value |
|---------|-------|
| Target | ES2022 |
| Module | Node16 (CommonJS compatibility) |
| Root | `./src` |
| Output | `./dist` |
| Strict mode | Enabled |

### 🔄 Express App Architecture (`app.ts`) — Request Pipeline

```
Request Pipeline:
  1.  trust proxy                  (for nginx)
  2.  telemetryMiddleware           (latency tracking)
  3.  generalLimiter                (300 req/15min/IP)
  4.  helmet()                      (security headers)
  5.  compression()                 (gzip)
  6.  cors()                        (whitelist: zenstudio.my.id + localhost dev)
  7.  /generate body parser         (50mb limit)
  8.  Global body parser            (1mb, captures rawBody for svix)
  9.  clerkMiddleware()             (auth session parsing)
  10. Static files: /api/v1/uploads
  11. Public routes: /health, /webhooks, /telemetry
  12. Protected routes: /user, /generate, /payments (requireAuth)
  13. telemetryErrorHandler
  14. Global errorHandler
```

### 🚦 Rate Limiting Strategy

| Limiter | Window | Max Requests | Scope | Applies To |
|---------|--------|-------------|-------|------------|
| `generalLimiter` | 15 min | 300 req | Per IP | All routes |
| `strictLimiter` | 15 min | 30 req | Per IP | `/generate` |
| `telemetryLimiter` | 1 min | 10 req | Per IP | `/telemetry` |
| `paymentLimiter` | 1 min | 5 req | Per IP | `/payments` |

### 🌐 CORS Origins

- **Production:** `https://zenstudio.my.id`
- **Development:** `http://localhost:5173`, `http://localhost:3000`

> [!TIP]
> **Windows DNS Fix:** `dns.setDefaultResultOrder("ipv4first")` — prevents ENOTFOUND errors on some Windows networks.

---

## 5. Database Schema

> [!NOTE]
> **Provider:** PostgreSQL (Neon serverless) · **ORM:** Prisma v5 · **Connection:** `DATABASE_URL` env variable

### 🗂️ Models Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                            User                                   │
│  id (uuid PK) | clerkId (unique) | email (unique) | name | ...  │
└──────┬──────────────┬─────────────────┬──────────────────────────┘
       │              │                 │
       ▼              ▼                 ▼
┌─────────────┐ ┌───────────┐ ┌──────────────┐
│ UserCredit  │ │Generation │ │ PaymentOrder │
│ (1:1 User)  │ │(1:N User) │ │ (1:N User)   │
└─────────────┘ └───────────┘ └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────────┐
                              │CreditTransaction │
                              │ (1:N User,       │
                              │  N:1 PaymentOrder)│
                              └──────────────────┘
```

### 👤 User

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `clerkId` | String | Unique, from Clerk |
| `email` | String | Unique |
| `name` | String? | Display name |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

### 💳 UserCredit

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `userId` | String | Unique FK → User |
| `remainingCredits` | Int | Default 3 (free tier) |
| `planType` | String | `"free"`, `"pro"`, `"enterprise"` |
| `version` | Int | Optimistic locking (default 0) |

### 🖼️ Generation

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `userId` | String | FK → User |
| `replicateId` | String? | Unique, from Replicate |
| `originalUrl` | String | Original image URL |
| `processedUrl` | String? | AI-processed result URL |
| `preset` | String | The AI prompt used |
| `status` | String | `"pending"`, `"completed"`, `"failed"` |
| `createdAt` | DateTime | Auto, indexed with userId |

### 💰 PaymentOrder

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `userId` | String | FK → User |
| `idempotencyKey` | String | Client-generated UUID |
| `xenditInvoiceId` | String | Unique, from Xendit |
| `externalId` | String | Unique (ZEN-YYYYMMDD-XXXXXX) |
| `packageId` | String | `"starter"` or `"pro"` |
| `credits` | Int | 10 or 30 |
| `amount` | Int | In Rupiah (75000 or 215000) |
| `status` | String | `creating` → `pending` → `paid`/`settled`/`expired`/`failed` |
| `invoiceUrl` | String? | Xendit hosted checkout URL |
| `paymentMethod` | String? | GOPAY, OVO, DANA, BCA, QRIS |
| `paymentChannel` | String? | GOPAY_WEB, BCA_VA, QRIS_DYNAMIC |
| `xenditPaymentId` | String? | From webhook |
| `rawResponse` | Json? | Full Xendit payload (sanitized) |
| `notifiedAt` | DateTime? | Last webhook received |
| `reconcileCount` | Int | Default 0 |
| `paidAt` / `settledAt` / `expiredAt` | DateTime? | Lifecycle timestamps |

### 📋 CreditTransaction *(Immutable Audit Log)*

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `userId` | String | FK → User |
| `orderId` | String? | FK → PaymentOrder (null for non-purchase) |
| `type` | String | `welcome_bonus`, `purchase`, `refund`, `admin_credit`, `admin_debit`, `reconcile_correction`, `generation_spend` |
| `amount` | Int | Signed (+credit, -debit) |
| `balanceAfter` | Int | Snapshot after operation |
| `reason` | String | Human-readable (Indonesian) |
| `idempotencyKey` | String? | Dedup key |
| `operatorId` | String? | Admin clerkId |
| `metadata` | Json? | Debug info |
| `createdAt` | DateTime | Auto |

### 🔍 Indexes

| Model | Index Fields | Purpose |
|-------|-------------|---------|
| `Generation` | `[userId, createdAt]` | User history queries |
| `PaymentOrder` | `[userId, idempotencyKey]` (unique) | Idempotency |
| `PaymentOrder` | `[status, createdAt]` | Reconciliation scans |
| `PaymentOrder` | `[userId, createdAt]` | User order history |
| `PaymentOrder` | `[xenditInvoiceId]` | Webhook lookup |
| `CreditTransaction` | `[userId, createdAt]`, `[orderId]`, `[idempotencyKey]` | Query & dedup |

---

## 6. API Endpoints

**Base URL:** `https://zenstudio.my.id/api/v1`

### 🔓 Public Endpoints

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| `GET` | `/health` | ❌ | General | Health check (DB ping, uptime) |
| `POST` | `/webhooks/clerk` | ❌ (Svix) | General | Clerk user sync webhook |
| `POST` | `/webhooks/xendit` | ❌ (Token) | General | Xendit payment callback |
| `POST` | `/telemetry` | ❌ (Secret) | 10/min/IP | Client-side error/performance telemetry |

### 🔐 Protected Endpoints *(Require Clerk Auth)*

| Method | Path | Rate Limit | Description |
|--------|------|------------|-------------|
| `GET` | `/user/me` | General | Get authenticated user profile + credits |
| `POST` | `/generate` | 30/15min/IP | AI image generation |
| `DELETE` | `/generate/:id` | 30/15min/IP | Delete a generation |
| `POST` | `/generate/sync` | 30/15min/IP | Sync all user generations |
| `POST` | `/payments/orders` | 5/min/IP | Create payment order (Xendit invoice) |
| `GET` | `/payments/orders/:id` | 5/min/IP | Poll payment order status |
| `GET` | `/payments/history` | 5/min/IP | User payment history (last 20) |

### 📌 Key Implementation Details

> [!IMPORTANT]
> - **Body size limits:** `/generate` accepts 50MB (base64 images), all others 1MB
> - **rawBody capture:** The global body parser captures `rawBody` for Svix webhook verification
> - **Idempotency:** Payment orders are idempotent via `userId + idempotencyKey` composite unique
> - **Atomic credit deduction:** Generation uses Prisma transactions with `updateMany` WHERE guard

---

## 7. Authentication & Authorization

> [!NOTE]
> **Provider:** Clerk · **Packages:** `@clerk/clerk-react` (frontend), `@clerk/express` (backend)

### 🔑 Auth Flow

```
1. User signs in via Clerk UI (frontend)
2. Clerk issues session token (JWT)
3. Frontend: useApiClient() fetches token via getToken()
4. Backend: clerkMiddleware() parses session from Authorization header
5. Backend: requireAuth middleware checks auth.userId exists
6. Backend: routes use getAuth(req) to extract clerkId
```

### 🔄 User Sync

Webhook at `/api/v1/webhooks/clerk` listens for:

| Event | Action |
|-------|--------|
| `user.created` | Upsert user + create credit record (3 free credits) |
| `user.updated` | Sync email/name |
| `user.deleted` | Cascade delete user + all related records |

- **Signature:** Verified via Svix (`svix-id`, `svix-timestamp`, `svix-signature` headers)
- **Security:** `rawBody` captured before JSON parsing for signature verification

### ♻️ 401 Handling (Frontend)

On receiving 401, the API client transparently retries once with `getToken({ skipCache: true })`.  
Fallback retry with exponential backoff: `200ms → 500ms → 1000ms` if token fetch is slow.

---

## 8. AI Image Generation Pipeline

### 🔄 Generation Flow

```
1.  Client sends: { imageUrl (base64 or URL), prompt, provider?, aspectRatio?, resolution?, outputFormat? }
2.  Server validates via Zod schema
3.  Base64 size validation (max ~10MB raw, 15MB encoded)
4.  Save original image locally via saveBase64Locally()
5.  Determine valid AI input URL (skip localhost for Replicate)
6.  Call AIService.generate() → Replicate API
7.  Poll Replicate prediction until "succeeded" or timeout (180s / 3 min)
8.  Save result image locally via saveRemoteImageLocally()
9.  Atomic DB transaction: deduct credits + save generation record + audit log
10. Return: { generation, remainingCredits }
```

### 🤖 AI Providers (via Replicate API)

| Provider ID | Model | Credits | Notes |
|-------------|-------|---------|-------|
| `replicate` | google/nano-banana-pro | 1 (2 for 4K) | Default — warm Replicate model |
| `nanobanana` | google/nano-banana-pro | 2 | Aliased, always 2 credits |
| `nanobanana2` | google/nano-banana-2 | 2 | Newer model |
| `gptimage` | openai/gpt-image-1.5 | 1 (2 for 4K) | Aspect ratio mapping needed |

### ⚙️ Replicate API Details

| Setting | Value |
|---------|-------|
| Endpoint | `https://api.replicate.com/v1/models/{model}/predictions` |
| Auth | `Token {REPLICATE_API_TOKEN}` |
| Timeout | 180 seconds (3 minutes) |
| Polling interval | Every 3 seconds |
| Poll until | `"succeeded"`, `"failed"`, or `"canceled"` |
| Output formats | `jpg`, `png`, `webp` (mapped: `jpg→jpeg` for GPT Image) |
| Resolutions | `1K`, `2K`, `4K` (GPT Image: `low`/`medium`/`high`) |
| Aspect ratios | `1:1`, `4:5`, `9:16`, `16:9` (GPT Image remaps `9:16→2:3`, `4:5→2:3`) |

### 💳 Credit Deduction Logic

```typescript
Credits per generation:
  GPT Image 1K/2K:          1 credit
  GPT Image 4K:             2 credits
  Nano Banana (any res):    2 credits
  Nano Banana 2 (any res):  2 credits
```

---

## 9. Payment System (Xendit)

> [!NOTE]
> **Provider:** Xendit Invoice API v2 · **Currency:** IDR (Indonesian Rupiah) · **Region:** Indonesia

### 💰 Pricing *(Server-Side Source of Truth)*

| Package | Credits | Price (IDR) | Label |
|---------|---------|-------------|-------|
| `starter` | 10 | Rp 75,000 | Starter |
| `pro` | 30 | Rp 215,000 | Pro |

### 🔄 Payment Flow

```
1.  Client: POST /payments/orders { packageId, idempotencyKey (UUID) }
2.  Server: Idempotency check (userId + idempotencyKey unique)
3.  Server: Create PaymentOrder (status: "creating")
4.  Server: Call Xendit createInvoice()
      - Success redirect: https://zenstudio.my.id/studio?payment=success
      - Failure redirect: https://zenstudio.my.id/studio?payment=failed
      - Invoice duration: 24 hours
5.  Server: Update PaymentOrder (status: "pending", invoiceUrl, xenditInvoiceId)
6.  Client: Redirect user to Xendit hosted checkout page
7.  User: Pays via GOPAY, OVO, DANA, BCA VA, QRIS, etc.
8.  Xendit: Sends webhook to POST /webhooks/xendit
9.  Server: Verifies callback token (timingSafeEqual)
10. Server: Updates order status, grants credits via creditOps.add()
```

### 🛡️ Webhook Processing — 3-Layer Resilience

| Layer | Mechanism | Description |
|-------|-----------|-------------|
| **Layer 1** | Idempotency | `userId + idempotencyKey` unique constraint |
| **Layer 2** | Webhook CAS | Compare-And-Swap update — only transition from `pending`/`creating` |
| **Layer 3** | Reconciliation | Cron every 15 minutes catches missed/hung orders |

### ♻️ Reconciliation (`reconcilePayments`)

- Runs every **15 minutes**
- Uses PostgreSQL advisory lock (`pg_try_advisory_lock(72491)`) for single-instance safety
- Finds orders stuck in `"creating"` (>10 min) or `"pending"` unreconciled (>15 min)
- Queries Xendit for actual status, corrects local state
- Grants credits if Xendit shows PAID/SETTLED but local DB doesn't
- Soft-expires orders >24h old
- **Escalation:** logs `CRITICAL` for orders with ≥8 failed reconcile attempts (~2h)

### 🔒 Security

- Callback token verified with `crypto.timingSafeEqual` (prevents timing attacks)
- Amount mismatch detection (422 response)
- Sensitive fields stripped from stored `rawResponse` via `sanitizeWebhookPayload()`
- Always returns `200` to Xendit (even on errors) to prevent retry storms

---

## 10. Credit System

### ⚙️ Core Operations (`creditOps`)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  creditOps   │    │  creditOps   │    │  creditOps   │
│  .add()      │    │  .deduct()   │    │  .refund()   │
│              │    │              │    │              │
│ +N credits   │    │ -N credits   │    │ Reverse      │
│ (purchase,   │    │ (generation, │    │ deduction    │
│  bonus,      │    │  admin)      │    │ (partial     │
│  admin)      │    │              │    │  ok)         │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       ▼                   ▼                   ▼
   Prisma $transaction (ReadCommitted isolation)
       │
       ▼
   Optimistic Locking (version column, max 3 retries on P2034)
       │
       ▼
   CreditTransaction (immutable audit log)
```

### 📋 Transaction Types

| Type | Description | Sign |
|------|-------------|------|
| `welcome_bonus` | 3 free credits on signup | `+3` |
| `purchase` | Xendit payment settlement | `+10` or `+30` |
| `refund` | Admin-initiated refund | `-N` |
| `admin_credit` | Manual admin credit grant | `+N` |
| `admin_debit` | Manual admin credit removal | `-N` |
| `reconcile_correction` | Reconciliation catch-up credit | `+N` |
| `generation_spend` | Image generation cost | `-1` or `-2` |

### 🔒 Concurrency Safety

| Mechanism | Details |
|-----------|---------|
| **Optimistic locking** | `UserCredit.version` incremented on each mutation; `P2034` → retry up to 3×: 50ms / 100ms / 150ms |
| **Atomic guard on deduct** | `WHERE remainingCredits >= amount` in `updateMany` — prevents negative balance races |
| **Transaction isolation** | `ReadCommitted` |
| **CAS on settlement** | `updateMany WHERE status IN ('pending','creating')` — prevents double-credit |

### 🎁 Free Tier

- **3 credits** granted on signup via Clerk webhook (`user.created`)
- **Lazy creation:** if user has no credit record at first `/generate` call, auto-creates with 3 credits

---

## 11. AI SRE Agent (Self-Healing)

> [!NOTE]
> **Model:** Gemini 2.0 Flash (`gemini-2.0-flash`) · **SDK:** `@google/genai` v2 · **API Key:** `GEMINI_API_KEY`

### 🏗️ Architecture

```
Telemetry Events (telemetryEmitter)
    │
    ├── HTTP 5xx errors
    ├── High latency (>2000ms)
    ├── Unhandled exceptions
    ├── Unhandled promise rejections
    ├── Uncaught exceptions
    └── High memory usage (cron)
         │
         ▼
    handleAnomaly(payload)
         │
         ▼
    guardrails.sanitizeData() — strip secrets
         │
         ▼
    Gemini 2.0 Flash (SRE_PROMPT)
         │
         ▼
    Diagnosis JSON:
    { rootCause, action, actionDescription, recommendedFix }
         │
         ▼
    Execute Action:
    ├── RESTART_PM2       → Telegram approval request
    ├── AUTO_FIX_PUSH     → Git commit + push (with/without approval)
    ├── GITHUB_ISSUE      → Auto-create GitHub issue
    └── NO_ACTION         → Suppress (unless WARNING_AND_ABOVE)
         │
         ▼
    Telegram Report (sendFullActionReport)
```

> [!WARNING]
> **Fallback:** If Gemini is unavailable, raw alerts are still sent to Telegram with `AI_DOWN_RAW_ALERT` status.

### 🛡️ Guardrails

| Guard | Details |
|-------|---------|
| **Feature flags** | Each remediation action can be disabled via env vars |
| **Rate limits** | PM2 restart limited to 2 per 30 minutes (in-memory) |
| **Data sanitization** | All sensitive keys/values redacted before sending to Gemini |

**Redacted key patterns:** `password`, `secret`, `token`, `apiKey`, `authorization`, `bearer`  
**Redacted value patterns:** `sk_live_*`, `sk_test_*`, `whsec_*`, `github_pat_*`, `xnd_*`, `r8_*`, `hf_*`

---

## 12. Telemetry & Monitoring

### 📡 Event Emitter (`telemetryEmitter`)

A global `EventEmitter` that the SRE agent listens to for `'anomaly'` events.

### 🚨 Anomaly Event Sources

| Source | Event Type | Trigger |
|--------|------------|---------|
| `telemetryMiddleware` | `HTTP_5XX` | Response status ≥ 500 |
| `telemetryMiddleware` | `HIGH_LATENCY` | Response time > 2000ms |
| `telemetryErrorHandler` | `UNHANDLED_EXCEPTION` | Express error middleware |
| `process.on('unhandledRejection')` | `UNHANDLED_PROMISE_REJECTION` | Async rejections |
| `process.on('uncaughtException')` | `UNCAUGHT_EXCEPTION` | Synchronous throws |
| Cron scheduler | `HIGH_MEMORY_USAGE` | RAM usage > 90% |

### 📊 Client Telemetry (`/api/v1/telemetry`)

- Accepts client-side error/performance events
- Rate limited: **10 events/min/IP**
- Secret-protected via `TELEMETRY_INGEST_SECRET`

### 🔐 Data Privacy

> [!IMPORTANT]
> Event payloads **NEVER** include raw request body (may contain base64 images or PII).  
> Only metadata is stored: `bodySize`, `queryKeys`, `method`, `url`, `statusCode`, `duration`.  
> All data passed to Gemini is sanitized via `guardrails.sanitizeData()`.

---

## 13. Telegram Bot Integration

> [!NOTE]
> **Library:** `node-telegram-bot-api` · **Mode:** Polling (long-poll for updates)

### 🤖 Admin Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `/help` | `/start` | Show all commands |
| `/check` | `/status`, `/health` | System health (RAM, uptime, DB) |
| `/metrics` | `/vps`, `/ram`, `/storage`, `/disk` | VPS resource stats |
| `/test` | `/deepcheck`, `/synthetic` | Synthetic health check |
| `/restart` | — | Request PM2 restart (requires approval) |
| `/credit check <email>` | — | Show user credit balance + last 10 transactions |
| `/credit add <email> <amount>` | — | Grant credits (>100 requires approval) |
| `/credit fix <orderId>` | — | Force reconciliation for stuck order |
| `/order <orderId>` | — | Show full payment order details |

### 📬 Automated Messages

| Type | Trigger | Content |
|------|---------|---------|
| Action Report | Every SRE agent diagnosis | Time, component, root cause, action, status |
| Approval Request | RESTART_PM2, GIT_PUSH, large credit grants | Inline keyboard (Approve/Reject) |
| Daily Summary | 08:00 AM daily | Uptime, status, RAM |
| Critical Alert | 3 consecutive DB ping failures | DB outage warning |

### ✅ Interactive Approval Flow

```
1. SRE agent diagnoses an issue requiring approval
2. Telegram bot sends message with inline keyboard: [✅ Approve] [❌ Reject]
3. Admin taps Approve → callback_query handler executes the action
4. Result message sent back to chat
```

---

## 14. Cron Scheduler

> [!NOTE]
> **Library:** `node-cron` · **Start:** Called from `index.ts` on server boot

### ⏱️ Scheduled Tasks

| Schedule | Task | Purpose |
|----------|------|---------|
| `*/4 * * * *` | DB keep-alive ping | Prevents Neon free-tier auto-suspend (5-min inactivity) |
| `*/15 * * * *` | Resource check | RAM > 90% → trigger anomaly event |
| `*/15 * * * *` | Payment reconciliation | Catch missed Xendit webhooks |
| `0 8 * * *` | Daily health summary | Telegram report to admin |

### 🔋 DB Keep-Alive

> [!WARNING]
> Neon's free tier auto-suspends after **5 minutes** of inactivity.
> - Every **4 minutes:** `SELECT 1` ping
> - **3 consecutive failures** (~12 min) → Telegram critical alert

---

## 15. File Storage

**Strategy:** Local disk storage on VPS

### 📁 Upload Directory

```
{process.cwd()}/uploads/generations/
```

### ⚙️ Operations

| Function | Purpose |
|----------|---------|
| `saveBase64Locally(base64, req)` | Save original user image from base64 data URI |
| `saveRemoteImageLocally(remoteUrl, req)` | Download Replicate result and save locally |
| `deleteLocalImage(fileUrl)` | Remove file from disk (on generation deletion) |

### 🔗 URL Generation

- Base URL from `BACKEND_URL` env var, or auto-detected from request
- Path format: `/api/v1/uploads/generations/{timestamp}-{random}.{ext}`
- Served statically via Express: `app.use("/api/v1/uploads", express.static(...))`

### 🏷️ File Naming

```
{timestamp}-{6-byte hex}.{ext}
Example: 1722691234567-a1b2c3d4e5f6.jpg
```

---

## 16. Security Architecture

### 🔒 HTTP Security

| Layer | Mechanism | Details |
|-------|-----------|---------|
| **Helmet** | Security headers | CSP, X-Frame-Options, X-XSS-Protection, etc. |
| **CORS** | Origin whitelist | Production domain + localhost dev |
| **Rate Limiting** | 4-tier system | General, strict, telemetry, payment |
| **Body Size Limits** | Request cap | 1MB default, 50MB for `/generate` |

### 🛡️ Content Security Policy (`index.html`)

```
default-src  'self'
script-src   'self' 'unsafe-inline' 'unsafe-eval'
             https://clerk.zenstudio.my.id https://clerk.com https://*.clerk.accounts.dev
connect-src  'self' http://localhost:* ws://localhost:*
             wss://*.clerk.accounts.dev https://*.clerk.accounts.dev
             https://clerk.zenstudio.my.id https://api.replicate.com
style-src    'self' 'unsafe-inline' https://fonts.googleapis.com
font-src     'self' data: https://fonts.gstatic.com
img-src      'self' data: blob: https://replicate.delivery https://*.replicate.delivery
             https://*.amazonaws.com https://clerk.zenstudio.my.id https://img.clerk.com
             https://*.clerk.com https://images.clerk.dev https://*.clerk.accounts.dev
worker-src   'self' blob:
```

### 🔐 Webhook Security

| Webhook | Verification Method |
|---------|---------------------|
| **Clerk** | Svix signature (`svix-id`, `svix-timestamp`, `svix-signature`) |
| **Xendit** | Callback token via `crypto.timingSafeEqual` |

### 🧹 Data Sanitization

- Telemetry events strip raw body content (only size metadata stored)
- All data sent to Gemini is sanitized (secrets redacted)
- Xendit webhook payloads are sanitized before DB storage
- Max recursion depth **20 levels** for sanitization walkers

### ⚛️ Concurrency & Data Integrity

| Mechanism | Implementation |
|-----------|---------------|
| Prisma transactions | `ReadCommitted` isolation |
| Optimistic locking | `UserCredit.version` |
| CAS | Compare-And-Swap on payment settlement |
| Advisory locks | PostgreSQL advisory locks for reconciliation singleton |

> [!CAUTION]
> **Production-Only Guard:** `validateTelemetryConfig()` fails fast if `TELEMETRY_INGEST_SECRET` is missing in production.

---

## 17. Environment Variables

### 🖥️ Server (`server/.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `PORT` | No (5000) | Server port |
| `DATABASE_URL` | **✅ Yes** | Neon PostgreSQL connection string |
| `CLERK_PUBLISHABLE_KEY` | **✅ Yes** | Clerk publishable key |
| `CLERK_SECRET_KEY` | **✅ Yes** | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | **✅ Yes** | Svix webhook signing secret |
| `REPLICATE_API_TOKEN` | **✅ Yes** | Replicate API token (for AI generation) |
| `FAL_KEY` | No | FAL.ai key (legacy) |
| `OPENAI_API_KEY` | No | OpenAI key (legacy/fallback) |
| `HF_TOKEN` | No | HuggingFace token (legacy) |
| `GEMINI_API_KEY` | **✅ Yes** | Gemini API key (SRE agent) |
| `GITHUB_TOKEN` | No | GitHub PAT (auto-issue creation) |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token |
| `TELEGRAM_CHAT_ID` | No | Primary chat for alerts |
| `TELEGRAM_ADMIN_CHAT_IDS` | No | Comma-separated admin chat IDs |
| `TELEGRAM_REPORT_LEVEL` | No | `ALL` or `WARNING_AND_ABOVE` |
| `TELEMETRY_INGEST_SECRET` | **✅ Yes** (prod) | Client telemetry auth |
| `XENDIT_API_KEY` | **✅ Yes** (payments) | Xendit API key |
| `XENDIT_WEBHOOK_TOKEN` | **✅ Yes** (payments) | Xendit callback verification token |
| `XENDIT_IS_PRODUCTION` | No (false) | Xendit environment |
| `XENDIT_ENFORCE_IP_WHITELIST` | No (false) | IP whitelist enforcement |
| `BACKEND_URL` | No | Override for generated file URLs |

### 🚩 Feature Flags *(all `true`/`false` strings)*

| Flag | Default | Controls |
|------|---------|---------|
| `ENABLE_AUTO_RESTART_PM2` | `true` | SRE agent PM2 restart |
| `ENABLE_AUTO_GITHUB_ISSUE` | `true` | Auto-create GitHub issues |
| `ENABLE_GIT_ROLLBACK` | `true` | Git rollback capability |
| `ENABLE_CACHE_FLUSH` | `true` | Cache flush action |
| `ENABLE_AUTO_GIT_PUSH` | `true` | Auto git commit + push |
| `REQUIRE_APPROVAL_FOR_GIT_PUSH` | `true` | Require Telegram approval for git push |

### 🌐 Frontend (`.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | **✅ Yes** | Clerk publishable key |
| `VITE_API_URL` | No | API base URL override |

---

## 18. Testing Infrastructure

**Test Runner:** Vitest v4

### 🖥️ Frontend Tests

```
Config:      vitest.config.ts
Environment: jsdom
Include:     src/**/*.test.{ts,tsx}
Setup:       src/test/setup.ts
Globals:     disabled
```

**Test files:**
- `src/components/__tests__/ErrorBoundary.test.tsx`
- `src/services/__tests__/api.test.ts`
- `src/lib/__tests__/credits.test.ts` — credit deduction logic
- `src/lib/__tests__/promptBuilder.test.ts`

### ⚙️ Backend Tests

```
Config:        server/vitest.config.ts
Environment:   node
Include:       src/**/*.test.ts
Setup:         server/src/test/setup.ts
Timeout:       15 seconds
Restore mocks: true
```

**Test files:**
- `server/src/services/__tests__/aiProvider.test.ts`
- `server/src/services/__tests__/storage.test.ts`
- `server/src/middleware/__tests__/auth.test.ts`
- `server/src/agent/__tests__/guardrails.test.ts` — sanitization, rate limits, feature flags
- `server/src/routes/__tests__/generate.test.ts`
- `server/src/routes/__tests__/health.test.ts`
- `server/src/routes/__tests__/user.test.ts`
- `server/src/routes/__tests__/webhooks.test.ts`
- `server/src/routes/__tests__/telemetry.test.ts`
- `server/src/routes/__tests__/validation.test.ts`

### ▶️ Running Tests

```bash
# All tests (both frontend + backend)
npm test

# Frontend only
npx vitest run

# Backend only
cd server && npm test

# Watch mode
npm run test:watch      # Frontend
npm run test:server     # Backend (single run)
```

---

## 19. Build & Deployment

### 💻 Development

```bash
npm run dev              # Starts both Vite (port 5173) + Express (port 5000)
npm run server           # Express only (tsx watch)
```

### 🏗️ Production Build

```bash
npm run build            # tsc -b && vite build
```

| Output | Path |
|--------|------|
| Frontend (static SPA) | `dist/` |
| Backend (compiled CommonJS) | `server/dist/` |

### 🚀 Runtime

```bash
npm start               # node dist/index.js (backend)
```

### ⚙️ Process Management

- **PM2** for production process management
- SRE agent can trigger PM2 restarts (with approval)
- 24/7 uptime via VPS + PM2

### 🏛️ Deployment Architecture (Production)

```
                      ┌─────────────┐
                      │   Nginx     │  Reverse Proxy
                      │  Port 80/443│
                      └──┬──────┬───┘
                         │      │
              ┌──────────▼┐  ┌──▼──────────┐
              │  Static   │  │  Express    │
              │  dist/    │  │  Port 5000  │
              │  (Vite)   │  │  (Backend)  │
              └───────────┘  └──┬──────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Neon PostgreSQL     │
                    │   (Serverless DB)     │
                    └───────────────────────┘
```

- Nginx proxies `/api/v1/*` → Express `:5000`
- Nginx serves static files (Vite SPA)
- Uploaded files: `/api/v1/uploads/*` proxied to Express static middleware

---

## 20. Third-Party Integrations

| Service | Purpose | Auth Method | API Base |
|---------|---------|-------------|----------|
| **Clerk** | Authentication & user management | API Keys + Svix webhooks | `https://api.clerk.com` |
| **Replicate** | AI model hosting (image generation) | API Token | `https://api.replicate.com/v1` |
| **Neon** | Serverless PostgreSQL | Connection string | `postgresql://` |
| **Xendit** | Payment gateway (Indonesia) | API Key (Basic Auth) | `https://api.xendit.co/v2` |
| **Google Gemini** | SRE agent AI reasoning | API Key | `@google/genai` SDK |
| **Telegram** | Admin bot & alerts | Bot Token | `https://api.telegram.org` |
| **GitHub** | Auto-issue creation | PAT | `https://api.github.com` |
| **Svix** | Webhook signature verification | N/A (verification only) | Bundled with Clerk |

---

## 21. Feature Flags

All controlled via environment variables (`true`/`false` strings):

| Flag | Effect |
|------|--------|
| `ENABLE_AUTO_RESTART_PM2` | Allows SRE agent to execute PM2 restarts |
| `ENABLE_AUTO_GITHUB_ISSUE` | Allows auto-creation of GitHub issues for bugs |
| `ENABLE_GIT_ROLLBACK` | Enables git rollback as remediation |
| `ENABLE_CACHE_FLUSH` | Allows cache flush action |
| `ENABLE_AUTO_GIT_PUSH` | Allows auto git commit + push |
| `REQUIRE_APPROVAL_FOR_GIT_PUSH` | Requires Telegram admin approval before git push |
| `XENDIT_IS_PRODUCTION` | Switches Xendit to production mode |
| `XENDIT_ENFORCE_IP_WHITELIST` | Enforces IP whitelist on Xendit webhooks |
| `TELEGRAM_REPORT_LEVEL` | `ALL` = all events; `WARNING_AND_ABOVE` = filter SUCCESS_NO_ACTION |

---

## 22. Infrastructure & Hosting

| Component | Provider | Notes |
|-----------|----------|-------|
| **VPS** | Self-managed (Linux) | 24/7 operation via PM2 |
| **Reverse Proxy** | Nginx | SSL termination, routing |
| **Database** | Neon (Serverless PostgreSQL) | Free tier with auto-suspend after 5 min |
| **Domain** | `zenstudio.my.id` | Production domain |
| **SSL** | Via Nginx (Let's Encrypt or similar) | HTTPS enforced |
| **Process Manager** | PM2 | Auto-restart on crash |
| **Monitoring** | Telegram bot + cron health checks | Self-hosted monitoring |

---

## 📐 Appendix: Key Architectural Decisions

> [!IMPORTANT]
> These decisions represent core trade-offs made during design. Understand them before making changes.

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Server-side AI calls only** | Replicate API keys never exposed to client — all generation through the backend |
| 2 | **Local image storage** | Generated images cached on VPS disk to avoid Replicate CDN expiry |
| 3 | **Atomic credit operations** | Prisma transactions + optimistic locking prevent double-spend |
| 4 | **3-layer payment resilience** | Idempotency (DB unique) → Webhook (CAS) → Reconciliation (cron) |
| 5 | **Single-instance reconciliation** | PostgreSQL advisory locks ensure only one process reconciles |
| 6 | **Data privacy by design** | Telemetry events exclude raw body content; AI agent input is sanitized |
| 7 | **Indonesian-language UX** | All user-facing messages and bot commands in Bahasa Indonesia |
| 8 | **PM2 self-healing** | The SRE agent can restart itself via PM2 (with human approval for safety) |
