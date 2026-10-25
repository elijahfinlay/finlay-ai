import { NextRequest, NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.MUX_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const rawBody = await request.text();
    try {
      new Mux({ webhookSecret: secret }).webhooks.verifySignature(rawBody, request.headers, secret);
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    const event = JSON.parse(rawBody);

    if (event.type === "video.asset.ready") {
      const assetId = event.data?.id || event.object?.id;
      const playbackIds = event.data?.playback_ids || event.object?.playback_ids;
      const playbackId = playbackIds?.[0]?.id;

      if (assetId && playbackId) {
        await db.generatedAsset.updateMany({
          where: { muxAssetId: assetId },
          data: { muxPlaybackId: playbackId },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mux webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
