"use client";

import { useEffect, useRef, useState } from "react";

interface PollResult {
  status: string;
  progress: number;
  asset?: {
    id: string;
    type: string;
    storageUrl?: string;
    muxPlaybackId?: string;
  };
  error?: string;
}

export function useJobPolling(jobId: string | null) {
  const [data, setData] = useState<PollResult | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/poll`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
          // Stop polling if done
          if (["completed", "failed", "cancelled"].includes(result.status)) {
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        }
      } catch {
        // ignore poll errors
      }
    };

    poll(); // immediate first poll
    intervalRef.current = setInterval(poll, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobId]);

  return data;
}
