import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { escapeHtml, isAdminChat, isAuthorizedTelegramUser, isValidWebhookSecret } from "../telegramBot.js";

describe("escapeHtml", () => {
  it("escapes ampersand", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("coerces non-string via String()", () => {
    expect(escapeHtml(42 as any)).toBe("42");
    expect(escapeHtml(null as any)).toBe("null");
    expect(escapeHtml(undefined as any)).toBe("undefined");
  });

  it("escapes all characters in combination", () => {
    expect(escapeHtml(`<a href="x" onclick='y'>Z & W</a>`)).toBe(
      "&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;Z &amp; W&lt;/a&gt;"
    );
  });

  it("prevents HTML injection via email", () => {
    const malicious = "<script>alert(1)</script>@evil.com";
    const result = escapeHtml(malicious);
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });
});

describe("isAdminChat", () => {
  beforeEach(() => {
    vi.stubEnv("TELEGRAM_CHAT_ID", "");
    vi.stubEnv("TELEGRAM_ADMIN_CHAT_IDS", "");
    vi.stubEnv("TELEGRAM_ADMIN_USER_IDS", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("matches single TELEGRAM_CHAT_ID", () => {
    vi.stubEnv("TELEGRAM_CHAT_ID", "123456");
    vi.stubEnv("TELEGRAM_ADMIN_CHAT_IDS", "");
    expect(isAdminChat("123456")).toBe(true);
    expect(isAdminChat("999999")).toBe(false);
  });

  it("matches comma-separated TELEGRAM_ADMIN_CHAT_IDS", () => {
    vi.stubEnv("TELEGRAM_CHAT_ID", "");
    vi.stubEnv("TELEGRAM_ADMIN_CHAT_IDS", "111,222,333");
    expect(isAdminChat("111")).toBe(true);
    expect(isAdminChat("222")).toBe(true);
    expect(isAdminChat("333")).toBe(true);
    expect(isAdminChat("444")).toBe(false);
  });

  it("trims whitespace from IDs", () => {
    vi.stubEnv("TELEGRAM_CHAT_ID", "");
    vi.stubEnv("TELEGRAM_ADMIN_CHAT_IDS", " 111 , 222 , 333 ");
    expect(isAdminChat("111")).toBe(true);
    expect(isAdminChat("222")).toBe(true);
    expect(isAdminChat("333")).toBe(true);
  });

  it("falls back to TELEGRAM_CHAT_ID when ADMIN_CHAT_IDS is empty", () => {
    vi.stubEnv("TELEGRAM_CHAT_ID", "555");
    vi.stubEnv("TELEGRAM_ADMIN_CHAT_IDS", "");
    expect(isAdminChat("555")).toBe(true);
    expect(isAdminChat("666")).toBe(false);
  });

  it("rejects empty string", () => {
    vi.stubEnv("TELEGRAM_CHAT_ID", "123");
    vi.stubEnv("TELEGRAM_ADMIN_CHAT_IDS", "");
    expect(isAdminChat("")).toBe(false);
  });

  it("allows the configured admin in a private chat by default", () => {
    vi.stubEnv("TELEGRAM_ADMIN_CHAT_IDS", "123");
    expect(isAuthorizedTelegramUser("123", "123", "private")).toBe(true);
    expect(isAuthorizedTelegramUser("123", "999", "private")).toBe(false);
  });

  it("requires an explicit user allowlist for group chats", () => {
    vi.stubEnv("TELEGRAM_ADMIN_CHAT_IDS", "-100123");
    expect(isAuthorizedTelegramUser("-100123", "777", "supergroup")).toBe(false);

    vi.stubEnv("TELEGRAM_ADMIN_USER_IDS", "777, 888");
    expect(isAuthorizedTelegramUser("-100123", "777", "supergroup")).toBe(true);
    expect(isAuthorizedTelegramUser("-100123", "999", "supergroup")).toBe(false);
  });
});

describe("isValidWebhookSecret", () => {
  it("fails closed when the configured secret is absent", () => {
    expect(isValidWebhookSecret("secret", "")).toBe(false);
    expect(isValidWebhookSecret(undefined, "secret")).toBe(false);
  });

  it("uses an exact timing-safe token comparison", () => {
    expect(isValidWebhookSecret("sre_secret-01", "sre_secret-01")).toBe(true);
    expect(isValidWebhookSecret("sre_secret-01", "sre_secret-02")).toBe(false);
    expect(isValidWebhookSecret(["sre_secret-01"], "sre_secret-01")).toBe(false);
    expect(isValidWebhookSecret("has spaces", "has spaces")).toBe(false);
  });
});
