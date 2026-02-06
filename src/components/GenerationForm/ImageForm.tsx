"use client";

import { useState } from "react";
import { PromptInput } from "./PromptInput";
import { AspectRatioPicker } from "./AspectRatioPicker";
import { ReferenceUpload } from "./ReferenceUpload";
import { CostEstimate } from "./CostEstimate";
import { estimateImageCost } from "@/lib/costs";

interface ReferenceImage {
  path: string;
  url: string;
}

interface ImageFormProps {
  onGenerate: (data: {
    provider: string;
    prompt: string;
    negativePrompt?: string;
    referenceImageUrls?: string[];
    params: {
      numberOfImages: number;
      aspectRatio: string;
      quality: string;
    };
  }) => void;
  isGenerating: boolean;
}

export function ImageForm({ onGenerate, isGenerating }: ImageFormProps) {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [quality, setQuality] = useState<"fast" | "standard" | "ultra">("standard");
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [showNegative, setShowNegative] = useState(false);

  const cost = estimateImageCost({ quality, numberOfImages });

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate({
      provider: "google_imagen",
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim() || undefined,
      referenceImageUrls: referenceImages.map((img) => img.url),
      params: { numberOfImages, aspectRatio, quality },
    });
  };

  return (
    <div className="space-y-5">
      <PromptInput
        value={prompt}
        onChange={setPrompt}
        placeholder="Describe the image you want to create..."
      />

      <div className="grid grid-cols-2 gap-4">
        <AspectRatioPicker
          value={aspectRatio}
          onChange={setAspectRatio}
          options={["1:1", "3:4", "4:3", "9:16", "16:9"]}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Quality</label>
          <div className="flex gap-2">
            {(["fast", "standard", "ultra"] as const).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuality(q)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium capitalize transition-all ${
                  quality === q
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-text-secondary hover:border-accent/30"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Number of Images</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNumberOfImages(n)}
              className={`h-10 w-10 rounded-lg border text-sm font-medium transition-all ${
                numberOfImages === n
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-text-secondary hover:border-accent/30"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <ReferenceUpload images={referenceImages} onChange={setReferenceImages} />

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
          placeholder="What to avoid in the image..."
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
            Generating...
          </span>
        ) : (
          `Generate Image${numberOfImages > 1 ? "s" : ""}`
        )}
      </button>
    </div>
  );
}
