"use client";

interface AspectRatioPickerProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

const ratioVisuals: Record<string, { w: number; h: number }> = {
  "1:1": { w: 28, h: 28 },
  "3:4": { w: 21, h: 28 },
  "4:3": { w: 28, h: 21 },
  "9:16": { w: 18, h: 32 },
  "16:9": { w: 32, h: 18 },
};

export function AspectRatioPicker({ value, onChange, options }: AspectRatioPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-secondary">Aspect Ratio</label>
      <div className="flex gap-2">
        {options.map((ratio) => {
          const visual = ratioVisuals[ratio] || { w: 24, h: 24 };
          const isSelected = value === ratio;
          return (
            <button
              key={ratio}
              type="button"
              onClick={() => onChange(ratio)}
              className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${
                isSelected
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-text-secondary hover:border-accent/30"
              }`}
            >
              <div
                className={`rounded-sm ${isSelected ? "bg-accent/30" : "bg-border"}`}
                style={{ width: visual.w, height: visual.h }}
              />
              <span className="text-xs font-medium">{ratio}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
