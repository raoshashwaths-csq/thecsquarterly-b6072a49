import { useRouterState } from "@tanstack/react-router";
import { tipsForPath, type TipGroup } from "@/lib/enablement/tips";

export function useRouteTips(): TipGroup {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return tipsForPath(pathname);
}

const FALLBACK_PROMPTS = [
  "Ask about churn risk",
  "Draft a QBR outline",
  "Score this account's health",
  "Find a playbook",
  "Map the stakeholder web",
];

/**
 * Returns short prompt strings suitable for the Lumi loader bubbles.
 * Uses the longest-matching TipGroup's tip titles, with a generic
 * fallback when no route-specific tips exist.
 */
export function getLoaderPrompts(pathname: string): string[] {
  const group = tipsForPath(pathname);
  const titles = group?.tips?.map((t) => t.title).filter(Boolean) ?? [];
  if (titles.length >= 3) return titles;
  // Pad with fallbacks if the group is sparse.
  const merged = [...titles];
  for (const p of FALLBACK_PROMPTS) {
    if (merged.length >= 5) break;
    if (!merged.includes(p)) merged.push(p);
  }
  return merged;
}
