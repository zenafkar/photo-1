import { EventEmitter } from "node:events";

export const dashboardEvents = new EventEmitter();
dashboardEvents.setMaxListeners(1000);

export type DashboardEventType =
  | "credits.updated"
  | "generation.completed"
  | "generation.failed"
  | "generation.deleted"
  | "topup.settled";

export interface DashboardEvent {
  type: DashboardEventType;
  userId: string;
  version?: number;
  generationsLatestTs?: string;
  data?: Record<string, any>;
  timestamp: string;
}
