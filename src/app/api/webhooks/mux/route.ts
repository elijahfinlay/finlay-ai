import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body;

    // Verify webhook signature in production
    // For now, just check the event type
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
