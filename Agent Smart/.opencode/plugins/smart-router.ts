import type { Plugin } from "@opencode-ai/plugin"
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const CONFIG_DIR = path.resolve(import.meta.dir ?? path.dirname(fileURLToPath(import.meta.url)), "..")
const TRACKER_PATH = path.join(CONFIG_DIR, "usage_tracker.json")
const LIMITS_PATH = path.join(CONFIG_DIR, "smart_limits.json")

type ModelKey = string
type WindowKey = "rolling_5hr" | "weekly" | "monthly"
type CounterField = "requests_5hr" | "requests_weekly" | "requests_monthly"

type WindowReset = {
  source?: string
  next_reset: string
}

type ManualResets = Partial<Record<WindowKey, string>>

type Tracker = {
  last_updated: string
  manual_resets?: ManualResets
  windows?: Partial<Record<WindowKey, WindowReset>>
  models: Record<ModelKey, Record<CounterField, number>>
}

type Limits = {
  thresholds_90: Record<ModelKey, Record<CounterField, number>>
  hierarchy: string[]
}

// Window durations in milliseconds (fallback when no manual value is set)
const WINDOW_5HR_MS = 5 * 60 * 60 * 1000
const WINDOW_WEEKLY_MS = 7 * 24 * 60 * 60 * 1000
const WINDOW_MONTHLY_MS = 30 * 24 * 60 * 60 * 1000

const WINDOW_CONFIG: Record<WindowKey, { counter: CounterField; fallbackMs: number }> = {
  rolling_5hr: { counter: "requests_5hr", fallbackMs: WINDOW_5HR_MS },
  weekly: { counter: "requests_weekly", fallbackMs: WINDOW_WEEKLY_MS },
  monthly: { counter: "requests_monthly", fallbackMs: WINDOW_MONTHLY_MS },
}

function loadJson<T>(p: string, fallback: T): T {
  try {
    if (!existsSync(p)) return fallback
    return JSON.parse(readFileSync(p, "utf-8")) as T
  } catch {
    return fallback
  }
}

function emptyTracker(): Tracker {
  return {
    last_updated: new Date().toISOString(),
    manual_resets: {},
    windows: {},
    models: {},
  }
}

function loadTracker(): Tracker {
  const t = loadJson<Tracker>(TRACKER_PATH, emptyTracker())
  if (!t.models) t.models = {}
  t.manual_resets ??= {}
  t.windows ??= {}
  return t
}

function saveTracker(t: Tracker) {
  mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(TRACKER_PATH, JSON.stringify(t, null, 2) + "\n", "utf-8")
}

/**
 * Normalize a model key to the short form used in the tracker.
 * `opencode-go/qwen3.7-plus` -> `qwen3.7-plus`
 */
function normalizeModelKey(model: string): string {
  const idx = model.lastIndexOf("/")
  return idx === -1 ? model : model.slice(idx + 1)
}

/**
 * Parse a human "reset in" duration string (as pasted from the /go page),
 * e.g. "3 hours 49 minutes", "4 days 13 hours", "30 days 22 hours".
 * Returns milliseconds, or null when nothing usable was found.
 */
function parseResetDuration(input: unknown): number | null {
  if (typeof input !== "string" || !input) return null
  const s = input.trim().toLowerCase()
  if (!s || s === "a few seconds" || s === "a few minutes") return 0

  const units: Record<string, number> = {
    second: 1000,
    seconds: 1000,
    minute: 60_000,
    minutes: 60_000,
    hour: 3_600_000,
    hours: 3_600_000,
    day: 86_400_000,
    days: 86_400_000,
  }

  let total = 0
  const re = /(\d+)\s*(seconds?|minutes?|hours?|days?|s|min|hrs?|d)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s)) !== null) {
    const unit = units[m[2]]
    if (unit !== undefined) total += Number(m[1]) * unit
  }
  return total > 0 ? total : null
}

/**
 * Format a remaining time (ms) the way the /go page does:
 * "Xd Xh", "Xh Xmin", "Xmin", "a few seconds".
 */
function formatRemaining(ms: number): string {
  if (ms <= 0) return "a few seconds"
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  if (days >= 1) return `${days}d ${hours}h`
  if (hours >= 1) return `${hours}h ${minutes}min`
  if (minutes === 0) return "a few seconds"
  return `${minutes}min`
}

function nowISO(): string {
  return new Date().toISOString()
}

/**
 * Sync window rotation against the manual "reset in" values from the /go page.
 *
 * Rules (mirrors the OpenCode Go plan):
 * - Rolling 5hr: anchored to last usage; resets 5h after the last usage update.
 * - Weekly: resets at the next Monday 00:00 UTC boundary.
 * - Monthly: resets on the subscription-day anniversary each month.
 *
 * When a manual value is set, `next_reset` is derived from `now + duration`.
 * Returns true if any reset occurred.
 */
