import TelegramBot from 'node-telegram-bot-api';
import { randomBytes, timingSafeEqual } from 'crypto';
import type { Express } from 'express';
import dotenv from 'dotenv';
import { webhookLimiter } from '../middleware/rateLimiters.js';

dotenv.config();

export const TELEGRAM_WEBHOOK_PATH = '/api/v1/internal/telegram-webhook';
const WEBHOOK_SECRET_HEADER = 'x-telegram-bot-api-secret-token';
const registeredWebhookApps = new WeakSet<Express>();

type PendingApproval = {
  actionId: string;
  chatId: string;
  expiresAt: number;
};

const pendingApprovals = new Map<string, PendingApproval>();
const APPROVAL_TTL_MS = 5 * 60 * 1000;

function getTelegramToken(): string {
  // The SRE bot token is read exclusively from TELEGRAM_SRE_BOT_TOKEN. The
  // legacy TELEGRAM_BOT_TOKEN is intentionally NOT used here: it belongs to
  // deploy-bot (a separate polling bot) and must never drive the SRE bot.
  return process.env.TELEGRAM_SRE_BOT_TOKEN || '';
}

function getReportLevel(): string {
  return process.env.TELEGRAM_REPORT_LEVEL || 'WARNING_AND_ABOVE';
}

function getReportChatId(): string {
  return process.env.TELEGRAM_CHAT_ID || '';
}

function getWebhookSecret(): string {
  return process.env.TELEGRAM_WEBHOOK_SECRET || '';
}

export function isAdminChat(chatIdToCheck: string): boolean {
  const raw = process.env.TELEGRAM_ADMIN_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || '';
  const adminIds = raw.split(",").map(s => s.trim()).filter(Boolean);
  return adminIds.includes(chatIdToCheck);
}

/**
 * A private chat is safe by default because its chat ID equals the user ID.
 * Group chats additionally require TELEGRAM_ADMIN_USER_IDS so that any group
 * member cannot approve an action merely by being in an allowed chat.
 */
