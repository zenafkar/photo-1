import type { Plugin } from "@opencode-ai/plugin"
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import path from "node:path"

const CONFIG_DIR = path.resolve(import.meta.dir, "..")
const TRACKER_PATH = path.join(CONFIG_DIR, "usage_tracker.json")
const LIMITS_PATH = path.join(CONFIG_DIR, "smart_limits.json")

type ModelKey = string
type WindowKey = "requests_5hr" | "requests_weekly" | "requests_monthly"

type UsageEntry = Record<WindowKey, number>
type WindowStarts = {
  "5hr": string
  weekly: string
  monthly: string
}
type Tracker = {
  last_updated: string
  window_starts?: WindowStarts
  models: Record<ModelKey, UsageEntry>
}

type Limits = {
  thresholds_90: Record<ModelKey, Record<WindowKey, number>>
  hierarchy: string[]
}

// Window durations in milliseconds
const WINDOW_5HR_MS = 5 * 60 * 60 * 1000
const WINDOW_WEEKLY_MS = 7 * 24 * 60 * 60 * 1000
const WINDOW_MONTHLY_MS = 30 * 24 * 60 * 60 * 1000

function loadJson<T>(p: string, fallback: T): T {
  try {
    if (!existsSync(p)) return fallback
    return JSON.parse(readFileSync(p, "utf-8")) as T
  } catch {
    return fallback
  }
}

function emptyTracker(): Tracker {
  const now = new Date().toISOString()
  return {
    last_updated: now,
    window_starts: {
      "5hr": now,
      weekly: now,
      monthly: now,
    },
    models: {},
  }
}

function loadTracker(): Tracker {
  const t = loadJson<Tracker>(TRACKER_PATH, emptyTracker())
  if (!t.models) t.models = {}
  // Initialize window_starts if missing (backward compatibility)
  if (!t.window_starts) {
    const now = new Date().toISOString()
    t.window_starts = { "5hr": now, weekly: now, monthly: now }
  }
  return t
}

function saveTracker(t: Tracker) {
  mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(TRACKER_PATH, JSON.stringify(t, null, 2) + "\n", "utf-8")
}

/**
 * Check if a window has expired and reset counters if so.
 * Returns true if any reset occurred.
 */
function rotateWindows(t: Tracker): boolean {
  const now = Date.now()
  let rotated = false

  // 5-Hour Window
  const hr5Start = new Date(t.window_starts!["5hr"]).getTime()
  if (now - hr5Start >= WINDOW_5HR_MS) {
    for (const model of Object.keys(t.models)) {
      t.models[model].requests_5hr = 0
    }
    t.window_starts!["5hr"] = new Date(now).toISOString()
    rotated = true
  }

  // Weekly Window
  const weeklyStart = new Date(t.window_starts!.weekly).getTime()
  if (now - weeklyStart >= WINDOW_WEEKLY_MS) {
    for (const model of Object.keys(t.models)) {
      t.models[model].requests_weekly = 0
    }
    t.window_starts!.weekly = new Date(now).toISOString()
    rotated = true
  }

  // Monthly Window
  const monthlyStart = new Date(t.window_starts!.monthly).getTime()
  if (now - monthlyStart >= WINDOW_MONTHLY_MS) {
    for (const model of Object.keys(t.models)) {
      t.models[model].requests_monthly = 0
    }
    t.window_starts!.monthly = new Date(now).toISOString()
    rotated = true
  }

  return rotated
}

export const SmartRouter: Plugin = async () => {
  // Serialize writes to avoid race conditions on rapid message updates.
  let writeQueue: Promise<void> = Promise.resolve()
  const enqueueWrite = (t: Tracker) => {
    writeQueue = writeQueue.then(() => saveTracker(t)).catch((e) => console.error("[smart-router]", e))
  }

  const record = (model: string) => {
    const t = loadTracker()

    // AUTO-RESET: Rotate expired windows before incrementing
    const rotated = rotateWindows(t)
    if (rotated) {
      console.log("[smart-router] Window rotation performed — expired counters reset to 0")
    }

    const entry = t.models[model] ?? { requests_5hr: 0, requests_weekly: 0, requests_monthly: 0 }
    t.models[model] = entry
    entry.requests_5hr += 1
    entry.requests_weekly += 1
    entry.requests_monthly += 1
    t.last_updated = new Date().toISOString()
    enqueueWrite(t)
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
