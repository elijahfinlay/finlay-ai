import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";

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
    include: {
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

  return NextResponse.json({ job });
}

export async function DELETE(
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
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (!["pending", "submitted", "processing"].includes(job.status)) {
    return NextResponse.json({ error: "Job cannot be cancelled" }, { status: 400 });
  }

  // Refund credits
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        creditsBalance: { increment: job.creditsCharged },
        creditsUsed: { decrement: job.creditsCharged },
      },
    }),
    db.creditTransaction.create({
      data: {
        userId: user.id,
        amount: job.creditsCharged,
        balance: user.creditsBalance + job.creditsCharged,
        type: "refund",
        description: "Cancelled generation",
        jobId: job.id,
      },
    }),
    db.generationJob.update({
      where: { id: job.id },
      data: { status: "cancelled" },
    }),
  ]);

  return NextResponse.json({ success: true });
}
