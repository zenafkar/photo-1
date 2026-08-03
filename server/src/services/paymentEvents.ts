import { EventEmitter } from "node:events";

/**
 * In-memory event bus for payment settlement notifications.
 * Used by the webhook handler to emit events, and SSE endpoints
 * to subscribe and push to connected clients in real time.
 *
 * Event names follow the pattern:  "settled:<externalId>"
 * Payload: { externalId, status, credits, paidAt, paymentMethod }
 */
export const paymentEvents = new EventEmitter();

// Prevent EventEmitter memory-leak warnings under high concurrency.
// Default limit is 10 listeners per event — bump to 500 for SSE fan-out.
paymentEvents.setMaxListeners(500);

export interface SettlementEvent {
  externalId: string;
  status: string;
  credits: number;
  paidAt: string;
  paymentMethod: string | null;
}
