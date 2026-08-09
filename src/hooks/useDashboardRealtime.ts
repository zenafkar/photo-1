import { useState, useEffect, useRef, useCallback } from "react";
import { useApiClient, API_BASE_URL } from "../services/api";

export interface DashboardRealtimeEvent {
  type: "credits.updated" | "generation.completed" | "generation.failed" | "generation.deleted" | "topup.settled";
  userId: string;
  version?: number;
  generationsLatestTs?: string | null;
  data?: Record<string, any>;
  timestamp: string;
}

interface DashboardRealtimeState {
  isConnected: boolean;
  lastEventAt: string | null;
}

interface UseDashboardRealtimeOptions {
  onEvent: (event: DashboardRealtimeEvent) => void;
  onCreditsUpdate: (credits: number, version: number) => void;
  onGenerationUpdate: (generation: any) => void;
  onGenerationDelete: (generationId: string) => void;
  onConnectionChange: (connected: boolean) => void;
  pollFallback?: () => Promise<void>;
}

const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 30_000;
const HEARTBEAT_TIMEOUT_MS = 45_000;

export function useDashboardRealtime(options: UseDashboardRealtimeOptions) {
  const api = useApiClient();

  const [state, setState] = useState<DashboardRealtimeState>({
    isConnected: false,
    lastEventAt: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isMountedRef = useRef(true);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const clearTimers = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearTimeout(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const resetHeartbeatTimer = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearTimeout(heartbeatTimerRef.current);
    }
    heartbeatTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      console.warn("[DashboardRealtime] Heartbeat timeout — reconnecting");
      disconnect();
      scheduleReconnect();
    }, HEARTBEAT_TIMEOUT_MS);
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, isConnected: false }));
      optionsRef.current.onConnectionChange(false);
    }
    if (heartbeatTimerRef.current) {
      clearTimeout(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    if (reconnectTimerRef.current) return;

    const delay = Math.min(
      RECONNECT_BASE_MS * 2 ** reconnectAttemptRef.current,
      RECONNECT_MAX_MS,
    ) + Math.floor(Math.random() * 1_000);
    reconnectAttemptRef.current += 1;

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      if (isMountedRef.current) {
        connect();
      }
    }, delay);
  }, []);

  const handleEvent = useCallback((event: DashboardRealtimeEvent) => {
    if (!isMountedRef.current) return;
    setState(prev => ({ ...prev, lastEventAt: event.timestamp }));
    resetHeartbeatTimer();
    reconnectAttemptRef.current = 0;
    optionsRef.current.onEvent(event);
  }, [resetHeartbeatTimer]);

  const connect = useCallback(async () => {
    if (!isMountedRef.current) return;
    disconnect();

    try {
      const res = await api.getEventTicket();
      if (!res?.success || !res.data?.ticket) {
        throw new Error("Failed to get event ticket");
      }

      const ticket = res.data.ticket as string;
      const baseUrl = API_BASE_URL;
      const url = `${baseUrl}/user/events/${ticket}`;

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isMountedRef.current) return;
        reconnectAttemptRef.current = 0;
        if (pollTimerRef.current) {
          clearTimeout(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        setState(prev => ({ ...prev, isConnected: true }));
        optionsRef.current.onConnectionChange(true);
        resetHeartbeatTimer();
      };

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as DashboardRealtimeEvent;
          handleEvent(data);
        } catch {
          // Ignore malformed events
        }
      };

      es.addEventListener("heartbeat", () => {
        if (isMountedRef.current) resetHeartbeatTimer();
      });

      es.onerror = () => {
        if (!isMountedRef.current) return;
        disconnect();
        if (reconnectAttemptRef.current >= 5 && optionsRef.current.pollFallback) {
          startPolling();
        } else {
          scheduleReconnect();
        }
      };
    } catch (err) {
      if (!isMountedRef.current) return;
      if (reconnectAttemptRef.current >= 5 && optionsRef.current.pollFallback) {
        startPolling();
      } else {
        scheduleReconnect();
      }
    }
  }, [api, disconnect, handleEvent, resetHeartbeatTimer, scheduleReconnect]);

  const startPolling = useCallback(() => {
    if (!isMountedRef.current || !optionsRef.current.pollFallback) return;
    if (pollTimerRef.current) return;

    const doPoll = async () => {
      if (!isMountedRef.current) return;
      try {
        await optionsRef.current.pollFallback!();
      } catch {
        // Polling failed — will retry
      }
      pollTimerRef.current = setTimeout(doPoll, 15_000);
    };

    doPoll();
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0;
    stopPolling();
    disconnect();
    connect();
  }, [connect, disconnect, stopPolling]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      clearTimers();
      stopPolling();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect, clearTimers, stopPolling]);

  return {
    isConnected: state.isConnected,
    lastEventAt: state.lastEventAt,
    reconnect,
    disconnect,
  };
}
