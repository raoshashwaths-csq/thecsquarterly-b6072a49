import { cn } from "@/lib/utils";

export function RhythmBars({
  values,
  labels,
  className,
}: {
  values: number[];
  labels?: string[];
  className?: string;
}) {
  const max = Math.max(1, ...values);
  return (
    <div className={cn("flex items-end gap-2 h-32", className)}>
      {values.map((v, i) => {
        const h = Math.round((v / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-muted/60 relative h-full flex items-end">
              <div
                className="w-full bg-accent transition-all duration-700 ease-out"
                style={{ height: `${h}%` }}
              />
            </div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {labels?.[i] ?? i + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}
