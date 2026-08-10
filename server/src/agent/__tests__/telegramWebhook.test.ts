import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const mockTelegram = vi.hoisted(() => ({
  setWebHook: vi.fn().mockResolvedValue(true),
  processUpdate: vi.fn(),
}));

vi.mock("node-telegram-bot-api", () => ({
  default: class MockTelegramBot {
    on = vi.fn();
    onText = vi.fn();
    answerCallbackQuery = vi.fn().mockResolvedValue(true);
    sendMessage = vi.fn().mockResolvedValue({ chat: { id: 1 }, message_id: 1 });
    editMessageText = vi.fn().mockResolvedValue(true);
    setWebHook = mockTelegram.setWebHook;
    processUpdate = mockTelegram.processUpdate;
  },
}));

import { initBotWebhook, TELEGRAM_WEBHOOK_PATH } from "../telegramBot.js";

describe("Telegram webhook", () => {
  beforeEach(() => {
    vi.stubEnv("TELEGRAM_SRE_BOT_TOKEN", "123456:server-sre-token");
    vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", "sre_secret-01");
    vi.stubEnv("DOMAIN", "https://example.test/");
    mockTelegram.setWebHook.mockReset().mockResolvedValue(true);
    mockTelegram.processUpdate.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("registers the webhook with the SRE token and secret", async () => {
    const app = express();
    app.use(express.json());

    await initBotWebhook(app);

    expect(mockTelegram.setWebHook).toHaveBeenCalledWith(
      `https://example.test${TELEGRAM_WEBHOOK_PATH}`,
      { secret_token: "sre_secret-01" },
    );
  });

  it("rejects missing and invalid secrets before processing updates", async () => {
    const app = express();
    app.use(express.json());
    await initBotWebhook(app);

    const invalid = await request(app)
      .post(TELEGRAM_WEBHOOK_PATH)
      .set("x-telegram-bot-api-secret-token", "wrong")
      .send({ update_id: 1 });
    expect(invalid.status).toBe(403);

    vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", "");
    const missing = await request(app)
      .post(TELEGRAM_WEBHOOK_PATH)
      .set("x-telegram-bot-api-secret-token", "sre_secret-01")
      .send({ update_id: 2 });
    expect(missing.status).toBe(503);
    expect(mockTelegram.processUpdate).not.toHaveBeenCalled();
  });

  it("processes a valid update while webhook registration is still pending", async () => {
    let resolveRegistration!: () => void;
    mockTelegram.setWebHook.mockImplementationOnce(() => new Promise<void>((resolve) => {
      resolveRegistration = resolve;
    }));

    const app = express();
    app.use(express.json());
    const initialization = initBotWebhook(app);

    const response = await request(app)
      .post(TELEGRAM_WEBHOOK_PATH)
      .set("x-telegram-bot-api-secret-token", "sre_secret-01")
      .send({ update_id: 3, message: { chat: { id: 123, type: "private" } } });

    expect(response.status).toBe(200);
    expect(mockTelegram.processUpdate).toHaveBeenCalledOnce();
    resolveRegistration();
    await initialization;
  });

  it("returns null and does not register the webhook when TELEGRAM_SRE_BOT_TOKEN is empty", async () => {
    vi.stubEnv("TELEGRAM_SRE_BOT_TOKEN", "");
    const app = express();
    app.use(express.json());

    const result = await initBotWebhook(app);

    expect(result).toBeNull();
    expect((await import("../telegramBot.js")).bot).toBeNull();
    expect(mockTelegram.setWebHook).not.toHaveBeenCalled();
  });
});
