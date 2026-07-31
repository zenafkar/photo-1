import { useAuth } from "@clerk/clerk-react";

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
  const { getToken, isSignedIn } = useAuth();

  const request = async (endpoint: string, options: RequestInit = {}) => {
    try {
      if (!isSignedIn) {
        throw new Error("Sesi Anda telah berakhir atau belum login. Silakan refresh halaman dan login kembali.");
      }

      let token = await getToken();
      
      // If token is null/undefined initially (e.g. Clerk still hydrating), retry once with skipCache
      if (!token) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        token = await getToken({ skipCache: true }).catch(() => null);
      }

      if (!token) {
        throw new Error("Sesi Anda telah berakhir atau belum login. Silakan refresh halaman dan login kembali.");
      }

      const headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

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
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`[API Error] ${endpoint}:`, error);
      }
      throw error;
    }
  };

  return {
    getProfile: () => request("/user/me"),
    generateImage: (payload: { 
      imageUrl: string; 
      prompt: string; 
      provider?: string;
      aspectRatio?: string;
      resolution?: string;
      outputFormat?: string;
    }) => 
      request("/generate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    deleteGeneration: (id: string) => 
      request(`/generate/${id}`, {
        method: "DELETE",
      }),
  };
};
