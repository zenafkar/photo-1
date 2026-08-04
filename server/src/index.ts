import { createApp } from "./app.js";
import { startScheduler } from "./agent/scheduler.js";
import "./agent/agent.js"; // Initialize agent to listen to telemetry events
import { prisma } from "./config/prisma.js";
import { bot } from "./agent/telegramBot.js";

const PORT = process.env.PORT || 5000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
  startScheduler();
});

// ── Graceful shutdown ──────────────────────────────────────────
async function shutdown(signal: string) {
  console.log(`[server] Received ${signal} — shutting down gracefully...`);

  // Stop accepting new connections
  server.close();

  // Stop Telegram bot polling
  if (bot) {
    try { await bot.stopPolling(); } catch {}
  }

  // Disconnect Prisma
  try { await prisma.$disconnect(); } catch {}

  console.log("[server] Shutdown complete.");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
