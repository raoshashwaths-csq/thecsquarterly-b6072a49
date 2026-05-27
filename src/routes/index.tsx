import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterInline } from "@/components/site/NewsletterInline";
import { OperatorTools } from "@/components/site/OperatorTools";
import { usePersona } from "@/hooks/usePersona";

import { listPosts } from "@/lib/posts.functions";



const postsQuery = queryOptions({
  queryKey: ["posts"],
  queryFn: () => listPosts(),
});

const SECTIONS = [
  { to: "/vanguard", name: "The CS Vanguard", blurb: "Proactive plays for fruitful engagement." },
  { to: "/retention-protocol", name: "The Retention Protocol", blurb: "Identify churn early. Reverse it systematically." },
  { to: "/outcome-forum", name: "The Outcome Forum", blurb: "Validated case studies, with the receipts." },
  { to: "/codex", name: "The CS Codex", blurb: "The reference library for serious operators." },
  { to: "/ai-readiness", name: "The Diagnostics", blurb: "Benchmark your team. 11 dimensions, 44 metrics." },
] as const;


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The CS Quarterly, The architecture of retention" },
      {
        name: "description",
        content:
          "A weekly dispatch for the 1% of Customer Success operators. Curated insights on stakeholder management, escalation, negotiation, and AI deployment.",
      },
      { property: "og:title", content: "The CS Quarterly" },
      {
        property: "og:description",
        content: "A weekly dispatch for Customer Success leaders and managers.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  component: HomePage,
});


function HomePage() {
  const { data: posts } = useSuspenseQuery(postsQuery);
  const featured = posts[0];
  const rest = posts.slice(1, 5);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <header className="max-w-7xl w-full mx-auto px-6 pt-24 pb-12 text-center animate-fade-up">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-6 font-semibold">
          Weekly Dispatch for the 1% of Operators
        </div>
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl mb-8 text-balance leading-[0.95] tracking-tight">
          Stop managing accounts. <span className="italic text-accent">Start engineering trajectory.</span>
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-foreground/75 text-pretty mb-10">
          Passives service contracts; leaders architect growth. This weekly playbook brings the elite tier the exact psychology, strategy, and frameworks needed to build legendary enterprise partnerships.
        </p>
        <NewsletterInline source="home-hero" />
      </header>

      <div className="h-px bg-border max-w-7xl w-full mx-auto mt-16 animate-reveal-line" />


      {/* Sections strip */}
      <section className="max-w-7xl w-full mx-auto px-6 py-16 animate-fade-up [animation-delay:300ms]">
        <div className="flex items-end justify-between mb-10">
          <div className="font-mono text-[11px] uppercase tracking-widest text-foreground font-semibold">
            The Sections
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {SECTIONS.length} disciplines
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {SECTIONS.map((s, i) => (
            <Link
              key={s.to}
              to={s.to}
              className="group relative block border border-border bg-card/60 hover:bg-card hover:border-foreground transition-colors p-6 pt-7"
            >
              <span aria-hidden className="absolute top-0 left-6 right-6 h-px bg-foreground/80" />
              <div className="font-mono text-[11px] text-secondary-accent font-semibold mb-3">0{i + 1} / 0{SECTIONS.length}</div>
              <h2 className="font-display text-xl md:text-2xl mb-2 leading-tight">{s.name}</h2>
              <p className="text-sm text-foreground/65 text-pretty mb-4">{s.blurb}</p>
              <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/60 group-hover:text-accent transition-colors">
                Enter section →
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="h-px bg-border max-w-7xl w-full mx-auto" />


      {/* Featured + Sidebar */}
      {featured && (
        <main className="max-w-7xl w-full mx-auto px-6 py-20 animate-fade-up [animation-delay:400ms]">
          <div className="grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-7">
              <div className="mb-8 font-mono text-[11px] text-accent font-medium">
                Insight #{posts.length.toString().padStart(3, "0")}, {featured.read_minutes} min read
              </div>
              <Link to="/insights/$slug" params={{ slug: featured.slug }} className="block group">
                <h2 className="font-display text-4xl md:text-6xl mb-8 leading-[1.1] tracking-tight transition-all">
                  {featured.title}
                </h2>
              </Link>
              <p className="text-xl leading-relaxed text-foreground/80 mb-10 text-pretty">
                {featured.excerpt}
              </p>
              {featured.subtitle && (
                <div className="border-y border-border py-8 mb-12">
                  <p className="font-display italic text-2xl md:text-3xl leading-snug text-pretty">
                    {featured.subtitle}
                  </p>
                </div>
              )}


              <Link
                to="/insights/$slug"
                params={{ slug: featured.slug }}
                className="font-mono text-[11px] uppercase tracking-widest border-b border-foreground pb-1 hover:text-accent hover:border-accent"
              >
                Read the full essay
              </Link>
            </div>

            <aside className="lg:col-span-5 flex flex-col gap-12 lg:border-l lg:border-border lg:pl-12">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                  The Thesis
                </div>
                <p className="text-lg italic leading-snug">
                  "CS is no longer a service department; it is a revenue engine that requires the same mechanical precision as an assembly line."
                </p>
              </div>

              {/* AI Survey Promo */}
              <div className="bg-foreground text-background p-10">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-6 opacity-60">
                  Tooling & Diagnostics
                </div>
                <h3 className="font-display text-3xl mb-6">The 2026 AI Readiness Audit</h3>
                <p className="text-sm leading-relaxed opacity-80 mb-8">
                  Is your CS organization prepared for automated orchestration? Take our 5-minute diagnostic to benchmark your team against industry leaders.
                </p>
                <Link
                  to="/ai-readiness"
                  className="inline-block w-full text-center py-4 border border-background/30 hover:bg-background hover:text-foreground transition-all font-mono text-[11px] uppercase tracking-widest"
                >
                  Start Survey
                </Link>
              </div>
            </aside>
          </div>
        </main>
      )}

      {/* Recent grid */}
      {rest.length > 0 && (
        <section className="max-w-7xl w-full mx-auto px-6 pb-24">
          <div className="flex justify-between items-end mb-12">
            <h2 className="font-display text-4xl">Recent Dispatches</h2>
            <Link
              to="/insights"
              className="font-mono text-[11px] uppercase tracking-widest border-b border-foreground pb-1 hover:text-accent hover:border-accent"
            >
              View all
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
            {rest.map((p) => (
              <Link
                key={p.id}
                to="/insights/$slug"
                params={{ slug: p.slug }}
                className="group block border-t border-border pt-6"
              >
                <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                  <span>{p.category}</span>
                  <span>{p.read_minutes} min</span>
                </div>
                <h3 className="font-display text-2xl md:text-3xl mb-3 leading-tight transition-all">
                  {p.title}
                </h3>
                <p className="text-foreground/70 text-pretty">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      

      <SiteFooter />
    </div>
  );
}