export function isAuthorizedTelegramUser(
  chatIdToCheck: string,
  userId: string | undefined,
  chatType: string | undefined,
): boolean {
  if (!isAdminChat(chatIdToCheck) || !userId) return false;

  const configuredUserIds = (process.env.TELEGRAM_ADMIN_USER_IDS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  if (configuredUserIds.length > 0) return configuredUserIds.includes(userId);
  return chatType === 'private' && userId === chatIdToCheck;
}

function isAuthorizedMessage(msg: { chat: { id: number; type?: string }; from?: { id: number } }): boolean {
  return isAuthorizedTelegramUser(
    String(msg.chat.id),
    msg.from?.id === undefined ? undefined : String(msg.from.id),
    msg.chat.type,
  );
}

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export let bot: TelegramBot | null = null;

export function isValidWebhookSecret(received: unknown, expected = getWebhookSecret()): boolean {
  // Telegram secret tokens are 1–256 chars from this restricted alphabet. An
  // absent or malformed configuration must never authenticate a request.
  if (typeof received !== 'string' || !/^[A-Za-z0-9_-]{1,256}$/.test(expected)) return false;

  const receivedBuffer = Buffer.from(received, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  return receivedBuffer.length === expectedBuffer.length
    && timingSafeEqual(receivedBuffer, expectedBuffer);
}

function registerWebhookRoute(app: Express): void {
  if (registeredWebhookApps.has(app)) return;
  registeredWebhookApps.add(app);

  app.post(TELEGRAM_WEBHOOK_PATH, webhookLimiter, (req, res) => {
    const secret = getWebhookSecret();
    if (!secret) {
      console.error('[Telegram] TELEGRAM_WEBHOOK_SECRET is missing — rejecting webhook request');
      res.sendStatus(503);
      return;
    }

    const receivedSecret = req.headers[WEBHOOK_SECRET_HEADER];
    if (!isValidWebhookSecret(receivedSecret, secret)) {
      res.sendStatus(403);
      return;
    }

    if (!bot) {
      res.sendStatus(503);
      return;
    }

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      res.sendStatus(400);
      return;
    }

    const upd = req.body as any;
    const fromId = upd?.message?.from?.id ?? upd?.callback_query?.from?.id;
    const chatType = upd?.message?.chat?.type ?? upd?.callback_query?.message?.chat?.type;
    const text = upd?.message?.text ?? upd?.callback_query?.data ?? '';
    console.log(`[Telegram] WEBHOOK RECV user_id=${fromId} chat_type=${chatType} text=${String(text).slice(0, 60)}`);

    try {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    } catch (err: any) {
      console.error('[Telegram] Failed to process webhook update:', err?.message || err);
      res.sendStatus(500);
    }
  });
}

export async function initBotWebhook(app: Express): Promise<TelegramBot | null> {
  // Register synchronously before the first await. This makes the endpoint
  // available immediately while setWebHook remains best-effort in the
  // background and never delays app.listen().
  registerWebhookRoute(app);

  const token = getTelegramToken();
  if (!token) {
    bot = null;
    console.error('[Telegram] SRE bot token is missing; webhook registration skipped');
    return null;
  }

  try {
    bot = null;
    bot = new TelegramBot(token);

    bot.on("error", (err) => {
      console.error("[Telegram] Bot error (non-fatal):", err?.message || err);
    });

    registerHandlers();

    const webhookSecret = getWebhookSecret();
    if (!isValidWebhookSecret(webhookSecret, webhookSecret)) {
      console.error('[Telegram] TELEGRAM_WEBHOOK_SECRET is missing; webhook registration skipped');
      return bot;
    }

    const domain = (process.env.DOMAIN || 'https://zenstudio.my.id').replace(/\/+$/, '');
    try {
      await bot.setWebHook(`${domain}${TELEGRAM_WEBHOOK_PATH}`, { secret_token: webhookSecret });
      console.log(`[Telegram] Webhook set to ${domain}${TELEGRAM_WEBHOOK_PATH}`);
    } catch (err: any) {
      console.error("[Telegram] Failed to set webhook:", err?.message || err);
    }

    return bot;
  } catch (error) {
    console.error("Failed to initialize Telegram Bot", error);
    return null;
  }
}

async function doSendApprovalRequest(actionId: string, description: string, riskLevel: string) {
  const reportChatId = getReportChatId();
  if (!bot || !reportChatId) return;

  for (const [token, pending] of pendingApprovals) {
    if (pending.expiresAt <= Date.now()) pendingApprovals.delete(token);
  }

  const callbackToken = randomBytes(16).toString('hex');
  pendingApprovals.set(callbackToken, {
    actionId,
    chatId: reportChatId,
    expiresAt: Date.now() + APPROVAL_TTL_MS,
  });

  const message = `
⚠️ <b>ACTION APPROVAL REQUIRED</b>
• <b>Risk Level:</b> ${escapeHtml(riskLevel)}
• <b>Action:</b> ${escapeHtml(description)}
  `;

  const opts = {
    parse_mode: 'HTML' as const,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Approve', callback_data: `APPROVE_${callbackToken}` },
          { text: '❌ Reject', callback_data: `REJECT_${callbackToken}` }
        ]
      ]
    }
  };

  await bot.sendMessage(reportChatId, message, opts);
}

