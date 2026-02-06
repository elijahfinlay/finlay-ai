import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "all";
  const sort = searchParams.get("sort") || "newest";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const favoriteOnly = searchParams.get("favorite") === "true";

  const where: Record<string, unknown> = {
    userId: user.id,
    deleted: false,
  };

  if (type !== "all") {
    where.type = type;
  }

  if (favoriteOnly) {
    where.favorite = true;
  }

  const [assets, total] = await Promise.all([
    db.generatedAsset.findMany({
      where,
      orderBy: { createdAt: sort === "newest" ? "desc" : "asc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        provider: true,
        prompt: true,
        storageUrl: true,
        muxPlaybackId: true,
        title: true,
        favorite: true,
        width: true,
        height: true,
        durationSeconds: true,
        createdAt: true,
      },
    }),
    db.generatedAsset.count({ where }),
  ]);

  return NextResponse.json({ assets, total });
}
