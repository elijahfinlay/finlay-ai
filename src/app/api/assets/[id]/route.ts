import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const asset = await db.generatedAsset.findFirst({
    where: { id, userId: user.id, deleted: false },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return NextResponse.json({ asset });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const asset = await db.generatedAsset.findFirst({
    where: { id, userId: user.id },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof body.favorite === "boolean") updateData.favorite = body.favorite;
  if (typeof body.title === "string") updateData.title = body.title;

  const updated = await db.generatedAsset.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ asset: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const asset = await db.generatedAsset.findFirst({
    where: { id, userId: user.id },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  await db.generatedAsset.update({
    where: { id },
    data: { deleted: true },
  });

  return NextResponse.json({ success: true });
}
