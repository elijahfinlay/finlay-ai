"use client";

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

interface AssetCardProps {
  asset: Asset;
  onFavorite: (id: string, favorite: boolean) => void;
  onDelete: (id: string) => void;
  onClick: (asset: Asset) => void;
}

export function AssetCard({ asset, onFavorite, onDelete, onClick }: AssetCardProps) {
  const isVideo = asset.type === "video";
  const hasVideoSource = isVideo && (asset.muxPlaybackId || asset.storageUrl);

  return (
    <div className="group relative rounded-xl border border-border bg-surface overflow-hidden transition-all hover:border-accent/30">
      <button onClick={() => onClick(asset)} className="block w-full text-left">
        {asset.type === "image" && asset.storageUrl && (
          <img src={asset.storageUrl} alt="" className="w-full aspect-square object-cover" />
        )}
        {isVideo && asset.muxPlaybackId && (
          <div className="w-full aspect-video bg-bg flex items-center justify-center">
            <img
              src={`https://image.mux.com/${asset.muxPlaybackId}/thumbnail.webp?time=1`}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-black/60 flex items-center justify-center">
                <svg className="h-5 w-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        )}
        {isVideo && !asset.muxPlaybackId && asset.storageUrl && (
          <div className="w-full aspect-video bg-bg flex items-center justify-center relative">
            <video
              src={asset.storageUrl}
              muted
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-black/60 flex items-center justify-center">
                <svg className="h-5 w-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        )}
        {isVideo && !hasVideoSource && (
          <div className="w-full aspect-video bg-bg flex items-center justify-center text-text-secondary text-xs">
            Video processing...
          </div>
        )}
      </button>

      <div className="p-3 space-y-1">
        <p className="text-xs text-text-primary line-clamp-2">{asset.prompt}</p>
        <p className="text-xs text-text-secondary">
          {asset.provider.replace("_", " ")}
        </p>
      </div>

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite(asset.id, !asset.favorite); }}
          className={`h-7 w-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${
            asset.favorite ? "bg-warning/20 text-warning" : "bg-black/40 text-white hover:bg-black/60"
          }`}
        >
          <svg className="h-3.5 w-3.5" fill={asset.favorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(asset.id); }}
          className="h-7 w-7 rounded-full bg-black/40 text-white hover:bg-error/80 flex items-center justify-center backdrop-blur-sm transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}
