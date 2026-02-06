"use client";

import { useState, useCallback } from "react";
import { AssetGrid } from "@/components/Gallery/AssetGrid";
import { ImageViewer } from "@/components/Gallery/ImageViewer";
import { VideoPlayer } from "@/components/Gallery/VideoPlayer";

interface Asset {
  id: string;
  type: string;
  provider: string;
  prompt: string;
  storageUrl?: string;
  muxPlaybackId?: string;
  favorite: boolean;
  createdAt: string;
}

export function GalleryClient({
  initialAssets,
  initialTotal,
}: {
  initialAssets: Asset[];
  initialTotal: number;
}) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [total] = useState(initialTotal);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const filtered = assets.filter((a) => {
    if (filter !== "all" && a.type !== filter) return false;
    if (favoritesOnly && !a.favorite) return false;
    return true;
  });

  const handleFavorite = useCallback(async (id: string, favorite: boolean) => {
    try {
      await fetch(`/api/assets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite }),
      });
      setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, favorite } : a)));
    } catch { /* ignore */ }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/assets/${id}`, { method: "DELETE" });
      setAssets((prev) => prev.filter((a) => a.id !== id));
      if (selectedAsset?.id === id) setSelectedAsset(null);
    } catch { /* ignore */ }
  }, [selectedAsset]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Gallery</h1>
          <p className="text-sm text-text-secondary">{total} total assets</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              favoritesOnly
                ? "border-warning bg-warning/10 text-warning"
                : "border-border text-text-secondary hover:border-accent/30"
            }`}
          >
            Favorites
          </button>
          <div className="flex gap-1 rounded-lg bg-surface border border-border p-1">
            {(["all", "image", "video"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition-all ${
                  filter === f
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {f === "all" ? "All" : f + "s"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AssetGrid
        assets={filtered}
        onFavorite={handleFavorite}
        onDelete={handleDelete}
        onSelect={setSelectedAsset}
      />

      {/* Viewer modal */}
      {selectedAsset && selectedAsset.type === "image" && selectedAsset.storageUrl && (
        <ImageViewer
          url={selectedAsset.storageUrl}
          prompt={selectedAsset.prompt}
          onClose={() => setSelectedAsset(null)}
        />
      )}

      {selectedAsset && selectedAsset.type === "video" && (selectedAsset.muxPlaybackId || selectedAsset.storageUrl) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSelectedAsset(null)}>
          <div className="w-full max-w-3xl p-4" onClick={(e) => e.stopPropagation()}>
            <VideoPlayer
              playbackId={selectedAsset.muxPlaybackId}
              src={selectedAsset.storageUrl}
              title={selectedAsset.prompt}
            />
            <p className="text-sm text-text-secondary mt-3 text-center">{selectedAsset.prompt}</p>
          </div>
        </div>
      )}
    </main>
  );
}
