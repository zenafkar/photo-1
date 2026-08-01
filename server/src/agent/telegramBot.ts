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
🛠️ <b>AI SRE AGENT COMMAND MENU</b>

• <b>/help</b> - Menampilkan daftar seluruh perintah bantuan ini.
• <b>/check</b>, <b>/status</b>, <b>/health</b> - Menjalankan instant health check (API, Database, RAM/CPU VPS).
• <b>/test</b>, <b>/deepcheck</b>, <b>/synthetic</b> - Memicu pengujian fungsional sintetis mendalam dari hulu ke hilir.
• <b>/metrics</b>, <b>/vps</b>, <b>/ram</b> - Menampilkan statistik performa & penggunaan resource VPS real-time.
• <b>/restart</b> - Meminta restart PM2 process server (membutuhkan konfirmasi approval).
      `;
      bot?.sendMessage(chatId, helpText, { parse_mode: 'HTML' });
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
🛠️ <b>[AGENT ACTION REPORT]</b>
    
• 🕒 <b>Waktu:</b> ${reportDetails.time}
• 📌 <b>Komponen:</b> ${reportDetails.component}
• 🔍 <b>Akar Masalah:</b> ${reportDetails.rootCause}
• ⚙️ <b>Tindakan:</b> ${reportDetails.action}
• 📊 <b>Status Akhir:</b> ${reportDetails.status}
    `;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  },

  async sendDailyHealthSummary(metrics: any) {
    if (!bot || !chatId) return;
    const message = `
🟢 <b>DAILY WEBSITE HEALTH SUMMARY</b>
    
• <b>Uptime:</b> ${metrics.uptime}%
• <b>Status:</b> All Systems Operational
• <b>RAM VPS:</b> ${metrics.ram}%
    `;
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  },

  async sendApprovalRequest(actionId: string, description: string, riskLevel: string) {
    if (!bot || !chatId) return;
    
    const message = `
⚠️ <b>ACTION APPROVAL REQUIRED</b>
• <b>Risk Level:</b> ${riskLevel}
• <b>Action:</b> ${description}
    `;
    
    const opts = {
      parse_mode: 'HTML' as const,
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
