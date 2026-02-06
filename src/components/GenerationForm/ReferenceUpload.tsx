"use client";

import { useCallback, useState } from "react";

interface ReferenceImage {
  path: string;
  url: string;
}

interface ReferenceUploadProps {
  images: ReferenceImage[];
  onChange: (images: ReferenceImage[]) => void;
  maxImages?: number;
}

export function ReferenceUpload({ images, onChange, maxImages = 3 }: ReferenceUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (files: FileList) => {
      if (images.length >= maxImages) return;

      setUploading(true);
      const newImages = [...images];

      for (const file of Array.from(files)) {
        if (newImages.length >= maxImages) break;
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 10 * 1024 * 1024) continue;

        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/upload/reference", { method: "POST", body: formData });
          if (res.ok) {
            const data = await res.json();
            newImages.push({ path: data.path, url: data.url });
          }
        } catch {
          // silently skip failed uploads
        }
      }

      onChange(newImages);
      setUploading(false);
    },
    [images, maxImages, onChange]
  );

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-secondary">
        Reference Images <span className="text-text-secondary/50">({images.length}/{maxImages})</span>
      </label>
      <div className="flex gap-2 flex-wrap">
        {images.map((img, i) => (
          <div key={img.path} className="relative group">
            <img
              src={img.url}
              alt={`Reference ${i + 1}`}
              className="h-20 w-20 rounded-lg object-cover border border-border"
            />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-error text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              x
            </button>
          </div>
        ))}
        {images.length < maxImages && (
          <label
            className={`flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border text-text-secondary hover:border-accent/50 hover:text-accent transition-colors ${
              uploading ? "opacity-50 pointer-events-none" : ""
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleUpload(e.dataTransfer.files);
            }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
            {uploading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
          </label>
        )}
      </div>
    </div>
  );
}
