# API Platform Review: Telegram Deployment System
**Date**: 2026-08-09  
**Reviewer**: API Platform Engineer  
**Scope**: Telegram webhook endpoint, deploy bot API design, security posture

---

## Executive Summary

The Telegram deployment system consists of **two separate bots**:
1. **Server-side SRE bot** (TypeScript, `server/src/agent/telegramBot.ts`) — monitoring, health checks, credit admin
2. **Deploy bot** (Python, `deploy-bot/bot.py`) — triggers deployments to VPS

**Current architecture**: The deploy bot uses long polling and runs as a VPS systemd service. The separate SRE bot uses the Express webhook endpoint. `/deploy` is handled only by the deploy bot and does not pass through the application API.

---

## 1. Webhook Endpoint Status

### Finding: IMPLEMENTED FOR THE SRE BOT
- **Endpoint**: `/api/v1/internal/telegram-webhook`
- **Implementation**: `server/src/agent/telegramBot.ts`
- **Deploy bot**: polling only, managed by `deploy-bot/zen-deploy-bot.service`

### Assessment
For the deploy bot running on the VPS:
- ✅ No need to expose a public webhook endpoint
- ✅ Long polling is more secure (no inbound firewall rules needed)
- ✅ Simpler deployment (no reverse proxy configuration)

For the server-side SRE bot:
- ✅ Webhook route validates `x-telegram-bot-api-secret-token`
- ✅ Webhook registration is best-effort and does not block API startup

**Recommendation**: Keep the two bots on different Telegram tokens and never run a second polling process for the deploy token.

---

## 2. Bot Command Authorization

### Server Bot (TypeScript) — ✅ SECURE

**Authorization Model**:
```typescript
function isAdminChat(chatIdToCheck: string): boolean {
  const adminIds = (process.env.TELEGRAM_ADMIN_CHAT_IDS || chatId).split(",").map(s => s.trim());
  return adminIds.includes(chatIdToCheck);
}
```

**Coverage**:
- ✅ All command handlers check `isAdminChat()` before processing
- ✅ Callback query handlers check authorization
- ✅ Silent rejection (no response to unauthorized users) — prevents info disclosure

**Commands Protected**:
- `/help`, `/start` — line 43
- `/check`, `/status`, `/health` — line 59
- `/metrics`, `/vps`, `/ram`, `/storage`, `/disk` — line 80
- `/test`, `/deepcheck`, `/synthetic` — line 117
- `/restart` — line 141
- `/credit check`, `/credit add`, `/credit fix` — lines 217, 264, 329
- `/order` — line 394
- Callback queries — line 155

### Deploy Bot (Python) — ✅ SECURE

**Authorization Model**:
```python
def is_authorized(update: Update, cfg: Config) -> bool:
    user = update.effective_user
    chat = update.effective_chat
    if user is None or chat is None:
        return False
    if cfg.require_private_chat and chat.type != "private":
        return False
    return user.id in cfg.allowed_user_ids
```

**Coverage**:
- ✅ All command handlers check `is_authorized()` before processing
- ✅ Callback query handler re-checks authorization (critical: callback could be from different user)
- ✅ Checks `require_private_chat` to prevent group chat usage
- ✅ Silent rejection for unauthorized users

**Commands Protected**:
- `/help`, `/start` — line 96
- `/ping` — line 102
- `/status` — line 108
- `/logs` — line 125
- `/rollback` — line 141
- `/deploy` — line 159
- `/cancel` — line 287
- Callback queries — line 224

**Additional Security**:
- ✅ Confirmation flow with 5-minute TTL prevents accidental deploys
- ✅ Lock file mechanism prevents concurrent deploys
- ✅ Callback data includes `run_id` to prevent replay attacks

---

## 3. Security: Webhook Secret Validation

### Current State: NOT APPLICABLE (No Webhooks)

Since both bots use polling, webhook secret validation is not needed.

**If webhooks were to be implemented**, the pattern would be:

```typescript
// Telegram webhook secret validation (HMAC-SHA256)
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const header = req.headers['x-telegram-bot-api-secret-token'];
const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
if (!crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected))) {
  return res.status(401).json({ success: false, message: 'Invalid signature' });
}
```

**Existing Webhook Security** (for reference):
- ✅ Clerk webhook: Svix signature verification (lines 31-52 in `webhooks.ts`)
- ✅ Xendit webhook: Timing-safe token comparison (lines 136-140 in `webhooks.ts`)

---

## 4. Security: HTML Escaping

### Server Bot (TypeScript) — ⚠️ INCONSISTENT

