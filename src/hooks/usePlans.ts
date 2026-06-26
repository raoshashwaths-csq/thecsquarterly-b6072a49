// usePlans — reads live subscription_plans from DB and shapes them into the
// existing Tier[] type so /pricing and /subscribe render the live catalog.
// Falls back to the static TIERS list while the query is loading or empty
// (offline / first paint).

import { useQuery } from "@tanstack/react-query";
import { listPublishedPlans, type PublicPlan, type PublicFeature, type PublicAssignment, type PlansBundle } from "@/lib/plans.functions";
import { TIERS, type Tier, type Designation } from "@/lib/tiers";

const VALID_DESIGNATIONS: Designation[] = [
  "reader",
  "practitioner",
  "operator",
  "team",
  "scale",
  "enterprise",
  "strategic_partner",
];

function isValidDesignation(d: string): d is Designation {
  return (VALID_DESIGNATIONS as string[]).includes(d);
}

/**
 * Convert a DB plan + its assignments into the existing Tier shape.
 * "features" string list comes from joined plan_feature_assignments, with
 * marketing_label_override taking precedence over the feature's label.
 */
export function planToTier(
  plan: PublicPlan,
  features: PublicFeature[],
  assignments: PublicAssignment[],
): Tier | null {
  if (!isValidDesignation(plan.designation)) return null;
  const featureById = new Map(features.map((f) => [f.id, f]));
  const myAssigns = assignments
    .filter((a) => a.plan_id === plan.id && a.enabled)
    .map((a) => ({ a, f: featureById.get(a.feature_id) }))
    .filter((x): x is { a: PublicAssignment; f: PublicFeature } => !!x.f)
    .sort((x, y) => x.f.display_order - y.f.display_order);

  const bullets: string[] = myAssigns.map(({ a, f }) => {
    if (a.marketing_label_override) return a.marketing_label_override;
    if (f.kind === "numeric" && a.numeric_value !== null) {
      const v = a.numeric_value >= 9999 ? "Unlimited" : a.numeric_value.toLocaleString();
      return `${f.label} — ${v}`;
    }
    return f.label;
  });

  return {
    designation: plan.designation,
    label: plan.label,
    tagline: plan.tagline,
    priceMonthly: plan.price_monthly_display,
    priceMonthlyValue: Math.round(plan.price_monthly_cents / 100),
    priceAnnual: plan.price_annual_display ?? undefined,
    contactOnly: plan.contact_only || undefined,
    seatCap: plan.seat_cap_display,
    qCap: plan.q_cap_display,
    band: plan.band,
    highlight: plan.highlight || undefined,
    highlightLabel: plan.highlight_label ?? undefined,
    features: bullets,
    cta: plan.cta_label,
    ctaKind: plan.cta_kind,
  };
}

export function bundleToTiers(bundle: PlansBundle): Tier[] {
  return bundle.plans
    .map((p) => planToTier(p, bundle.features, bundle.assignments))
    .filter((t): t is Tier => !!t);
}

export function usePlans(): { tiers: Tier[]; bundle: PlansBundle | null; loading: boolean } {
  const q = useQuery({
    queryKey: ["plans:public"],
    queryFn: () => listPublishedPlans(),
    staleTime: 30_000,
  });
  const tiers = q.data ? bundleToTiers(q.data) : null;
  return {
    tiers: tiers && tiers.length > 0 ? tiers : TIERS,
    bundle: q.data ?? null,
    loading: q.isLoading,
  };
}

/** Returns the user-feature map derived from their plan (or admin = all true). */
export function bundleFeatureCodes(bundle: PlansBundle): string[] {
  return bundle.features.map((f) => f.code);
}
