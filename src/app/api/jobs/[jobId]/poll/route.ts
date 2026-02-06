import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProvider } from "@/lib/providers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { jobId } = await params;

  const job = await db.generationJob.findFirst({
    where: { id: jobId, userId: user.id },
    select: {
      id: true,
      status: true,
      progress: true,
      errorMessage: true,
      provider: true,
      providerJobId: true,
      lastPolledAt: true,
      pollCount: true,
      asset: {
        select: {
          id: true,
          type: true,
          storageUrl: true,
          muxPlaybackId: true,
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // If job is still active and hasn't been polled by cron in 15+ seconds,
  // poll the provider directly as a fallback
  const isActive = ["submitted", "processing"].includes(job.status);
  const lastPoll = job.lastPolledAt ? new Date(job.lastPolledAt).getTime() : 0;
  const stale = Date.now() - lastPoll > 15000;

  if (isActive && stale && job.providerJobId) {
    try {
      const provider = getProvider(job.provider);
      const result = await provider.poll(job.providerJobId);

      if (result.status === "processing") {
        await db.generationJob.update({
          where: { id: job.id },
          data: {
            progress: result.progress || job.progress,
            pollCount: { increment: 1 },
            lastPolledAt: new Date(),
            status: "processing",
          },
        });

        return NextResponse.json({
          status: "processing",
          progress: result.progress || job.progress,
          asset: null,
          error: null,
        });
      }

      if (result.status === "failed") {
        // Don't handle refund here — let cron handle failures fully.
        // Just update status so the client sees it.
        await db.generationJob.update({
          where: { id: job.id },
          data: {
            status: "failed",
            errorMessage: result.error || "Generation failed",
            lastPolledAt: new Date(),
          },
        });

        return NextResponse.json({
          status: "failed",
          progress: 0,
          asset: null,
          error: result.error || "Generation failed",
        });
      }

      if (result.status === "completed") {
        // Mark progress so cron picks it up for the full completion flow
        // (upload, Mux, asset creation). Don't duplicate that logic here.
        await db.generationJob.update({
          where: { id: job.id },
          data: {
            progress: 99,
            lastPolledAt: new Date(),
            resultUrl: result.resultUrl || undefined,
          },
        });

        return NextResponse.json({
          status: "processing",
          progress: 99,
          asset: null,
          error: null,
        });
      }
    } catch (error) {
      console.error(`Inline poll error for job ${job.id}:`, error);
      // Fall through to return DB state
    }
  }

  return NextResponse.json({
    status: job.status,
    progress: job.progress,
    asset: job.asset,
    error: job.errorMessage,
  });
}
