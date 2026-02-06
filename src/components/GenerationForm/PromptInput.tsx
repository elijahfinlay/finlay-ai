"use client";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export function PromptInput({
  value,
  onChange,
  placeholder = "Describe what you want to create...",
  maxLength = 2000,
}: PromptInputProps) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
        className="w-full resize-none rounded-xl bg-surface border border-border p-4 text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
      />
      <span className="absolute bottom-3 right-3 text-xs text-text-secondary">
        {value.length}/{maxLength}
      </span>
    </div>
  );
}
