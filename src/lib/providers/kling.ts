import jwt from "jsonwebtoken";
import { AIProvider, GenerationInput, SubmitResult, PollResult, CostEstimate, ProviderCapabilities } from "./types";
import { estimateKlingCost } from "../costs";

const BASE_URL = "https://api.klingai.com/v1";

function getKlingToken(): string {
  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;
  if (!accessKey || !secretKey) {
    throw new Error("Kling credentials not configured. Set KLING_ACCESS_KEY and KLING_SECRET_KEY.");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: accessKey,
    exp: now + 1800,
    nbf: now - 5,
    iat: now,
  };

  return jwt.sign(payload, secretKey, { algorithm: "HS256", header: { alg: "HS256", typ: "JWT" } });
}

export class KlingProvider implements AIProvider {
  id = "kling";
  name = "Kling 3.0";
  type = "video" as const;

  capabilities: ProviderCapabilities = {
    modes: ["text_to_video", "image_to_video"],
    aspectRatios: ["16:9", "9:16", "1:1"],
    maxDuration: 10,
    supportsReferenceImages: false,
    supportsNegativePrompt: true,
    isAsync: true,
  };

  async submit(input: GenerationInput): Promise<SubmitResult> {
    const { mode, prompt, negativePrompt, referenceImageUrls, params } = input;
    const endpoint = mode === "image_to_video" ? "image2video" : "text2video";

    const body: Record<string, unknown> = {
      prompt,
      duration: `${params.duration || 5}`,
      aspect_ratio: params.aspectRatio || "16:9",
      mode: params.mode || "standard",
    };

    if (negativePrompt) body.negative_prompt = negativePrompt;

    if (mode === "image_to_video" && referenceImageUrls?.[0]) {
      body.image_url = referenceImageUrls[0];
    }

    const token = getKlingToken();
    const response = await fetch(`${BASE_URL}/videos/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return { providerJobId: "", status: "failed", error: `Kling API error: ${error}` };
    }

    const data = await response.json();
    return {
      providerJobId: data.data?.task_id || data.task_id,
      status: "submitted",
    };
  }

  async poll(providerJobId: string): Promise<PollResult> {
    const token = getKlingToken();
    const response = await fetch(`${BASE_URL}/videos/${providerJobId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return { status: "failed", error: `Poll error: ${error}` };
    }

    const data = await response.json();
    const task = data.data || data;

    if (task.status === "completed" || task.status === "succeed") {
      const videoUrl = task.works?.[0]?.resource?.resource || task.video_url;
      if (videoUrl) {
        return { status: "completed", resultUrl: videoUrl, progress: 100 };
      }
      return { status: "failed", error: "No video URL in response" };
    }

    if (task.status === "failed") {
      return { status: "failed", error: task.message || "Generation failed" };
    }

    return {
      status: "processing",
      progress: task.progress || Math.min((task.percentage || 0), 99),
    };
  }

  estimateCost(input: GenerationInput): CostEstimate {
    return estimateKlingCost({
      duration: (input.params.duration as number) || 5,
      mode: (input.params.mode as "standard" | "professional") || "standard",
    });
  }
}
