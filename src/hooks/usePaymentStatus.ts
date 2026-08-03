import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
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

const POLL_INTERVAL_MS = 15_000; // Fallback poll — only kicks in if SSE fails
const MAX_POLL_ATTEMPTS = 8;     // ~2 min fallback polling
const SSE_FALLBACK_DELAY = 30_000; // Wait 30s for SSE before starting poll fallback

/**
 * Hybrid payment status tracker: SSE-first with polling fallback.
 *
 * - Opens a Server-Sent Events connection immediately for real-time settlement.
 * - If SSE delivers "settled" → instant update (~1-2s after webhook).
 * - If SSE doesn't connect within 30s → starts polling as safety net.
 * - If SSE reconnects after polling started → SSE result wins, polling stops.
 */
export function usePaymentStatus(orderId: string | null): PaymentStatusResult {
  const api = useApiClient();
  const { getToken } = useAuth();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [paidAt, setPaidAt] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sseSettledRef = useRef(false);

  // ── SSE connection (primary, real-time) ──────────────────
  const connectSSE = useCallback(async () => {
    if (!orderId || sseSettledRef.current) return;

    try {
      const token = await getToken();
      if (!token) return;

      const url = `/api/v1/payments/events/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          sseSettledRef.current = true;
          setStatus(data.status as PaymentStatus);
          setPaidAt(data.paidAt ?? null);
          setPaymentMethod(data.paymentMethod ?? null);
          setCredits(data.credits ?? null);

          // Stop fallback polling if it started
          setIsPolling(false);
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }

          es.close();
        } catch {
          // Ignore malformed SSE data
        }
      });

      es.addEventListener("error", () => {
        // EventSource auto-reconnects; if permanent, polling fallback handles it
      });
    } catch {
      // SSE not supported — polling fallback will kick in
    }
  }, [orderId, getToken]);

  // ── Polling (fallback, kicks in after SSE_FALLBACK_DELAY) ─
  const poll = useCallback(async () => {
    if (!orderId || sseSettledRef.current) return;

    try {
      const res: any = await api.getPaymentOrder(orderId);
      if (res?.success && res.data) {
        const s = res.data.status as PaymentStatus;
        setStatus(s);
        setPaidAt(res.data.paidAt || null);
        setPaymentMethod(res.data.paymentMethod || null);
        setCredits(res.data.credits ?? null);
        setAmount(res.data.amount ?? null);

        if (s === "settled" || s === "expired" || s === "failed") {
          sseSettledRef.current = true;
          setIsPolling(false);
          // Close SSE if it's still open
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          return;
        }
      }
    } catch (err: any) {
      setError(err?.message || "Gagal memeriksa status pembayaran.");
    }

    attemptsRef.current += 1;
    if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
      setIsPolling(false);
      return;
    }

    timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
  }, [orderId, api]);

  // ── Orchestrate SSE + fallback ───────────────────────────
  useEffect(() => {
    if (!orderId) {
      setStatus(null);
      setIsPolling(false);
      sseSettledRef.current = false;
      return;
    }

    // Reset for new order
    attemptsRef.current = 0;
    sseSettledRef.current = false;
    setError(null);

    // Start SSE immediately
    connectSSE();

    // Start fallback polling after a delay (only if SSE hasn't settled)
    const fallbackTimer = setTimeout(() => {
      if (!sseSettledRef.current) {
        setIsPolling(true);
        poll();
      }
    }, SSE_FALLBACK_DELAY);

    return () => {
      clearTimeout(fallbackTimer);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [orderId, connectSSE, poll]);

  // Pause/resume on tab visibility
  useEffect(() => {
    if (!orderId || sseSettledRef.current) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // If SSE lost connection while tab was hidden, reconnect
        if (eventSourceRef.current?.readyState === EventSource.CLOSED && !sseSettledRef.current) {
          connectSSE();
        }
        // Quick poll on return
        if (!sseSettledRef.current) {
          poll();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [orderId, connectSSE, poll]);

  return { status, paidAt, paymentMethod, credits, amount, isPolling, error };
}
