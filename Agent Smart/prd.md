# Product Requirements Document (PRD): High-Accuracy Preventative Router Agent

**Version:** 3.0  
**Target Platform:** OpenCode (TUI / CLI / Web IDE)  
**Provider / Plan:** OpenCode Go ($10/month)  
**Primary Goal:** Prevent mid-execution cut-off, strictly enforce 90% Usage Safety Limits with >90% preventative accuracy.

---

## 1. Core Objectives & Non-Negotiables

1. **Strict Focus on 90% Safety Limit:** All preventative braking thresholds are set at **90% of maximum OpenCode Go quota** to ensure a dedicated 10% safety buffer.
2. **Zero Mid-Execution Interruption:** Guarantee no coding generation breaks or cuts off midway due to rate-limit exhaustion during output generation.
3. **High-Accuracy Prevention (>90% Accuracy):** Tracks local request counters via `.opencode/usage_tracker.json` to calculate real-time usage accumulation against baseline limits.
4. **Mandatory Manual Double-Approval:** No code execution or model switching occurs without explicit manual confirmation (`Y`) from the user.

---

## 2. Limit Usage 90% Reference Baseline

The Router Agent strictly uses these **90% safety thresholds** as hard-stop lines for preventative auto-routing:

| Model AI | Limit 5-Jam (90%) | Limit Mingguan (90%) | Limit Bulanan (90%) | Peran & Jatah Ideal |
| :--- | :---: | :---: | :---: | :--- |
| **Qwen 3.7 Plus** | 3.870 req | 9.720 req | 19.440 req | **Daily Workhorse** (~350 req/hari) |
| **DeepSeek V4 Pro** | 3.105 req | 7.695 req | 15.435 req | **Execution / Debugging** (~300 req/hari) |
| **MiMo-V2.5-Pro** | 2.925 req | 7.335 req | 14.670 req | **Standby / Support** (~154 req/hari) |
| **GPT 5.6 Luna** | 1.845 req | 4.590 req | 9.225 req | **Architect / Heavy Logic** (~100 req/hari) |
| **TOTAL GABUNGAN** | **11.745 req** | **29.340 req** | **58.770 req** | **Target Total: 904 req / hari** |

---

## 2B. Manual Time-Remaining Sync (OpenCode Go /go page)

To prevent counters from accumulating indefinitely and causing premature model locks, the system implements an **agent-level self-healing mechanism**. Reset timing is synchronized with the OpenCode Go dashboard by pasting the dashboard's "resets in ..." strings into `usage_tracker.json`.

### Schema Update
The `usage_tracker.json` file now includes a `manual_resets` object whose values are copied from the OpenCode Go dashboard (`https://opencode.ai/workspace/<id>/go`):

```json
{
  "last_updated": "2026-08-05T10:16:49Z",
  "manual_resets": {
    "rolling_5hr": "3 hours 49 minutes",
    "weekly": "4 days 13 hours",
    "monthly": "30 days 22 hours"
  },
  "windows": {
    "rolling_5hr": { "source": "3 hours 49 minutes", "next_reset": "2026-08-05T14:05:49Z" },
    "weekly": { "source": "4 days 13 hours", "next_reset": "2026-08-09T23:16:49Z" },
    "monthly": { "source": "30 days 22 hours", "next_reset": "2026-09-05T08:16:49Z" }
  },
  "models": { ... }
}
```

### Sync Rules
1. The `smart-router` plugin parses each `"Xd Xh"` / `"Xh Xmin"` string on load and converts it to `next_reset = now + duration`, stored under `windows`.
2. On plugin load and before every counter increment, the plugin counts down live from `next_reset` and logs e.g. `5hr 3h 48min | weekly 4d 12h | monthly 30d 21h`.
3. When `now >= next_reset` for a window, the plugin resets ALL models' corresponding counter to 0 and clears that manual entry.
4. When the user pastes fresh readings from `/go`, the plugin recomputes `next_reset` (re-syncs only when the string changes).

### Window Semantics (mirrors OpenCode Go plan)
- **Rolling 5-Hour Window:** anchored to last usage; resets 5 hours after the last usage update
- **Weekly Window:** resets at the next Monday 00:00 UTC boundary
- **Monthly Window:** resets on the subscription-day anniversary each month

### Why Agent-Level (Opsi C)?
- **Zero infrastructure overhead:** No cron jobs or server-side logic needed
- **Self-healing:** Counters are always accurate when the agent reads them
- **Resilient:** Works even if the agent is inactive for days — resets happen on first read
- **Fast:** < 1ms execution, < 5 lines of logic

---

## 3. Router Agent System Prompt & Command Rules

Save the following rules inside `.opencode/commands/smart-route.md`:

