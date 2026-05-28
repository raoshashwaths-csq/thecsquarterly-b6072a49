// Single source of truth for tier <-> price/label/cap mapping in the admin
// surfaces. Mirrors src/lib/tiers.ts (positioning-v4) but adds legacy aliases
// so rows that still carry the old `vanguard`/`vanguard-pro` slug keep
// working until they're migrated to `designation`.

import type { Designation } from "@/lib/tiers";

export type NormalizedTier = {
  designation: Designation | "free";
  label: string;
  priceCents: number;
  seatCap: number;       // numeric for math; 0 = n/a, 9999 = unlimited
  qCap: number;          // 0 = none, 9999 = unlimited
};

export const TIER_PRICE_CENTS: Record<string, number> = {
  reader: 0,
  practitioner: 2900,
  operator: 7900,
  team: 59900,
  scale: 149900,
  enterprise: 350000,
  strategic_partner: 800000,
  // Legacy aliases (DB rows from before designation rollout)
  free: 0,
  vanguard: 2900,            // → practitioner
  "vanguard-pro": 7900,      // → operator
};

export const TIER_LABEL: Record<string, string> = {
  reader: "Reader",
  practitioner: "Practitioner",
  operator: "Operator",
  team: "Team",
  scale: "Scale",
  enterprise: "Enterprise",
  strategic_partner: "Strategic Partner",
  free: "Reader",
  vanguard: "Practitioner",
  "vanguard-pro": "Operator",
};

export const TIER_SEAT_CAP: Record<string, number> = {
  reader: 1,
  practitioner: 1,
  operator: 1,
  team: 8,
  scale: 20,
  enterprise: 50,
  strategic_partner: 9999,
  free: 1,
  vanguard: 1,
  "vanguard-pro": 1,
};

export const TIER_Q_CAP: Record<string, number> = {
  reader: 0,
  practitioner: 30,
  operator: 100,
  team: 400,
  scale: 1000,
  enterprise: 9999,
  strategic_partner: 9999,
  free: 0,
  vanguard: 30,
  "vanguard-pro": 100,
};

const LEGACY_TO_NEW: Record<string, Designation | "free"> = {
  free: "free",
  vanguard: "practitioner",
  "vanguard-pro": "operator",
};

// The seven canonical paid tiers in display order (Reader excluded — it's
// free and used as the baseline).
export const PAID_DESIGNATIONS: Designation[] = [
  "practitioner",
  "operator",
  "team",
  "scale",
  "enterprise",
  "strategic_partner",
];

export const ALL_DESIGNATIONS: (Designation | "reader")[] = [
  "reader",
  "practitioner",
  "operator",
  "team",
  "scale",
  "enterprise",
  "strategic_partner",
];

export function normalizeTier(row: {
  tier?: string | null;
  designation?: string | null;
}): NormalizedTier {
  const raw = (row.designation ?? row.tier ?? "free").toLowerCase();
  const designation = (LEGACY_TO_NEW[raw] ?? raw) as Designation | "free";
  const key = designation;
  return {
    designation,
    label: TIER_LABEL[key] ?? "Reader",
    priceCents: TIER_PRICE_CENTS[key] ?? 0,
    seatCap: TIER_SEAT_CAP[key] ?? 1,
    qCap: TIER_Q_CAP[key] ?? 0,
  };
}

export function isPaid(designation: string): boolean {
  return designation !== "free" && designation !== "reader";
}
