// Reader-facing complexity signal derived from post metadata.
// Pure, no IO, no schema dependency beyond the existing Post shape.

import type { Post } from "@/lib/posts.functions";
import type { UiTier } from "@/hooks/useSubscriptionTier";

export type Complexity = "PRACTITIONER" | "OPERATOR" | "STRATEGIC";

const STRATEGIC_TIERS = new Set(["operator", "team", "scale", "enterprise"]);

export function deriveComplexity(
  post: Pick<Post, "section" | "tier" | "read_minutes">,
): Complexity {
  const mins = post.read_minutes ?? 0;
  if (post.section === "vanguard") return "STRATEGIC";
  if (post.tier && STRATEGIC_TIERS.has(post.tier)) return "STRATEGIC";
  if (mins >= 12) return "STRATEGIC";
  if (post.section === "retention-protocol") return "OPERATOR";
  if (mins >= 7 && mins <= 11) return "OPERATOR";
  return "PRACTITIONER";
}

export function estimateReadMinutes(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(3, Math.round(words / 220));
}

const COMPLEXITY_RANK: Record<Complexity, number> = {
  PRACTITIONER: 1,
  OPERATOR: 2,
  STRATEGIC: 3,
};

const TIER_COMPLEXITY: Record<UiTier, number> = {
  visitor: 0,
  free: 1,
  practitioner: 1,
  operator: 2,
  team: 2,
  scale: 3,
  enterprise: 3,
};

export type ComplexityCopy = {
  /** Muted styling for visitors / free; accent for paying readers. */
  muted: boolean;
  /** Tooltip text (visitors/free only). */
  tooltip?: string;
  /** Secondary micro-line for operator+ tiers. */
  microLine?: string;
};

export function complexityCopy(
  complexity: Complexity,
  tier: UiTier,
): ComplexityCopy {
  if (tier === "visitor" || tier === "free") {
    const tip =
      complexity === "STRATEGIC"
        ? "STRATEGIC pieces are written for VP and Director-level operators. Practitioner unlocks the full archive."
        : complexity === "OPERATOR"
          ? "OPERATOR pieces are sized for senior CSMs running renewals weekly. Practitioner unlocks the full archive."
          : "PRACTITIONER pieces are for CSMs in the room with customers this week.";
    return { muted: true, tooltip: tip };
  }
  const readerRank = TIER_COMPLEXITY[tier] ?? 1;
  const pieceRank = COMPLEXITY_RANK[complexity];
  if (pieceRank > readerRank) {
    return { muted: false, microLine: "Above your daily cadence" };
  }
  return { muted: false, microLine: "In your cadence" };
}
