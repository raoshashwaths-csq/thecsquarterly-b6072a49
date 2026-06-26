// Selector hook over the centralized TIER_COPY registry.
// Reads the current designation from useSubscriptionTier and returns the
// matching copy for the requested feature. Re-renders automatically when
// auth state changes (the underlying useEntitlements query is invalidated
// on onAuthStateChange in src/routes/__root.tsx).

import { useSubscriptionTier } from "@/hooks/useSubscriptionTier";
import TIER_COPY, {
  type FeatureId,
  type TierCopyEntry,
  type TierCopyKey,
} from "@/config/tierCopyConfig";
import type { Designation } from "@/lib/entitlements";

/**
 * Map the canonical 8-state designation (plus visitor) onto the 7 keys the
 * copy registry authors against. Reader-the-designation == logged-in free in
 * this codebase, so it lands on the `free` key. The standalone `reader` key
 * is reserved for the future $19 Reader tier referenced in the registry
 * (not currently sold).
 */
function copyKeyFor(
  isLoggedIn: boolean,
  designation: Designation,
): TierCopyKey {
  if (!isLoggedIn) return "visitor";
  switch (designation) {
    case "reader":
      return "free";
    case "practitioner":
      return "practitioner";
    case "operator":
      return "operator";
    case "team":
      return "team";
    case "scale":
      return "scale";
    case "enterprise":
    case "strategic_partner":
      // Above-scale partners receive scale-tier copy; never see upgrade nags.
      return "scale";
  }
}

export function useTierCopy(featureId: FeatureId): TierCopyEntry {
  const { isLoggedIn, designation } = useSubscriptionTier();
  const key = copyKeyFor(isLoggedIn, designation);
  const config = TIER_COPY[featureId];
  // Type system guarantees both keys exist; fall back defensively anyway.
  return config[key] ?? config.visitor;
}

export type { FeatureId, TierCopyEntry, TierCopyKey };
