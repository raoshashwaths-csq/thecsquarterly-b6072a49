## Context
The CS Codex already has 6 published playbook entries in the database:
- `cs-health-score-calculator` (Framework, 14pp)
- `qbr-deck-template-pack` (Template, 12pp)
- `90-day-onboarding-playbook` (Playbook, 22pp)
- `churn-early-warning-system` (Framework, 16pp)
- `cs-ai-readiness-diagnostic` (Diagnostic, 18pp)
- `expansion-revenue-playbook` (Playbook, 20pp)

Currently, `codex.$slug.tsx` renders `pb.body` as plain markdown-style text for every playbook. The user wants these 6 playbooks replaced with rich interactive React components.

## Plan

### 1. Create `src/components/playbooks/` with 6 adapted components
Rewrite each component to use the site's design system:
- Replace all `bg-stone-*`, `text-stone-*`, `border-stone-*` with semantic tokens (`bg-card`, `text-foreground`, `border-border`, `bg-muted`, `text-muted-foreground`, etc.)
- Replace `font-serif` with `font-display`; keep `font-mono` for mono sections
- Replace hardcoded `accent-stone-800` range inputs with `accent` color via CSS custom property
- Ensure all components render correctly in dark mode (no hardcoded light-only backgrounds)
- Preserve all interactive logic: sliders, state, copy-to-clipboard, tab switching, live text generation

Components to create:
- `HealthScoreCalculator.tsx` — 4 weighted sliders → composite score + risk status badge
- `QbrDeckTemplatePack.tsx` — 12-slide selector with copyable raw-text templates
- `OnboardingPlaybook.tsx` — 3-phase timeline + live handover script generator
- `ChurnEarlyWarningSystem.tsx` — Risk-code table + accusation-audit email generator
- `AiReadinessDiagnostic.tsx` — 3-pillar sliders → geometric mean + 90-day remediation plan
- `ExpansionRevenuePlaybook.tsx` — Stakeholder hierarchy + expansion-motion matrix + trigger-based dispatch script

### 2. Create `src/components/playbooks/index.tsx`
Export a `PLAYBOOK_COMPONENTS` record mapping each of the 6 slugs to its component:
```ts
export const PLAYBOOK_COMPONENTS: Record<string, React.FC> = {
  "cs-health-score-calculator": HealthScoreCalculator,
  "qbr-deck-template-pack": QbrDeckTemplatePack,
  "90-day-onboarding-playbook": OnboardingPlaybook,
  "churn-early-warning-system": ChurnEarlyWarningSystem,
  "cs-ai-readiness-diagnostic": AiReadinessDiagnostic,
  "expansion-revenue-playbook": ExpansionRevenuePlaybook,
};
```

### 3. Wire into `codex.$slug.tsx`
In the unlocked content area of the playbook detail page, conditionally render the mapped component when `pb.slug` matches a key in `PLAYBOOK_COMPONENTS`. For all other slugs, keep the existing body-text rendering. The component renders inside the same `prose-content` container after a small eyebrow label indicating "Interactive Playbook".

No database changes are required — the 6 entries already exist with the correct slugs.

## Technical notes
- All 6 components are client-only (useState, useMemo, clipboard API). No SSR concerns.
- The copy-to-clipboard calls use `navigator.clipboard.writeText`.
- The `OnboardingPlaybook.tsx` has a bug in the original (`navigator.clipboard.text = script`) — fix to `writeText`.
- No new dependencies needed. Lucide icons are already available.