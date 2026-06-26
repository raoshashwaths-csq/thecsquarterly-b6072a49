// Selector hook over the centralized TIER_COPY registry.
// Reads the current designation from useSubscriptionTier and returns the
// matching copy for the requested feature, plus a tier-aware destination
// for the CTA so cards route to /login, /pricing, or the feature itself
// depending on entitlement.
//
// Re-renders automatically when auth state changes (the underlying
// useEntitlements query is invalidated on onAuthStateChange in
// src/routes/__root.tsx).

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

// ─────────────────────────────────────────────────────────────────────────────
// Tier-aware CTA routing.
// One row per feature. Each row maps the user's tier-copy key onto the
// destination path the CTA should navigate to. Routing follows three states:
//   • visitor  → /login                       (sign in / sign up)
//   • locked   → /pricing                     (upgrade required)
//   • unlocked → the feature's own route      (direct access)
// Diagnostics is special-cased because the free score is available to
// everyone, so visitors and free users both deep-link to /diagnostics.
// ─────────────────────────────────────────────────────────────────────────────
const CTA_ROUTES: Record<FeatureId, Record<TierCopyKey, string>> = {
  "codex-library": {
    visitor: "/login",
    free: "/pricing",
    reader: "/codex",
    practitioner: "/codex",
    operator: "/codex",
    team: "/codex",
    scale: "/codex",
  },
  "codex-individual-playbook": {
    visitor: "/login",
    free: "/pricing",
    reader: "/codex",
    practitioner: "/codex",
    operator: "/codex",
    team: "/codex",
    scale: "/codex",
  },
  diagnostics: {
    visitor: "/diagnostics",
    free: "/diagnostics",
    reader: "/diagnostics",
    practitioner: "/diagnostics",
    operator: "/diagnostics",
    team: "/diagnostics",
    scale: "/diagnostics",
  },
  lumi: {
    visitor: "/login",
    free: "/agent/framework",
    reader: "/agent/framework",
    practitioner: "/agent/framework",
    operator: "/agent/framework",
    team: "/agent/framework",
    scale: "/agent/framework",
  },
  csfactors: {
    visitor: "/login",
    free: "/pricing",
    reader: "/pricing",
    practitioner: "/csfactors",
    operator: "/csfactors",
    team: "/csfactors",
    scale: "/csfactors",
  },
  "map-engine": {
    visitor: "/login",
    free: "/pricing",
    reader: "/pricing",
    practitioner: "/csfactors/maps",
    operator: "/csfactors/maps",
    team: "/csfactors/maps",
    scale: "/csfactors/maps",
  },
  "ebr-builder": {
    visitor: "/login",
    free: "/pricing",
    reader: "/pricing",
    practitioner: "/pricing",
    operator: "/csfactors",
    team: "/csfactors",
    scale: "/csfactors",
  },
  "cta-engine": {
    visitor: "/login",
    free: "/pricing",
    reader: "/pricing",
    practitioner: "/csfactors/ctas",
    operator: "/csfactors/ctas",
    team: "/csfactors/ctas",
    scale: "/csfactors/ctas",
  },
  community: {
    visitor: "/login",
    free: "/pricing",
    reader: "/pricing",
    practitioner: "/pricing",
    operator: "/pricing",
    team: "/pricing",
    scale: "/pricing",
  },
  "job-board": {
    visitor: "/login",
    free: "/pricing",
    reader: "/pricing",
    practitioner: "/pricing",
    operator: "/pricing",
    team: "/pricing",
    scale: "/pricing",
  },
  whatsapp: {
    visitor: "/login",
    free: "/pricing",
    reader: "/pricing",
    practitioner: "/account",
    operator: "/account",
    team: "/account",
    scale: "/account",
  },
  "expansion-engine": {
    visitor: "/login",
    free: "/pricing",
    reader: "/pricing",
    practitioner: "/pricing",
    operator: "/csfactors",
    team: "/csfactors",
    scale: "/csfactors",
  },
  "retention-ledger": {
    visitor: "/insights",
    free: "/insights",
    reader: "/insights",
    practitioner: "/insights",
    operator: "/insights",
    team: "/insights",
    scale: "/insights",
  },
};

export type TierCopyResult = TierCopyEntry & {
  /** Tier-aware destination for the CTA. */
  ctaHref: string;
  /** Which row of the registry was matched. */
  tierKey: TierCopyKey;
};

export function useTierCopy(featureId: FeatureId): TierCopyResult {
  const { isLoggedIn, designation } = useSubscriptionTier();
  const key = copyKeyFor(isLoggedIn, designation);
  const config = TIER_COPY[featureId];
  const entry = config[key] ?? config.visitor;
  const ctaHref = CTA_ROUTES[featureId][key] ?? CTA_ROUTES[featureId].visitor;
  return { ...entry, ctaHref, tierKey: key };
}

export type { FeatureId, TierCopyEntry, TierCopyKey };
