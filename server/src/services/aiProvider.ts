export interface AIGenerationOptions {
  imageUrl: string;
  prompt: string;
  provider?: "replicate" | "nanobanana" | "nanobanana2" | "gptimage";
  aspectRatio?: string;
  resolution?: string;
  outputFormat?: string;
}

export interface AIGenerationResult {
  url: string;
  predictionId?: string;
}

export class AIService {
  static async generate(options: AIGenerationOptions): Promise<AIGenerationResult> {
    const provider = options.provider || "replicate";

    switch (provider) {
      case "nanobanana2":
        return this.callReplicateNanoBanana2(options);
      case "gptimage":
        return this.callReplicateGPTImage(options);
      case "replicate":
      case "nanobanana":
      default:
        return this.callReplicate(options);
    }
  }

  private static getFetchOptions(body: any, token: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000); // 180 seconds (3 minutes) timeout

    return {
      options: {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
          "Prefer": "wait"
        },
        body: JSON.stringify(body),
        signal: controller.signal
      },
      clearTimeout: () => clearTimeout(timeout)
    };
  }

  private static async pollPrediction(pollUrl: string, token: string, maxWaitMs: number = 180000): Promise<string> {
    const startTime = Date.now();
    const intervalMs = 3000;
    console.log(`[AI Polling] Starting polling for prediction at: ${pollUrl}`);

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));

      try {
        const response = await fetch(pollUrl, {
          headers: {
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error("[Replicate Poll Error]", errText);
          throw new Error(`Replicate Poll API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`[AI Polling] Prediction status: ${data.status}`);

        if (data.status === "succeeded") {
          if (data && data.output) {
            if (typeof data.output === "string") {
              return data.output;
            } else if (Array.isArray(data.output) && data.output.length > 0) {
              return data.output[0];
            }
          }
          throw new Error("Replicate prediction succeeded but output is empty.");
        }

        if (data.status === "failed" || data.status === "canceled") {
          throw new Error(data.error || `Replicate prediction ${data.status}`);
        }
      } catch (pollErr: any) {
        if (pollErr.message && !pollErr.message.includes("Replicate Poll API Error")) {
          throw pollErr;
        }
        console.warn("[AI Polling Notice]", pollErr.message);
      }
    }

    throw new Error("Proses generasi gambar melebihi batas waktu (timeout 3 menit). Silakan coba lagi.");
  }

  private static async callReplicate(options: AIGenerationOptions): Promise<AIGenerationResult> {
    const { imageUrl, prompt, aspectRatio, resolution, outputFormat } = options;
    const token = process.env.REPLICATE_API_TOKEN;
    console.log(`[AI] Calling Replicate (Nano Banana Pro) with prompt: ${prompt}`);

    if (!token || token.includes("...")) {
      throw new Error("REPLICATE_API_TOKEN is missing or invalid");
    }

    const { options: fetchOpts, clearTimeout: clear } = this.getFetchOptions({
      input: {
        prompt: prompt,
        image_input: [imageUrl],
        aspect_ratio: aspectRatio,
        resolution: resolution ? resolution.toUpperCase() : "1K",
        output_format: outputFormat || "jpg"
      }
    }, token);

    try {
      const response = await fetch("https://api.replicate.com/v1/models/google/nano-banana-pro/predictions", fetchOpts);
      clear();

      if (!response.ok) {
        const errText = await response.text();
        console.error("[Replicate Error]", errText);
        throw new Error(`Replicate API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const predId = data.id;
      
      if (data.status === "failed") {
        throw new Error(data.error || "Replicate prediction failed");
      }
      
      if (data && data.output) {
        const url = typeof data.output === "string" ? data.output : data.output[0];
        if (url) return { url, predictionId: predId };
      }

      const pollUrl = data.urls?.get || (predId ? `https://api.replicate.com/v1/predictions/${predId}` : null);
      if (pollUrl) {
        const url = await this.pollPrediction(pollUrl, token);
        return { url, predictionId: predId };
      }
      
      throw new Error("Replicate API timeout or invalid format. Please try again.");
    } catch (error: any) {
      clear();
      console.error("[AIService Error]", error);
      if (error.name === 'AbortError') {
        throw new Error("Request to AI provider timed out after 3 minutes.");
      }
      throw error;
    }
  }

  private static async callReplicateNanoBanana2(options: AIGenerationOptions): Promise<AIGenerationResult> {
    const { imageUrl, prompt, aspectRatio, resolution, outputFormat } = options;
    const token = process.env.REPLICATE_API_TOKEN;
    console.log(`[AI] Calling Replicate (Nano Banana 2) with prompt: ${prompt}`);

    if (!token || token.includes("...")) {
      throw new Error("REPLICATE_API_TOKEN is missing or invalid");
    }

    const { options: fetchOpts, clearTimeout: clear } = this.getFetchOptions({
      input: {
        prompt: prompt,
        image_input: [imageUrl],
        aspect_ratio: aspectRatio,
        resolution: resolution ? resolution.toUpperCase() : "1K",
        output_format: outputFormat || "jpg"
      }
    }, token);

    try {
      const response = await fetch("https://api.replicate.com/v1/models/google/nano-banana-2/predictions", fetchOpts);
      clear();

      if (!response.ok) {
        const errText = await response.text();
        console.error("[Replicate Error]", errText);
        throw new Error(`Replicate API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const predId = data.id;
      
      if (data.status === "failed") {
        throw new Error(data.error || "Replicate prediction failed");
      }
      
      if (data && data.output) {
        const url = typeof data.output === "string" ? data.output : data.output[0];
        if (url) return { url, predictionId: predId };
      }

      const pollUrl = data.urls?.get || (predId ? `https://api.replicate.com/v1/predictions/${predId}` : null);
      if (pollUrl) {
        const url = await this.pollPrediction(pollUrl, token);
        return { url, predictionId: predId };
      }
      
      throw new Error("Replicate API timeout or invalid format. Please try again.");
    } catch (error: any) {
      clear();
      console.error("[AIService Error]", error);
      if (error.name === 'AbortError') {
        throw new Error("Request to AI provider timed out after 3 minutes.");
      }
      throw error;
    }
  }

  private static async callReplicateGPTImage(options: AIGenerationOptions): Promise<AIGenerationResult> {
    const { imageUrl, prompt, aspectRatio, resolution, outputFormat } = options;
    const token = process.env.REPLICATE_API_TOKEN;
    console.log(`[AI] Calling Replicate (OpenAI GPT-Image 1.5) with prompt: ${prompt}`);

    if (!token || token.includes("...")) {
      throw new Error("REPLICATE_API_TOKEN is missing or invalid");
    }

    let mappedRatio = "1:1";
    if (aspectRatio) {
      if (aspectRatio === "9:16" || aspectRatio === "4:5") mappedRatio = "2:3";
      else if (aspectRatio === "16:9") mappedRatio = "3:2";
      else mappedRatio = aspectRatio;
    }
    
    const mappedFormat = outputFormat === "jpg" ? "jpeg" : (outputFormat || "jpeg");

    let mappedQuality = "auto";
    if (resolution) {
      const resLower = resolution.toLowerCase();
      if (resLower === "4k") mappedQuality = "high";
      else if (resLower === "2k") mappedQuality = "medium";
      else if (resLower === "1k") mappedQuality = "low";
    }

    const { options: fetchOpts, clearTimeout: clear } = this.getFetchOptions({
      input: {
        prompt: prompt,
        input_images: [imageUrl],
        aspect_ratio: mappedRatio,
        output_format: mappedFormat,
        quality: mappedQuality
      }
    }, token);

    try {
      const response = await fetch("https://api.replicate.com/v1/models/openai/gpt-image-1.5/predictions", fetchOpts);
      clear();

      if (!response.ok) {
        const errText = await response.text();
        console.error("[Replicate Error]", errText);
        throw new Error(`Replicate API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const predId = data.id;
      
      if (data.status === "failed") {
        throw new Error(data.error || "Replicate prediction failed");
      }
      
      if (data && data.output) {
        const url = typeof data.output === "string" ? data.output : data.output[0];
        if (url) return { url, predictionId: predId };
      }

      const pollUrl = data.urls?.get || (predId ? `https://api.replicate.com/v1/predictions/${predId}` : null);
      if (pollUrl) {
        const url = await this.pollPrediction(pollUrl, token);
        return { url, predictionId: predId };
      }
      
      throw new Error("Replicate API timeout or invalid format. Please try again.");
    } catch (error: any) {
      clear();
      console.error("[AIService Error]", error);
      if (error.name === 'AbortError') {
        throw new Error("Request to AI provider timed out after 3 minutes.");
      }
      throw error;
    }
  }
}
