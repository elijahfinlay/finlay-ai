import { redirect } from "next/navigation";
import { getUserFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { Nav } from "@/components/Nav";
import { GenerateClient } from "./GenerateClient";

export default async function GeneratePage() {
  const user = await getUserFromCookie();
  if (!user) redirect("/login");

  const recentJobs = await db.generationJob.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
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

  return (
    <>
      <Nav />
      <GenerateClient
        initialJobs={recentJobs.map((j) => ({
          id: j.id,
          type: j.type,
          provider: j.provider,
          prompt: j.prompt,
          status: j.status,
          progress: j.progress,
          creditsCharged: j.creditsCharged,
          createdAt: j.createdAt.toISOString(),
          asset: j.asset ? {
            id: j.asset.id,
            type: j.asset.type,
            storageUrl: j.asset.storageUrl ?? undefined,
            muxPlaybackId: j.asset.muxPlaybackId ?? undefined,
          } : undefined,
        }))}
        creditsBalance={user.creditsBalance}
      />
    </>
  );
}
