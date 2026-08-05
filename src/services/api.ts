import { useAuth } from "@clerk/clerk-react";
import { useCallback, useMemo } from "react";

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:5000/api/v1";
    }
    // In production, Nginx proxies /api/v1 on the same origin (no :5000 port)
    return "/api/v1";
  }
  return "/api/v1";
};

const API_BASE_URL = getApiBaseUrl();

export const useApiClient = () => {
  const { getToken } = useAuth();

  const request = useCallback(async (endpoint: string, options: RequestInit = {}, isRetry = false, timeoutMs = 30_000): Promise<any> => {
    try {
      // Fetch a valid token with retry logic
      let token: string | null = null;
      try {
        token = await getToken();
      } catch {
        // Fallback to bypass cache
      }

      if (!token) {
        // Retry with skipCache and exponential backoff
        const delays = [200, 500, 1000];
        for (const delay of delays) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          try {
            token = await getToken({ skipCache: true });
            if (token) break;
          } catch {
            // Continue retrying
          }
        }
      }

      if (!token) {
        throw new Error("Sesi login belum siap atau belum aktif. Silakan refresh halaman dan login kembali.");
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Authorization: `Bearer ${token}`,
        ...(options.headers as Record<string, string> || {}),
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      // Handle 401 Unauthorized with transparent 1x retry using a fresh token
      if (response.status === 401 && !isRetry) {
        console.warn(`[ApiClient] Received 401 for ${endpoint}. Attempting automatic token refresh and retry...`);
        try {
          const freshToken = await getToken({ skipCache: true });
          if (freshToken) {
            return await request(endpoint, options, true);
          }
        } catch (retryErr) {
          console.error("[ApiClient] Automatic token refresh retry failed:", retryErr);
        }
      }

      if (!response.ok) {
        if (isJson) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 401) {
            throw new Error("Sesi Anda telah berakhir atau belum login. Silakan refresh halaman dan login kembali.");
          }
          throw new Error(errorData.message || `Terjadi kesalahan pada server (${response.status})`);
        } else {
          if (response.status === 401) {
            throw new Error("Sesi Anda telah berakhir atau belum login. Silakan refresh halaman dan login kembali.");
          } else if (response.status === 413) {
            throw new Error("Ukuran data gambar terlalu besar. Silakan gunakan gambar dengan ukuran lebih kecil.");
          } else if (response.status === 404) {
            throw new Error("Layanan backend tidak ditemukan (404). Silakan pastikan server backend berjalan.");
          } else if (response.status >= 500) {
            throw new Error(`Server backend mengalami kendala (${response.status}). Silakan coba beberapa saat lagi.`);
          }
          throw new Error(`Respon server tidak valid (${response.status})`);
        }
      }

      if (!isJson) {
        const text = await response.text().catch(() => "");
        if (response.redirected || text.trim().startsWith("<") || contentType.includes("text/html")) {
          throw new Error("Respon server tidak valid (bukan JSON). Pastikan server backend berjalan dengan benar.");
        }
        throw new Error(`Respon server tidak valid (${response.status})`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(`[API Error] ${endpoint}:`, error);
      }

      // Normalize raw browser network error strings (e.g. TypeError: Failed to fetch)
      const message = error?.message || "";
      if (error?.name === "AbortError" || error?.message?.includes("aborted")) {
        throw new Error("Permintaan timeout — server tidak merespon dalam waktu yang ditentukan. Silakan coba lagi.");
      }
      if (message.includes("Failed to fetch") || message.includes("NetworkError") || error?.name === "TypeError") {
        throw new Error("Koneksi terputus atau waktu pemrosesan server melebihi batas (Timeout). Silakan periksa koneksi atau coba beberapa saat lagi.");
      }

      throw error;
    }
  }, [getToken]);

  return useMemo(() => ({
    getProfile: () => request("/user/me"),
    generateImage: (payload: {
      imageUrls: string[];
      prompt: string;
      provider?: string;
      aspectRatio?: string;
      resolution?: string;
      outputFormat?: string;
    }) =>
      request("/generate", {
        method: "POST",
        body: JSON.stringify(payload),
      }, false, 180_000), // 3 min timeout for AI generation
    deleteGeneration: (id: string) =>
      request(`/generate/${id}`, {
        method: "DELETE",
      }),
    syncReplicate: () =>
      request("/generate/sync", {
        method: "POST",
      }),
    createPaymentOrder: (payload: { packageId: string; idempotencyKey: string }) =>
      request("/payments/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    getPaymentOrder: (orderId: string) =>
      request(`/payments/orders/${orderId}`),
  }), [request]);
};
