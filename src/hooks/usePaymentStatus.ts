import { useState, useEffect, useRef, useCallback } from "react";
import { useApiClient } from "../services/api";

export type PaymentStatus = "creating" | "pending" | "paid" | "settled" | "expired" | "failed";

export interface PaymentStatusResult {
  status: PaymentStatus | null;
  paidAt: string | null;
  paymentMethod: string | null;
  credits: number | null;
  amount: number | null;
  isPolling: boolean;
  error: string | null;
}

const POLL_INTERVAL_MS = 12_000; // 5 req/min = every 12s (respects paymentLimiter)
const MAX_ATTEMPTS = 10;         // ~2 min total polling

/**
 * Polls GET /api/v1/payments/orders/:id for status updates.
 * Respects the 5 req/min rate limit by polling every 12 seconds.
 * Stops on terminal states (settled/expired/failed) or after MAX_ATTEMPTS.
 */
export function usePaymentStatus(orderId: string | null): PaymentStatusResult {
  const api = useApiClient();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [paidAt, setPaidAt] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(async () => {
    if (!orderId) return;

    try {
      const res: any = await api.getPaymentOrder(orderId);
      if (res?.success && res.data) {
        const s = res.data.status as PaymentStatus;
        setStatus(s);
        setPaidAt(res.data.paidAt || null);
        setPaymentMethod(res.data.paymentMethod || null);
        setCredits(res.data.credits ?? null);
        setAmount(res.data.amount ?? null);

        // Stop polling on terminal states
        if (s === "settled" || s === "expired" || s === "failed") {
          setIsPolling(false);
          return;
        }
      }
    } catch (err: any) {
      setError(err?.message || "Gagal memeriksa status pembayaran.");
    }

    attemptsRef.current += 1;
    if (attemptsRef.current >= MAX_ATTEMPTS) {
      setIsPolling(false);
      return;
    }

    // Schedule next poll
    timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
  }, [orderId, api]);

  useEffect(() => {
    if (!orderId) {
      setStatus(null);
      setIsPolling(false);
      return;
    }

    // Reset state for new order
    attemptsRef.current = 0;
    setError(null);
    setIsPolling(true);

    // Start polling
    poll();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [orderId, poll]);

  // Pause polling when tab is hidden, resume on visibility
  useEffect(() => {
    if (!orderId || !isPolling) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // Immediately check on return
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        poll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [orderId, isPolling, poll]);

  return { status, paidAt, paymentMethod, credits, amount, isPolling, error };
}
