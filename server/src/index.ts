import { createApp } from "./app.js";
import { startScheduler } from "./agent/scheduler.js";
import "./agent/agent.js";
import { prisma } from "./config/prisma.js";
import { initBotWebhook } from "./agent/telegramBot.js";

const PORT = Number(process.env.PORT || 5000);
const app = createApp();

// Register the webhook route synchronously; the Telegram API call inside is
// best-effort and intentionally runs in the background.
void initBotWebhook(app).catch((error) => {
  console.error("[Telegram] Webhook initialization failed (non-fatal):", error);
});

const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(`[server]: Server is running at http://127.0.0.1:${PORT}`);
  startScheduler();
});

async function shutdown(signal: string) {
  console.log(`[server] Received ${signal} — shutting down gracefully...`);

  server.close();

  try { await prisma.$disconnect(); } catch {}

  console.log("[server] Shutdown complete.");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
