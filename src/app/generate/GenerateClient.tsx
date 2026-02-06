"use client";

import { useState, useCallback } from "react";
import { ImageForm } from "@/components/GenerationForm/ImageForm";
import { VideoForm } from "@/components/GenerationForm/VideoForm";
import { JobList } from "@/components/Jobs/JobList";

interface Job {
  id: string;
  type: string;
  provider: string;
  prompt: string;
  status: string;
  progress: number;
  creditsCharged: number;
  createdAt: string;
  asset?: {
    id: string;
    type: string;
    storageUrl?: string;
    muxPlaybackId?: string;
  };
}

export function GenerateClient({
  initialJobs,
  creditsBalance,
}: {
  initialJobs: Job[];
  creditsBalance: number;
}) {
  const [tab, setTab] = useState<"image" | "video">("image");
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [isGenerating, setIsGenerating] = useState(false);
  const [credits, setCredits] = useState(creditsBalance);
  const [error, setError] = useState("");

  const handleImageGenerate = useCallback(
    async (data: {
      provider: string;
      prompt: string;
      negativePrompt?: string;
      referenceImageUrls?: string[];
      params: { numberOfImages: number; aspectRatio: string; quality: string };
    }) => {
      setIsGenerating(true);
      setError("");

      try {
        const res = await fetch("/api/generate/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (!res.ok) {
          setError(result.error || "Generation failed");
          return;
        }

        // Refresh jobs
        const jobsRes = await fetch("/api/jobs");
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(
            jobsData.jobs.map((j: Record<string, unknown>) => ({
              ...j,
              createdAt:
                typeof j.createdAt === "string"
                  ? j.createdAt
                  : new Date(j.createdAt as string).toISOString(),
            }))
          );
        }

        // Update credits
        if (result.assets) {
          const meRes = await fetch("/api/auth/me");
          if (meRes.ok) {
            const meData = await meRes.json();
            setCredits(meData.user.creditsBalance);
          }
        }
      } catch {
        setError("Something went wrong");
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const handleVideoGenerate = useCallback(
    async (data: {
      provider: string;
      mode: string;
      prompt: string;
      negativePrompt?: string;
      referenceImageUrls?: string[];
      params: Record<string, unknown>;
    }) => {
      setIsGenerating(true);
      setError("");

      try {
        const res = await fetch("/api/generate/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (!res.ok) {
          setError(result.error || "Generation failed");
          return;
        }

        // Add new job to list
        setJobs((prev) => [
          {
            id: result.jobId,
            type: data.mode,
            provider: data.provider,
            prompt: data.prompt,
            status: result.status,
            progress: 0,
            creditsCharged: result.creditsCharged,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);

        // Update credits
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          setCredits(meData.user.creditsBalance);
        }
      } catch {
        setError("Something went wrong");
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const handleCancel = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: "cancelled" } : j))
        );
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          setCredits(meData.user.creditsBalance);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Form panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 rounded-lg bg-surface border border-border p-1">
              {(["image", "video"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                    tab === t
                      ? "bg-accent text-white"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <span className="text-sm text-text-secondary">
              {credits.toLocaleString()} credits
            </span>
          </div>

          {error && (
            <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error">
              {error}
            </div>
          )}

          {tab === "image" ? (
            <ImageForm onGenerate={handleImageGenerate} isGenerating={isGenerating} />
          ) : (
            <VideoForm onGenerate={handleVideoGenerate} isGenerating={isGenerating} />
          )}
        </div>

        {/* Jobs panel */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-medium text-text-secondary">Recent Generations</h2>
          <JobList jobs={jobs} onCancel={handleCancel} />
        </div>
      </div>
    </main>
  );
}
