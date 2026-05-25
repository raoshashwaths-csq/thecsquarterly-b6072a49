import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listSeriesParts } from "@/lib/posts.functions";

type SeriesPart = {
  slug: string;
  title: string;
  series_part: number | null;
  series_total: number | null;
  series_title: string | null;
  published: boolean;
  published_at: string;
  tier: string;
  is_premium: boolean;
};

const roman = (n: number) =>
  ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][n - 1] ?? String(n);

export function SeriesRail({
  seriesSlug,
  seriesTitle,
  currentSlug,
}: {
  seriesSlug: string;
  seriesTitle: string;
  currentSlug: string;
}) {
  const { data: parts } = useQuery({
    queryKey: ["series", seriesSlug],
    queryFn: () => listSeriesParts({ data: { series_slug: seriesSlug } }),
    staleTime: 5 * 60 * 1000,
  });

  const now = Date.now();
  const items = (parts ?? []) as SeriesPart[];

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-3">
        The series
      </div>
      <div className="font-display text-xl leading-tight mb-6 text-balance">
        {seriesTitle}
      </div>
      <ol className="space-y-1 border-t border-border">
        {items.map((p) => {
          const released = p.published && new Date(p.published_at).getTime() <= now;
          const isCurrent = p.slug === currentSlug;
          const num = roman(p.series_part ?? 0);

          const inner = (
            <div
              className={[
                "flex items-start gap-3 py-3 border-b border-border transition-colors",
                isCurrent ? "text-foreground" : released ? "text-foreground/80 hover:text-accent" : "text-muted-foreground/60",
              ].join(" ")}
            >
              <span className="font-mono text-[10px] uppercase tracking-widest pt-1 w-8 shrink-0 text-secondary-accent">
                {num}
              </span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm leading-snug ${isCurrent ? "font-semibold" : ""}`}>
                  {p.title}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-widest mt-1 text-muted-foreground">
                  {released ? (
                    isCurrent ? "Reading now" : "Available"
                  ) : (
                    <span className="flex items-center gap-1">
                      <Lock size={9} />
                      {new Date(p.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );

          if (!released || isCurrent) {
            return <li key={p.slug}>{inner}</li>;
          }
          return (
            <li key={p.slug}>
              <Link to="/insights/$slug" params={{ slug: p.slug }} className="block">
                {inner}
              </Link>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
