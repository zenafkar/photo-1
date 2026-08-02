import { createApp } from "./app.js";
import { startScheduler } from "./agent/scheduler.js";
import "./agent/agent.js"; // Initialize agent to listen to telemetry events

const PORT = process.env.PORT || 5000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);

  // Start AI Agent Scheduler
  startScheduler();
});
