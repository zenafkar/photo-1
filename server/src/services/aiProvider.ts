export interface AIGenerationOptions {
  imageUrl: string;
  prompt: string;
  provider?: "replicate" | "falai" | "nanobanana" | "nanobanana2" | "openai" | "huggingface" | "pollinations" | "gptimage";
  aspectRatio?: string;
  resolution?: string;
  outputFormat?: string;
}

export class AIService {
  static async generate(options: AIGenerationOptions): Promise<string> {
    const provider = options.provider || "falai";

    switch (provider) {
      case "pollinations":
      case "huggingface":
        return this.callPollinations(options.imageUrl, options.prompt);
      case "replicate":
      case "nanobanana":
        return this.callReplicate(options);
      case "nanobanana2":
        return this.callReplicateNanoBanana2(options);
      case "gptimage":
        return this.callReplicateGPTImage(options);
      case "falai":
      default:
        return this.callFalAI(options);
    }
  }

  private static async callPollinations(imageUrl: string, prompt: string): Promise<string> {
    console.log(`[AI] Calling Pollinations with prompt: ${prompt}`);
    
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
    
    return pollinationsUrl;
  }

  private static async callReplicate(options: AIGenerationOptions): Promise<string> {
    const { imageUrl, prompt, aspectRatio, resolution, outputFormat } = options;
    const token = process.env.REPLICATE_API_TOKEN;
    console.log(`[AI] Calling Replicate (Nano Banana Pro) with prompt: ${prompt}`);

    if (!token || token.includes("...")) {
      throw new Error("REPLICATE_API_TOKEN is missing or invalid");
    }

    try {
      // Menggunakan endpoint langsung ke model yang spesifik (google/nano-banana-pro)
      const response = await fetch("https://api.replicate.com/v1/models/google/nano-banana-pro/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
          "Prefer": "wait"
        },
        body: JSON.stringify({
          input: {
            prompt: prompt,
            image_input: [imageUrl],
            aspect_ratio: aspectRatio,
            resolution: resolution ? resolution.toUpperCase() : "1K",
            output_format: outputFormat || "jpg"
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[Replicate Error]", errText);
        throw new Error(`Replicate API Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === "failed") {
        throw new Error(data.error || "Replicate prediction failed");
      }
      
      if (data && data.output) {
        // Some Replicate models return an array of strings, some return a single string
        if (typeof data.output === "string") {
          return data.output;
        } else if (Array.isArray(data.output) && data.output.length > 0) {
          return data.output[0];
        }
      }
      
      throw new Error("Replicate API timeout or invalid format. Please try again.");
    } catch (error) {
      console.error("[AIService Error]", error);
      throw error;
    }
  }

  private static async callReplicateNanoBanana2(options: AIGenerationOptions): Promise<string> {
    const { imageUrl, prompt, aspectRatio, resolution, outputFormat } = options;
    const token = process.env.REPLICATE_API_TOKEN;
    console.log(`[AI] Calling Replicate (Nano Banana 2) with prompt: ${prompt}`);

    if (!token || token.includes("...")) {
      throw new Error("REPLICATE_API_TOKEN is missing or invalid");
    }

    try {
      const response = await fetch("https://api.replicate.com/v1/models/google/nano-banana-2/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
          "Prefer": "wait"
        },
        body: JSON.stringify({
          input: {
            prompt: prompt,
            image_input: [imageUrl],
            aspect_ratio: aspectRatio,
            resolution: resolution ? resolution.toUpperCase() : "1K",
            output_format: outputFormat || "jpg"
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[Replicate Error]", errText);
        throw new Error(`Replicate API Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === "failed") {
        throw new Error(data.error || "Replicate prediction failed");
      }
      
      if (data && data.output) {
        if (typeof data.output === "string") {
          return data.output;
        } else if (Array.isArray(data.output) && data.output.length > 0) {
          return data.output[0];
        }
      }
      
      throw new Error("Replicate API timeout or invalid format. Please try again.");
    } catch (error) {
      console.error("[AIService Error]", error);
      throw error;
    }
  }

  private static async callReplicateGPTImage(options: AIGenerationOptions): Promise<string> {
    const { imageUrl, prompt, aspectRatio, resolution, outputFormat } = options;
    const token = process.env.REPLICATE_API_TOKEN;
    console.log(`[AI] Calling Replicate (OpenAI GPT-Image 1.5) with prompt: ${prompt}`);

    if (!token || token.includes("...")) {
      throw new Error("REPLICATE_API_TOKEN is missing or invalid");
    }

    // Map aspect ratios to what GPT-Image 1.5 supports: ['1:1', '3:2', '2:3']
    let mappedRatio = "1:1";
    if (aspectRatio) {
      if (aspectRatio === "9:16" || aspectRatio === "4:5") mappedRatio = "2:3";
      else if (aspectRatio === "16:9") mappedRatio = "3:2";
      else mappedRatio = aspectRatio; // '1:1' or '2:3'
    }
    
    // Map output format to what GPT-Image 1.5 supports: ['png', 'jpeg', 'webp']
    const mappedFormat = outputFormat === "jpg" ? "jpeg" : (outputFormat || "jpeg");

    // Map resolution to quality
    let mappedQuality = "auto";
    if (resolution) {
      const resLower = resolution.toLowerCase();
      if (resLower === "4k") mappedQuality = "high";
      else if (resLower === "2k") mappedQuality = "medium";
      else if (resLower === "1k") mappedQuality = "low";
    }

    try {
      const response = await fetch("https://api.replicate.com/v1/models/openai/gpt-image-1.5/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
          "Prefer": "wait"
        },
        body: JSON.stringify({
          input: {
            prompt: prompt,
            input_images: [imageUrl],
            aspect_ratio: mappedRatio,
            output_format: mappedFormat,
            quality: mappedQuality
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[Replicate Error]", errText);
        throw new Error(`Replicate API Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === "failed") {
        throw new Error(data.error || "Replicate prediction failed");
      }
      
      if (data && data.output) {
        if (typeof data.output === "string") {
          return data.output;
        } else if (Array.isArray(data.output) && data.output.length > 0) {
          return data.output[0];
        }
      }
      
      throw new Error("Replicate API timeout or invalid format. Please try again.");
    } catch (error) {
      console.error("[AIService Error]", error);
      throw error;
    }
  }

  private static async callFalAI(options: AIGenerationOptions): Promise<string> {
    const { imageUrl, prompt, aspectRatio, resolution, outputFormat } = options;
    const token = process.env.FAL_KEY;
    console.log(`[AI] Calling Fal.ai Flux Image-to-Image with prompt: ${prompt}`);

    if (!token || token.includes("...")) {
      throw new Error("FAL_KEY is missing or invalid");
    }

    // Hitung resolusi pasti berdasarkan aspect ratio & resolution tier
    let width = 1024;
    let height = 1024;
    const baseSize = resolution === "4k" ? 4096 : resolution === "2k" ? 2048 : 1024;
    
    if (aspectRatio === "16:9") {
      width = baseSize;
      height = Math.round((baseSize * 9) / 16);
    } else if (aspectRatio === "9:16") {
      height = baseSize;
      width = Math.round((baseSize * 9) / 16);
    } else if (aspectRatio === "4:3") {
      width = baseSize;
      height = Math.round((baseSize * 3) / 4);
    } else if (aspectRatio === "3:4") {
      height = baseSize;
      width = Math.round((baseSize * 3) / 4);
    } else {
      width = baseSize;
      height = baseSize;
    }

    try {
      const response = await fetch("https://fal.run/fal-ai/flux/dev/image-to-image", {
        method: "POST",
        headers: {
          "Authorization": `Key ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image_url: imageUrl,
          prompt: prompt,
          strength: 0.85,
          num_inference_steps: resolution === "4k" ? 40 : resolution === "2k" ? 35 : 28,
          guidance_scale: 3.5,
          image_size: { width, height },
          output_format: outputFormat || "jpeg"
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[FalAI Error]", errText);
        throw new Error(`Fal.ai API Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data && data.images && data.images.length > 0) {
        return data.images[0].url;
      }
      
      throw new Error("Invalid response format from Fal.ai");
    } catch (error) {
      console.error("[AIService Error]", error);
      throw error;
    }
  }
}
