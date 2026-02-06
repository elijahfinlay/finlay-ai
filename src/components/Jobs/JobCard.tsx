"use client";

import { useJobPolling } from "./useJobPolling";

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

export function JobCard({ job, onCancel }: { job: Job; onCancel: (id: string) => void }) {
  const isActive = ["pending", "submitted", "processing"].includes(job.status);
  const pollData = useJobPolling(isActive ? job.id : null);

  const status = pollData?.status || job.status;
  const progress = pollData?.progress || job.progress;
  const asset = pollData?.asset || job.asset;

  const statusColors: Record<string, string> = {
    pending: "text-warning",
    submitted: "text-accent",
    processing: "text-accent",
    completed: "text-success",
    failed: "text-error",
    cancelled: "text-text-secondary",
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-text-primary truncate">{job.prompt}</p>
          <p className="text-xs text-text-secondary mt-0.5">
            {job.provider.replace("_", " ")} &middot; {job.type.replace(/_/g, " ")}
          </p>
        </div>
        <span className={`text-xs font-medium capitalize ${statusColors[status] || "text-text-secondary"}`}>
          {status}
        </span>
      </div>

      {isActive && (
        <div className="space-y-2">
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-text-secondary">{progress}%</span>
            <button
              onClick={() => onCancel(job.id)}
              className="text-xs text-error hover:text-error/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status === "completed" && asset && (
        <div className="rounded-lg overflow-hidden border border-border">
          {asset.type === "image" && asset.storageUrl && (
            <img src={asset.storageUrl} alt="" className="w-full h-32 object-cover" />
          )}
          {asset.type === "video" && asset.muxPlaybackId && (
            <img
              src={`https://image.mux.com/${asset.muxPlaybackId}/thumbnail.webp?time=1`}
              alt=""
              className="w-full h-32 object-cover"
            />
          )}
          {asset.type === "video" && !asset.muxPlaybackId && asset.storageUrl && (
            <video
              src={asset.storageUrl}
              muted
              playsInline
              preload="metadata"
              className="w-full h-32 object-cover"
            />
          )}
          {asset.type === "video" && !asset.muxPlaybackId && !asset.storageUrl && (
            <div className="flex items-center justify-center h-32 bg-bg text-text-secondary text-xs">
              Video processing...
            </div>
          )}
        </div>
      )}

      {status === "failed" && (
        <p className="text-xs text-error">{pollData?.error || "Generation failed"}</p>
      )}
    </div>
  );
}
