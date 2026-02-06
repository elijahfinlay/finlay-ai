export type GenerationMode = "text_to_video" | "image_to_video" | "text_to_image";

export interface GenerationInput {
  mode: GenerationMode;
  prompt: string;
  negativePrompt?: string;
  referenceImageUrls?: string[];
  params: Record<string, unknown>;
}

export interface SubmitResult {
  providerJobId: string;
  status: "submitted" | "completed" | "failed";
  resultUrl?: string;
  resultBase64?: string;
  error?: string;
}

export interface PollResult {
  status: "processing" | "completed" | "failed";
  progress?: number;
  resultUrl?: string;
  resultBase64?: string;
  error?: string;
}

export interface CostEstimate {
  credits: number;
  breakdown: string;
}

export interface ProviderCapabilities {
  modes: GenerationMode[];
  resolutions?: string[];
  aspectRatios: string[];
  maxDuration?: number;
  supportsReferenceImages: boolean;
  supportsNegativePrompt: boolean;
  isAsync: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  type: "video" | "image";
  capabilities: ProviderCapabilities;
  submit(input: GenerationInput): Promise<SubmitResult>;
  poll(providerJobId: string): Promise<PollResult>;
  estimateCost(input: GenerationInput): CostEstimate;
}
