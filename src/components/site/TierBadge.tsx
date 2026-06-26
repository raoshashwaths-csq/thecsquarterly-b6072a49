// Tier-aware badge for feature cards. Visual treatment is keyed off the
// `badgeVariant` returned by useTierCopy. No hex colours — pulls from the
// existing semantic tokens already defined in src/styles.css.
//
// Sizing matches the existing eyebrow language across the site: mono,
// uppercase, ~10–11px, tracking [0.22em–0.25em]. No rounded corners.

import { Lock, Check } from "lucide-react";
import type { BadgeVariant } from "@/config/tierCopyConfig";

type Props = {
  label: string;
  variant: BadgeVariant;
  showLock?: boolean;
  className?: string;
};

export function TierBadge({ label, variant, showLock, className }: Props) {
  const base =
    "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] px-2 py-1 border";
  let styles = "";
  switch (variant) {
    case "locked":
      styles = "bg-muted/40 border-border text-muted-foreground";
      break;
    case "neutral":
      styles = "bg-muted/20 border-border text-foreground/70";
      break;
    case "active":
      styles = "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400";
      break;
  }
  return (
    <span className={`${base} ${styles} ${className ?? ""}`.trim()}>
      {variant === "locked" && showLock ? <Lock size={10} aria-hidden /> : null}
      {variant === "active" ? <Check size={10} aria-hidden /> : null}
      {label}
    </span>
  );
}
