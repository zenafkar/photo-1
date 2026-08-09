import { describe, it, expect, vi, afterEach } from "vitest";
import { dashboardEvents } from "../dashboardEvents.js";

describe("dashboardEvents", () => {
  afterEach(() => {
    dashboardEvents.removeAllListeners();
  });

  it("emits and receives events", () => {
    const handler = vi.fn();
    dashboardEvents.on("event", handler);

    const payload = {
      type: "credits.updated" as const,
      userId: "user-1",
      version: 5,
      timestamp: new Date().toISOString(),
    };

    dashboardEvents.emit("event", payload);

    expect(handler).toHaveBeenCalledWith(payload);
  });

  it("supports multiple listeners", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    dashboardEvents.on("event", handler1);
    dashboardEvents.on("event", handler2);

    dashboardEvents.emit("event", {
      type: "generation.completed",
      userId: "user-1",
      timestamp: new Date().toISOString(),
    });

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it("filters events by removing listeners", () => {
    const handler = vi.fn();
    dashboardEvents.on("event", handler);
    dashboardEvents.off("event", handler);

    dashboardEvents.emit("event", {
      type: "credits.updated",
      userId: "user-1",
      timestamp: new Date().toISOString(),
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