function registerHandlers() {
  if (!bot) return;

  bot.onText(/^\/help$|^\/start$|^\/ping$/, (msg) => {
    const cid = msg.chat.id;
    if (!isAuthorizedMessage(msg)) return;
    if (msg.text?.trim() === '/ping') {
      bot?.sendMessage(cid, "pong — bot online ✅", { parse_mode: 'HTML' });
      return;
    }
    const helpText = `
🛠️ <b>AI SRE AGENT COMMAND MENU</b>

• <b>/help</b> - Menampilkan daftar seluruh perintah bantuan ini.
• <b>/check</b>, <b>/status</b>, <b>/health</b> - Menjalankan instant health check (API, Database, RAM/CPU VPS).
• <b>/test</b>, <b>/deepcheck</b>, <b>/synthetic</b> - Memicu pengujian fungsional sintetis mendalam dari hulu ke hilir.
• <b>/metrics</b>, <b>/vps</b>, <b>/ram</b>, <b>/storage</b>, <b>/disk</b> - Menampilkan statistik performa, RAM, & penggunaan storage VPS real-time.
• <b>/restart</b> - Meminta restart PM2 process server (membutuhkan konfirmasi approval).
      `;
    bot?.sendMessage(cid, helpText, { parse_mode: 'HTML' });
  });

  bot.onText(/^\/check$|^\/status$|^\/health$/, async (msg) => {
    const cid = msg.chat.id;
    if (!isAuthorizedMessage(msg)) return;

    const os = await import('os');
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const ramUsage = (((totalMem - freeMem) / totalMem) * 100).toFixed(2);

    let dbStatus = "UNKNOWN";
    try {
      const { prisma } = await import("../config/prisma.js");
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "CONNECTED";
    } catch {
      dbStatus = "DISCONNECTED";
    }

    const statusText = `
🟢 <b>SYSTEM HEALTH REPORT</b>

• <b>Server Status:</b> ONLINE 24/7
• <b>RAM Usage:</b> ${ramUsage}%
• <b>CPU Cores:</b> ${os.cpus().length} Cores
• <b>System Uptime:</b> ${(os.uptime() / 3600).toFixed(1)} Jam
• <b>Database:</b> ${dbStatus}
      `;
    bot?.sendMessage(cid, statusText, { parse_mode: 'HTML' });
  });

  bot.onText(/^\/metrics$|^\/vps$|^\/ram$|^\/storage$|^\/disk$/, async (msg) => {
    const cid = msg.chat.id;
    if (!isAuthorizedMessage(msg)) return;

    const os = await import('os');

    const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
    const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
    const usedMem = (parseFloat(totalMem) - parseFloat(freeMem)).toFixed(2);

    let storageDetails = "• <b>Storage Info:</b> Unavailable";
    try {
      const { execSync } = await import('child_process');
      const dfOutput = execSync("df -BG / | awk 'NR==2{print $2,$3,$4,$5}'", { encoding: 'utf-8' }).trim();
      const [total, used, free, pct] = dfOutput.split(/\s+/);
      storageDetails = `• <b>Total Storage:</b> ${total}\n• <b>Used Storage:</b> ${used} (${pct})\n• <b>Free Storage:</b> ${free}`;
    } catch (err) {
      console.warn("Failed to check disk storage:", err);
    }

    const metricsText = `
📊 <b>VPS RESOURCE METRICS</b>

• <b>Total RAM:</b> ${totalMem} GB
• <b>Used RAM:</b> ${usedMem} GB
• <b>Free RAM:</b> ${freeMem} GB
${storageDetails}
• <b>Platform:</b> ${os.platform()} (${os.arch()})
      `;
    bot?.sendMessage(cid, metricsText, { parse_mode: 'HTML' });
  });

  bot.onText(/^\/test$|^\/deepcheck$|^\/synthetic$/, async (msg) => {
    const cid = msg.chat.id;
    if (!isAuthorizedMessage(msg)) return;

    const statusMsg = await bot?.sendMessage(cid, "⏳ <i>Menjalankan Deep Synthetic Checkup...</i>", { parse_mode: 'HTML' });

    const checks = await Promise.allSettled([
      fetch('http://localhost:5000/api/v1/health/live')
        .then(r => r.ok ? 'PASS (200 OK)' : `FAIL (${r.status})`),
      fetch('http://localhost:5000/api/v1/health/ready')
        .then(r => r.ok ? 'PASS (Query Connected)' : `FAIL (${r.status})`),
      (async () => {
        try {
          const { prisma } = await import("../config/prisma.js");
          await prisma.$queryRaw`SELECT 1`;
          return 'PASS (Query Connected)';
        } catch {
          return 'FAIL (DB Unreachable)';
        }
      })(),
      (async () => {
        try {
          const fs = await import('fs');
          await fs.promises.access('uploads', fs.constants.W_OK);
          return 'PASS (Writable)';
        } catch {
          return 'FAIL (Not Writable)';
        }
      })(),
      (() => {
        const os = require('os');
        const used = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
        return used < 90 ? `PASS (${used.toFixed(1)}% Used)` : `WARN (${used.toFixed(1)}% Used)`;
      })(),
    ]);

    const results = checks.map(c => c.status === 'fulfilled' ? c.value : 'FAIL (Error)');
    const allPass = results.every(r => r.startsWith('PASS'));

    const testReport = `
🧪 <b>DEEP SYNTHETIC CHECKUP REPORT</b>

• <b>Express API Gateway:</b> ${results[0]}
• <b>API Readiness:</b> ${results[1]}
• <b>Prisma ORM & Database:</b> ${results[2]}
• <b>Storage / Upload Path:</b> ${results[3]}
• <b>VPS Memory Health:</b> ${results[4]}

${allPass ? '✅ <b>Kesimpulan:</b> Seluruh fungsi, script, dan sistem berjalan 100% normal tanpa anomaly!' : '⚠️ <b>Kesimpulan:</b> Ada komponen yang FAIL/WARN — segera periksa!'}
    `;

    if (statusMsg) {
      await bot?.editMessageText(testReport, {
        chat_id: statusMsg.chat.id,
        message_id: statusMsg.message_id,
        parse_mode: 'HTML',
      });
    } else {
      await bot?.sendMessage(cid, testReport, { parse_mode: 'HTML' });
    }
  });

  bot.onText(/^\/restart$/, (msg) => {
    const cid = msg.chat.id;
    if (!isAuthorizedMessage(msg)) return;
    void doSendApprovalRequest('PM2_MANUAL_RESTART', 'Manual PM2 Restart requested via Telegram', 'HIGH');
  });

  bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    if (!message) return;

    if (!isAuthorizedTelegramUser(
      String(message.chat.id),
      callbackQuery.from?.id === undefined ? undefined : String(callbackQuery.from.id),
      message.chat.type,
    )) {
      await bot?.answerCallbackQuery(callbackQuery.id, { text: 'Unauthorized — admin only.' });
      return;
    }

    const callbackMatch = /^(APPROVE|REJECT)_([a-f0-9]{32})$/.exec(callbackQuery.data || '');
    const pending = callbackMatch ? pendingApprovals.get(callbackMatch[2]) : undefined;
    if (!pending || pending.expiresAt <= Date.now() || pending.chatId !== String(message.chat.id)) {
      await bot?.answerCallbackQuery(callbackQuery.id, { text: 'Approval expired or invalid.' });
      return;
    }

    // Consume before executing. A second click/replayed callback cannot repeat
    // a credit grant, restart, push, or issue creation.
    pendingApprovals.delete(callbackMatch![2]);
    await bot?.answerCallbackQuery(callbackQuery.id, {
      text: callbackMatch![1] === 'REJECT' ? 'Rejected' : 'Processing...',
    });

    if (callbackMatch![1] === 'REJECT') {
      await bot?.sendMessage(message.chat.id, "❌ <b>Action Rejected:</b> Operator menolak eksekusi ini.", { parse_mode: 'HTML' });
      return;
    }

    try {
      const action = pending.actionId;
      const creditMatch = /^CREDIT_ADD_(.+)_(\d+)$/.exec(action);
      if (creditMatch) {
        const userId = creditMatch[1];
        const amount = Number(creditMatch[2]);
        if (!userId || !Number.isSafeInteger(amount) || amount <= 100 || amount > 1_000_000) {
          await bot?.sendMessage(message.chat.id, '❌ Approval kredit invalid.', { parse_mode: 'HTML' });
          return;
        }

        const { creditOps } = await import("../services/credits.js");
        const { prisma } = await import("../config/prisma.js");
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const result = await creditOps.add(userId, amount, {
          type: "admin_credit",
          reason: "Admin grant via Telegram (approved)",
          operatorId: user?.clerkId || undefined,
        });
        await bot?.sendMessage(
          message.chat.id,
          `✅ <b>+${amount} kredit</b> diberikan ke <b>${escapeHtml(user?.email || userId)}</b>. Sisa: <b>${result.remainingCredits}</b>.`,
          { parse_mode: 'HTML' }
        );
      } else if (action === 'RESTART_PM2' || action === 'PM2_MANUAL_RESTART') {
        await bot?.sendMessage(message.chat.id, "⚡ <b>Action Executing:</b> Restarting PM2 process...", { parse_mode: 'HTML' });
        const { remediationTools } = await import('./tools/remediationTools.js');
        const res = await remediationTools.restartPM2Process('backend-api');
        await bot?.sendMessage(message.chat.id, `✅ <b>Action Completed:</b> ${escapeHtml(res.message)}`, { parse_mode: 'HTML' });
      } else if (action === 'GIT_PUSH') {
        await bot?.sendMessage(message.chat.id, "⚡ <b>Action Executing:</b> Auto git push to master...", { parse_mode: 'HTML' });
        const { remediationTools } = await import('./tools/remediationTools.js');
        const res = await remediationTools.autoPushToMaster("Auto fix via Telegram (approved)");
        await bot?.sendMessage(message.chat.id, `✅ <b>Action Completed:</b> ${escapeHtml(res.message)}`, { parse_mode: 'HTML' });
      } else if (action === 'GITHUB_ISSUE') {
        await bot?.sendMessage(message.chat.id, "⚡ <b>Action Executing:</b> Creating GitHub issue...", { parse_mode: 'HTML' });
        const { remediationTools } = await import('./tools/remediationTools.js');
        const res = await remediationTools.createGitHubIssue(action, "Issue created via Telegram approval.");
        await bot?.sendMessage(message.chat.id, `✅ <b>Action Completed:</b> ${escapeHtml(res.message)}`, { parse_mode: 'HTML' });
      } else {
        await bot?.sendMessage(message.chat.id, '❌ Approval action tidak dikenal.', { parse_mode: 'HTML' });
      }
    } catch (err) {
      console.error('[Telegram] Approval execution failed:', err);
      await bot?.sendMessage(message.chat.id, '❌ Gagal menjalankan approval. Cek log server untuk detail.', { parse_mode: 'HTML' });
    }
  });

  bot.onText(/^\/credit\s+check\s+(\S+)/, async (msg, match) => {
    const cid = msg.chat.id.toString();
    if (!isAuthorizedMessage(msg)) return;

    const email = match?.[1];
    if (!email) {
      bot?.sendMessage(msg.chat.id, "Usage: /credit check <email>", { parse_mode: 'HTML' });
      return;
    }

    try {
      const { prisma } = await import("../config/prisma.js");
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          credits: true,
          creditTransactions: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      });

      if (!user) {
        bot?.sendMessage(msg.chat.id, `❌ User dengan email <b>${escapeHtml(email)}</b> tidak ditemukan.`, { parse_mode: 'HTML' });
        return;
      }

      const txns = user.creditTransactions
        .map((t) => `  ${t.amount > 0 ? "+" : ""}${t.amount} — ${escapeHtml(t.reason)} (${t.createdAt.toISOString().slice(0, 16)})`)
        .join("\n");

      const text = `
👤 <b>${escapeHtml(user.email)}</b> (${escapeHtml(user.name || "N/A")})
• <b>Plan:</b> ${escapeHtml(user.credits?.planType || "free")}
• <b>Credits:</b> ${user.credits?.remainingCredits ?? 0}

📋 <b>10 Transaksi Terakhir:</b>
${txns || "  (tidak ada transaksi)"}
        `;
      bot?.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
    } catch (err: any) {
      console.error("[Telegram] Credit check failed:", err);
      bot?.sendMessage(msg.chat.id, "❌ Gagal mengecek kredit. Cek log server untuk detail.", { parse_mode: 'HTML' });
    }
  });

  bot.onText(/^\/credit\s+add\s+(\S+)\s+(\d+)/, async (msg, match) => {
    const cid = msg.chat.id.toString();
    if (!isAuthorizedMessage(msg)) return;

    const email = match?.[1];
    const amount = parseInt(match?.[2] || "0", 10);
    if (!email || amount <= 0) {
      bot?.sendMessage(msg.chat.id, "Usage: /credit add <email> <amount>", { parse_mode: 'HTML' });
      return;
    }

    try {
      const { prisma } = await import("../config/prisma.js");
      const { creditOps } = await import("../services/credits.js");

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        bot?.sendMessage(msg.chat.id, `❌ User <b>${escapeHtml(email)}</b> tidak ditemukan.`, { parse_mode: 'HTML' });
        return;
      }

      let credit = await prisma.userCredit.findUnique({ where: { userId: user.id } });
      if (!credit) {
        credit = await prisma.userCredit.create({
          data: { userId: user.id, remainingCredits: 3, planType: "free" },
        });
      }

      if (amount > 100) {
        await doSendApprovalRequest(
          `CREDIT_ADD_${user.id}_${amount}`,
          `Grant ${amount} credits to ${email}`,
          "MEDIUM"
        );
        bot?.sendMessage(
          msg.chat.id,
          `⏳ Menunggu approval untuk grant <b>${amount}</b> kredit ke <b>${escapeHtml(email)}</b>.`,
          { parse_mode: 'HTML' }
        );
        return;
      }

      const result = await creditOps.add(user.id, amount, {
        type: "admin_credit",
        reason: `Admin grant via Telegram oleh ${msg.from?.username || msg.from?.first_name || "unknown"}`,
        operatorId: user.clerkId,
      });

      bot?.sendMessage(
        msg.chat.id,
        `✅ <b>+${amount} kredit</b> diberikan ke <b>${escapeHtml(email)}</b>. Sisa: <b>${result.remainingCredits}</b>.`,
        { parse_mode: 'HTML' }
      );
    } catch (err: any) {
      console.error("[Telegram] Credit add failed:", err);
      bot?.sendMessage(msg.chat.id, "❌ Gagal menambah kredit. Cek log server untuk detail.", { parse_mode: 'HTML' });
    }
  });

  bot.onText(/^\/credit\s+fix\s+(\S+)/, async (msg, match) => {
    const cid = msg.chat.id.toString();
    if (!isAuthorizedMessage(msg)) return;

    const externalId = match?.[1];
    if (!externalId) {
      bot?.sendMessage(msg.chat.id, "Usage: /credit fix <orderId>", { parse_mode: 'HTML' });
      return;
    }

    try {
      const { prisma } = await import("../config/prisma.js");
      const { getInvoice } = await import("../services/xendit.js");
      const { creditOps } = await import("../services/credits.js");

      const order = await prisma.paymentOrder.findFirst({ where: { externalId } });
      if (!order) {
        bot?.sendMessage(msg.chat.id, `❌ Pesanan <b>${escapeHtml(externalId)}</b> tidak ditemukan.`, { parse_mode: 'HTML' });
        return;
      }

      if (!order.xenditInvoiceId) {
        bot?.sendMessage(msg.chat.id, `⚠️ Pesanan <b>${escapeHtml(externalId)}</b> belum memiliki invoice Xendit.`, { parse_mode: 'HTML' });
        return;
      }

      const invoice = await getInvoice(order.xenditInvoiceId);
      if (!invoice) {
        bot?.sendMessage(msg.chat.id, `⚠️ Gagal mengambil data invoice dari Xendit.`, { parse_mode: 'HTML' });
        return;
      }

      bot?.sendMessage(
        msg.chat.id,
        `📋 <b>${escapeHtml(externalId)}</b>\n• Xendit status: <b>${escapeHtml(invoice.status)}</b>\n• DB status: <b>${escapeHtml(order.status)}</b>\n• Amount: Rp ${order.amount}`,
        { parse_mode: 'HTML' }
      );

      const xStatus = invoice.status.toUpperCase();
      if ((xStatus === "PAID" || xStatus === "SETTLED") && !["settled"].includes(order.status)) {
        await prisma.paymentOrder.update({
          where: { id: order.id },
          data: { status: "settled", settledAt: new Date(), paidAt: new Date() },
        });
        await creditOps.add(order.userId, order.credits, {
          type: "purchase",
          orderId: order.id,
          reason: `Manual fix via Telegram: ${externalId}`,
          idempotencyKey: order.idempotencyKey,
          metadata: { xenditInvoiceId: order.xenditInvoiceId, source: "manual-fix" },
        });
        bot?.sendMessage(msg.chat.id, `✅ Credits granted! Order settled.`, { parse_mode: 'HTML' });
      } else {
        bot?.sendMessage(msg.chat.id, `ℹ️ No action needed.`, { parse_mode: 'HTML' });
      }
    } catch (err: any) {
      console.error("[Telegram] Credit fix failed:", err);
      bot?.sendMessage(msg.chat.id, "❌ Gagal memperbaiki kredit. Cek log server untuk detail.", { parse_mode: 'HTML' });
    }
  });

  bot.onText(/^\/order\s+(\S+)/, async (msg, match) => {
    const cid = msg.chat.id.toString();
    if (!isAuthorizedMessage(msg)) return;

    const externalId = match?.[1];
    if (!externalId) {
      bot?.sendMessage(msg.chat.id, "Usage: /order <orderId>", { parse_mode: 'HTML' });
      return;
    }

    try {
      const { prisma } = await import("../config/prisma.js");
      const order = await prisma.paymentOrder.findFirst({
        where: { externalId },
        include: { creditTransactions: true },
      });

      if (!order) {
        bot?.sendMessage(msg.chat.id, `❌ Pesanan <b>${escapeHtml(externalId)}</b> tidak ditemukan.`, { parse_mode: 'HTML' });
        return;
      }

      const text = `
📦 <b>${escapeHtml(order.externalId)}</b>
• <b>Status:</b> ${escapeHtml(order.status)}
• <b>Paket:</b> ${escapeHtml(order.packageId)} (${order.credits} kredit)
• <b>Jumlah:</b> Rp ${order.amount}
• <b>Metode:</b> ${escapeHtml(order.paymentMethod || "N/A")}
• <b>Xendit ID:</b> ${escapeHtml(order.xenditInvoiceId || "N/A")}
• <b>Reconcile:</b> ${order.reconcileCount}x
• <b>Dibuat:</b> ${order.createdAt.toISOString().slice(0, 16)}
• <b>Selesai:</b> ${order.settledAt?.toISOString().slice(0, 16) || "N/A"}
        `;
      bot?.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
    } catch (err: any) {
      console.error("[Telegram] Order lookup failed:", err);
      bot?.sendMessage(msg.chat.id, "❌ Gagal mengambil data order. Cek log server untuk detail.", { parse_mode: 'HTML' });
    }
  });
}

