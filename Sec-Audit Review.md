# ?? Security Audit Review — ZenStudio

**Reviewed by:** Antigravity (AI Code Assistant)  
**Review Date:** 2026-08-03  
**Audit Document:** [SECURITY-AUDIT-2026-08-03.md](./SECURITY-AUDIT-2026-08-03.md)  
**Scope:** Analysis of findings, fix quality, status accuracy, and gaps

---

## Overall Verdict: **Solid and credible** ?

This is a genuinely well-structured audit. The findings are real, the severity ratings are appropriate, and — critically — the code actually reflects the fixes described. Several claimed fixes were verified against live source files and they all match.

---

## ? Strengths

| # | What's Good |
|---|---|
| **1** | **Fixes are verified, not just claimed.** C-5, H-1, H-2, H-3, H-4, C-2 — checked in code, and they're real. |
| **2** | **Severity ratings are accurate.** C-4 (unauthenticated telemetry ? infra actions) is correctly the most dangerous finding. A bypass that can auto-push to `master` is genuinely Critical. |
| **3** | **The "Already Secure" section adds credibility.** It's not inflating findings — it acknowledges Helmet, Clerk auth, Zod validation, parameterized queries, etc. were already good. |
| **4** | **Manual action items are actionable and specific.** The deployment checklist with exact service names, exact menu paths, and shell verification commands is genuinely useful. |
| **5** | **The telemetry fix (H-4) is correctly handled** — `bodySize` instead of raw body is the right approach. |

---

## ?? Issues & Gaps Found

### 1. C-3 (Webhook) is in a Fragile Backward-Compatible State

In `server/src/routes/webhooks.ts`, if `CLERK_WEBHOOK_SECRET` is not set, the webhook **silently proceeds without verification**:

```typescript
} else {
  console.warn("[Clerk Webhook] CLERK_WEBHOOK_SECRET not set — running without signature verification (insecure)");
}
```

The audit acknowledges this, but labels it **"Fixed (code)"** in the status table. A more honest label would be **"Partially Fixed — code ready, secret not yet configured."** Until the secret is in production, this is still an open Critical vulnerability.

---

### 2. C-1 Urgency is Understated

The `server/.env` file on disk contains live production credentials. The audit says "rotate" but doesn't call this out as **the #1 priority** that should have been done *before* proceeding with anything else. If this repo is on GitHub private or OneDrive sync, those secrets may already be exposed.

---

### 3. Telemetry Secret Has a Dangerous Fallback Default

In `server/src/routes/telemetry.ts` line 7:

```typescript
const TELEMETRY_SECRET = process.env.TELEMETRY_INGEST_SECRET || "dev-secret-change-in-production";
```

If `TELEMETRY_INGEST_SECRET` is never set in production (which is the current state per the deployment checklist), the endpoint accepts `"dev-secret-change-in-production"` as valid auth. This is a **publicly guessable default string**. The code should **fail hard** (`throw new Error(...)` or `process.exit(1)`) on startup in production if this var is missing — not silently fall back to a known value.

---

### 4. H-5 is Understated as "Addressed by H-4"

The guardrail sanitizer regex in `guardrails.ts` is still in place and still weak. H-4 removes body data from the telemetry *event*, but the SRE agent still uses Gemini to analyze stack traces and error messages from `unhandledRejection`/`uncaughtException` events — which *could* contain secret values embedded in error messages. This residual risk is waved away too quickly.

**Recommendation:** Replace the regex-based `sanitizeData` with a proper recursive JSON walk that redacts any key matching a known sensitive list (`password`, `secret`, `token`, `key`, `apikey`, `auth`, etc.).

---

### 5. M-1 (Auto Git Push) is Under-Flagged

The audit rates this **Medium**, but the realistic attack chain is:

> Telegram bot token leaks (C-1) ? attacker sends `/approve` ? AI agent auto-pushes malicious code to `master`

That is a **full supply-chain attack via Telegram**. This should arguably be **High**, not Medium. The Telegram approval flow should not be the sole gate for production code changes.

**Recommendation:** Require a GitHub PR with branch protection rules as a hard requirement — Telegram approval alone is insufficient.

---

### 6. L-2 (Tests Target Production) — Not Actioned

`test-clerk.js` and `test-ui.js` both point to the live `https://zenstudio.my.id`. This is low severity now but could cause real side effects (auth events, analytics skew, credit deduction) if tests are ever automated in CI.

**Recommendation:** Point these to `http://localhost:5173` or a staging environment.

---

### 7. Global Body Limit is Still 50MB

`server/src/app.ts` line 68–69 still accepts 50MB bodies globally:

```typescript
app.use(express.json({ limit: "50mb" }));
```

L-1 adds per-field validation inside `/generate`, but the 50MB limit applies to **every route** — including unauthenticated ones like `/webhooks` and `/telemetry`. A malicious actor can still send large payloads to exhaust memory.

**Recommendation:** Lower the global body limit to `1mb`, and raise it selectively only on the `/generate` route using route-level middleware.

---

## ?? Summary Scorecard

| Audit Section | Rating | Notes |
|---|---|---|
| Finding identification | ????? | Real issues, nothing fabricated |
| Severity ratings | ???? | M-1 should be High |
| Fix quality (code) | ???? | Telemetry fallback default is risky |
| Fix status accuracy | ??? | C-3 is overclaimed as "Fixed" |
| Manual action clarity | ????? | Best section of the document |
| Gap coverage | ??? | Missing: 50MB body limit, Telegram attack vector, telemetry fail-hard |

---

## ?? Recommended Immediate Actions (Pre-Deploy Priority)

1. **?? Rotate all secrets NOW** (C-1) — this is the only thing that actually matters until done. OneDrive sync makes exposure risk non-trivial.
2. **?? Configure `CLERK_WEBHOOK_SECRET`** — C-3 is currently still open in production.
3. **?? Harden telemetry secret fallback** — change `|| "dev-secret-change-in-production"` to a startup crash in production.
4. **?? Lower the global body limit** — from `50mb` to `1mb` in `app.ts`, accept large payloads only on `/generate`.
5. **?? Upgrade M-1 remediation** — add GitHub branch protection rules; remove Telegram-only approval for git pushes.
6. **?? Replace regex sanitizer in guardrails** — use a recursive JSON walk redactor instead of the brittle regex in `guardrails.ts`.

---

*Review conducted by Antigravity on 2026-08-03. Cross-referenced against live source files in `server/src/`.*
