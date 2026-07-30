export interface AIGenerationOptions {
  imageUrl: string;
  prompt: string;
  provider?: "replicate" | "falai" | "nanobanana" | "openai" | "huggingface";
}

export class AIService {
  static async generate(options: AIGenerationOptions): Promise<string> {
    const provider = options.provider || "huggingface";

    switch (provider) {
      case "huggingface":
        return this.callHuggingFace(options.imageUrl, options.prompt);
      case "nanobanana":
        return this.callNanoBanana(options.imageUrl, options.prompt);
      case "openai":
        return this.callOpenAI(options.imageUrl, options.prompt);
      case "replicate":
        return this.callReplicate(options.imageUrl, options.prompt);
      case "falai":
        return this.callFalAI(options.imageUrl, options.prompt);
      default:
        return this.callHuggingFace(options.imageUrl, options.prompt);
    }
  }

  private static async callHuggingFace(imageUrl: string, prompt: string): Promise<string> {
    console.log(`[AI] Calling Alternative AI (Pollinations) with prompt: ${prompt} (HuggingFace bypassed due to DNS block)`);
    
    try {
      // Menggunakan Pollinations AI sebagai alternatif gratis karena HuggingFace diblokir ISP lokal
      const seed = Math.floor(Math.random() * 1000000);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
      
      const response = await fetch(pollinationsUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Pollinations Error]", errorText);
        throw new Error(`Pollinations API Error: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error("[AIService Error]", error);
      throw error;
    }
  }

  private static async callNanoBanana(imageUrl: string, prompt: string): Promise<string> {
    return this.callHuggingFace(imageUrl, prompt);
  }

  private static async callOpenAI(imageUrl: string, prompt: string): Promise<string> {
    return this.callHuggingFace(imageUrl, prompt);
  }

  private static async callReplicate(imageUrl: string, prompt: string): Promise<string> {
    return this.callHuggingFace(imageUrl, prompt);
  }

  private static async callFalAI(imageUrl: string, prompt: string): Promise<string> {
    return this.callHuggingFace(imageUrl, prompt);
  }
}