**Good**: `escapeHtml()` function exists (lines 17-24):
```typescript
export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

**Used correctly in**:
- `sendFullActionReport()` — lines 452-456
- `sendApprovalRequest()` — lines 479-480

**NOT used in command handlers** (inconsistent):
- Line 69: `${ramUsage}%` — system value, low risk
- Line 109: `${os.platform()} (${os.arch()})` — system value, low risk
- Line 239: `${email}` — **USER INPUT, HIGH RISK**
- Line 282: `${email}` — **USER INPUT, HIGH RISK**
- Line 347: `${externalId}` — **USER INPUT, HIGH RISK**
- Line 413: `${externalId}` — **USER INPUT, HIGH RISK**

**Risk**: If a user crafts a malicious email or order ID containing `<script>` or HTML tags, it could be interpreted as HTML in the Telegram message.

**Example Attack**:
```
/credit check <b>fake@email.com</b>&lt;script&gt;alert(1)&lt;/script&gt;
```

**Fix Required**:
```typescript
// Line 239
bot?.sendMessage(msg.chat.id, `❌ User dengan email <b>${escapeHtml(email)}</b> tidak ditemukan.`, { parse_mode: 'HTML' });

// Line 282
bot?.sendMessage(msg.chat.id, `❌ User <b>${escapeHtml(email)}</b> tidak ditemukan.`, { parse_mode: 'HTML' });

// Line 347
bot?.sendMessage(msg.chat.id, `❌ Pesanan <b>${escapeHtml(externalId)}</b> tidak ditemukan.`, { parse_mode: 'HTML' });

