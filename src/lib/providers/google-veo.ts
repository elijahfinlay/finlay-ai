import { AIProvider, GenerationInput, SubmitResult, PollResult, CostEstimate, ProviderCapabilities } from "./types";
import { estimateVeoCost } from "../costs";

const SUBMIT_URL = "https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning";
const POLL_BASE = "https://generativelanguage.googleapis.com/v1beta";

export class GoogleVeoProvider implements AIProvider {
  id = "google_veo";
  name = "Veo 3.1";
  type = "video" as const;

  capabilities: ProviderCapabilities = {
    modes: ["text_to_video", "image_to_video"],
    resolutions: ["720p", "1080p"],
    aspectRatios: ["16:9", "9:16"],
    maxDuration: 8,
    supportsReferenceImages: true,
    supportsNegativePrompt: true,
    isAsync: true,
  };

  async submit(input: GenerationInput): Promise<SubmitResult> {
    const { prompt, negativePrompt, referenceImageUrls, params } = input;

    const body: Record<string, unknown> = {
      instances: [{ prompt }],
      parameters: {
        duration: `${params.duration || 4}s`,
        resolution: params.resolution || "720p",
        aspectRatio: params.aspectRatio || "16:9",
      },
    };

    if (negativePrompt) {
      (body.parameters as Record<string, unknown>).negativePrompt = negativePrompt;
    }

    if (params.seed) {
      (body.parameters as Record<string, unknown>).seed = params.seed;
    }

    if (referenceImageUrls && referenceImageUrls.length > 0) {
      (body.instances as Record<string, unknown>[])[0].referenceImages = referenceImageUrls.map(url => ({
        referenceImage: { imageUrl: url },
        referenceType: "STYLE",
      }));
    }

    const response = await fetch(`${SUBMIT_URL}?key=${process.env.GOOGLE_AI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return { providerJobId: "", status: "failed", error: `Veo API error: ${error}` };
    }

    const data = await response.json();
    return {
      providerJobId: data.name, // operation name for polling
      status: "submitted",
    };
  }

  async poll(providerJobId: string): Promise<PollResult> {
    const response = await fetch(
      `${POLL_BASE}/${providerJobId}?key=${process.env.GOOGLE_AI_API_KEY}`
    );

    if (!response.ok) {
      const error = await response.text();
      return { status: "failed", error: `Poll error: ${error}` };
    }

    const data = await response.json();

    if (data.done) {
      if (data.error) {
        return { status: "failed", error: data.error.message };
      }

      const videos = data.response?.generateVideoResponse?.generatedSamples;
      if (videos && videos.length > 0) {
        const video = videos[0];
        if (video.video?.uri) {
          return { status: "completed", resultUrl: video.video.uri, progress: 100 };
        }
        if (video.video?.bytesBase64Encoded) {
          return { status: "completed", resultBase64: video.video.bytesBase64Encoded, progress: 100 };
        }
      }

      return { status: "failed", error: "No video in response" };
    }

    // Still processing
    const progress = data.metadata?.percentComplete || 0;
    return { status: "processing", progress };
  }

  estimateCost(input: GenerationInput): CostEstimate {
    return estimateVeoCost({
      duration: (input.params.duration as number) || 4,
      resolution: (input.params.resolution as string) || "720p",
    });
  }
}
