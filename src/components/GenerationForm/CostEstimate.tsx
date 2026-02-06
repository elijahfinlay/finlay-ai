export function CostEstimate({
  credits,
  breakdown,
}: {
  credits: number;
  breakdown: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-accent/5 border border-accent/20 px-4 py-2.5">
      <span className="text-sm text-text-secondary">{breakdown}</span>
      <span className="text-sm font-semibold text-accent">{credits} credits</span>
    </div>
  );
}
