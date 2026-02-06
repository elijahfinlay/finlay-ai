"use client";

import { JobCard } from "./JobCard";

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

export function JobList({
  jobs,
  onCancel,
}: {
  jobs: Job[];
  onCancel: (id: string) => void;
}) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-text-secondary">No generations yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onCancel={onCancel} />
      ))}
    </div>
  );
}
