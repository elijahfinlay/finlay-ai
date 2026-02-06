import { AIProvider, GenerationInput, SubmitResult, PollResult, CostEstimate, ProviderCapabilities } from "./types";
import { estimateImageCost } from "../costs";

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict";

export class GoogleImagenProvider implements AIProvider {
  id = "google_imagen";
  name = "Imagen 4";
  type = "image" as const;

  capabilities: ProviderCapabilities = {
    modes: ["text_to_image"],
    aspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9"],
    supportsReferenceImages: true,
    supportsNegativePrompt: true,
    isAsync: false,
  };

  async submit(input: GenerationInput): Promise<SubmitResult> {
    const { prompt, negativePrompt, params } = input;
    const numberOfImages = (params.numberOfImages as number) || 1;
    const aspectRatio = (params.aspectRatio as string) || "1:1";

    const body: Record<string, unknown> = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: numberOfImages,
        aspectRatio,
      },
    };

    if (negativePrompt) {
      (body.parameters as Record<string, unknown>).negativePrompt = negativePrompt;
    }

    const response = await fetch(`${API_URL}?key=${process.env.GOOGLE_AI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        providerJobId: "sync",
        status: "failed",
        error: `Imagen API error: ${error}`,
      };
    }

    const data = await response.json();
    const predictions = data.predictions || [];

    if (predictions.length === 0) {
      return {
        providerJobId: "sync",
        status: "failed",
        error: "No images generated",
      };
    }

    // Return the first image's base64 - the API route handles multiple images
    return {
      providerJobId: "sync",
      status: "completed",
      resultBase64: predictions[0].bytesBase64Encoded,
    };
  }

  async poll(): Promise<PollResult> {
    // Imagen is synchronous, no polling needed
    return { status: "completed" };
  }

  estimateCost(input: GenerationInput): CostEstimate {
    return estimateImageCost({
      quality: (input.params.quality as "fast" | "standard" | "ultra") || "standard",
      numberOfImages: (input.params.numberOfImages as number) || 1,
    });
  }
}
