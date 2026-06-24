import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getForYou } from "@/lib/discovery.functions";
import { withGlossary } from "@/components/site/Glossary";

export function ForYou() {
  const { user } = useAuth();
  const fetchForYou = useServerFn(getForYou);
  const { data, isLoading } = useQuery({
    queryKey: ["for-you", user?.id ?? "anon"],
    queryFn: () => fetchForYou({ data: { band: null } }),
    staleTime: 5 * 60_000,
  });

  const picks = data?.picks ?? [];
  const band = data?.band ?? null;

  return (
    <section className="border-t border-border py-16">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2 flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              {user ? "For you" : "Editor's selection"}
            </div>
            <h2 className="font-display text-4xl md:text-5xl tracking-tight">
              {band
                ? withGlossary(`Curated for your ${band} diagnostic.`)
                : user
                  ? "Where we'd start, given what we know."
                  : "Where most operators start."}
            </h2>
          </div>
          {!user && (
            <Link
              to="/diagnostics"
              className="hidden md:inline-block font-mono text-xs uppercase tracking-[0.25em] border border-border px-3 py-2 hover:bg-muted/40 transition-colors"
            >
              Take the diagnostic →
            </Link>
          )}
        </div>

        {isLoading && picks.length === 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-background h-48 animate-pulse" />
            ))}
          </div>
        ) : picks.length === 0 ? (
          <p className="text-muted-foreground">Nothing to recommend just yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {picks.map((p) => (
              <Link
                key={p.id}
                to={p.href}
                className="group bg-background p-6 flex flex-col gap-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-accent">
                  <FileText className="h-3 w-3" />
                  <span className="truncate">{p.category}</span>
                  {p.isPremium && (
                    <span className="ml-auto text-secondary-accent">Vanguard</span>
                  )}
                </div>
                <h3 className="font-display text-xl leading-tight group-hover:underline decoration-1 underline-offset-4">
                  {p.title}
                </h3>
                {p.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{withGlossary(p.excerpt)}</p>
                )}
                <div className="mt-auto font-mono uppercase tracking-widest text-xs text-muted-foreground">
                  {p.readMinutes} min read
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