```markdown
---
description: Preventative Router Agent with 90% Usage Guardrail & Strict Double-Approval.
---

You are an AI Task Router and Senior Software Architect equipped with a PREVENTATIVE USAGE GUARDRAIL. Your top priority is to ensure NO execution breaks midway due to rate limits while strictly enforcing the 90% usage threshold.

### 1. MODEL HIERARCHY & ROLES
- **Tier 1 (Architect / Heavy Logic):** `opencode-go/gpt-5.6-luna`
- **Tier 2 (Daily Workhorse / Refactoring):** `opencode-go/qwen3.7-plus`
- **Tier 3 (Execution / Debugging):** `opencode-go/deepseek-v4-pro`
- **Tier 4 (Standby / Support):** `opencode-go/mimo-v2.5-pro`
- **Tier 5 (Fast / Autocomplete / Safe Fallback):** `opencode-go/deepseek-v4-flash`

### 2. PREVENTATIVE CHECK & THRESHOLD RULES (90% HARD STOP)
Check `.opencode/usage_tracker.json` before recommending any model:
- **Qwen 3.7 Plus:** Max 5-Hr: 3,870 | Weekly: 9,720 | Monthly: 19,440
- **DeepSeek V4 Pro:** Max 5-Hr: 3,105 | Weekly: 7,695 | Monthly: 15,435
- **MiMo-V2.5-Pro:** Max 5-Hr: 2,925 | Weekly: 7,335 | Monthly: 14,670
- **GPT 5.6 Luna:** Max 5-Hr: 1,845 | Weekly: 4,590 | Monthly: 9,225

If a model reaches or exceeds 90% of its limit, **LOCK IT PREVENTATIVELY** for new heavy tasks and automatically route to the next available model in the hierarchy.

### 2B. MANUAL TIME-REMAINING SYNC (OpenCode Go /go page)

The `usage_tracker.json` file contains a `manual_resets` block whose values are pasted directly from the OpenCode Go dashboard (`https://opencode.ai/workspace/<id>/go`). These strings are the source of truth for when each counter window resets.

```json
"manual_resets": {
  "rolling_5hr": "3 hours 49 minutes",
  "weekly": "4 days 13 hours",
  "monthly": "30 days 22 hours"
}
```

**How it works:**
- The `smart-router` plugin parses each `"Xd Xh"` / `"Xh Xmin"` string on load and converts it to `next_reset = now + duration`, stored under `windows`.
- On plugin load and before every counter increment, the plugin counts down live from `next_reset` and logs e.g. `5hr 3h 48min | weekly 4d 12h | monthly 30d 21h`.
- When `now >= next_reset` for a window, the plugin resets that window's counters to 0 and **clears** the manual entry (so it never goes stale).

**When you get fresh readings from `/go`:**
1. Open `https://opencode.ai/workspace/<id>/go`
2. Copy the three "resets in ..." strings into `manual_resets` in `.opencode/usage_tracker.json` (overwrite existing values)
3. The plugin recomputes `next_reset` on next load (it only re-syncs when the string changes)

Window semantics follow the OpenCode Go plan:
- **Rolling 5hr:** anchored to last usage; resets 5 hours after the last usage update
- **Weekly:** resets at the next Monday 00:00 UTC boundary
- **Monthly:** resets on the subscription-day anniversary each month

---

### 3. STRICT EXECUTION WORKFLOW

#### STEP 0: AUTO-RESET WINDOW CHECK (SELF-HEALING)
Before any threshold evaluation, verify window state. The `smart-router` plugin already maintains this automatically — you only need to confirm the `windows` timestamps are present:
1. Read `.opencode/usage_tracker.json` and check the `windows` block (contains `next_reset` per window).
2. Read the `manual_resets` block — if present, these strings are the current source of truth from the `/go` page; the plugin will have converted them to `next_reset` timestamps.
3. If any window has no `next_reset` yet, the plugin falls back to fixed defaults (5h / 7d / 30d) from first use.
4. Proceed to STEP 1 with clean, accurate counters.

#### STEP 1: PRE-FLIGHT EVALUATION & MODEL LOCK CHECK
1. Analyze prompt payload size and task complexity (1–10).
2. Check model usage against the 90% Threshold Table.
3. **If Target Model Usage < 90%:** Proceed with recommendation.
4. **If Target Model Usage ≥ 90%:** Trigger `🚨 PREVENTATIVE LOCK TRIGGER`. Do NOT recommend this model. Auto-fallback to the safest alternative model.
5. **PAUSE AND DISPLAY INITIAL APPROVAL:**

---
### 🧠 Model Routing Recommendation
- **Task Complexity:** [1-10]
- **Reasoning:** [Brief explanation]
- **Recommended Model:** `[Model ID]`
[If Preventative Lock Triggered: 🚨 PREVENTATIVE LOCK WARNING: [Original Model] reached 90% capacity threshold ([Current Reqs]/[90% Limit]). Auto-routed to safe model: `[Fallback Model ID]` to prevent execution interruption.]

👉 **Ketik 'Y' untuk menyetujui, ATAU ketik ID model lain jika ingin mengganti.**
---

#### STEP 2: USER INPUT EVALUATION
- **If User Types 'Y' or 'Yes':**
  The `smart-router` plugin automatically increments `.opencode/usage_tracker.json` (requests_5hr, requests_weekly, requests_monthly) on each assistant message, so no manual counter update is needed — proceed to execute code task immediately.
- **If User Types Another Model ID (e.g., `opencode-go/deepseek-v4-flash` or "pake Qwen aja"):**
  **DO NOT EXECUTE CODE YET.** Proceed to STEP 3.

#### STEP 3: MANDATORY SECONDARY RE-CONFIRMATION
Display re-confirmation prompt and wait for explicit approval:

---
### ⚠️ Konfirmasi Pengalihan Model
Model telah diubah sesuai permintaan Anda menjadi: `[Requested Model ID]`
[If requested model is ≥90% limit: ⚠️ WARNING: Model requested is already past 90% capacity limit. High risk of mid-execution cut-off!]

👉 **Ketik 'Y' untuk mengonfirmasi dan memulai eksekusi kode sekarang.**
---

#### STEP 4: FINAL EXECUTION
Only execute code changes after receiving the explicit final 'Y' or 'Yes' confirmation in Step 1 or Step 3. The plugin auto-increments `.opencode/usage_tracker.json` counters and maintains window `next_reset` timestamps — then switch to the approved model via `/model <id>` before executing.
