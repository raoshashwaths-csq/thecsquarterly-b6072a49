// Tier-awareness facade for UI layers.
// Wraps useAuth + useEntitlements + getMonthlyQUsage so components can branch
// on a single, stable shape instead of stitching the pieces themselves.
//
// IMPORTANT: this is a thin layer — server-side gating still lives in
// requireSupabaseAuth + assertQUnderCap. This hook is purely for rendering.

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { getMonthlyQUsage } from "@/lib/q-usage.functions";
import {
  type Designation,
  Q_MONTHLY_CAP,
  READER_WEEKLY_CAP,
  DESIGNATION_RANK,
  nextTier,
} from "@/lib/entitlements";

/** UI-facing tier slug. `free` = logged in, no paid sub. `visitor` = no session. */
export type UiTier =
  | "visitor"
  | "free"
  | "practitioner"
  | "operator"
  | "team"
  | "scale"
  | "enterprise";

/**
 * UI-facing tier names used by the tier-copy hierarchy. Mirrors the keys
 * of the TIER_COPY registry plus `enterprise` for above-Scale states.
 * visitor < free < reader < practitioner < operator < team < scale
 */
export type AccessTier =
  | "visitor"
  | "free"
  | "reader"
  | "practitioner"
  | "operator"
  | "team"
  | "scale";

const ACCESS_RANK: Record<AccessTier, number> = {
  visitor: 0,
  free: 1,
  reader: 2,
  practitioner: 3,
  operator: 4,
  team: 5,
  scale: 6,
};

export type SubscriptionTier = {
  isLoggedIn: boolean;
  loading: boolean;
  tier: UiTier;
  designation: Designation; // server-truth designation
  displayName: string;
  isTeamLeader: boolean;
  lumiSessionsUsed: number;
  lumiSessionsAllowed: number; // 0 for visitor; weekly for free; monthly otherwise
  canAccessCSFactors: boolean; // practitioner+
  canAccessLumi: boolean; // free+ (with caps)
  canAccessCommunity: boolean; // practitioner+ (was "reader+" in spec — Reader == free here)
  canAccessTeamFeatures: boolean; // team+
  upgradePromptTier: Designation;
  /**
   * Generic tier-gate helper. Returns true when the current user's tier sits
   * at or above the required tier. Reader-the-designation in this codebase
   * equals the logged-in free state, so canAccess("reader") is true for any
   * logged-in user with no paid subscription.
   */
  canAccess: (requiredTier: AccessTier) => boolean;
};

function isoWeekKey(d = new Date()): string {
  // YYYY-Www (UTC). Cheap, stable per week.
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const FREE_LUMI_KEY = "cs_free_lumi_week";

/** Did the free (Reader) user already use their 1 weekly Lumi session? */
export function readFreeLumiUsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(FREE_LUMI_KEY);
    if (!raw) return false;
    const v = JSON.parse(raw) as { week?: string; used?: number };
    return v.week === isoWeekKey() && (v.used ?? 0) >= READER_WEEKLY_CAP;
  } catch {
    return false;
  }
}

/** Mark the free weekly Lumi session as consumed for this ISO week. */
export function markFreeLumiUsed(): void {
  if (typeof window === "undefined") return;
  const week = isoWeekKey();
  window.localStorage.setItem(
    FREE_LUMI_KEY,
    JSON.stringify({ week, used: READER_WEEKLY_CAP }),
  );
}

function deriveDisplayName(meta: Record<string, unknown> | undefined, email: string | null): string {
  const dn = meta?.display_name as string | undefined;
  const full = meta?.full_name as string | undefined;
  const given = meta?.given_name as string | undefined;
  const first = (dn ?? given ?? full ?? "").split(/\s+/)[0];
  if (first) return first;
  if (email) return email.split("@")[0];
  return "there";
}

export function useSubscriptionTier(): SubscriptionTier {
  const { user, loading: authLoading } = useAuth();
  const ent = useEntitlements();
  const getUsage = useServerFn(getMonthlyQUsage);

  const usageQ = useQuery({
    queryKey: ["lumi-usage", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: () => getUsage(),
  });

  const loading = authLoading || ent.loading || (!!user && usageQ.isLoading);

  // UI tier resolution
  let tier: UiTier;
  if (!user) tier = "visitor";
  else if (ent.designation === "reader") tier = "free";
  else if (ent.designation === "strategic_partner") tier = "enterprise";
  else tier = ent.designation as UiTier;

  const isTeamLeader = false; // no users.is_team_leader column — derive later when team data lands.

  // Lumi accounting
  const monthlyUsed = usageQ.data?.used ?? 0;
  const monthlyCap = usageQ.data?.cap ?? Q_MONTHLY_CAP[ent.designation] ?? 0;
  let lumiSessionsUsed = monthlyUsed;
  let lumiSessionsAllowed = monthlyCap;

  if (tier === "visitor") {
    lumiSessionsUsed = 0;
    lumiSessionsAllowed = 0;
  } else if (tier === "free") {
    lumiSessionsAllowed = READER_WEEKLY_CAP;
    lumiSessionsUsed = readFreeLumiUsed() ? READER_WEEKLY_CAP : 0;
  }

  const dRank = DESIGNATION_RANK[ent.designation] ?? 0;

  // Map the runtime UiTier onto the AccessTier hierarchy so canAccess() can
  // answer questions phrased in the registry's vocabulary.
  const accessTier: AccessTier =
    tier === "enterprise" ? "scale" : (tier as AccessTier);
  const currentRank = ACCESS_RANK[accessTier];
  const canAccess = (requiredTier: AccessTier): boolean =>
    currentRank >= ACCESS_RANK[requiredTier];

  return {
    isLoggedIn: !!user,
    loading,
    tier,
    designation: ent.designation,
    displayName: deriveDisplayName(
      user?.user_metadata as Record<string, unknown> | undefined,
      user?.email ?? null,
    ),
    isTeamLeader,
    lumiSessionsUsed,
    lumiSessionsAllowed,
    canAccessCSFactors: dRank >= DESIGNATION_RANK.practitioner,
    canAccessLumi: tier !== "visitor",
    canAccessCommunity: dRank >= DESIGNATION_RANK.practitioner,
    canAccessTeamFeatures: dRank >= DESIGNATION_RANK.team,
    upgradePromptTier: nextTier(ent.designation),
    canAccess,
  };
}
