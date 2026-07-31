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
    return `${window.location.protocol}//${host}:5000/api/v1`;
  }
  return "http://localhost:5000/api/v1";
};

const API_BASE_URL = getApiBaseUrl();

export const useApiClient = () => {
  const { getToken } = useAuth();

  const request = async (endpoint: string, options: RequestInit = {}) => {
    try {
      let token = await getToken();
      
      // If token is null/undefined initially (e.g. Clerk still hydrating), retry once after a short delay
      if (!token) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        token = await getToken();
      }
      
      const headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "An error occurred");
      }

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
