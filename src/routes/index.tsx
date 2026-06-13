import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid, Compass } from "lucide-react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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

