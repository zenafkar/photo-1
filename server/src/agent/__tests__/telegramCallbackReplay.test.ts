import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({
  state: { callbackHandler: undefined as ((query: any) => Promise<void>) | undefined },
}));

vi.mock("node-telegram-bot-api", () => ({
  default: class MockTelegramBot {
    sendMessage = vi.fn().mockResolvedValue({ chat: { id: 123 }, message_id: 1 });
    answerCallbackQuery = vi.fn().mockResolvedValue(true);
    setWebHook = vi.fn().mockResolvedValue(true);
    processUpdate = vi.fn();
    onText = vi.fn();

    on = vi.fn((event: string, handler: (query: any) => Promise<void>) => {
      if (event === "callback_query") state.callbackHandler = handler;
    });
  },
}));

describe("Telegram approval callback replay", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("TELEGRAM_SRE_BOT_TOKEN", "123456:test-token");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", "webhook-secret");
    vi.stubEnv("TELEGRAM_CHAT_ID", "123");
    vi.stubEnv("TELEGRAM_ADMIN_CHAT_IDS", "123");
    vi.stubEnv("TELEGRAM_ADMIN_USER_IDS", "123");
    vi.stubEnv("DOMAIN", "https://example.test");
    state.callbackHandler = undefined;
  });

  it("consumes an approval before execution so a replay cannot repeat it", async () => {
    const { initBotWebhook, telegramBot } = await import("../telegramBot.js");
    const express = (await import("express")).default;
    const app = express();
    await initBotWebhook(app);

    await telegramBot.sendApprovalRequest("CREDIT_ADD_invalid-user_1", "safe action", "HIGH");
    const botInstance = (await import("../telegramBot.js")).bot as any;
    const approvalCall = botInstance.sendMessage.mock.calls[0];
    const callbackData = approvalCall[2].reply_markup.inline_keyboard[0][0].callback_data;
    const callback = {
      id: "callback-replay",
      data: callbackData,
      from: { id: 123 },
      message: { chat: { id: 123, type: "private" } },
    };

    expect(state.callbackHandler).toBeDefined();
    await Promise.all([state.callbackHandler!(callback), state.callbackHandler!(callback)]);

    // Initial approval + one invalid-action response; the second callback only
    // receives an expired/invalid acknowledgement.
    expect(botInstance.sendMessage).toHaveBeenCalledTimes(2);
    expect(botInstance.answerCallbackQuery).toHaveBeenCalledTimes(2);
  });
});
