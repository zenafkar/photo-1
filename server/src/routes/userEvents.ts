import { Router } from "express";
import { createEventTicket, streamUserEvents } from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Ticket creation remains bearer-authenticated; the SSE stream uses the short-lived ticket.
router.post("/ticket", requireAuth, createEventTicket);
router.get("/:ticket", streamUserEvents);

export default router;