function syncWindows(t: Tracker, now: number = Date.now()): boolean {
  let rotated = false
  t.manual_resets ??= {}
  t.windows ??= {}

  for (const key of Object.keys(WINDOW_CONFIG) as WindowKey[]) {
    const cfg = WINDOW_CONFIG[key]
    const manual = t.manual_resets[key]
    const window = t.windows[key]
    const nextReset = window?.next_reset ? new Date(window.next_reset).getTime() : null

    // Expired window -> reset counters for all models and drop the manual entry.
    if (nextReset !== null && now >= nextReset) {
      for (const model of Object.keys(t.models)) {
        t.models[model][cfg.counter] = 0
      }
      delete t.manual_resets[key]
      rotated = true
      console.log(`[smart-router] ${key} window expired — counters reset to 0, manual entry cleared`)
      // Re-establish an immediate fallback window so next_reset always exists.
      t.windows[key] = {
        source: "",
        next_reset: new Date(now + cfg.fallbackMs).toISOString(),
      }
      continue
    }

    // (Re)compute next_reset from the manual value whenever it changes or is missing.
    const parsed = manual !== undefined ? parseResetDuration(manual) : null
    if (parsed !== null && (window?.source !== manual || window?.next_reset === undefined)) {
      t.windows[key] = {
        source: manual,
        next_reset: new Date(now + parsed).toISOString(),
      }
      console.log(`[smart-router] ${key} manual reset synced — resets in ${formatRemaining(parsed)}`)
    }

    // Fallback when no manual value: roll on a fixed window from first use.
    if (!t.windows[key]?.next_reset) {
      t.windows[key] = {
        source: "",
        next_reset: new Date(now + cfg.fallbackMs).toISOString(),
      }
    }
  }

  return rotated
}

/**
 * Compute the time remaining (ms) for each window from the current tracker.
 */
function remainingFromTracker(t: Tracker, now: number = Date.now()): Partial<Record<WindowKey, number>> {
  const out: Partial<Record<WindowKey, number>> = {}
  for (const key of Object.keys(WINDOW_CONFIG) as WindowKey[]) {
    const nextReset = t.windows?.[key]?.next_reset
    out[key] = nextReset ? Math.max(0, new Date(nextReset).getTime() - now) : 0
  }
  return out
}export const SmartRouter: Plugin = async () => {
  // Serialize writes to avoid race conditions on rapid message updates.
  let writeQueue: Promise<void> = Promise.resolve()
  const enqueueWrite = (t: Tracker) => {
    writeQueue = writeQueue.then(() => saveTracker(t)).catch((e) => console.error("[smart-router]", e))
  }

  const record = (model: string) => {
    const t = loadTracker()

    // AUTO-RESET: rotate expired windows before incrementing
    const rotated = syncWindows(t)
    if (rotated) {
      console.log("[smart-router] Window rotation performed — expired counters reset to 0")
    }

    const key = normalizeModelKey(model)
    const entry = t.models[key] ?? { requests_5hr: 0, requests_weekly: 0, requests_monthly: 0 }
    t.models[key] = entry
    entry.requests_5hr += 1
    entry.requests_weekly += 1
    entry.requests_monthly += 1
    t.last_updated = nowISO()

    const remaining = remainingFromTracker(t)
    console.log(
      `[smart-router] ${key} +1 | 5hr ${formatRemaining(remaining.rolling_5hr ?? 0)} | ` +
        `weekly ${formatRemaining(remaining.weekly ?? 0)} | monthly ${formatRemaining(remaining.monthly ?? 0)}`,
    )

    enqueueWrite(t)
  }

  // Run a rotation + sync pass on plugin load so stale windows self-heal even
  // before the first assistant message arrives.
  const initial = loadTracker()
  const initialRotated = syncWindows(initial)
  if (initialRotated || Object.keys(initial.windows ?? {}).length === 0) enqueueWrite(initial)
  else {
    const remaining = remainingFromTracker(initial)
    console.log(
      `[smart-router] Loaded — 5hr resets in ${formatRemaining(remaining.rolling_5hr ?? 0)} | ` +
        `weekly ${formatRemaining(remaining.weekly ?? 0)} | monthly ${formatRemaining(remaining.monthly ?? 0)}`,
    )
  }

  return {
    event: async ({ event }) => {
      if (event.type !== "message.updated") return
      const info = event.properties.info as {
        role?: string
        providerID?: string
        modelID?: string
      }
      if (!info || info.role !== "assistant") return
      if (!info.providerID || !info.modelID) return
      record(`${info.providerID}/${info.modelID}`)
    },
  }
}
