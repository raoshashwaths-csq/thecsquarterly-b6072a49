import { useMemo } from "react";
import type { CSAccount } from "@/lib/csfactors.functions";
import { cn } from "@/lib/utils";

/**
 * 5x5 Impact (ARR band) × Likelihood (inverse health) heatmap.
 * Cells render hairline borders, color saturation derived from severity score.
 * Quicksand dots inside each cell are sized by total ARR in that bucket.
 */

function impactBand(arr: number): 1 | 2 | 3 | 4 | 5 {
  if (arr >= 1_500_000) return 5;
  if (arr >= 1_000_000) return 4;
  if (arr >= 500_000) return 3;
  if (arr >= 250_000) return 2;
  return 1;
}
function likelihoodBand(health: number): 1 | 2 | 3 | 4 | 5 {
  // inverse: low health → high likelihood
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

  return (
    <section className="mb-10">
      <div className="eyebrow text-secondary-accent mb-3">Impact × Likelihood</div>
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="min-w-[520px]">
          <div className="flex">
            {/* Y-axis */}
            <div className="flex flex-col justify-between pr-3 py-1 text-right">
              {[5, 4, 3, 2, 1].map((n, idx) => (
                <div
                  key={n}
                  className="h-[44px] md:h-[52px] flex items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
                >
                  <span className="tabular-nums">{n}</span>
                  <span className="hidden md:inline">{IMPACT_LABELS[4 - idx]}</span>
                </div>
              ))}
            </div>
            {/* Grid */}
            <div className="flex-1 grid grid-cols-5 border border-border">
              {grid.map((row, ri) =>
                row.map((cell, ci) => {
                  // ri 0..4 (top=impact5), ci 0..4 (left=likelihood1)
                  const impact = 5 - ri;
                  const likelihood = ci + 1;
                  const severity = (impact + likelihood) / 2; // 1..5
                  const arrSum = cell.reduce((s, a) => s + Number(a.arr), 0);
                  const dotSize =
                    arrSum === 0
                      ? 0
                      : Math.min(28, 6 + Math.sqrt(arrSum / 50_000));
                  // tint via accent (gold→red blend approximated with destructive)
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
                  return (
                    <button
                      key={`${ri}-${ci}`}
                      type="button"
                      onClick={() => cell.length && onCellSelect?.(cell)}
                      disabled={!cell.length}
                      className={cn(
                        "h-[44px] md:h-[52px] border border-border/60 flex items-center justify-center transition-colors",
                        tint,
                        cell.length
                          ? "hover:outline hover:outline-1 hover:outline-accent cursor-pointer"
                          : "cursor-default",
                      )}
                      title={
                        cell.length
                          ? `${cell.length} account${cell.length === 1 ? "" : "s"} · $${Math.round(arrSum / 1000).toLocaleString()}K`
                          : "No accounts"
                      }
                    >
                      {dotSize > 0 ? (
                        <span
                          aria-hidden
                          className="rounded-full bg-accent shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_30%,transparent)]"
                          style={{ width: dotSize, height: dotSize }}
                        />
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
                className="flex-1 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
              >
                {n}
              </div>
            ))}
          </div>
          <div className="text-center font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mt-1">
            Likelihood
          </div>
        </div>
      </div>
    </section>
  );
}
