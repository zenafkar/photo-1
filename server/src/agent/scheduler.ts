import cron from 'node-cron';
import os from 'os';
import { telegramBot } from './telegramBot.js';
import { prisma } from '../config/prisma.js';
import { reconcilePayments } from '../reconciliation/reconcilePayments.js';

// DB keep-alive failure counter (reset on success)
let dbFailCount = 0;

// Tier 2: 5-minute and 15-minute Heartbeat
export function startScheduler() {
  console.log("[Scheduler] Starting AI Agent Cron Scheduler...");

  // Every 4 minutes — keep Neon PostgreSQL from auto-pausing (free tier: 5 min inactivity)
  cron.schedule('*/4 * * * *', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbFailCount = 0; // reset on success
    } catch (err) {
      dbFailCount++;
      console.error(`[Scheduler] DB keep-alive ping failed (${dbFailCount}/3):`, err);

      // After 3 consecutive failures (~12 min), send Telegram alert
      if (dbFailCount >= 3) {
        await telegramBot.sendFullActionReport({
          time: new Date().toISOString(),
          component: "Neon PostgreSQL",
          rootCause: "Database unreachable — possible outage or paused instance",
          action: "Manual check required — verify Neon dashboard",
          status: "CRITICAL_DB_DOWN",
        });
      }
    }
  });

  // Every 5 minutes (Basic Heartbeat)
  cron.schedule('*/5 * * * *', async () => {
    // Heartbeat: keep-alive ping already handles DB connection
  });

  // Every 15 minutes (Resource Check)
  cron.schedule('*/15 * * * *', async () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = ((totalMem - freeMem) / totalMem) * 100;

    // If RAM > 90%, trigger incident
    if (memUsage > 90) {
      import('./agent.js').then(({ handleAnomaly }) => {
        handleAnomaly({
          type: 'HIGH_MEMORY_USAGE',
          message: `Memory usage is critically high: ${memUsage.toFixed(2)}%`,
          timestamp: new Date().toISOString()
        });
      });
    }
  });

  // Every 15 minutes — Payment reconciliation (Xendit webhook catch-up)
  cron.schedule('*/15 * * * *', async () => {
    try {
      await reconcilePayments();
    } catch (err) {
      console.error("[Scheduler] Reconciliation cron failed:", err);
    }
  });

  // Tier 3 & Daily Summary (08:00 AM)
  cron.schedule('0 8 * * *', async () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    
    const metrics = {
      uptime: 100, // mock
      ram: (((totalMem - freeMem) / totalMem) * 100).toFixed(2),
    };
    
    await telegramBot.sendDailyHealthSummary(metrics);
    console.log("[Scheduler] Daily Health Summary sent to Telegram.");
  });
}
