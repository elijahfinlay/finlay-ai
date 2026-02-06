import Mux from "@mux/mux-node";

let _mux: Mux;

export function isMuxConfigured(): boolean {
  return !!process.env.MUX_TOKEN_ID && !!process.env.MUX_TOKEN_SECRET;
}

function getMux() {
  if (!isMuxConfigured()) {
    throw new Error("Mux is not configured. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET.");
  }
  if (!_mux) {
    _mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });
  }
  return _mux;
}

export async function createAssetFromUrl(url: string): Promise<{
  assetId: string;
  playbackId?: string;
}> {
  const mux = getMux();
  const asset = await mux.video.assets.create({
    inputs: [{ url }],
    playback_policy: ["public"],
  });

  const playbackId = asset.playback_ids?.[0]?.id;

  return {
    assetId: asset.id,
    playbackId,
  };
}

export async function getAsset(assetId: string) {
  return getMux().video.assets.retrieve(assetId);
}

export async function deleteAsset(assetId: string) {
  return getMux().video.assets.delete(assetId);
}

export { getMux as mux };
