import { describe, it, expect, vi, afterEach } from "vitest";
import { createTicket, consumeTicket } from "../userTicketStore.js";

vi.useFakeTimers();

describe("userTicketStore", () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it("creates and consumes a ticket", () => {
    const ticket = createTicket("clerk-abc");
    const clerkId = consumeTicket(ticket);
    expect(clerkId).toBe("clerk-abc");
  });

  it("ticket is one-time use", () => {
    const ticket = createTicket("clerk-abc");
    consumeTicket(ticket);
    const second = consumeTicket(ticket);
    expect(second).toBeNull();
  });

  it("unknown ticket returns null", () => {
    expect(consumeTicket("nonexistent")).toBeNull();
  });

  it("expired ticket returns null", () => {
    const ticket = createTicket("clerk-abc");
    vi.advanceTimersByTime(31_000);
    expect(consumeTicket(ticket)).toBeNull();
  });

  it("different tickets map to different users", () => {
    const t1 = createTicket("user-1");
    const t2 = createTicket("user-2");
    expect(consumeTicket(t1)).toBe("user-1");
    expect(consumeTicket(t2)).toBe("user-2");
  });
});
