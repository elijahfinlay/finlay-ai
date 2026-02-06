"use client";

interface Provider {
  id: string;
  name: string;
  description: string;
}

interface ProviderPickerProps {
  value: string;
  onChange: (value: string) => void;
  providers: Provider[];
}

export function ProviderPicker({ value, onChange, providers }: ProviderPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-secondary">Model</label>
      <div className="grid grid-cols-2 gap-2">
        {providers.map((provider) => {
          const isSelected = value === provider.id;
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => onChange(provider.id)}
              className={`rounded-lg border p-3 text-left transition-all ${
                isSelected
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:border-accent/30"
              }`}
            >
              <div className={`text-sm font-medium ${isSelected ? "text-accent" : "text-text-primary"}`}>
                {provider.name}
              </div>
              <div className="text-xs text-text-secondary mt-0.5">{provider.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
