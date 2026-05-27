import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type TierSlug =
  | "free"
  | "vanguard"
  | "vanguard-individual"
  | "vanguard-pro"
  | "team-starter"
  | "team-growth"
  | "enterprise";

/** Tier hierarchy — index = capability rank. */
const RANK: Record<TierSlug, number> = {
  "free": 0,
  "vanguard": 1, // legacy alias for individual
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
      // Admin override
      const [{ data: isAdmin }, { data: sub }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" }),
        supabase
          .from("subscriptions")
          .select("tier, status")
          .eq("user_id", user!.id)
          .eq("status", "active")
          .maybeSingle(),
      ]);
      const tier: TierSlug = (isAdmin ? "enterprise" : (sub?.tier as TierSlug | undefined)) ?? "free";
      return { tier, rank: RANK[tier] ?? 0 };
    },
  });

  const tier = (q.data?.tier ?? "free") as TierSlug;
  const rank = q.data?.rank ?? 0;
  return {
    tier,
    rank,
    loading: loading || q.isLoading,
    // Universal search → Vanguard Individual and up
    canUniversalSearch: rank >= RANK["vanguard-individual"],
    // Workspace → Vanguard Pro and up
    canWorkspace: rank >= RANK["vanguard-pro"],
    isPaying: rank >= RANK["vanguard-individual"],
  };
}