export const telegramBot = {
  async sendFullActionReport(reportDetails: { time: string, component: string, rootCause: string, action: string, status: string }) {
    const reportChatId = getReportChatId();
    if (!bot || !reportChatId) return;

    if (getReportLevel() === 'WARNING_AND_ABOVE' && reportDetails.status === 'SUCCESS_NO_ACTION') {
      return;
    }

    const message = `
🛠️ <b>[AGENT ACTION REPORT]</b>

• 🕒 <b>Waktu:</b> ${escapeHtml(reportDetails.time)}
• 📌 <b>Komponen:</b> ${escapeHtml(reportDetails.component)}
• 🔍 <b>Akar Masalah:</b> ${escapeHtml(reportDetails.rootCause)}
• ⚙️ <b>Tindakan:</b> ${escapeHtml(reportDetails.action)}
• 📊 <b>Status Akhir:</b> ${escapeHtml(reportDetails.status)}
    `;

    await bot.sendMessage(reportChatId, message, { parse_mode: 'HTML' });
  },

  async sendDailyHealthSummary(metrics: any) {
    const reportChatId = getReportChatId();
    if (!bot || !reportChatId) return;
    const message = `
🟢 <b>DAILY WEBSITE HEALTH SUMMARY</b>

    • <b>Uptime:</b> ${escapeHtml(metrics.uptime)}%
• <b>Status:</b> All Systems Operational
    • <b>RAM VPS:</b> ${escapeHtml(metrics.ram)}%
    `;
    await bot.sendMessage(reportChatId, message, { parse_mode: 'HTML' });
  },

  sendApprovalRequest: doSendApprovalRequest,
};
