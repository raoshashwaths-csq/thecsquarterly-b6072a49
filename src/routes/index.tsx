import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid, Compass } from "lucide-react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterInline } from "@/components/site/NewsletterInline";
import { OperatorTools } from "@/components/site/OperatorTools";
import { QHint } from "@/components/site/QHint";
import { StickyScrollSection } from "@/components/shared/StickyScrollSection";
import { usePersona } from "@/hooks/usePersona";
import { useAuth } from "@/hooks/useAuth";

import { listPosts } from "@/lib/posts.functions";



const postsQuery = queryOptions({
  queryKey: ["posts"],
  queryFn: () => listPosts(),
});

// Section proper nouns ("The CS Vanguard", etc.) stay in English per the
// editorial brand rules. Only the blurb / hint / surrounding chrome translate.
const SECTIONS = [
  { to: "/vanguard", name: "The CS Vanguard", key: "vanguard" },
  { to: "/retention-protocol", name: "The Retention Protocol", key: "retention" },
  { to: "/outcome-forum", name: "The Outcome Forum", key: "outcome" },
  { to: "/codex", name: "The CS Codex", key: "codex" },
  { to: "/ai-readiness", name: "The Diagnostics", key: "diagnostic" },
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
  const { t } = useTranslation();
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
          {t("home.eyebrow")}
        </div>
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl mb-8 text-balance leading-[0.95] tracking-tight">
          {t("home.hero.line1")} <span className="italic text-accent">{t("home.hero.line2")}</span>
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-foreground/75 text-pretty mb-10">
          {t("home.hero.sub")}
        </p>
        {!user ? (
          <NewsletterInline source="home-hero" />
        ) : (
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {t("home.welcomeBack")}{" "}
            <Link to="/account" className="text-accent border-b border-accent/40 hover:border-accent pb-0.5">
              {t("home.openAccount")}
            </Link>
          </p>
        )}


        {/* Primary destination grid — four equal cards, each with a clear primary CTA */}
        <div className="mt-12 grid gap-4 md:grid-cols-2 text-left">
          {/* AI Readiness */}
          <Link
            to="/ai-readiness"
            data-tour="ai-readiness-box"
            className="group relative flex flex-col h-full bg-card border border-border hover:border-secondary-accent border-l-4 border-l-secondary-accent transition-colors p-6 md:p-7"
            aria-label="Take the AI Readiness Audit"
          >
            <div className="flex items-center gap-3 mb-4">
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-secondary-accent text-background rounded-sm font-mono text-sm font-bold tracking-tight shadow-sm group-hover:scale-105 transition-transform"
              >
                AR
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-secondary-accent font-semibold">
                {t("home.aiCard.eyebrow")}
              </span>
            </div>
            <h3 className="font-display text-xl md:text-2xl leading-tight mb-2">
              {t("home.aiCard.title")}
            </h3>
            <p className="text-sm text-foreground/70 leading-snug mb-5 flex-1">
              {t("home.aiCard.body")}
            </p>
            <span className="inline-flex items-center font-mono text-xs uppercase tracking-[0.22em] text-secondary-accent border-b border-secondary-accent/40 group-hover:border-secondary-accent pb-1 self-start">
              {t("home.aiCard.cta")}
            </span>
            <QHint>{t("home.aiCard.hint")}</QHint>
          </Link>

          {/* CSFactors Command Centre */}
          <Link
            to="/csfactors"
            data-tour="csf-box"
            className="group relative flex flex-col h-full bg-card border border-border hover:border-accent border-l-4 border-l-accent transition-colors p-6 md:p-7"
            aria-label="Open CSFactors Command Centre"
          >
            <div className="flex items-center gap-3 mb-4">
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent text-accent-foreground rounded-sm font-mono text-sm font-bold tracking-tight shadow-sm group-hover:scale-105 transition-transform"
              >
                CSF
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-semibold">
                {t("home.csfCard.eyebrow")}
              </span>
            </div>
            <h3 className="font-display text-xl md:text-2xl leading-tight mb-2">
              {t("home.csfCard.title")}
            </h3>
            <p className="text-sm text-foreground/70 leading-snug mb-5 flex-1">
              {t("home.csfCard.body")}
            </p>
            <span className="inline-flex items-center font-mono text-xs uppercase tracking-[0.22em] text-accent border-b border-accent/40 group-hover:border-accent pb-1 self-start">
              {t("home.csfCard.cta")}
            </span>
            <QHint>{t("home.csfCard.hint")}</QHint>
          </Link>

          {/* Workspace */}
          <Link
            to="/account/workspace"
            data-tour="workspace-icon"
            className="group relative flex flex-col h-full bg-card border border-border hover:border-foreground border-l-4 border-l-foreground/70 transition-colors p-6 md:p-7"
            aria-label="Open your Workspace"
          >
            <div className="flex items-center gap-3 mb-4">
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-foreground text-background rounded-sm group-hover:scale-105 transition-transform"
              >
                <LayoutGrid size={18} strokeWidth={2.5} />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/70 font-semibold">
                {t("home.workspace.eyebrow")}
              </span>
            </div>
            <h3 className="font-display text-xl md:text-2xl leading-tight mb-2">
              {t("home.workspace.title")}
            </h3>
            <p className="text-sm text-foreground/70 leading-snug mb-5 flex-1">
              {t("home.workspace.body")}
            </p>
            <span className="inline-flex items-center font-mono text-xs uppercase tracking-[0.22em] text-foreground border-b border-foreground/40 group-hover:border-foreground pb-1 self-start">
              {t("home.workspace.cta")}
            </span>
          </Link>

          {/* Decision Canvas */}
          <Link
            to="/agent/framework"
            data-tour="canvas-icon"
            className="group relative flex flex-col h-full bg-card border border-border hover:border-accent border-l-4 border-l-accent transition-colors p-6 md:p-7"
            aria-label="Open Decision Canvas"
          >
            <div className="flex items-center gap-3 mb-4">
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent text-accent-foreground rounded-sm group-hover:scale-105 transition-transform"
              >
                <Compass size={18} strokeWidth={2.5} />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-semibold">
                {t("home.canvas.eyebrow")}
              </span>
            </div>
            <h3 className="font-display text-xl md:text-2xl leading-tight mb-2">
              {t("home.canvas.title")}
            </h3>
            <p className="text-sm text-foreground/70 leading-snug mb-5 flex-1">
              {t("home.canvas.body")}
            </p>
            <span className="inline-flex items-center font-mono text-xs uppercase tracking-[0.22em] text-accent border-b border-accent/40 group-hover:border-accent pb-1 self-start">
              {t("home.canvas.cta")}
            </span>
          </Link>
        </div>
      </header>

      <StickyScrollSection
        stages={[
          {
            label: "The CSM",
            left: (
              <div className="max-w-lg">
                <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent mb-6">
                  Stage 01 / Practitioner
                </div>
                <h2 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight mb-6 text-balance">
                  For the practitioner managing thirty accounts.
                </h2>
                <p className="text-lg text-foreground/75 leading-relaxed mb-8 text-pretty">
                  A personal command centre for the CSM in the trenches. Triage the burning three before standup, surface the renewals that need a real conversation, and keep every account note in one operator-grade canvas.
                </p>
                <Link
                  to="/csfactors"
                  className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-[0.22em] px-5 py-3 hover:opacity-90 transition-opacity"
                >
                  Start free →
                </Link>
              </div>
            ),
            right: <StageMock variant="pulse" />,
          },
          {
            label: "The Leader",
            left: (
              <div className="max-w-lg">
                <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent mb-6">
                  Stage 02 / Operator · Team
                </div>
                <h2 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight mb-6 text-balance">
                  For the VP carrying the NRR number.
                </h2>
                <p className="text-lg text-foreground/75 leading-relaxed mb-8 text-pretty">
                  Roll every CSM's book into a single 360° portfolio. Watch NRR move in real time, see which segments are bleeding gross retention, and act before the QBR turns into a post-mortem.
                </p>
                <Link
                  to="/csfactors/360"
                  className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-[0.22em] px-5 py-3 hover:opacity-90 transition-opacity"
                >
                  See the platform →
                </Link>
              </div>
            ),
            right: <StageMock variant="threeSixty" />,
          },
          {
            label: "The Enterprise",
            left: (
              <div className="max-w-lg">
                <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent mb-6">
                  Stage 03 / Scale · Enterprise
                </div>
                <h2 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight mb-6 text-balance">
                  For the CCO presenting to the board on Monday.
                </h2>
                <p className="text-lg text-foreground/75 leading-relaxed mb-8 text-pretty">
                  A risk register, capacity model and renewal waterfall the board will actually read. Export the slide, defend the number, and walk out with the next quarter already mapped.
                </p>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-[0.22em] px-5 py-3 hover:opacity-90 transition-opacity"
                >
                  View enterprise →
                </Link>
              </div>
            ),
            right: <StageMock variant="risk" />,
          },
        ]}
      />

      <div className="h-px bg-border max-w-7xl w-full mx-auto mt-16 animate-reveal-line" />



      {/* Sections strip */}
      <section className="max-w-7xl w-full mx-auto px-6 py-16 animate-fade-up [animation-delay:300ms]">
        <div className="flex items-end justify-between mb-10">
          <div className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold">
            {t("home.sections.eyebrow")}
          </div>
          <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground">
            {t("home.sections.count", { count: SECTIONS.length })}
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
              <div className="font-mono text-xs text-secondary-accent font-semibold mb-3">0{i + 1} / 0{SECTIONS.length}</div>
              <h2 className="font-display text-xl md:text-2xl mb-2 leading-tight">
                {t(`home.sections.items.${s.key}.name`, { defaultValue: s.name })}
              </h2>
              <p className="text-sm text-foreground/65 text-pretty mb-4">
                {t(`home.sections.items.${s.key}.blurb`)}
              </p>
              <div className="font-mono uppercase tracking-widest text-xs text-foreground/60 group-hover:text-accent transition-colors mb-3">
                {t("home.sections.enter")}
              </div>
              <QHint>{t(`home.sections.items.${s.key}.hint`)}</QHint>
            </Link>
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
                {t("home.insightLabel", {
                  n: posts.length.toString().padStart(3, "0"),
                  min: featured.read_minutes,
                })}
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
                {t("home.readFull")}
              </Link>
            </div>


            <aside className="lg:col-span-5 flex flex-col gap-12 lg:border-l lg:border-border lg:pl-12">
              <div>
                <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground mb-4">
                  {t("home.thesis.eyebrow")}
                </div>
                <p className="text-lg italic leading-snug">
                  "CS is no longer a service department; it is a revenue engine that requires the same mechanical precision as an assembly line."
                </p>
              </div>
            </aside>

          </div>
        </main>
      )}

      {/* Recent grid */}
      {rest.length > 0 && (
        <section className="max-w-7xl w-full mx-auto px-6 pb-24">
          <div className="flex justify-between items-end mb-12">
            <h2 className="font-display text-4xl">{t("home.recent.title")}</h2>
            <Link
              to="/insights"
              className="font-mono text-xs uppercase tracking-widest border-b border-foreground pb-1 hover:text-accent hover:border-accent"
            >
              {t("home.recent.viewAll")}
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

function StageMock({ variant }: { variant: "pulse" | "threeSixty" | "risk" }) {
  return (
    <div className="w-full max-w-full md:max-w-3xl mx-auto bg-card border border-border shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/50">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
          {variant === "pulse" ? "csfactors / pulse" : variant === "threeSixty" ? "csfactors / 360" : "csfactors / risk-register"}
        </div>
        <span className="w-8" />
      </div>
      <div className="p-5 space-y-4">
        {variant === "pulse" && (
          <>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">The Burning Three</div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Acme Corp", v: "82%", c: "bg-destructive/15 text-destructive" },
                { label: "Globex", v: "61%", c: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
                { label: "Initech", v: "44%", c: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
              ].map((m) => (
                <div key={m.label} className="p-3 border border-border bg-background/40">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">{m.label}</div>
                  <div className={`text-lg font-display ${m.c} px-1.5 py-0.5 inline-block`}>{m.v}</div>
                </div>
              ))}
            </div>
            <div className="h-px bg-border" />
            <div className="space-y-2">
              {["Q3 renewal · 14 days", "Champion change · Northwind", "Expansion signal · Soylent"].map((r) => (
                <div key={r} className="flex items-center justify-between text-xs">
                  <span className="text-foreground/75">{r}</span>
                  <span className="font-mono text-[10px] text-accent">open →</span>
                </div>
              ))}
            </div>
          </>
        )}
        {variant === "threeSixty" && (
          <>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Net Revenue Retention</div>
                <div className="font-display text-4xl text-accent mt-1">118.4%</div>
              </div>
              <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">▲ 3.2pts QoQ</div>
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {[40, 55, 48, 62, 71, 65, 78, 84, 76, 88, 92, 95].map((h, i) => (
                <div key={i} className="flex-1 bg-accent/70" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
              {[
                { l: "Gross Ret.", v: "94.1%" },
                { l: "Expansion", v: "+$2.1M" },
                { l: "Churn $", v: "-$340K" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{s.l}</div>
                  <div className="font-display text-lg">{s.v}</div>
                </div>
              ))}
            </div>
          </>
        )}
        {variant === "risk" && (
          <>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">Risk Register · Board Export</div>
            <div className="space-y-2">
              {[
                { a: "Stark Industries", arr: "$1.8M", sev: "Critical", c: "bg-destructive text-destructive-foreground" },
                { a: "Wayne Enterprises", arr: "$1.2M", sev: "High", c: "bg-amber-500 text-background" },
                { a: "Pied Piper", arr: "$840K", sev: "High", c: "bg-amber-500 text-background" },
                { a: "Hooli", arr: "$620K", sev: "Watch", c: "bg-foreground/20 text-foreground" },
              ].map((r) => (
                <div key={r.a} className="flex items-center justify-between px-3 py-2 border border-border bg-background/40">
                  <div>
                    <div className="text-sm font-medium">{r.a}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{r.arr} ARR</div>
                  </div>
                  <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-1 ${r.c}`}>{r.sev}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Total at risk</div>
              <div className="font-display text-xl text-accent">$4.46M</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


