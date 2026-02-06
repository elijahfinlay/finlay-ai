"use client";

interface ImageViewerProps {
  url: string;
  prompt: string;
  onClose: () => void;
}

export function ImageViewer({ url, prompt, onClose }: ImageViewerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <img src={url} alt={prompt} className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain" />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="absolute bottom-0 left-0 right-0 rounded-b-xl bg-gradient-to-t from-black/60 p-4">
          <p className="text-sm text-white">{prompt}</p>
        </div>
      </div>
    </div>
  );
}
