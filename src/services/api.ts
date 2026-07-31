import { useAuth } from "@clerk/clerk-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const useApiClient = () => {
  const { getToken } = useAuth();

  const request = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const token = await getToken();
      
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
