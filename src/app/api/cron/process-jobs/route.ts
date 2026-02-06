import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProvider } from "@/lib/providers";
import { createAssetFromUrl, isMuxConfigured } from "@/lib/mux";
import { uploadFile } from "@/lib/storage";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  let processed = 0;

  while (Date.now() - startTime < 55000) {
    // Find jobs that need polling
    const jobs = await db.generationJob.findMany({
      where: {
        status: { in: ["submitted", "processing"] },
        lastPolledAt: {
          lt: new Date(Date.now() - 10000), // At least 10s since last poll
        },
      },
      take: 10,
      orderBy: { lastPolledAt: "asc" },
    });

    if (jobs.length === 0) {
      // No jobs to process, wait 5s then check again
      await new Promise((resolve) => setTimeout(resolve, 5000));
      continue;
    }

    for (const job of jobs) {
      try {
        // Check if job has timed out (1 hour = 360 polls at 10s intervals)
        if (job.pollCount > 360) {
          await handleJobFailure(job.id, job.userId, job.creditsCharged, "Generation timed out after 1 hour");
          processed++;
          continue;
        }

        const provider = getProvider(job.provider);
        const result = await provider.poll(job.providerJobId!);

        if (result.status === "completed") {
          await handleJobCompletion(job, result);
        } else if (result.status === "failed") {
          await handleJobFailure(job.id, job.userId, job.creditsCharged, result.error || "Generation failed");
        } else {
          // Still processing - update progress
          await db.generationJob.update({
            where: { id: job.id },
            data: {
              progress: result.progress || job.progress,
              pollCount: { increment: 1 },
              lastPolledAt: new Date(),
              status: "processing",
            },
          });
        }

        processed++;
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        await db.generationJob.update({
          where: { id: job.id },
          data: {
            pollCount: { increment: 1 },
            lastPolledAt: new Date(),
          },
        });
      }
    }
  }

  return NextResponse.json({ processed });
}

async function handleJobCompletion(
  job: { id: string; userId: string; provider: string; prompt: string; type: string },
  result: { resultUrl?: string; resultBase64?: string }
) {
  if (job.type === "text_to_image" && result.resultBase64) {
    // Upload image to Vercel Blob
    const buffer = Buffer.from(result.resultBase64, "base64");
    const storagePath = `${job.userId}/${Date.now()}.png`;
    const uploaded = await uploadFile("generated-images", storagePath, buffer, "image/png");

    await db.$transaction([
      db.generatedAsset.create({
        data: {
          userId: job.userId,
          jobId: job.id,
          type: "image",
          provider: job.provider,
          storagePath,
          storageUrl: uploaded.url,
          prompt: job.prompt,
          mimeType: "image/png",
        },
      }),
      db.generationJob.update({
        where: { id: job.id },
        data: { status: "completed", progress: 100, completedAt: new Date() },
      }),
    ]);
  } else if (result.resultUrl) {
    // Video - use Mux if configured, otherwise store direct URL
    if (isMuxConfigured()) {
      const muxAsset = await createAssetFromUrl(result.resultUrl);

      await db.$transaction([
        db.generatedAsset.create({
          data: {
            userId: job.userId,
            jobId: job.id,
            type: "video",
            provider: job.provider,
            muxAssetId: muxAsset.assetId,
            muxPlaybackId: muxAsset.playbackId,
            prompt: job.prompt,
          },
        }),
        db.generationJob.update({
          where: { id: job.id },
          data: {
            status: "completed",
            progress: 100,
            completedAt: new Date(),
            resultUrl: result.resultUrl,
          },
        }),
      ]);
    } else {
      // No Mux — store the direct video URL
      await db.$transaction([
        db.generatedAsset.create({
          data: {
            userId: job.userId,
            jobId: job.id,
            type: "video",
            provider: job.provider,
            storageUrl: result.resultUrl,
            prompt: job.prompt,
          },
        }),
        db.generationJob.update({
          where: { id: job.id },
          data: {
            status: "completed",
            progress: 100,
            completedAt: new Date(),
            resultUrl: result.resultUrl,
          },
        }),
      ]);
    }
  } else if (result.resultBase64) {
    // Video returned as base64 - upload to Blob storage
    const buffer = Buffer.from(result.resultBase64, "base64");
    const storagePath = `${job.userId}/${Date.now()}.mp4`;
    const uploaded = await uploadFile("generated-videos", storagePath, buffer, "video/mp4");

    if (isMuxConfigured()) {
      const muxAsset = await createAssetFromUrl(uploaded.url);

      await db.$transaction([
        db.generatedAsset.create({
          data: {
            userId: job.userId,
            jobId: job.id,
            type: "video",
            provider: job.provider,
            muxAssetId: muxAsset.assetId,
            muxPlaybackId: muxAsset.playbackId,
            storagePath,
            storageUrl: uploaded.url,
            prompt: job.prompt,
          },
        }),
        db.generationJob.update({
          where: { id: job.id },
          data: {
            status: "completed",
            progress: 100,
            completedAt: new Date(),
          },
        }),
      ]);
    } else {
      // No Mux — just use the blob URL directly
      await db.$transaction([
        db.generatedAsset.create({
          data: {
            userId: job.userId,
            jobId: job.id,
            type: "video",
            provider: job.provider,
            storagePath,
            storageUrl: uploaded.url,
            prompt: job.prompt,
          },
        }),
        db.generationJob.update({
          where: { id: job.id },
          data: {
            status: "completed",
            progress: 100,
            completedAt: new Date(),
          },
        }),
      ]);
    }
  }
}

async function handleJobFailure(
  jobId: string,
  userId: string,
  creditsCharged: number,
  error: string
) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: {
        creditsBalance: { increment: creditsCharged },
        creditsUsed: { decrement: creditsCharged },
      },
    }),
    db.creditTransaction.create({
      data: {
        userId,
        amount: creditsCharged,
        balance: user.creditsBalance + creditsCharged,
        type: "refund",
        description: `Refund: ${error}`,
        jobId,
      },
    }),
    db.generationJob.update({
      where: { id: jobId },
      data: { status: "failed", errorMessage: error },
    }),
  ]);
}
