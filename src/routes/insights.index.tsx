import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { listPosts } from "@/lib/posts.functions";

const postsQuery = queryOptions({
  queryKey: ["posts"],
  queryFn: () => listPosts(),
});

export const Route = createFileRoute("/insights/")({
  head: () => ({
    meta: [
      { title: "Insights, The CS Quarterly" },
      {
        name: "description",
        content:
          "Essays, playbooks, and dispatches on Customer Success leadership: stakeholder management, escalation, negotiation, sales qualification, AI deployment.",
      },
      { property: "og:title", content: "Insights, The CS Quarterly" },
      { property: "og:description", content: "Essays and playbooks on CS leadership." },
      { property: "og:url", content: "/insights" },
    ],
    links: [{ rel: "canonical", href: "/insights" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  component: InsightsPage,
});

function InsightsPage() {
  const { data: posts } = useSuspenseQuery(postsQuery);
  const categories = ["All", ...Array.from(new Set(posts.map((p) => p.category)))];
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? posts : posts.filter((p) => p.category === active);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <header className="max-w-7xl w-full mx-auto px-6 pt-24 pb-12 animate-fade-up">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-6 font-medium">
          The Archive
        </div>
        <h1 className="font-display text-6xl md:text-8xl leading-[0.95] tracking-tight text-balance max-w-4xl">
          Essays for the <span className="italic">post-sales</span> operator.
        </h1>
      </header>

      <section className="max-w-7xl w-full mx-auto px-6 py-8 flex flex-wrap gap-3 border-y border-border">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`font-mono text-xs uppercase tracking-widest px-4 py-2 border transition-colors ${
              active === c
                ? "bg-foreground text-background border-foreground"
                : "border-border hover:border-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </section>

      <main className="max-w-7xl w-full mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-16">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to="/insights/$slug"
              params={{ slug: p.slug }}
              className="group block border-t border-border pt-6"
            >
              <div className="flex justify-between font-mono uppercase tracking-widest text-xs text-muted-foreground mb-4">
                <span className="text-accent">{p.category}</span>
                <span>{p.read_minutes} min</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl mb-3 leading-tight transition-all">
                {p.title}
              </h2>
              <p className="text-foreground/70 text-pretty">{p.excerpt}</p>
              <div className="mt-4 font-mono uppercase tracking-widest text-xs text-muted-foreground">
                By {p.author}
              </div>
            </Link>

          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