// Line 413
bot?.sendMessage(msg.chat.id, `❌ Pesanan <b>${escapeHtml(externalId)}</b> tidak ditemukan.`, { parse_mode: 'HTML' });
```

### Deploy Bot (Python) — ⚠️ LOG CONTENT INJECTION

**Good**: Uses `html.escape()` from stdlib for labels (line 67):
```python
head = f"🚀 <b>Deploy sedang berjalan...</b>\n• Fase: <b>{html.escape(label)}</b>\n• Durasi: {elapsed:.0f} detik\n"
```

**Problem**: `/logs` command sends log content without escaping (lines 134-137):
```python
content = log_files[-1].read_text(encoding="utf-8", errors="replace")
lines = content.splitlines()[-n:]
text = "```\n" + "\n".join(lines)[:3800] + "\n```"
await update.message.reply_text(text, parse_mode="HTML")
```

**Risk**: If log files contain `<script>`, `</b>`, or other HTML tags, they will be interpreted by Telegram's HTML parser.

**Fix Required**:
```python
# Line 136
escaped_lines = [html.escape(line) for line in lines]
text = "```\n" + "\n".join(escaped_lines)[:3800] + "\n```"
await update.message.reply_text(text, parse_mode="HTML")
```

---

## 5. Security: Input Sanitization

### Server Bot (TypeScript) — ✅ SAFE

**Email input** (lines 222, 269):
- Passed to Prisma `findUnique({ where: { email } })` — Prisma parameterizes queries
- ✅ No SQL injection risk

**Order ID input** (lines 334, 399):
- Passed to Prisma `findFirst({ where: { externalId } })` — parameterized
- ✅ No SQL injection risk

**Callback data parsing** (line 164):
```typescript
const parts = data.replace("APPROVE_CREDIT_ADD_", "").split("_");
const userId = parts.slice(0, -1).join("_"); // userId may contain underscores
const amount = parseInt(parts[parts.length - 1], 10);
```
- ✅ Correctly handles userIds with underscores
- ✅ Telegram limits callback_data to 64 bytes
- ✅ Authorization check before processing

### Deploy Bot (Python) — ✅ SAFE

**Command flags** (lines 164-170):
```python
parts = update.message.text.split()
flags = set(parts[1:])
skip_build = "--skip-build" in flags
```
- ✅ Only accepts known flags from whitelist
- ✅ Unknown flags are ignored
- ✅ No shell injection (flags passed as arguments to subprocess, not interpolated)

**Subprocess execution** (lines 148-156 in `deploy.py`):
```python
args = [
    "powershell",
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", script,
    "-VpsIp", self.cfg.vps_ip,
    "-VpsUser", self.cfg.vps_user,
    "-TargetDir", self.cfg.vps_target_dir,
]
```
- ✅ Arguments passed as list (not shell string) — no shell injection
- ✅ Values come from config (not user input)
- ✅ `subprocess.Popen` with `stdout=subprocess.PIPE` — no command injection

---

## 6. API Design Consistency

### Error Response Shape — ⚠️ INCONSISTENT WITH SPEC

**Current implementation** (all webhook routes):
```typescript
{ success: false, message: "Error message" }
```

**API Platform Spec** (from system prompt):
```typescript
{ 
  code: "rate_limit_exceeded",  // stable, machine-readable
  message: "API rate limit exceeded; retry after 30s",
  details: {},  // field-level or contextual detail
  request_id: "req_a1b2"  // traceable on our side
}
```

**Impact**: This is a pre-existing inconsistency, not introduced by the Telegram changes. However, it violates the "consistent to the point of boredom" principle.

**Recommendation**: This should be addressed in a separate refactor, not blocked by the Telegram review.

### Rate Limiting — ✅ APPROPRIATE

**Webhook routes**: Use `generalLimiter` (300 req/15min) from `app.ts` line 43.
- ✅ Appropriate for authenticated webhooks
- ✅ Prevents abuse if signatures are compromised

**Note**: Webhook routes don't have dedicated rate limiters because they're authenticated via signature verification. This is correct.

### Versioning — ✅ CONSISTENT

All routes under `/api/v1/` — consistent with platform conventions.

---

## 7. Injection Vectors Summary

| Vector | Location | Risk | Status |
|--------|----------|------|--------|
| HTML injection via email | `telegramBot.ts:239,282` | **HIGH** | ❌ Not escaped |
| HTML injection via order ID | `telegramBot.ts:347,413` | **HIGH** | ❌ Not escaped |
| HTML injection via log content | `bot.py:136` | **MEDIUM** | ❌ Not escaped |
| SQL injection via email | `telegramBot.ts:230` | None | ✅ Parameterized |
| SQL injection via order ID | `telegramBot.ts:345,407` | None | ✅ Parameterized |
| Shell injection via flags | `bot.py:164-170` | None | ✅ Whitelist |
| Shell injection via subprocess | `deploy.py:148-156` | None | ✅ List args |
| Callback data replay | `telegramBot.ts:163-184` | None | ✅ Auth check |
| Deploy confirmation replay | `bot.py:214-253` | None | ✅ TTL + user check |

---

## 8. Recommendations (Priority Order)

### P0 — CRITICAL (Fix Immediately)

1. **Escape user input in Telegram bot HTML messages**
   - File: `server/src/agent/telegramBot.ts`
   - Lines: 239, 282, 347, 413
   - Fix: Wrap `email` and `externalId` with `escapeHtml()`
   - Risk: HTML injection could allow phishing or misleading messages

2. **Escape log content in deploy bot**
   - File: `deploy-bot/bot.py`
   - Line: 136
   - Fix: Apply `html.escape()` to each log line before sending
   - Risk: Malicious log content could inject HTML into Telegram messages

### P1 — HIGH (Fix Before Next Release)

3. **Add tests for HTML escaping**
   - File: `server/src/agent/__tests__/telegramBot.test.ts` (create)
   - Test cases:
     - Email with `<script>` tags
     - Order ID with HTML entities
     - Log content with `<b>` tags
   - Ensure `escapeHtml()` is applied consistently

4. **Document the polling architecture decision**
   - File: `deploy-bot/README.md`
   - Add section explaining why polling is used instead of webhooks
   - Clarify that this is intentional and secure for local deployment

### P2 — MEDIUM (Address in Next Sprint)

5. **Standardize error response shape**
   - File: All route handlers
   - Migrate from `{ success, message }` to `{ code, message, details, request_id }`
   - This is a breaking change — requires version bump and deprecation plan
   - **Not blocking for Telegram review**

6. **Add request ID generation to error handler**
   - File: `server/src/middleware/error.ts`
   - Generate unique `request_id` for each error
   - Include in error response for traceability

### P3 — LOW (Backlog)

7. **Consider adding deprecation headers to webhook routes**
   - If error response shape changes, add `Deprecation: true` and `Sunset: <date>` headers
   - Monitor usage before removing old format

8. **Add OpenAPI spec for webhook endpoints**
   - Document Clerk and Xendit webhook contracts
   - Generate from spec to prevent drift

---

## 9. What's Done Well

✅ **Authorization is comprehensive** — every command handler checks auth, no gaps  
✅ **Silent rejection** — unauthorized users get no response (prevents info disclosure)  
✅ **Callback query re-auth** — deploy bot checks auth on callback (critical for multi-user scenarios)  
✅ **Confirmation flow with TTL** — prevents accidental deploys  
✅ **Lock file mechanism** — prevents concurrent deploys  
✅ **Timing-safe comparison** — Xendit webhook uses `crypto.timingSafeEqual`  
✅ **Svix signature verification** — Clerk webhook uses proper signature validation  
✅ **Parameterized queries** — all database queries use Prisma (no SQL injection)  
✅ **Subprocess safety** — deploy bot uses list args (no shell injection)  
✅ **Fail-close configuration** — bots refuse to start without required secrets  

---

## 10. Conclusion

The Telegram deployment system now has the main repository-level Telegram fixes applied. Production readiness still depends on VPS provisioning, secret rotation, and end-to-end verification. The key controls are:

1. **HTML escaping inconsistency** in the server bot (P0)
2. **Log content injection** in the deploy bot (P0)

The architecture (polling for the deploy bot and webhook for the SRE bot) is intentional. Authorization is comprehensive, but the deploy bot must not be enabled in production until the service user, token rotation, tracked deployment artifacts, and staging tests are complete.

---

## Appendix: File Locations

- Server bot: `server/src/agent/telegramBot.ts`
- Deploy bot: `deploy-bot/bot.py`, `deploy-bot/deploy.py`, `deploy-bot/config.py`
- Webhook routes: `server/src/routes/webhooks.ts`
- Rate limiters: `server/src/middleware/rateLimiters.ts`
- Error handler: `server/src/middleware/error.ts`
- Express app: `server/src/app.ts`
