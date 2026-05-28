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
          .select("tier, status, designation")
          .eq("user_id", user!.id)
          .eq("status", "active")
          .maybeSingle(),
      ]);

      // Legacy tier (for back-compat consumers).
      const tier: TierSlug = (isAdmin ? "enterprise" : (sub?.tier as TierSlug | undefined)) ?? "free";

      // New designation.
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

      return {
        tier,
        rank: LEGACY_RANK[tier] ?? 0,
        designation,
        dRank: rank(designation),
      };
    },
  });

  const tier = (q.data?.tier ?? "free") as TierSlug;
  const legacyRank = q.data?.rank ?? 0;
  const designation: Designation = q.data?.designation ?? "reader";
  const dRank = q.data?.dRank ?? 0;

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
    loading: loading || q.isLoading,
  };
}
