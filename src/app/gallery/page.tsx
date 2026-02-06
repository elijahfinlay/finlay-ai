import { redirect } from "next/navigation";
import { getUserFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { Nav } from "@/components/Nav";
import { GalleryClient } from "./GalleryClient";

export default async function GalleryPage() {
  const user = await getUserFromCookie();
  if (!user) redirect("/login");

  const assets = await db.generatedAsset.findMany({
    where: { userId: user.id, deleted: false },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      type: true,
      provider: true,
      prompt: true,
      storageUrl: true,
      muxPlaybackId: true,
      favorite: true,
      createdAt: true,
    },
  });

  const total = await db.generatedAsset.count({
    where: { userId: user.id, deleted: false },
  });

  return (
    <>
      <Nav />
      <GalleryClient
        initialAssets={assets.map((a) => ({
          ...a,
          storageUrl: a.storageUrl ?? undefined,
          muxPlaybackId: a.muxPlaybackId ?? undefined,
          createdAt: a.createdAt.toISOString(),
        }))}
        initialTotal={total}
      />
    </>
  );
}
