import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/Reveal";
import { QMark } from "@/components/site/QMark";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getMe, startSubscriptionPlaceholder } from "@/lib/auth.functions";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing, The CS Quarterly" },
      { name: "description", content: "Six tiers from the Free Briefing to a 50-seat Enterprise license. Q agent sessions, the full Codex, Workspace, universal search, and the job board — priced for operators and teams." },
      { property: "og:title", content: "The CS Quarterly, Pricing" },
      { property: "og:description", content: "Six tiers, from the Free Briefing to a 50-seat Enterprise license." },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
  component: PricingPage,
});

type Tier = {
  slug: string;
  name: string;
  price: string;
  cadence: string;
  altPrice?: string;
  blurb: ReactNode;
  highlights: string[];
  seats: string;
  sessions: ReactNode;
  cta: string;
  emphasis?: boolean;
};

// Capability matrix (read across to verify gating):
//   Universal search  →  Vanguard Individual and up
//   Your Workspace    →  Vanguard Pro and up
const TIERS: Tier[] = [
  {
    slug: "free",
    name: "Free Briefing",
    price: "$0",
    cadence: "forever",
    blurb: "The weekly dispatch and a baseline diagnostic, no card required.",
    highlights: [
      "Weekly Tuesday dispatch",
      "1 Value Realization Model per month",
      "Score-only AI Readiness Diagnostic",
      "Public archive access",
    ],
    seats: "1 seat",
    sessions: <>0 <QMark /> sessions</>,
    cta: "Subscribe free",
  },
  {
    slug: "vanguard-individual",
    name: "Vanguard Individual",
    price: "$29",
    cadence: "/ month",
    altPrice: "or $290 / year",
    blurb: <>Full archive, the entire Codex, and universal <QMark /> search across every dispatch.</>,
    highlights: [
      "Everything in Free Briefing",
      "Full premium archive + two-voice toggle",
      "Complete Codex of executive playbooks",
      "Universal search across every CSQ source",
      "Job board talent profile",
    ],
    seats: "1 seat",
    sessions: <>50 <QMark /> sessions / month</>,
    cta: "Join the Vanguard",
    emphasis: true,
  },
  {
    slug: "vanguard-pro",
    name: "Vanguard Pro",
    price: "$49",
    cadence: "/ month",
    altPrice: "or $490 / year",
    blurb: <>For senior operators who run their week through <QMark /> and a private Workspace.</>,
    highlights: [
      "Everything in Individual",
      "Your Workspace — saved links, files, highlights",
      "Local search across your saved intel only",
      "Early-access Codex alerts",
      "1 free Sponsored Job Posting / quarter",
      "Senior Executive sub-channels",
    ],
    seats: "1 seat",
    sessions: <>150 <QMark /> sessions / month</>,
    cta: "Go Pro",
  },
  {
    slug: "team-starter",
    name: "Team Starter",
    price: "$499",
    cadence: "/ month",
    blurb: "A pod-sized rollout with shared compute, shared Workspaces, and central billing.",
    highlights: [
      "Everything in Vanguard Pro, per seat",
      "Centralized billing panel",
      "Shared team Workspace + Codex",
      "Collaborative download library",
      "Priority support queue",
    ],
    seats: "Up to 5 seats",
    sessions: <>500 pooled <QMark /> sessions / month</>,
    cta: "Start a team",
  },
  {
    slug: "team-growth",
    name: "Team Growth",
    price: "$999",
    cadence: "/ month",
    blurb: "Scaled CS orgs with shared benchmarks, hiring leverage, and team-wide Workspace search.",
    highlights: [
      "Everything in Team Starter",
      "Team-wide Workspace search + admin",
      "Quarterly Benchmark PDFs (NRR, Payback, GRR)",
      "3 active Featured job listings / year",
      "Team analytics dashboard",
    ],
    seats: "Up to 15 seats",
    sessions: <>1,500 pooled <QMark /> sessions / month</>,
    cta: "Scale the team",
  },
  {
    slug: "enterprise",
    name: "Enterprise License",
    price: "$2,500",
    cadence: "/ month",
    blurb: "A direct line to the editorial team, a dedicated channel, and a custom corpus.",
    highlights: [
      "Everything in Team Growth",
      "Custom onboarding modules",
      "Dedicated Slack channel",
      "Custom RAG corpus extensions inside Workspace",
      "Priority editorial response window",
    ],
    seats: "Up to 50 seats",
    sessions: <>5,000 pooled <QMark /> sessions / month</>,
    cta: "Talk to editorial",
  },
];

function PricingPage() {
  const { user } = useAuth();
  const fetchMe = useServerFn(getMe);
  const startSub = useServerFn(startSubscriptionPlaceholder);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), enabled: !!user });

  const onSelect = async (slug: string) => {
    if (slug === "free") {
      window.location.href = "/subscribe";
      return;
    }
    if (slug === "enterprise") {
      window.location.href = "mailto:editorial@thecsquarterly.com?subject=Enterprise%20License";
      return;
    }
    if (!user) {
      window.location.href = "/login";
      return;
    }
    try {
      await startSub();
      toast.success(`${slug} activated (preview). Stripe checkout wires up next release.`);
      me.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-12 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">Membership Matrix</div>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-6">
            Six tiers. <span className="italic">One discipline.</span>
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto text-pretty">
            From a free weekly briefing to a 50-seat Enterprise license — with <QMark />&nbsp;agent sessions, universal search, and a private Workspace gated by tier.
          </p>
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/60">
            <span className="px-2 py-1 border border-border">Universal search · Vanguard +</span>
            <span className="px-2 py-1 border border-border">Your Workspace · Pro +</span>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TIERS.map((t, i) => (
              <Reveal
                key={t.slug}
                index={i}
                className={
                  "flex flex-col p-8 border card-lift " +
                  (t.emphasis
                    ? "border-2 border-accent bg-card relative"
                    : "border-border bg-card/60")
                }
              >
                {t.emphasis && (
                  <div className="absolute -top-3 left-8 bg-accent text-accent-foreground px-3 py-1 font-mono text-[9px] uppercase tracking-widest">
                    Most popular
                  </div>
                )}
                <div className="font-mono text-[10px] uppercase tracking-widest text-secondary-accent mb-3">
                  {t.name}
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-display text-5xl leading-none">{t.price}</span>
                  <span className="text-sm text-muted-foreground">{t.cadence}</span>
                </div>
                {t.altPrice && (
                  <div className="text-xs text-muted-foreground mb-3">{t.altPrice}</div>
                )}
                <p className="text-sm text-foreground/70 mt-3 mb-6 min-h-[3rem]">{t.blurb}</p>

                <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-border">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-foreground/50 mb-1">Seats</div>
                    <div className="text-sm font-medium">{t.seats}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-foreground/50 mb-1"><QMark /> sessions</div>
                    <div className="text-sm font-medium">{t.sessions}</div>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {t.highlights.map((h) => (
                    <li key={h} className="flex gap-2.5 text-sm">
                      <Check size={14} className="mt-1 shrink-0 text-accent" />
                      <span className="text-foreground/85">{h}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onSelect(t.slug)}
                  className={
                    "block w-full py-3.5 text-center font-mono text-[10px] uppercase tracking-[0.25em] transition-all " +
                    (t.emphasis
                      ? "bg-accent text-accent-foreground hover:opacity-90"
                      : "border border-foreground hover:bg-foreground hover:text-background")
                  }
                >
                  {t.cta}
                </button>
              </Reveal>
            ))}
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
