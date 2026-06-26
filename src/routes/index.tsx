import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid, Compass } from "lucide-react";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ResumeRunPrompt } from "@/components/agent/ResumeRunPrompt";
import { NewsletterInline } from "@/components/site/NewsletterInline";
import { OperatorTools } from "@/components/site/OperatorTools";
import { QHint } from "@/components/site/QHint";

import { SectionsFillGrid } from "@/components/home/SectionsFillGrid";
import { usePersona } from "@/hooks/usePersona";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionTier } from "@/hooks/useSubscriptionTier";
import { useTierCopy } from "@/hooks/useTierCopy";
import { TierBadge } from "@/components/site/TierBadge";

import { listPosts, getLumiSeededFeed, type Post } from "@/lib/posts.functions";



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
  { to: "/diagnostics", name: "The Diagnostics", key: "diagnostic" },
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
  const { group, isRecruiterOrLead } = usePersona();
  const { user } = useAuth();
  const sub = useSubscriptionTier();

  // Lumi-seeded recent feed (signed-in only; falls back to recency).
  const seededFn = useServerFn(getLumiSeededFeed);
  const seededQ = useQuery({
    queryKey: ["home-seeded-feed", user?.id ?? "anon"],
    queryFn: () => seededFn({ data: { limit: 5 } }),
    enabled: !!user,
    staleTime: 60_000,
  });
  const seededPosts = (seededQ.data?.posts ?? []) as Array<Post & { seeded: boolean }>;
  const isLumiSeeded = seededQ.data?.source === "lumi";
  const restRecency = posts.slice(1, 5);
  const rest: Array<Post & { seeded?: boolean }> = user && seededPosts.length
    ? seededPosts.filter((p) => p.slug !== featured?.slug).slice(0, 4)
    : restRecency;

  // Stages render under hero for visitors/free, at the bottom for paid users.
  // While entitlements are still resolving, render NEITHER slot to keep order
  // stable across hard refresh (no flash + re-mount when tier flips).
  const stagesAtTop = !sub.loading && !sub.canAccessCSFactors;
  const stagesAtBottom = !sub.loading && sub.canAccessCSFactors;

  // SSR-safe daily headline rotation. Default to Sunday (brand anchor) on
  // server render; swap to the viewer's local day-of-week after mount.
  const [dayIndex, setDayIndex] = useState(0);
  useEffect(() => {
    setDayIndex(new Date().getDay());
  }, []);
  const rotations = t("home.hero.rotations", { returnObjects: true }) as
    | Array<{ line1: string; line2: string; sub: string }>
    | undefined;
  const fallback = {
    line1: t("home.hero.line1"),
    line2: t("home.hero.line2"),
    sub: t("home.hero.sub"),
  };
  const hero = rotations?.[dayIndex] ?? fallback;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <header className="max-w-7xl w-full mx-auto px-6 pt-20 md:pt-24 pb-6 text-center md:animate-fade-up">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-6 font-semibold">
          {t("home.eyebrow")}
        </div>
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl mb-8 text-balance leading-[0.95] tracking-tight">
          {hero.line1} <span className="not-italic text-accent">{hero.line2}</span>
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-foreground/75 text-pretty mb-8">
          {hero.sub}
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

        <TierStrip compact />


        {/* Primary destination grid — four equal cards. Tier-gated cards
            (Diagnostics, CSFactors, Decision Canvas / Lumi) pull badge,
            headline, body and CTA from the central tierCopyConfig. */}
        <div className="mt-10 grid gap-4 md:grid-cols-2 text-left">
          {/* AI Readiness — diagnostics feature */}
          <TierAwareHeroCard
            featureId="diagnostics"
            to="/diagnostics"
            dataTour="ai-readiness-box"
            ariaLabel={t("home.aiCard.title")}
            accentClass="secondary-accent"
            icon={<span className="font-mono text-sm font-bold tracking-tight">AR</span>}
            hint={t("home.aiCard.hint")}
            fallbackTitle={t("home.aiCard.title")}
            fallbackBody={t("home.aiCard.body")}
            fallbackCta={t("home.aiCard.cta")}
          />

          {/* CSFactors Command Centre — csfactors feature */}
          <TierAwareHeroCard
            featureId="csfactors"
            to="/csfactors"
            dataTour="csf-box"
            ariaLabel="Open CSFactors Command Centre"
            accentClass="accent"
            icon={<span className="font-mono text-sm font-bold tracking-tight">CSF</span>}
            hint={t("home.csfCard.hint")}
            fallbackTitle={t("home.csfCard.title")}
            fallbackBody={t("home.csfCard.body")}
            fallbackCta={t("home.csfCard.cta")}
          />


          {/* Workspace */}
          <Link
            to="/account/workspace"
            data-tour="workspace-icon"
            className="group relative flex flex-col h-full bg-card border border-border hover:border-foreground border-l-4 border-l-foreground/70 transition-colors p-6 md:p-7 card-lift"
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

          {/* Decision Canvas — lumi feature */}
          <TierAwareHeroCard
            featureId="lumi"
            to="/agent/framework"
            dataTour="canvas-icon"
            ariaLabel="Open Decision Canvas"
            accentClass="accent"
            icon={<Compass size={18} strokeWidth={2.5} />}
            fallbackTitle={t("home.canvas.title")}
            fallbackBody={t("home.canvas.body")}
            fallbackCta={t("home.canvas.cta")}
          />
        </div>
      </header>

      {/* Stage 01 / 02 / 03 — visitor + free users see it directly under the
          hero with the new scroll-locked carousel reveal. Paid logged-in
          users get it at the bottom of the page (rendered further down).
          Neither slot renders while tier is loading. */}
      {stagesAtTop && <HomeStages />}

      {/* Featured + Sidebar — LIFTED for visibility */}
      {featured && (
        <main className="max-w-7xl w-full mx-auto px-6 pt-10 pb-14 md:pt-14 md:pb-16 animate-fade-up">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-7">
              <div className="mb-6 font-mono text-xs text-accent font-medium">
                {t("home.insightLabel", {
                  n: posts.length.toString().padStart(3, "0"),
                  min: featured.read_minutes,
                })}
              </div>
              <Link to="/insights/$slug" params={{ slug: featured.slug }} className="block group">
                <h2 className="font-display text-5xl md:text-7xl mb-6 leading-[1.02] tracking-tight transition-all text-balance">
                  {featured.title}
                </h2>
              </Link>
              <p className="text-xl leading-relaxed text-foreground/80 mb-8 text-pretty">
                {featured.excerpt}
              </p>
              {featured.subtitle && (
                <div className="border-y border-border py-6 mb-8">
                  <p className="font-display not-italic text-2xl md:text-3xl leading-snug text-pretty">
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

            <aside className="lg:col-span-5 flex flex-col gap-10 lg:border-l lg:border-border lg:pl-12">
              <div>
                <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground mb-4">
                  {t("home.thesis.eyebrow")}
                </div>
                <p className="text-lg leading-snug">
                  "CS is no longer a service department; it is a revenue engine that requires the same mechanical precision as an assembly line."
                </p>
              </div>
            </aside>
          </div>
        </main>
      )}

      {/* Editorial — sections rail */}
      <section className="max-w-7xl w-full mx-auto px-6 py-14 md:py-16 animate-fade-up">
        <div className="flex items-end justify-between mb-8">
          <div className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold">
            {t("home.editorial.eyebrow")}
          </div>
          <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground">
            {t("home.sections.count", { count: SECTIONS.length })}
          </div>
        </div>
        <SectionsFillGrid />
      </section>

      {/* Recruiter / leader: tools surface BEFORE the editorial */}
      {isRecruiterOrLead && <OperatorTools group={group} variant="home" />}

      {/* Recent grid — Lumi-seeded for signed-in users with memory context */}
      {rest.length > 0 && (
        <section className="max-w-7xl w-full mx-auto px-6 pt-2 pb-14 md:pb-16">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="font-display text-4xl">{t("home.recent.title")}</h2>
              {isLumiSeeded && (
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent mt-2">
                  Surfaced for you · Lumi context
                </div>
              )}
            </div>
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
                  <span className="flex items-center gap-3">
                    {p.seeded && <span className="text-accent">Surfaced for you</span>}
                    <span>{p.read_minutes} min</span>
                  </span>
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

      {/* Paid logged-in users see the three Stages here at the bottom,
          below the Operator Toolkit, above the closing CTA. */}
      {stagesAtBottom && <HomeStages />}

      <ClosingCTA />

      <SiteFooter />
      {user && <ResumeRunPrompt />}
    </div>
  );
}

// Stage 01/02/03 block — one definition rendered in either the top slot
// (visitor / free) or the bottom slot (paid logged-in) by HomePage above.
function HomeStages() {
  return (
    <StageRevealSection
      stages={[
        {
          label: "The CSM",
          caption: (
            <div className="max-w-xl">
              <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent mb-6">
                Stage 01 / Practitioner
              </div>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight mb-6 text-balance">
                For the practitioner managing thirty accounts.
              </h2>
              <p className="text-lg text-foreground/75 leading-relaxed mb-8 text-pretty">
                A personal command centre for the CSM in the trenches. Triage the burning three before standup, surface the renewals that need a real conversation, and keep every account note in one operator-grade canvas.
              </p>
              <StageCta featureId="csfactors" label="Start free →" />
            </div>
          ),
          mock: <StageMock variant="pulse" />,
        },
        {
          label: "The Leader",
          caption: (
            <div className="max-w-xl">
              <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent mb-6">
                Stage 02 / Operator · Team
              </div>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight mb-6 text-balance">
                For the VP carrying the NRR number.
              </h2>
              <p className="text-lg text-foreground/75 leading-relaxed mb-8 text-pretty">
                Roll every CSM's book into a single 360° portfolio. Watch NRR move in real time, see which segments are bleeding gross retention, and act before the QBR turns into a post-mortem.
              </p>
              <StageCta featureId="csfactors" label="See the platform →" />
            </div>
          ),
          mock: <StageMock variant="threeSixty" />,
        },
        {
          label: "The Enterprise",
          caption: (
            <div className="max-w-xl">
              <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent mb-6">
                Stage 03 / Scale · Enterprise
              </div>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight mb-6 text-balance">
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
          mock: <StageMock variant="risk" />,
        },
      ]}
    />
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Tier-aware hero card. Visual layout is identical to the original static
// cards — only the badge, headline, body and CTA strings come from the
// centralized tierCopyConfig via useTierCopy. When the user signs in or
// upgrades, the registry returns different copy for the same featureId and
// the card re-renders automatically.
// ─────────────────────────────────────────────────────────────────────────────
type AccentClass = "accent" | "secondary-accent";

function TierAwareHeroCard({
  featureId,
  to,
  dataTour,
  ariaLabel,
  accentClass,
  icon,
  hint,
  fallbackTitle,
  fallbackBody,
  fallbackCta,
}: {
  featureId: import("@/config/tierCopyConfig").FeatureId;
  to: string;
  dataTour?: string;
  ariaLabel: string;
  accentClass: AccentClass;
  icon: ReactNode;
  hint?: string;
  fallbackTitle: string;
  fallbackBody: string;
  fallbackCta: string;
}) {
  const copy = useTierCopy(featureId);
  const isAccent = accentClass === "accent";
  const borderColor = isAccent ? "hover:border-accent border-l-accent" : "hover:border-secondary-accent border-l-secondary-accent";
  const iconBg = isAccent ? "bg-accent text-accent-foreground" : "bg-secondary-accent text-background";
  const ctaColor = isAccent ? "text-accent border-accent/40 group-hover:border-accent" : "text-secondary-accent border-secondary-accent/40 group-hover:border-secondary-accent";
  return (
    <Link
      to={(copy.ctaHref ?? to) as never}
      data-tour={dataTour}
      className={`group relative flex flex-col h-full bg-card border border-border ${borderColor} border-l-4 transition-colors p-6 md:p-7 card-lift`}
      aria-label={ariaLabel}
    >
      <div className="flex items-center gap-3 mb-4">
        <span
          aria-hidden
          className={`flex h-10 w-10 shrink-0 items-center justify-center ${iconBg} rounded-sm shadow-sm group-hover:scale-105 transition-transform`}
        >
          {icon}
        </span>
        <TierBadge label={copy.badge} variant={copy.badgeVariant} showLock={copy.lockIcon} />
      </div>
      <h3 className="font-display text-xl md:text-2xl leading-tight mb-2">
        {copy.headline ?? fallbackTitle}
      </h3>
      <p className="text-sm text-foreground/70 leading-snug mb-5 flex-1">
        {copy.body ?? fallbackBody}
      </p>
      <span className={`inline-flex items-center font-mono text-xs uppercase tracking-[0.22em] ${ctaColor} border-b pb-1 self-start`}>
        {copy.cta ?? fallbackCta}
      </span>
      {hint && <QHint>{hint}</QHint>}
    </Link>
  );
}

// Stage CTA — keeps the editorial label (e.g. "Start free →") but routes
// to the right destination based on the viewer's tier. Visitors land on
// /login, free/reader users on /pricing (upgrade), entitled users on the
// feature itself. Drives off the same CTA_ROUTES table as the hero cards.
function StageCta({
  featureId,
  label,
}: {
  featureId: import("@/config/tierCopyConfig").FeatureId;
  label: string;
}) {
  const copy = useTierCopy(featureId);
  return (
    <Link
      to={copy.ctaHref as never}
      className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-[0.22em] px-5 py-3 hover:opacity-90 transition-opacity"
    >
      {label}
    </Link>
  );
}

function ClosingCTA() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const sub = useSubscriptionTier();

  // Prevent flash of visitor CTA while auth/tier state is still resolving.
  if (sub.loading) return null;

  // Tier-aware routing:
  //   visitor / free  → diagnostic (free value) + pricing (upgrade path)
  //   practitioner+   → CSFactors (main dashboard) + workspace
  const isPaid = sub.canAccessCSFactors;

  const primary = isPaid
    ? { to: "/csfactors" as const, label: t("home.closing.ctaAuthedPrimary") }
    : { to: "/diagnostics" as const, label: t("home.closing.ctaPrimary") };
  const secondary = isPaid
    ? { to: "/account/workspace" as const, label: t("home.closing.ctaAuthedSecondary") }
    : { to: "/pricing" as const, label: t("home.closing.ctaSecondary") };

  return (
    <section className="border-t border-border bg-card/40">
      <div className="max-w-5xl w-full mx-auto px-6 py-16 md:py-20 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-secondary-accent mb-5 font-semibold">
          {t("home.closing.eyebrow")}
        </div>
        <h2 className="font-display text-3xl md:text-5xl leading-[1.05] tracking-tight text-balance mb-5">
          {t("home.closing.title")}
        </h2>
        <p className="max-w-2xl mx-auto text-base md:text-lg text-foreground/75 text-pretty mb-8">
          {t("home.closing.sub")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to={primary.to}
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-[0.22em] px-5 py-3 hover:opacity-90 transition-opacity"
          >
            {primary.label} →
          </Link>
          <Link
            to={secondary.to}
            className="inline-flex items-center gap-2 border border-border font-mono text-xs uppercase tracking-[0.22em] px-5 py-3 hover:border-foreground transition-colors"
          >
            {secondary.label} →
          </Link>
        </div>
        {!user && (
          <div className="mt-8 max-w-xl mx-auto">
            <NewsletterInline source="home-closing" />
          </div>
        )}
      </div>
    </section>
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

// ─────────────────────────────────────────────────────────────────────────────
// Tier-aware strip — rendered immediately below the hero. Switches content
// (NOT visual design) based on the visitor's tier. Tokens only — no hex.
// ─────────────────────────────────────────────────────────────────────────────
function TierStrip({ compact = false }: { compact?: boolean } = {}) {
  void compact;
  const sub = useSubscriptionTier();
  const [readerNudgeDismissed, setReaderNudgeDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.sessionStorage.getItem("cs_reader_nudge_seen") === "1";
  });

  if (sub.loading) return null;

  // VISITOR — three what-you-get cards
  if (sub.tier === "visitor") {
    const cards: Array<{ eyebrow: string; title: string; body: string; cta: string; to: string }> = [
      { eyebrow: "Free", title: "Reader", body: "Weekly dispatch, diagnostic score, and one Lumi session a week.", cta: "Start free", to: "/login" },
      { eyebrow: "$39 / mo", title: "Practitioner unlocks", body: "Full archive, all six Codex playbooks, CSFactors dashboard, 50 Lumi/mo.", cta: "Learn more", to: "/pricing" },
      { eyebrow: "$89 / mo", title: "Operator unlocks", body: "Risk register, renewal waterfall, benchmark comparisons, 100 Lumi/mo.", cta: "Learn more", to: "/pricing" },
    ];
    return (
      <section className="max-w-7xl w-full mx-auto px-6 pt-4 pb-12">
        <div className="grid md:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Link
              key={c.title}
              to={c.to}
              className="group border border-border bg-card p-5 hover:border-foreground transition-colors flex flex-col card-lift"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent mb-3">{c.eyebrow}</div>
              <h3 className="font-display text-xl leading-tight mb-2">{c.title}</h3>
              <p className="text-sm text-foreground/70 leading-snug mb-4 flex-1">{c.body}</p>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent border-b border-accent/40 group-hover:border-accent pb-0.5 self-start">
                {c.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  // FREE — personalised greeting + slim upgrade nudge
  if (sub.tier === "free") {
    return (
      <section className="max-w-7xl w-full mx-auto px-6 pt-2 pb-10">
        <div className="border border-border bg-card px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent mb-1">
              Good to see you, {sub.displayName}
            </span>
            <span className="text-sm text-foreground/80">
              Unlock the full Codex library, 50 Lumi sessions, and your CSFactors dashboard. From $39/month.
            </span>
          </div>
          <Link
            to="/pricing"
            className="font-mono text-[11px] uppercase tracking-[0.22em] bg-accent text-accent-foreground px-4 py-2 hover:opacity-90"
          >
            See plans →
          </Link>
        </div>
      </section>
    );
  }

  // PRACTITIONER — "Your week" 3-tile (Lumi remaining is real; latest article + open MAPs are placeholders)
  if (sub.tier === "practitioner") {
    const remaining = Math.max(0, sub.lumiSessionsAllowed - sub.lumiSessionsUsed);
    const showReaderNudge = !readerNudgeDismissed;
    return (
      <section className="max-w-7xl w-full mx-auto px-6 pt-2 pb-10 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <Tile eyebrow="This week" title="Latest dispatch" body="See the newest essay below." to="/insights" cta="Read →" />
          <Tile eyebrow="Lumi" title={`${remaining} of ${sub.lumiSessionsAllowed} remaining`} body="Sessions reset on the 1st of the month." to="/agent/framework" cta="Open Lumi →" />
          <Tile eyebrow="CSFactors" title="Open MAPs" body="Live mutual action plans for your accounts." to="/csfactors/maps" cta="Open →" />
        </div>
        {showReaderNudge && (
          <div className="border border-border bg-card px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent mb-1">What you're missing</div>
              <p className="text-sm text-foreground/80 max-w-2xl">
                Operator adds the risk register, renewal waterfall, and benchmark comparisons on top of everything you have today. $89/month.
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/pricing" className="font-mono text-[11px] uppercase tracking-[0.22em] bg-accent text-accent-foreground px-4 py-2 hover:opacity-90">
                Explore Operator
              </Link>
              <button
                type="button"
                onClick={() => { window.sessionStorage.setItem("cs_reader_nudge_seen", "1"); setReaderNudgeDismissed(true); }}
                className="font-mono text-[11px] uppercase tracking-[0.22em] border border-border px-4 py-2 hover:border-foreground"
              >
                Remind me later
              </button>
            </div>
          </div>
        )}
        {remaining <= Math.max(1, Math.floor(sub.lumiSessionsAllowed * 0.2)) && remaining > 0 && (
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-secondary-accent">
            You have {remaining} Lumi sessions left this month. Operator members get 100.
          </p>
        )}
      </section>
    );
  }

  // OPERATOR — same tiles plus a renewal/risk line (real data wired separately)
  if (sub.tier === "operator") {
    const remaining = Math.max(0, sub.lumiSessionsAllowed - sub.lumiSessionsUsed);
    return (
      <section className="max-w-7xl w-full mx-auto px-6 pt-2 pb-10">
        <div className="grid md:grid-cols-3 gap-4">
          <Tile eyebrow="Operator" title="Risk register" body="Open risks across your portfolio." to="/csfactors" cta="Open →" />
          <Tile eyebrow="Lumi" title={`${remaining} of ${sub.lumiSessionsAllowed} remaining`} body="Sessions reset on the 1st of the month." to="/agent/framework" cta="Open Lumi →" />
          <Tile eyebrow="Renewals" title="Next renewal window" body="The accounts inside your 90-day horizon." to="/csfactors/360" cta="Open 360 →" />
        </div>
      </section>
    );
  }

  // TEAM / SCALE / ENTERPRISE — team summary
  return (
    <section className="max-w-7xl w-full mx-auto px-6 pt-2 pb-10">
      <div className="border border-border bg-card px-5 py-4 grid grid-cols-1 gap-3 sm:flex sm:items-center sm:justify-between sm:flex-wrap sm:gap-4">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent mb-1">Your team</div>
          <p className="text-sm text-foreground/80">
            Lumi pool: {sub.lumiSessionsUsed} / {sub.lumiSessionsAllowed} sessions used this month.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link to="/csfactors/360" className="font-mono text-[11px] uppercase tracking-[0.22em] border border-border px-4 py-2 hover:border-foreground whitespace-nowrap">
            Team Pulse
          </Link>
          <Link to="/csfactors/maps" className="font-mono text-[11px] uppercase tracking-[0.22em] border border-border px-4 py-2 hover:border-foreground whitespace-nowrap">
            MAP engine
          </Link>
          <Link to="/account/workspace" className="font-mono text-[11px] uppercase tracking-[0.22em] border border-border px-4 py-2 hover:border-foreground whitespace-nowrap">
            Workspace
          </Link>
        </div>
      </div>
    </section>
  );
}


function Tile({ eyebrow, title, body, to, cta }: { eyebrow: string; title: string; body: string; to: string; cta: string }) {
  return (
    <Link to={to} className="group border border-border bg-card p-5 hover:border-foreground transition-colors flex flex-col card-lift">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent mb-2">{eyebrow}</div>
      <h3 className="font-display text-lg leading-tight mb-2">{title}</h3>
      <p className="text-sm text-foreground/70 leading-snug mb-4 flex-1">{body}</p>
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent border-b border-accent/40 group-hover:border-accent pb-0.5 self-start">
        {cta}
      </span>
    </Link>
  );
}


