import { NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const jobs = await db.generationJob.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
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

  return NextResponse.json({ jobs });
}
