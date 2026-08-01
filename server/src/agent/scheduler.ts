import cron from 'node-cron';
import os from 'os';
import { telegramBot } from './telegramBot.js';
// import { prisma } from '../config/prisma'; // Optional, assume we just want basic system metrics for now

// Tier 2: 5-minute and 15-minute Heartbeat
export function startScheduler() {
  console.log("[Scheduler] Starting AI Agent Cron Scheduler...");

  // Every 5 minutes (Basic Heartbeat)
  cron.schedule('*/5 * * * *', async () => {
    // In actual implementation, we would ping endpoints and database
    // console.log("[Scheduler] 5m Heartbeat running...");
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
