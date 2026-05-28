// Lightweight keyword triggers used to flag a Q session as a "difficult day"
// so we can prompt the operator for an end-of-day check-in.
// Match is case-insensitive, whole-substring.

export const FRICTION_KEYWORDS: readonly string[] = [
  "escalation",
  "hod",
  "performance dispute",
  "churn risk",
  "scrutiny",
  "restructuring",
  "executive review",
  "pip",
  "appraisal conflict",
  "board-level",
  "exec misalignment",
] as const;

export function detectFrictionKeywords(input: string): string[] {
  const s = input.toLowerCase();
  return FRICTION_KEYWORDS.filter((k) => s.includes(k));
}
