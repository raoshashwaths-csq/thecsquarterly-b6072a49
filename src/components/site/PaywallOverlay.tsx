// In-context paywall overlay. Replaces the historical "redirect to /pricing"
// pattern. Renders on top of a blurred preview so the reader can see there is
// real content behind the gate — never blank-page-blocks them.
//
// Copy varies by current tier (from useSubscriptionTier) and by gate kind.
// CTAs use TanStack <Link> against existing routes — no hardcoded URLs.

import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useSubscriptionTier, type UiTier } from "@/hooks/useSubscriptionTier";
import { getTier } from "@/lib/tiers";

export type PaywallGate = "article" | "codex" | "csfactors" | "lumi";

type Props = {
  gate: PaywallGate;
  /** Optional override; when omitted the overlay reads tier from the hook. */
  tier?: UiTier;
  /** Free-only: invoked by the secondary CTA to reveal one more paragraph. */
  onContinueFree?: () => void;
  /** Whether the secondary "continue" affordance is still available. */
  continueAvailable?: boolean;
};

type Copy = {
  headline: string;
  subhead: string;
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel?: string;
  secondaryTo?: string;
  price?: string;
};

function copyFor(gate: PaywallGate, tier: UiTier, continueAvailable: boolean): Copy {
  const practitioner = getTier("practitioner");
  const practitionerPrice = practitioner?.priceMonthly ?? "$39";

  if (tier === "visitor") {
    return {
      headline: "This piece continues.",
      subhead:
        "Create a free account to read the full brief, access the AI Readiness diagnostic, and try Lumi once this week.",
      primaryLabel: "Create free account",
      primaryTo: "/login",
      secondaryLabel: "Sign in",
      secondaryTo: "/login",
    };
  }

  if (tier === "free") {
    if (gate === "csfactors") {
      return {
        headline: "CSFactors is a Practitioner feature.",
        subhead:
          "Practitioner unlocks CSFactors, every Codex playbook, the full archive, and 50 Lumi sessions a month.",
        price: `${practitionerPrice} per month. Cancel any time.`,
        primaryLabel: `Upgrade to Practitioner (${practitionerPrice}/mo)`,
        primaryTo: "/pricing",
        secondaryLabel: "See plans →",
        secondaryTo: "/pricing",
      };
    }
    return {
      headline: "This is a Practitioner piece.",
      subhead:
        "Practitioner members get unlimited access to every article, the full Codex library (six playbooks), 50 Lumi sessions per month, and the CSFactors dashboard.",
      price: `${practitionerPrice} per month. Cancel any time.`,
      primaryLabel: "Upgrade to Practitioner",
      primaryTo: "/pricing",
      secondaryLabel: continueAvailable ? "Continue reading for free →" : "See plans →",
      // secondaryTo intentionally omitted when continueAvailable — handler runs instead.
      secondaryTo: continueAvailable ? undefined : "/pricing",
    };
  }

  // Paid tier hitting a higher-tier gate
  if (gate === "csfactors") {
    return {
      headline: "CSFactors requires Practitioner.",
      subhead:
        "Your current plan gives you the full editorial layer. CSFactors adds the operating dashboard on top of that.",
      price: `${practitionerPrice} per month. Cancel any time.`,
      primaryLabel: `Upgrade to Practitioner (${practitionerPrice}/mo)`,
      primaryTo: "/pricing",
      secondaryLabel: "Stay on current plan",
      secondaryTo: "/account",
    };
  }

  return {
    headline: "Upgrade to continue.",
    subhead: "This content sits a tier above your current plan.",
    primaryLabel: "See plans",
    primaryTo: "/pricing",
  };
}

export function PaywallOverlay({ gate, tier: tierOverride, onContinueFree, continueAvailable }: Props) {
  const sub = useSubscriptionTier();
  const tier = tierOverride ?? sub.tier;
  const allowContinue =
    tier === "free" && gate === "article" && !!onContinueFree && (continueAvailable ?? true);
  const copy = copyFor(gate, tier, allowContinue);

  return (
    <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-12 pb-20 pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-2xl mx-6 bg-background border border-border shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)] p-8 md:p-10 animate-fade-up"
        role="dialog"
        aria-label="Continue reading"
      >
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-secondary-accent mb-5">
          <Lock size={12} />
          <span>Continue reading</span>
        </div>

        <h3 className="font-display text-3xl md:text-4xl leading-tight tracking-tight mb-4 text-balance">
          {copy.headline}
        </h3>
        <p className="text-base text-foreground/75 leading-relaxed mb-4 text-pretty">
          {copy.subhead}
        </p>
        {copy.price && (
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-foreground/60 mb-6">
            {copy.price}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            to={copy.primaryTo}
            className="inline-flex items-center justify-center bg-accent text-accent-foreground font-mono text-xs uppercase tracking-[0.22em] px-5 py-3 hover:opacity-90 transition-opacity"
          >
            {copy.primaryLabel}
          </Link>
          {allowContinue ? (
            <button
              type="button"
              onClick={onContinueFree}
              className="inline-flex items-center justify-center border border-border text-foreground font-mono text-xs uppercase tracking-[0.22em] px-5 py-3 hover:border-foreground transition-colors"
            >
              {copy.secondaryLabel}
            </button>
          ) : copy.secondaryLabel && copy.secondaryTo ? (
            <Link
              to={copy.secondaryTo}
              className="inline-flex items-center justify-center border border-border text-foreground font-mono text-xs uppercase tracking-[0.22em] px-5 py-3 hover:border-foreground transition-colors"
            >
              {copy.secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Wraps content so it can be partially or fully blurred behind the overlay. */
export function PaywallBlur({ children, full = false }: { children: React.ReactNode; full?: boolean }) {
  return (
    <div className="relative">
      <div className={full ? "select-none pointer-events-none blur-md opacity-60" : "select-none pointer-events-none blur-[3px] opacity-80"}>
        {children}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background/80" />
    </div>
  );
}
