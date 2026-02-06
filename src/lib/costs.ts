export type GenerationMode = "text_to_video" | "image_to_video" | "text_to_image";

export interface CostEstimate {
  credits: number;
  breakdown: string;
}

export function estimateImageCost(params: {
  quality: "fast" | "standard" | "ultra";
  numberOfImages: number;
}): CostEstimate {
  const baseCost = { fast: 3, standard: 5, ultra: 8 }[params.quality];
  const total = baseCost * params.numberOfImages;
  const qualityLabel = params.quality.charAt(0).toUpperCase() + params.quality.slice(1);

  return {
    credits: total,
    breakdown: `${qualityLabel} image${params.numberOfImages > 1 ? ` x${params.numberOfImages}` : ""}: ${total} credits`,
  };
}

export function estimateVeoCost(params: {
  duration: number;
  resolution: string;
}): CostEstimate {
  let credits: number;

  if (params.resolution === "1080p") {
    credits = params.duration <= 4 ? 160 : params.duration <= 6 ? 240 : 320;
  } else {
    credits = params.duration <= 4 ? 60 : params.duration <= 6 ? 90 : 120;
  }

  return {
    credits,
    breakdown: `${params.duration}s ${params.resolution} video (Veo): ${credits} credits`,
  };
}

export function estimateKlingCost(params: {
  duration: number;
  mode: "standard" | "professional";
}): CostEstimate {
  let credits: number;

  if (params.mode === "professional") {
    credits = params.duration <= 5 ? 100 : 150;
  } else {
    credits = params.duration <= 5 ? 50 : 80;
  }

  return {
    credits,
    breakdown: `${params.duration}s ${params.mode} video (Kling): ${credits} credits`,
  };
}

export function estimateCost(
  provider: string,
  mode: GenerationMode,
  params: Record<string, unknown>
): CostEstimate {
  if (provider === "google_imagen") {
    return estimateImageCost({
      quality: (params.quality as "fast" | "standard" | "ultra") || "standard",
      numberOfImages: (params.numberOfImages as number) || 1,
    });
  }

  if (provider === "google_veo") {
    return estimateVeoCost({
      duration: (params.duration as number) || 4,
      resolution: (params.resolution as string) || "720p",
    });
  }

  if (provider === "kling") {
    return estimateKlingCost({
      duration: (params.duration as number) || 5,
      mode: (params.mode as "standard" | "professional") || "standard",
    });
  }

  return { credits: 0, breakdown: "Unknown provider" };
}
