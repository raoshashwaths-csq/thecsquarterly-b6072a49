// Shared (client + server safe) tier vocabulary + rank.
// No Supabase imports here so this can be used in browser hooks and server fns.

export type Designation =
  | "reader"
  | "practitioner"
  | "operator"
  | "team"
  | "scale"
  | "enterprise"
  | "strategic_partner";

export const DESIGNATION_RANK: Record<Designation, number> = {
  reader: 0,
  practitioner: 1,
  operator: 2,
  team: 3,
  scale: 4,
  enterprise: 5,
  strategic_partner: 6,
};

export const DESIGNATION_LABEL: Record<Designation, string> = {
  reader: "Reader",
  practitioner: "Practitioner",
  operator: "Operator",
  team: "Team",
  scale: "Scale",
  enterprise: "Enterprise",
  strategic_partner: "Strategic Partner",
};

/** Monthly Q-agent interaction cap. Infinity = no cap. */
export const Q_MONTHLY_CAP: Record<Designation, number> = {
  reader: 0,
  practitioner: 30,
  operator: 100,
  team: 400,
  scale: 1000,
  enterprise: Number.POSITIVE_INFINITY,
  strategic_partner: Number.POSITIVE_INFINITY,
};

/** Map legacy `subscriptions.tier` strings to the new designation vocabulary. */
export function tierToDesignation(tier: string | null | undefined): Designation {
  switch (tier) {
    case "vanguard":
    case "vanguard-individual":
      return "practitioner";
    case "vanguard-pro":
      return "operator";
    case "team-starter":
      return "team";
    case "team-growth":
      return "scale";
    case "enterprise":
      return "enterprise";
    case "free":
    default:
      return "reader";
  }
}

export function rank(d: Designation): number {
  return DESIGNATION_RANK[d] ?? 0;
}

export function atLeast(d: Designation, min: Designation): boolean {
  return rank(d) >= rank(min);
}

/** Next paid tier above `d` (for upgrade CTAs). */
export function nextTier(d: Designation): Designation {
  const order: Designation[] = [
    "reader",
    "practitioner",
    "operator",
    "team",
    "scale",
    "enterprise",
  ];
  const i = order.indexOf(d);
  if (i < 0 || i >= order.length - 1) return "enterprise";
  return order[i + 1];
}
