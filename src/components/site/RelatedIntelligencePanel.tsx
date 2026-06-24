import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRelatedIntelligence } from "@/lib/posts.functions";
import { trackLumiEvent } from "@/lib/lumi-analytics";

type Props = { slug: string };

export function RelatedIntelligencePanel({ slug }: Props) {
  const fetcher = useServerFn(getRelatedIntelligence);
  const { data } = useQuery({
    queryKey: ["related-intelligence", slug],
    queryFn: () => fetcher({ data: { slug } }),
    staleTime: 5 * 60 * 1000,
  });

  if (!data) return null;
  const { playbook, tree, foundational } = data;
  if (!playbook && !tree && !foundational) return null;

  const onClick = (kind: "playbook" | "tree" | "foundational", targetSlug: string) =>
    trackLumiEvent("article.related.click", {
      surface: "insights",
      meta: { slug, kind, targetSlug },
    });

  return (
    <section className="mt-20 pt-10 border-t border-border">
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-6">
        Related intelligence
      </div>
      <ul className="divide-y divide-border border border-border bg-card widget-lift">
        {playbook && (
          <li>
            <Link
              to="/codex/$slug"
              params={{ slug: playbook.slug }}
              onClick={() => onClick("playbook", playbook.slug)}
              className="group flex items-start justify-between gap-6 px-5 py-4 transition-transform hover:-translate-y-px"
            >
              <RowBody eyebrow="PLAYBOOK" title={playbook.title} />
              <Arrow />
            </Link>
          </li>
        )}
        {tree && (
          <li>
            <Link
              to="/agent/framework"
              search={{ tree: tree.id } as never}
              onClick={() => onClick("tree", tree.id)}
              className="group flex items-start justify-between gap-6 px-5 py-4 transition-transform hover:-translate-y-px"
            >
              <RowBody eyebrow={`LUMI TREE · ${tree.id}`} title={`Run on canvas — ${tree.title}`} />
              <Arrow />
            </Link>
          </li>
        )}
        {foundational && (
          <li>
            <Link
              to="/insights/$slug"
              params={{ slug: foundational.slug }}
              onClick={() => onClick("foundational", foundational.slug)}
              className="group flex items-start justify-between gap-6 px-5 py-4 transition-transform hover:-translate-y-px"
            >
              <RowBody eyebrow="FOUNDATIONAL" title={foundational.title} />
              <Arrow />
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}

function RowBody({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-1">
        {eyebrow}
      </div>
      <div className="font-display text-lg leading-snug text-foreground group-hover:underline underline-offset-4 decoration-accent/60">
        {title}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <span aria-hidden className="font-mono text-xs text-muted-foreground mt-2 shrink-0">
      →
    </span>
  );
}

