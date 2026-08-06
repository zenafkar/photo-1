import { Router } from "express";
import { createOrder, getOrderStatus, getHistory, streamPaymentEvents } from "../controllers/paymentsController.js";

const router = Router();

router.post("/orders", createOrder);
router.get("/orders/:id", getOrderStatus);
router.get("/history", getHistory);
router.get("/events/:orderId", streamPaymentEvents);

export default router;
