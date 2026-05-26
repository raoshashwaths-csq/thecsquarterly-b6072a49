import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { getMe, startSubscriptionPlaceholder } from "@/lib/auth.functions";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing, The CS Quarterly" },
      { name: "description", content: "Six tiers from the Free Briefing to a 50-seat Enterprise license. Q agent sessions, the full Codex, and the job board, priced for operators and teams." },
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
  blurb: string;
  highlights: string[];
  seats: string;
  sessions: string;
  cta: string;
  emphasis?: boolean;
};

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
    sessions: "0 Q sessions",
    cta: "Subscribe free",
  },
  {
    slug: "vanguard-individual",
    name: "Vanguard Individual",
    price: "$29",
    cadence: "/ month",
    altPrice: "or $290 / year",
    blurb: "Full archive, the entire Codex, and Q for solo operators.",
    highlights: [
      "Everything in Free Briefing",
      "Full premium archive + two-voice toggle",
      "Complete Codex of executive playbooks",
      "Job board talent profile",
    ],
    seats: "1 seat",
    sessions: "50 Q sessions / month",
    cta: "Join the Vanguard",
    emphasis: true,
  },
  {
    slug: "vanguard-pro",
    name: "Vanguard Pro",
    price: "$49",
    cadence: "/ month",
    altPrice: "or $490 / year",
    blurb: "For senior operators who run their week through Q.",
    highlights: [
      "Everything in Individual",
      "Early-access Codex alerts",
      "1 free Sponsored Job Posting / quarter",
      "Senior Executive sub-channels",
    ],
    seats: "1 seat",
    sessions: "150 Q sessions / month",
    cta: "Go Pro",
  },
  {
    slug: "team-starter",
    name: "Team Starter",
    price: "$499",
    cadence: "/ month",
    blurb: "A pod-sized rollout with shared compute and central billing.",
    highlights: [
      "Centralized billing panel",
      "Shared team Codex workspace",
      "Collaborative download library",
      "Priority support queue",
    ],
    seats: "Up to 5 seats",
    sessions: "500 pooled Q sessions / month",
    cta: "Start a team",
  },
  {
    slug: "team-growth",
    name: "Team Growth",
    price: "$999",
    cadence: "/ month",
    blurb: "Scaled CS orgs with branded benchmarks and hiring leverage.",
    highlights: [
      "Everything in Team Starter",
      "White-labeled Quarterly Benchmark PDFs",
      "3 active Featured job listings / year",
      "Team analytics dashboard",
    ],
    seats: "Up to 15 seats",
    sessions: "1,500 pooled Q sessions / month",
    cta: "Scale the team",
  },
  {
    slug: "enterprise",
    name: "Enterprise License",
    price: "$2,500",
    cadence: "/ month",
    blurb: "A direct line to the editorial team and a dedicated channel.",
    highlights: [
      "Live quarterly briefing call with editorial",
      "Custom onboarding modules",
      "Dedicated Slack channel",
      "Custom RAG corpus extensions",
    ],
    seats: "Up to 50 seats",
    sessions: "5,000 pooled Q sessions / month",
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
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-12 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">Membership Matrix</div>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-6">
            Six tiers. <span className="italic">One discipline.</span>
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto text-pretty">
            From a free weekly briefing to a 50-seat Enterprise license with Q&nbsp;agent sessions and white-labeled benchmarks.
          </p>
        </section>

        {/* Tier matrix */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TIERS.map((t) => (
              <div
                key={t.slug}
                className={
                  "flex flex-col p-8 border " +
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
                    <div className="font-mono text-[9px] uppercase tracking-widest text-foreground/50 mb-1">Q sessions</div>
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
              </div>
            ))}
          </div>
        </section>

        {/* Hiring CTA */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="border border-border bg-card p-10 md:p-12 flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="flex-1">
              <div className="font-mono text-[10px] uppercase tracking-widest text-secondary-accent mb-3">
                For employers
              </div>
              <h2 className="font-display text-3xl md:text-4xl leading-tight mb-3">
                Hiring CS operators? <span className="italic">Post on the Quarterly.</span>
              </h2>
              <p className="text-sm text-foreground/70 max-w-prose">
                Listings ship inside the Tuesday dispatch and the standalone job board. Standard postings from $299, Executive Search at $1,500 flat.
              </p>
            </div>
            <Link
              to="/job-board"
              className="shrink-0 px-6 py-3.5 border border-foreground font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-foreground hover:text-background transition-all"
            >
              See recruiter options
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
