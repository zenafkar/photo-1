import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN || '';
const chatId = process.env.TELEGRAM_CHAT_ID || '';
const reportLevel = process.env.TELEGRAM_REPORT_LEVEL || 'WARNING_AND_ABOVE'; // ALL, WARNING_AND_ABOVE

export let bot: TelegramBot | null = null;

if (token) {
  try {
    bot = new TelegramBot(token, { polling: true });
    
    // Command Handler for /help
    bot.onText(/\/help|\/start/, (msg) => {
      const chatId = msg.chat.id;
      const helpText = `
🛠️ *AI SRE AGENT COMMAND MENU*

* /help - Menampilkan daftar seluruh perintah bantuan ini.
* /check, /status, /health - Menjalankan instant health check (API, Database, RAM/CPU VPS).
* /test, /deepcheck, /synthetic - Memicu pengujian fungsional sintetis mendalam dari hulu ke hilir.
* /metrics, /vps, /ram - Menampilkan statistik performa & penggunaan resource VPS real-time.
* /restart - Meminta restart PM2 process server (membutuhkan konfirmasi approval).
      `;
      bot?.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
    });

    // We can add other command handlers here or in agent.ts later
    
    // Callback query handler for Interactive Approval
    bot.on('callback_query', (callbackQuery) => {
      const message = callbackQuery.message;
      if (!message) return;
      
      const data = callbackQuery.data; // e.g. "APPROVE_RESTART_PM2", "REJECT_RESTART_PM2"
      
      // We would verify the action request here and execute it via Agent/remediationTools
      // For now, we acknowledge it:
      bot?.sendMessage(message.chat.id, `Action received: ${data}`);
      bot?.answerCallbackQuery(callbackQuery.id, { text: 'Processing action...' });
    });
    
  } catch (error) {
    console.error("Failed to initialize Telegram Bot", error);
  }
}

export const telegramBot = {
  async sendFullActionReport(reportDetails: { time: string, component: string, rootCause: string, action: string, status: string }) {
    if (!bot || !chatId) return;
    
    if (reportLevel === 'WARNING_AND_ABOVE' && reportDetails.status === 'SUCCESS_NO_ACTION') {
      return; // Filter out
    }
    
    const message = `
🛠️ *[AGENT ACTION REPORT]*
    
* 🕒 Waktu: ${reportDetails.time}
* 📌 Komponen: ${reportDetails.component}
* 🔍 Akar Masalah: ${reportDetails.rootCause}
* ⚙️ Tindakan: ${reportDetails.action}
* 📊 Status Akhir: ${reportDetails.status}
    `;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  },

  async sendDailyHealthSummary(metrics: any) {
    if (!bot || !chatId) return;
    const message = `
🟢 *DAILY WEBSITE HEALTH SUMMARY*
    
* Uptime: ${metrics.uptime}%
* Status: All Systems Operational
* RAM VPS: ${metrics.ram}%
    `;
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  },

  async sendApprovalRequest(actionId: string, description: string, riskLevel: string) {
    if (!bot || !chatId) return;
    
    const message = `
⚠️ *ACTION APPROVAL REQUIRED*
* Risk Level: ${riskLevel}
* Action: ${description}
    `;
    
    const opts = {
      parse_mode: 'Markdown' as const,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Approve', callback_data: `APPROVE_${actionId}` },
            { text: '❌ Reject', callback_data: `REJECT_${actionId}` }
          ]
        ]
      }
    };
    
    await bot.sendMessage(chatId, message, opts);
  }
};
