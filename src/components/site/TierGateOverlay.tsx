import { Link, useRouter } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { DESIGNATION_LABEL, type Designation } from "@/lib/entitlements";

type Props = {
  /** Minimum tier required to unlock the gated surface. */
  requiredTier: Designation;
  /** Eyebrow line above the headline. Defaults to "Tier required". */
  eyebrow?: string;
  /** Display headline inside the gate card. */
  title: string;
  /** Body copy explaining what unlocks. */
  description: string;
  /** Optional primary CTA label override. */
  ctaLabel?: string;
  /** Optional ghost / secondary CTA label override. */
  secondaryLabel?: string;
};

/**
 * Full-bleed Parchment-styled gate. Renders behind a blurred backdrop and
 * centers an upgrade card. Used in place of a route body when the current
 * user's designation is below the required tier.
 */
export function TierGateOverlay({
  requiredTier,
  eyebrow = "Tier required",
  title,
  description,
  ctaLabel,
  secondaryLabel = "Go back",
}: Props) {
  const router = useRouter();
  const tierLabel = DESIGNATION_LABEL[requiredTier];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      {/* Blurred backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 bg-background/70 backdrop-blur-xl"
      />

      {/* Card */}
      <div className="relative max-w-xl w-full bg-card border border-border shadow-[0_30px_80px_-30px_rgba(0,0,0,0.4)] p-8 md:p-12 animate-fade-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 inline-flex items-center justify-center border border-accent/40 text-accent">
            <Lock className="h-4 w-4" />
          </div>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent font-semibold">
            {eyebrow} · {tierLabel}+
          </div>
        </div>

        <h2 className="font-display text-3xl md:text-4xl leading-[1.05] tracking-tight text-balance mb-4">
          {title}
        </h2>

        <p className="font-body text-base text-foreground/75 leading-relaxed mb-8">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center px-6 py-3 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-[0.25em] hover:opacity-90 transition-opacity"
          >
            {ctaLabel ?? `Upgrade to ${tierLabel}`}
          </Link>
          <button
            type="button"
            onClick={() => router.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 border border-border text-foreground font-mono text-xs uppercase tracking-[0.25em] hover:border-foreground transition-colors"
          >
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
