import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { toast } from "sonner";
import { Check, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterInline } from "@/components/site/NewsletterInline";
import { QMark } from "@/components/site/QMark";
import { TIERS, getTier, tierMailto, type Designation } from "@/lib/tiers";
import { useAuth } from "@/hooks/useAuth";
import { getMe, startSubscriptionPlaceholder } from "@/lib/auth.functions";

const DESIGNATIONS = TIERS.map((t) => t.designation) as [Designation, ...Designation[]];

const searchSchema = z.object({
  tier: fallback(z.enum(DESIGNATIONS), undefined as unknown as Designation).optional(),
});

export const Route = createFileRoute("/subscribe")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Subscribe — The CS Quarterly" },
      {
        name: "description",
        content:
          "Confirm your plan and join the CS operating platform with the industry's intelligence layer built in.",
      },
      { property: "og:title", content: "Subscribe to The CS Quarterly" },
      {
        property: "og:description",
        content: "Confirm your plan on the CS operating platform for senior operators.",
      },
      { property: "og:url", content: "/subscribe" },
    ],
    links: [{ rel: "canonical", href: "/subscribe" }],
  }),
  component: SubscribePage,
});

function SubscribePage() {
  const { tier: tierParam } = Route.useSearch();
  const tier = tierParam ? getTier(tierParam) : undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {tier ? <TierConfirm designation={tier.designation} /> : <FreeBriefingLanding />}
      </main>
      <SiteFooter />
    </div>
  );
}

function FreeBriefingLanding() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 animate-fade-up text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-6">
        The Weekly Dispatch
      </div>
      <h1 className="font-display text-6xl md:text-8xl leading-[0.95] tracking-tight text-balance mb-10 max-w-4xl">
        Read what the <span className="italic">best CS leaders</span> read.
      </h1>
      <p className="text-xl text-foreground/75 max-w-xl mb-8 text-pretty">
        Start free with the weekly briefing, or{" "}
        <Link to="/pricing" className="underline decoration-accent underline-offset-4">
          choose a tier
        </Link>{" "}
        to unlock the platform, the <QMark /> advisor, and the dashboard.
      </p>
      <div className="w-full max-w-xl">
        <NewsletterInline source="subscribe-page" cta="Subscribe" placeholder="you@company.com" />
      </div>
    </div>
  );
}

function TierConfirm({ designation }: { designation: Designation }) {
  const tier = getTier(designation)!;
  const { user } = useAuth();
  const fetchMe = useServerFn(getMe);
  const startSub = useServerFn(startSubscriptionPlaceholder);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), enabled: !!user });

  const onCheckout = async () => {
    if (tier.ctaKind === "contact") {
      window.location.href = tierMailto(tier.label);
      return;
    }
    if (!user) {
      window.location.href = "/login";
      return;
    }
    try {
      await startSub();
      toast.success(`${tier.label} activated (preview). Checkout wires up next release.`);
      me.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <section className="max-w-3xl mx-auto px-6 py-20 animate-fade-up">
      <Link
        to="/pricing"
        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/60 hover:text-foreground mb-8"
      >
        <ArrowLeft size={12} />
        Back to pricing
      </Link>

      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">
        Confirm your plan
      </div>
      <h1 className="font-display text-5xl md:text-6xl leading-[0.95] tracking-tight text-balance mb-4">
        {tier.label}.
      </h1>
      <p className="text-lg text-foreground/70 max-w-2xl mb-10">{tier.tagline}</p>

      <div className="border-2 border-accent bg-card p-8">
        <div className="flex items-baseline gap-3 mb-1">
          <span className="font-display text-6xl leading-none">{tier.priceMonthly}</span>
          <span className="text-sm text-muted-foreground">
            {tier.priceMonthlyValue === 0 ? "" : "/ month"}
          </span>
        </div>
        {tier.priceAnnual && (
          <div className="text-xs text-muted-foreground mb-6">{tier.priceAnnual}</div>
        )}

        <div className="grid grid-cols-2 gap-3 my-6 pb-6 border-b border-border">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-foreground/50 mb-1">
              Seats
            </div>
            <div className="text-sm font-medium">{tier.seatCap}</div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-foreground/50 mb-1">
              <QMark /> sessions
            </div>
            <div className="text-sm font-medium">{tier.qCap}</div>
          </div>
        </div>

        <ul className="space-y-2.5 mb-8">
          {tier.features.map((f) => (
            <li key={f} className="flex gap-2.5 text-sm">
              <Check size={14} className="mt-1 shrink-0 text-accent" />
              <span className="text-foreground/85">{f}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onCheckout}
          className="block w-full py-3.5 text-center font-mono text-[10px] uppercase tracking-[0.25em] bg-accent text-accent-foreground hover:opacity-90 transition-all"
        >
          {tier.ctaKind === "contact" ? tier.cta : "Continue to checkout"}
        </button>

        {tier.ctaKind !== "contact" && (
          <p className="text-xs text-foreground/55 text-center mt-4">
            Cancel or change tiers any time. Annual plans carry a two-month discount.
          </p>
        )}
      </div>
    </section>
  );
}
