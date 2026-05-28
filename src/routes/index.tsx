import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterInline } from "@/components/site/NewsletterInline";
import { OperatorTools } from "@/components/site/OperatorTools";
import { QHint } from "@/components/site/QHint";
import { usePersona } from "@/hooks/usePersona";
import { useAuth } from "@/hooks/useAuth";

import { listPosts } from "@/lib/posts.functions";



const postsQuery = queryOptions({
  queryKey: ["posts"],
  queryFn: () => listPosts(),
});

const SECTIONS = [
  { to: "/vanguard", name: "The CS Vanguard", blurb: "Proactive plays for fruitful engagement.", hint: "Q: open when you want this week's signal on what other CS orgs are doing." },
  { to: "/retention-protocol", name: "The Retention Protocol", blurb: "Identify churn early. Reverse it systematically.", hint: "Q: pick one playbook per quarter and run it end-to-end across the book." },
  { to: "/outcome-forum", name: "The Outcome Forum", blurb: "Validated case studies, with the receipts.", hint: "Q: bring receipts here when you need numbers for a board or stakeholder argument." },
  { to: "/codex", name: "The CS Codex", blurb: "The reference library for serious operators.", hint: "Q: use it like a dictionary — jump in, grab the framework, leave." },
  { to: "/ai-readiness", name: "The Diagnostics", blurb: "Benchmark your team. 11 dimensions, 44 metrics.", hint: "Q: the single transition that unlocks your next band is the one to fund first." },
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
  const { group, isRecruiterOrLead } = usePersona();
  const { user } = useAuth();


  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <header className="max-w-7xl w-full mx-auto px-6 pt-24 pb-12 text-center md:animate-fade-up">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-6 font-semibold">
          Weekly Dispatch for the 1% of Customer Success Operators
        </div>
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl mb-8 text-balance leading-[0.95] tracking-tight">
          Stop managing accounts. <span className="italic text-accent">Start engineering trajectory.</span>
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-foreground/75 text-pretty mb-10">
          Passives service contracts; leaders architect growth. This weekly playbook brings the elite tier the exact psychology, strategy, and frameworks needed to build legendary enterprise partnerships.
        </p>
        {!user ? (
          <NewsletterInline source="home-hero" />
        ) : (
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Welcome back —{" "}
            <Link to="/account" className="text-accent border-b border-accent/40 hover:border-accent pb-0.5">
              open your account →
            </Link>
          </p>
        )}

        {/* AI Readiness Audit — primary value-prop card for first-time visitors */}
        <div className="mt-12 flex justify-center">
          <Link
            to="/ai-readiness"
            data-tour="ai-readiness-box"
            className="group relative w-full max-w-2xl bg-card border border-border hover:border-secondary-accent border-l-4 border-l-secondary-accent transition-colors p-6 md:p-7 text-left flex flex-col md:flex-row md:items-center gap-5"
            aria-label="Take the AI Readiness Audit"
          >
            <span
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center bg-secondary-accent text-background rounded-sm font-mono text-base font-bold tracking-tight shadow-sm group-hover:scale-105 transition-transform"
            >
              AR
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-secondary-accent font-semibold mb-1">
                AI Readiness · Diagnostic
              </div>
              <div className="font-display text-xl md:text-2xl leading-tight mb-1">
                Benchmark your CS org in 5 minutes
              </div>
              <p className="text-sm text-foreground/70 leading-snug mb-2">
                11 dimensions, 44 metrics. See where you sit between Reactive, Operational and Predictive — and what to fix first.
              </p>
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
                Take the free diagnostic →
              </div>
              <QHint>
                Q: the 5-min audit pinpoints your weakest of 11 dimensions and names the single fix that moves your band.
              </QHint>
            </div>
          </Link>
        </div>

        {/* Elevated CSF Command Centre card */}
        <div className="mt-4 flex justify-center">
          <Link
            to="/csfactors"
            data-tour="csf-box"
            className="group relative w-full max-w-2xl bg-card border border-border hover:border-accent border-l-4 border-l-accent transition-colors p-6 md:p-7 text-left flex flex-col md:flex-row md:items-center gap-5"
            aria-label="Open CSFactors Command Centre"
          >
            <span
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center bg-accent text-accent-foreground rounded-sm font-mono text-base font-bold tracking-tight shadow-sm group-hover:scale-105 transition-transform"
            >
              CSF
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-secondary-accent font-semibold mb-1">
                CSF · Command Centre
              </div>
              <div className="font-display text-xl md:text-2xl leading-tight mb-1">
                Your personal CS dashboard
              </div>
              <p className="text-sm text-foreground/70 leading-snug mb-2">
                Portfolio analytics, health, renewals and opportunities — in one operator-grade console.
              </p>
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
                Unlock at Operator tier →
              </div>
              <QHint>
                Q: your daily operator console — start here every morning to triage the burning three.
              </QHint>
            </div>
          </Link>
        </div>

        {/* Workspace anchor — placed directly below the CSF card */}
        <div className="mt-4 flex justify-center">
          <Link
            to="/account/workspace"
            data-tour="workspace-icon"
            className="group w-full max-w-2xl inline-flex items-center gap-4 bg-card border border-border hover:border-accent transition-colors p-4 md:p-5 text-left"
            aria-label="Open your Workspace"
          >
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center bg-foreground text-background rounded-sm group-hover:scale-105 transition-transform"
            >
              <LayoutGrid size={18} strokeWidth={2.5} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground leading-tight mb-1">
                Your Workspace
              </span>
              <span className="block font-display text-base md:text-lg leading-tight">
                Notes · Highlights · Links →
              </span>
            </span>
          </Link>
        </div>
      </header>


      <div className="h-px bg-border max-w-7xl w-full mx-auto mt-16 animate-reveal-line" />


      {/* Sections strip */}
      <section className="max-w-7xl w-full mx-auto px-6 py-16 animate-fade-up [animation-delay:300ms]">
        <div className="flex items-end justify-between mb-10">
          <div className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold">
            The Sections
          </div>
          <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground">
            {SECTIONS.length} disciplines
          </div>
        </div>
          {SECTIONS.map((s, i) => (
            <Link
              key={s.to}
              to={s.to}
              className="group relative block border border-border bg-card/60 hover:bg-card hover:border-foreground transition-colors p-6 pt-7"
            >
              <span aria-hidden className="absolute top-0 left-6 right-6 h-px bg-foreground/80" />
              <div className="font-mono text-xs text-secondary-accent font-semibold mb-3">0{i + 1} / 0{SECTIONS.length}</div>
              <h2 className="font-display text-xl md:text-2xl mb-2 leading-tight">{s.name}</h2>
              <p className="text-sm text-foreground/65 text-pretty mb-4">{s.blurb}</p>
              <div className="font-mono uppercase tracking-widest text-xs text-foreground/60 group-hover:text-accent transition-colors mb-3">
                Enter section →
              </div>
              <QHint>{s.hint}</QHint>
            </Link>
          ))}

          ))}
        </div>
      </section>

      <div className="h-px bg-border max-w-7xl w-full mx-auto" />

      {/* Recruiter / leader: tools surface BEFORE the editorial */}
      {isRecruiterOrLead && <OperatorTools group={group} variant="home" />}

      {/* Featured + Sidebar */}
      {featured && (
        <main className="max-w-7xl w-full mx-auto px-6 py-20 animate-fade-up [animation-delay:400ms]">

          <div className="grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-7">
              <div className="mb-8 font-mono text-xs text-accent font-medium">
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
                className="font-mono text-xs uppercase tracking-widest border-b border-foreground pb-1 hover:text-accent hover:border-accent"
              >
                Read the full essay
              </Link>
            </div>

            <aside className="lg:col-span-5 flex flex-col gap-12 lg:border-l lg:border-border lg:pl-12">
              <div>
                <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground mb-4">
                  The Thesis
                </div>
                <p className="text-lg italic leading-snug">
                  "CS is no longer a service department; it is a revenue engine that requires the same mechanical precision as an assembly line."
                </p>
              </div>

              {/* AI Survey Promo */}
              <div className="bg-foreground text-background p-10">
                <div className="font-mono text-xs uppercase tracking-[0.2em] mb-6 opacity-60">
                  Tooling & Diagnostics
                </div>
                <h3 className="font-display text-3xl mb-6">The 2026 AI Readiness Audit</h3>
                <p className="text-sm leading-relaxed opacity-80 mb-8">
                  Is your CS organization prepared for automated orchestration? Take our 5-minute diagnostic to benchmark your team against industry leaders.
                </p>
                <Link
                  to="/ai-readiness"
                  className="inline-block w-full text-center py-4 border border-background/30 hover:bg-background hover:text-foreground transition-all font-mono text-xs uppercase tracking-widest"
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
              className="font-mono text-xs uppercase tracking-widest border-b border-foreground pb-1 hover:text-accent hover:border-accent"
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
                <div className="flex justify-between font-mono uppercase tracking-widest text-xs text-muted-foreground mb-4">
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

      {/* Operator / unknown: tools surface AFTER the editorial */}
      {!isRecruiterOrLead && <OperatorTools group={group} variant="home" />}

      <SiteFooter />
    </div>
  );
}

