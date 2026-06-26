import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  type Designation,
  DESIGNATION_RANK,
  Q_MONTHLY_CAP,
  rank,
  tierToDesignation,
} from "@/lib/entitlements";

// Legacy alias — keep prior callers working.
export type TierSlug =
  | "free"
  | "vanguard"
  | "vanguard-individual"
  | "vanguard-pro"
  | "team-starter"
  | "team-growth"
  | "enterprise";

const LEGACY_RANK: Record<TierSlug, number> = {
  "free": 0,
  "vanguard": 1,
  "vanguard-individual": 1,
  "vanguard-pro": 2,
  "team-starter": 3,
  "team-growth": 4,
  "enterprise": 5,
};

type FeatureRow = { enabled: boolean; value: number | null; kind: "boolean" | "numeric" };

export function useEntitlements() {
  const { user, loading } = useAuth();
  const q = useQuery({
    queryKey: ["entitlements", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const [{ data: isAdmin }, { data: sub }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" }),
        supabase
          .from("subscriptions")
          .select("tier, status, designation, plan_snapshot")
          .eq("user_id", user!.id)
          .eq("status", "active")
          .maybeSingle(),
      ]);

      const tier: TierSlug = (isAdmin ? "enterprise" : (sub?.tier as TierSlug | undefined)) ?? "free";

      let designation: Designation;
      if (isAdmin) {
        designation = "strategic_partner";
      } else if (sub) {
        const raw = ((sub as { designation?: string | null }).designation ?? null) as
          | Designation
          | null;
        designation = raw ?? tierToDesignation(sub.tier);
      } else {
        designation = "reader";
      }

      // Feature map: prefer plan_snapshot (grandfathered), else fetch live
      // assignments for the user's current designation.
      let features: Record<string, FeatureRow> = {};
      const snapshot = (sub as { plan_snapshot?: { features?: Record<string, FeatureRow> } | null } | null)?.plan_snapshot;
      if (snapshot?.features) {
        features = snapshot.features;
      } else {
        const { data: planRow } = await supabase
          .from("subscription_plans")
          .select("id")
          .eq("designation", designation)
          .maybeSingle();
        if (planRow?.id) {
          const { data: assigns } = await supabase
            .from("plan_feature_assignments")
            .select("enabled, numeric_value, feature_id, plan_features(code, kind)")
            .eq("plan_id", planRow.id);
          for (const a of (assigns ?? []) as Array<{
            enabled: boolean;
            numeric_value: number | null;
            plan_features: { code: string; kind: "boolean" | "numeric" } | null;
          }>) {
            if (!a.plan_features) continue;
            features[a.plan_features.code] = {
              enabled: a.enabled,
              value: a.numeric_value,
              kind: a.plan_features.kind,
            };
          }
        }
      }

      return {
        tier,
        rank: LEGACY_RANK[tier] ?? 0,
        designation,
        dRank: rank(designation),
        features,
        isAdmin: !!isAdmin,
      };
    },
  });

  const tier = (q.data?.tier ?? "free") as TierSlug;
  const legacyRank = q.data?.rank ?? 0;
  const designation: Designation = q.data?.designation ?? "reader";
  const dRank = q.data?.dRank ?? 0;
  const features = q.data?.features ?? {};
  const isAdmin = q.data?.isAdmin ?? false;

  const hasFeature = (code: string): boolean => {
    if (isAdmin) return true;
    return !!features[code]?.enabled;
  };
  const featureValue = (code: string): number => {
    if (isAdmin) return Number.POSITIVE_INFINITY;
    const row = features[code];
    if (!row || !row.enabled) return 0;
    if (row.value === null) return 1;
    if (row.value >= 9999) return Number.POSITIVE_INFINITY;
    return row.value;
  };

  return {
    // legacy
    tier,
    rank: legacyRank,
    canUniversalSearch: legacyRank >= LEGACY_RANK["vanguard-individual"],
    canWorkspace: legacyRank >= LEGACY_RANK["vanguard-pro"],
    isPaying: legacyRank >= LEGACY_RANK["vanguard-individual"],
    // new
    designation,
    dRank,
    canExecAnalytics: dRank >= DESIGNATION_RANK.operator,
    canTeamScope: dRank >= DESIGNATION_RANK.team,
    canSSO: dRank >= DESIGNATION_RANK.scale,
    canBrandAssets: dRank >= DESIGNATION_RANK.scale,
    canApiKeys: dRank >= DESIGNATION_RANK.enterprise,
    qMonthlyCap: Q_MONTHLY_CAP[designation],
    // feature SKU map (DB-driven)
    features,
    hasFeature,
    featureValue,
    isAdmin,
    loading: loading || q.isLoading,
  };
}
