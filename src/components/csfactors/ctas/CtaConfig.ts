// CTA visual config — semantic tokens only. No new hex values.
// Bible reference colors are mapped to existing design-system tokens.

import type { CtaPriority, CtaType } from "@/lib/ctas.functions";

export type CtaTypeMeta = {
  label: string;
  icon: string; // unicode glyph from the Bible spec
  tone: "default" | "muted" | "success" | "accent" | "warning" | "danger";
};

export const CTA_CONFIG: Record<CtaType, CtaTypeMeta> = {
  call: { label: "CALL", icon: "◉", tone: "accent" },
  email: { label: "EMAIL", icon: "◈", tone: "muted" },
  meeting: { label: "MEETING", icon: "◆", tone: "success" },
  task: { label: "TASK", icon: "◇", tone: "warning" },
  escalation: { label: "ESCALATION", icon: "▲", tone: "danger" },
  renewal: { label: "RENEWAL", icon: "↻", tone: "warning" },
  expansion: { label: "EXPANSION", icon: "↗", tone: "success" },
  other: { label: "ACTION", icon: "◌", tone: "muted" },
};

export const CTA_TONE_CLASS: Record<CtaTypeMeta["tone"], string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  accent: "text-accent",
  warning: "text-[color:var(--secondary-accent)]",
  danger: "text-destructive",
};

export type PriorityMeta = {
  label: string;
  toneClass: string;
};

export const PRIORITY_CONFIG: Record<CtaPriority, PriorityMeta> = {
  critical: { label: "CRITICAL", toneClass: "text-destructive" },
  high: { label: "HIGH", toneClass: "text-[color:var(--secondary-accent)]" },
  medium: { label: "MEDIUM", toneClass: "text-accent" },
  low: { label: "LOW", toneClass: "text-muted-foreground" },
};

export const CTA_STATUS_LABEL: Record<string, string> = {
  open: "OPEN",
  in_progress: "IN PROGRESS",
  completed: "COMPLETED",
  dismissed: "DISMISSED",
};

export function dueDateTone(due?: string | null): "overdue" | "today" | "future" | "none" {
  if (!due) return "none";
  const d = new Date(due).getTime();
  const now = Date.now();
  if (d < now) return "overdue";
  if (d - now < 86_400_000) return "today";
  return "future";
}

export function initials(name?: string | null): string {
  if (!name) return "—";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
