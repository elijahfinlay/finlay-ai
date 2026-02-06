"use client";

import { useState } from "react";
import { PromptInput } from "./PromptInput";
import { ProviderPicker } from "./ProviderPicker";
import { AspectRatioPicker } from "./AspectRatioPicker";
import { ReferenceUpload } from "./ReferenceUpload";
import { CostEstimate } from "./CostEstimate";
import { estimateVeoCost, estimateKlingCost } from "@/lib/costs";

interface ReferenceImage {
  path: string;
  url: string;
}

interface VideoFormProps {
  onGenerate: (data: {
    provider: string;
    mode: string;
    prompt: string;
    negativePrompt?: string;
    referenceImageUrls?: string[];
    params: Record<string, unknown>;
  }) => void;
  isGenerating: boolean;
}

const videoProviders = [
  { id: "google_veo", name: "Veo 3.1", description: "Google's latest video model" },
  { id: "kling", name: "Kling 3.0", description: "Fast, cinematic video" },
];

export function VideoForm({ onGenerate, isGenerating }: VideoFormProps) {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [provider, setProvider] = useState("google_veo");
  const [mode, setMode] = useState<"text_to_video" | "image_to_video">("text_to_video");
  const [duration, setDuration] = useState(4);
  const [resolution, setResolution] = useState("720p");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [klingMode, setKlingMode] = useState<"standard" | "professional">("standard");
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [showNegative, setShowNegative] = useState(false);

  const cost =
    provider === "google_veo"
      ? estimateVeoCost({ duration, resolution })
      : estimateKlingCost({ duration: Math.min(duration, 10), mode: klingMode });

  const durations = provider === "google_veo" ? [4, 6, 8] : [5, 10];

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate({
      provider,
      mode,
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim() || undefined,
      referenceImageUrls: referenceImages.map((img) => img.url),
      params: {
        duration,
        aspectRatio,
        ...(provider === "google_veo" ? { resolution } : { mode: klingMode }),
      },
    });
  };

  return (
    <div className="space-y-5">
      <PromptInput
        value={prompt}
        onChange={setPrompt}
        placeholder="Describe the video you want to create..."
      />

      <ProviderPicker value={provider} onChange={(v) => { setProvider(v); setDuration(v === "google_veo" ? 4 : 5); }} providers={videoProviders} />

      <div className="flex gap-2">
        {(["text_to_video", "image_to_video"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${
              mode === m
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface text-text-secondary hover:border-accent/30"
            }`}
          >
            {m === "text_to_video" ? "Text to Video" : "Image to Video"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Duration</label>
          <div className="flex gap-2">
            {durations.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${
                  duration === d
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-text-secondary hover:border-accent/30"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {provider === "google_veo" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Resolution</label>
            <div className="flex gap-2">
              {["720p", "1080p"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setResolution(r)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${
                    resolution === r
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-surface text-text-secondary hover:border-accent/30"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Mode</label>
            <div className="flex gap-2">
              {(["standard", "professional"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setKlingMode(m)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium capitalize transition-all ${
                    klingMode === m
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-surface text-text-secondary hover:border-accent/30"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <AspectRatioPicker
        value={aspectRatio}
        onChange={setAspectRatio}
        options={provider === "google_veo" ? ["16:9", "9:16"] : ["16:9", "9:16", "1:1"]}
      />

      {(mode === "image_to_video" || provider === "google_veo") && (
        <ReferenceUpload
          images={referenceImages}
          onChange={setReferenceImages}
          maxImages={mode === "image_to_video" ? 1 : 3}
        />
      )}

      <button
        type="button"
        onClick={() => setShowNegative(!showNegative)}
        className="text-xs text-text-secondary hover:text-accent transition-colors"
      >
        {showNegative ? "Hide" : "Show"} negative prompt
      </button>

      {showNegative && (
        <textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="What to avoid..."
          rows={2}
          className="w-full resize-none rounded-lg bg-surface border border-border p-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none transition-colors"
        />
      )}

      <CostEstimate credits={cost.credits} breakdown={cost.breakdown} />

      <button
        onClick={handleSubmit}
        disabled={!prompt.trim() || isGenerating}
        className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-all hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Submitting...
          </span>
        ) : (
          "Generate Video"
        )}
      </button>
    </div>
  );
}
