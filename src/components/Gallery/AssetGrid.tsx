"use client";

import { AssetCard } from "./AssetCard";

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

interface AssetGridProps {
  assets: Asset[];
  onFavorite: (id: string, favorite: boolean) => void;
  onDelete: (id: string) => void;
  onSelect: (asset: Asset) => void;
}

export function AssetGrid({ assets, onFavorite, onDelete, onSelect }: AssetGridProps) {
  if (assets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-16 text-center">
        <svg className="mx-auto h-12 w-12 text-text-secondary/30 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
        </svg>
        <p className="text-sm text-text-secondary">No assets yet</p>
        <p className="text-xs text-text-secondary/60 mt-1">Generated images and videos will appear here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onFavorite={onFavorite}
          onDelete={onDelete}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}
