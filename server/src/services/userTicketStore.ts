import crypto from "node:crypto";

interface Ticket {
  clerkId: string;
  createdAt: number;
}

const TICKET_TTL_MS = 30_000;
const tickets = new Map<string, Ticket>();

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ticket, data] of tickets) {
    if (now - data.createdAt > TICKET_TTL_MS) {
      tickets.delete(ticket);
    }
  }
}, 60_000);
if (typeof cleanupInterval.unref === "function") cleanupInterval.unref();

export function createTicket(clerkId: string): string {
  const ticket = crypto.randomBytes(24).toString("hex");
  tickets.set(ticket, { clerkId, createdAt: Date.now() });
  return ticket;
}

export function consumeTicket(ticket: string): string | null {
  const data = tickets.get(ticket);
  if (!data) return null;
  if (Date.now() - data.createdAt > TICKET_TTL_MS) {
    tickets.delete(ticket);
    return null;
  }
  tickets.delete(ticket);
  return data.clerkId;
}
