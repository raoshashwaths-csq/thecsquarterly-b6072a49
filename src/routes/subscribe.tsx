import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterInline } from "@/components/site/NewsletterInline";
import { QMark } from "@/components/site/QMark";
import { TIERS, getTier, tierMailto, type Designation } from "@/lib/tiers";
import { useAuth } from "@/hooks/useAuth";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { priceIdFor, type Cadence } from "@/lib/price-map";

const DESIGNATIONS = new Set<string>(TIERS.map((t) => t.designation));

type SubscribeSearch = { tier?: Designation };

function validateSearch(input: Record<string, unknown>): SubscribeSearch {
  const t = input.tier;
  if (typeof t === "string" && DESIGNATIONS.has(t)) {
    return { tier: t as Designation };
  }
  return {};
}

export const Route = createFileRoute("/subscribe")({
  validateSearch,
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
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-6">
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
  const [cadence, setCadence] = useState<Cadence>("monthly");
  const [checkingOut, setCheckingOut] = useState(false);

  const priceId = priceIdFor(designation, cadence);
  const annualSaving =
    tier.priceMonthlyValue > 0
      ? `Save ~$${(tier.priceMonthlyValue * 12 - tier.priceMonthlyValue * 10).toLocaleString()} a year`
      : "";

  const onCheckout = () => {
    if (tier.ctaKind === "contact" || !priceId) {
      window.location.href = tierMailto(tier.label);
      return;
    }
    if (!user) {
      window.location.href = `/login?return=/subscribe?tier=${designation}`;
      return;
    }
    setCheckingOut(true);
  };

  if (checkingOut && priceId && user) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-16 animate-fade-up">
        <button
          type="button"
          onClick={() => setCheckingOut(false)}
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-foreground/60 hover:text-foreground mb-8"
        >
          <ArrowLeft size={12} />
          Back
        </button>
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-3">
          Secure checkout · {cadence === "monthly" ? "Monthly" : "Annual"}
        </div>
        <h1 className="font-display text-3xl tracking-tight mb-6">{tier.label}.</h1>
        <StripeEmbeddedCheckout
          priceId={priceId}
          userId={user.id}
          customerEmail={user.email ?? undefined}
        />
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto px-6 py-20 animate-fade-up">
      <Link
        to="/pricing"
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-foreground/60 hover:text-foreground mb-8"
      >
        <ArrowLeft size={12} />
        Back to pricing
      </Link>

      <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-4">
        Confirm your plan
      </div>
      <h1 className="font-display text-5xl md:text-6xl leading-[0.95] tracking-tight text-balance mb-4">
        {tier.label}.
      </h1>
      <p className="text-lg text-foreground/70 max-w-2xl mb-10">{tier.tagline}</p>

      <div className="border-2 border-accent bg-card p-8">
        {priceId && (
          <div className="inline-flex border border-border mb-6">
            <button
              type="button"
              onClick={() => setCadence("monthly")}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] ${cadence === "monthly" ? "bg-foreground text-background" : "text-foreground/60"}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCadence("yearly")}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] ${cadence === "yearly" ? "bg-foreground text-background" : "text-foreground/60"}`}
            >
              Annual · 2 mo free
            </button>
          </div>
        )}

        <div className="flex items-baseline gap-3 mb-1">
          <span className="font-display text-6xl leading-none">
            {cadence === "yearly" && tier.priceMonthlyValue > 0
              ? `$${(tier.priceMonthlyValue * 10).toLocaleString()}`
              : tier.priceMonthly}
          </span>
          <span className="text-sm text-muted-foreground">
            {tier.priceMonthlyValue === 0 ? "" : cadence === "yearly" ? "/ year" : "/ month"}
          </span>
        </div>
        {cadence === "yearly" && annualSaving && (
          <div className="text-xs text-secondary-accent mb-6">{annualSaving}</div>
        )}
        {cadence === "monthly" && tier.priceAnnual && (
          <div className="text-xs text-muted-foreground mb-6">{tier.priceAnnual}</div>
        )}

        <div className="grid grid-cols-2 gap-3 my-6 pb-6 border-b border-border">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-foreground/50 mb-1">
              Seats
            </div>
            <div className="text-sm font-medium">{tier.seatCap}</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-foreground/50 mb-1">
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
          className="block w-full py-3.5 text-center font-mono text-xs uppercase tracking-[0.25em] bg-accent text-accent-foreground hover:opacity-90 transition-all"
        >
          {tier.ctaKind === "contact"
            ? tier.cta
            : !user
              ? "Sign in to continue"
              : "Continue to checkout"}
        </button>

        {tier.ctaKind !== "contact" && (
          <p className="text-xs text-foreground/55 text-center mt-4">
            Cancel any time — access continues until the end of your billing period.
          </p>
        )}
      </div>
    </section>
  );
}
