export interface AIGenerationOptions {
  imageUrls: string[];
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
          "Authorization": `Bearer ${token}`,
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
        const controller = new AbortController();
        const requestTimeout = setTimeout(() => controller.abort(), 15_000);
        const response = await fetch(pollUrl, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          signal: controller.signal,
        }).finally(() => clearTimeout(requestTimeout));

        if (!response.ok) {
          const errText = await response.text();
          console.error("[Replicate Poll Error]", errText);
          if ([400, 401, 403, 404].includes(response.status)) {
            throw new Error(`Replicate Poll Permanent Error (${response.status}): aborting poll`);
          }
          if (response.status === 429) {
            const retryAfter = Number(response.headers.get("Retry-After"));
            const delay = Number.isFinite(retryAfter) && retryAfter > 0
              ? Math.min(retryAfter * 1000, 15_000)
              : intervalMs;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          throw new Error(`Replicate Poll Transient Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`[AI Polling] Prediction status: ${data.status}`);

        if (data.status === "succeeded") {
          if (data && data.output) {
            if (typeof data.output === "string") {
              return data.output;
            } else if (Array.isArray(data.output) && data.output.length > 0) {
              return data.output[data.output.length - 1];
            }
          }
          throw new Error("Replicate prediction succeeded but output is empty.");
        }

        if (data.status === "failed" || data.status === "canceled") {
          throw new Error(data.error || `Replicate prediction ${data.status}`);
        }
      } catch (pollErr: any) {
        if (pollErr.message?.includes("Permanent Error") || pollErr.message?.startsWith("Replicate prediction")) {
          throw pollErr;
        }
        console.warn("[AI Polling Notice]", pollErr.message);
      }
    }

    throw new Error("Proses generasi gambar melebihi batas waktu (timeout 3 menit). Silakan coba lagi.");
  }

  private static async callReplicate(options: AIGenerationOptions): Promise<AIGenerationResult> {
    const { imageUrls, prompt, aspectRatio, resolution, outputFormat } = options;
    const token = process.env.REPLICATE_API_TOKEN;
    console.log(`[AI] Calling Replicate (Nano Banana Pro) with prompt: ${prompt}`);

    if (!token || token.includes("...")) {
      throw new Error("REPLICATE_API_TOKEN is missing or invalid");
    }

    const { options: fetchOpts, clearTimeout: clear } = this.getFetchOptions({
      input: {
        prompt: prompt,
        image_input: imageUrls,
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
      
      if (data.status === "succeeded" && data.output) {
        const url = typeof data.output === "string" ? data.output : data.output[data.output.length - 1];
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
    const { imageUrls, prompt, aspectRatio, resolution, outputFormat } = options;
    const token = process.env.REPLICATE_API_TOKEN;
    console.log(`[AI] Calling Replicate (Nano Banana 2) with prompt: ${prompt}`);

    if (!token || token.includes("...")) {
      throw new Error("REPLICATE_API_TOKEN is missing or invalid");
    }

    const { options: fetchOpts, clearTimeout: clear } = this.getFetchOptions({
      input: {
        prompt: prompt,
        image_input: imageUrls,
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
      
      if (data.status === "succeeded" && data.output) {
        const url = typeof data.output === "string" ? data.output : data.output[data.output.length - 1];
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
    const { imageUrls, prompt, aspectRatio, resolution, outputFormat } = options;
    const token = process.env.REPLICATE_API_TOKEN;
    console.log(`[AI] Calling Replicate (OpenAI GPT-Image 2) with prompt: ${prompt}`);

    if (!token || token.includes("...")) {
      throw new Error("REPLICATE_API_TOKEN is missing or invalid");
    }

    let mappedRatio = "1:1";
    if (aspectRatio) {
      if (aspectRatio === "4:5") mappedRatio = "3:4";
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

    const inputPayload: any = {
      prompt: prompt,
      aspect_ratio: mappedRatio,
      output_format: mappedFormat,
      quality: mappedQuality,
      background: "opaque"
    };

    const validImages = imageUrls.filter(url =>
      url.startsWith("data:image/") || url.startsWith("https://") || url.startsWith("http://")
    );
    if (validImages.length > 0) {
      inputPayload.input_images = validImages;
    }

    const { options: fetchOpts, clearTimeout: clear } = this.getFetchOptions({
      input: inputPayload
    }, token);

    try {
      const response = await fetch("https://api.replicate.com/v1/models/openai/gpt-image-2/predictions", fetchOpts);
      clear();

      if (!response.ok) {
        const errText = await response.text();
        console.error("[Replicate OpenAI Error]", errText);
        let parsedMessage = response.statusText;
        try {
          const parsedErr = JSON.parse(errText);
          parsedMessage = parsedErr.detail || parsedErr.error || parsedMessage;
        } catch {
          // Use default response statusText
        }
        throw new Error(`Gagal memproses gambar pada model OpenAI: ${parsedMessage}`);
      }

      const data = await response.json();
      const predId = data.id;
      
      if (data.status === "failed") {
        throw new Error(data.error || "Proses generasi gambar OpenAI gagal pada provider Replicate.");
      }
      
      if (data.status === "succeeded" && data.output) {
        const url = typeof data.output === "string" ? data.output : data.output[data.output.length - 1];
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
