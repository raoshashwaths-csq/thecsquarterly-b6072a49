import { useMemo, useState } from "react";
import type { CSAccount } from "@/lib/csfactors.functions";
import { cn } from "@/lib/utils";

/**
 * 5x5 Impact (ARR band) × Likelihood (inverse health) heatmap.
 */

function impactBand(arr: number): 1 | 2 | 3 | 4 | 5 {
  if (arr >= 1_500_000) return 5;
  if (arr >= 1_000_000) return 4;
  if (arr >= 500_000) return 3;
  if (arr >= 250_000) return 2;
  return 1;
}
function likelihoodBand(health: number): 1 | 2 | 3 | 4 | 5 {
  if (health < 30) return 5;
  if (health < 50) return 4;
  if (health < 65) return 3;
  if (health < 80) return 2;
  return 1;
}

const IMPACT_LABELS = ["Very low", "Low", "Medium", "High", "Very high"];

export function RiskHeatmap({
  accounts,
  onCellSelect,
}: {
  accounts: CSAccount[];
  onCellSelect?: (accounts: CSAccount[]) => void;
}) {
  const grid = useMemo(() => {
    const g: CSAccount[][][] = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => []),
    );
    for (const a of accounts) {
      const i = impactBand(Number(a.arr));
      const l = likelihoodBand(Number(a.health));
      g[5 - i][l - 1].push(a);
    }
    return g;
  }, [accounts]);

  const [hover, setHover] = useState<{ ri: number; ci: number } | null>(null);

  return (
    <section className="mb-10">
      <div className="eyebrow text-secondary-accent mb-3">Impact × Likelihood</div>
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="min-w-[520px] relative">
          <div className="flex">
            {/* Y-axis */}
            <div className="flex flex-col justify-between pr-3 py-1 text-right">
              {[5, 4, 3, 2, 1].map((n, idx) => (
                <div
                  key={n}
                  className="h-[44px] md:h-[52px] flex items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground"
                >
                  <span className="tabular-nums">{n}</span>
                  <span className="hidden md:inline">{IMPACT_LABELS[4 - idx]}</span>
                </div>
              ))}
            </div>
            {/* Grid */}
            <div className="flex-1 grid grid-cols-5 border border-border relative">
              {grid.map((row, ri) =>
                row.map((cell, ci) => {
                  const impact = 5 - ri;
                  const likelihood = ci + 1;
                  const severity = (impact + likelihood) / 2;
                  const arrSum = cell.reduce((s, a) => s + Number(a.arr), 0);
                  const dotSize =
                    arrSum === 0 ? 0 : Math.min(28, 6 + Math.sqrt(arrSum / 50_000));
                  const tint =
                    severity >= 4.5
                      ? "bg-destructive/55"
                      : severity >= 3.5
                        ? "bg-destructive/35"
                        : severity >= 2.5
                          ? "bg-accent/45"
                          : severity >= 1.5
                            ? "bg-accent/25"
                            : "bg-accent/10";
                  const isHover = hover?.ri === ri && hover?.ci === ci;
                  return (
                    <button
                      key={`${ri}-${ci}`}
                      type="button"
                      onClick={() => cell.length && onCellSelect?.(cell)}
                      onMouseEnter={() => setHover({ ri, ci })}
                      onMouseLeave={() => setHover((h) => (h?.ri === ri && h?.ci === ci ? null : h))}
                      disabled={!cell.length}
                      className={cn(
                        "relative h-[44px] md:h-[52px] border border-border/60 flex items-center justify-center transition-colors",
                        tint,
                        cell.length
                          ? "cursor-pointer"
                          : "cursor-default",
                        isHover && cell.length && "outline outline-1 outline-accent z-10",
                      )}
                      aria-label={
                        cell.length
                          ? `Impact ${impact}, Likelihood ${likelihood}, ${cell.length} accounts`
                          : "Empty cell"
                      }
                    >
                      {dotSize > 0 ? (
                        <span
                          aria-hidden
                          className="rounded-full bg-accent shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_30%,transparent)]"
                          style={{ width: dotSize, height: dotSize }}
                        />
                      ) : null}
                      {isHover && cell.length ? (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 bg-popover border border-accent px-3 py-2 shadow-lg whitespace-nowrap pointer-events-none">
                          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent mb-1">
                            I{impact} · L{likelihood}
                          </div>
                          <div className="font-display text-xs leading-tight text-foreground">
                            {cell.slice(0, 2).map((a) => a.name).join(", ")}
                            {cell.length > 2 ? ` +${cell.length - 2}` : ""}
                          </div>
                        </div>
                      ) : null}
                    </button>
                  );
                }),
              )}
            </div>
          </div>
          {/* X-axis */}
          <div className="flex pl-[calc(2.25rem+1ch)] mt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="flex-1 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground"
              >
                {n}
              </div>
            ))}
          </div>
          <div className="text-center font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mt-1">
            Likelihood
          </div>
        </div>
      </div>
    </section>
  );
}
