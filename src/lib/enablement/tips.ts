// Route-aware quick tips registry.
// Each group's `match` is a path prefix; longest match wins, "/" is fallback.

export type Tip = {
  id: string;
  title: string;
  body: string;
  cta?: { label: string; to: string };
};

export type TipGroup = {
  match: string;
  label: string;
  tips: Tip[];
};

export const TIP_GROUPS: TipGroup[] = [
  {
    match: "/csfactors/",
    label: "Account drill-down",
    tips: [
      {
        id: "csfactors-account-stakeholder",
        title: "Map the stakeholder web first",
        body: "Open the Stakeholder Map before any QBR. Champions in orbit but no economic buyer is your earliest churn signal.",
      },
      {
        id: "csfactors-account-vault",
        title: "Pin the contract vault",
        body: "Surface renewal date, auto-renew clause and price hold from the vault into your next 1:1 — half of expansion blockers live in the paperwork.",
      },
    ],
  },
  {
    match: "/csfactors",
    label: "Command Centre",
    tips: [
      {
        id: "csfactors-csf-tiles",
        title: "Read the CSF tiles top-down",
        body: "Tiles are ordered by retention impact, not alphabetically. Start at the top, escalate anything red or amber > 14 days.",
      },
      {
        id: "csfactors-burning-three",
        title: "The Burning Three rule",
        body: "Never carry more than three burning accounts into a week. Promote, defuse or hand off — but the queue must clear.",
      },
      {
        id: "csfactors-ask-q",
        title: "Talk to Q in plain English",
        body: 'Try "Show me accounts with NRR < 90% and no QBR in 60 days." Q understands your portfolio — phrase questions like you would to a CSM.',
      },
    ],
  },
  {
    match: "/calculator",
    label: "ROI Calculator",
    tips: [
      {
        id: "calc-contraction",
        title: "Simulate the contraction floor",
        body: "Hold expansion at 0% and drop GRR by 5 points — that's your worst credible scenario for the board. Most boards want to see this number more than the upside.",
      },
      {
        id: "calc-payback",
        title: "Pair NRR with payback",
        body: "A 120% NRR with a 36-month payback is a working business. A 120% NRR with a 60-month payback is a financing problem.",
      },
    ],
  },
  {
    match: "/benchmarks",
    label: "NRR Benchmarks",
    tips: [
      {
        id: "bench-cohort",
        title: "Read your cohort, not the median",
        body: "The global NRR median is noise. Filter to your ACV band and motion (PLG vs sales-led) — that's the only line worth comparing against.",
      },
    ],
  },
  {
    match: "/ai-readiness",
    label: "AI Readiness",
    tips: [
      {
        id: "ai-bands",
        title: "Bands beat scores",
        body: "Treat the score as a band, not a number. Move from Reactive → Operational → Predictive — each transition takes one to two quarters of disciplined investment.",
      },
    ],
  },
  {
    match: "/retention-protocol",
    label: "Retention Protocol",
    tips: [
      {
        id: "rp-playbooks",
        title: "Run one playbook end-to-end",
        body: "Pick one playbook per quarter and run it across your full book. Half-running five playbooks is how teams convince themselves they're operating systematically.",
      },
    ],
  },
  {
    match: "/",
    label: "Home",
    tips: [
      {
        id: "home-csf-box",
        title: "The CSF Box is the homepage on purpose",
        body: "It's the only surface that ties health, revenue and stakeholder posture together. If you check one thing per day, check this.",
        cta: { label: "Open Command Centre", to: "/csfactors" },
      },
      {
        id: "home-workspace",
        title: "Workspace = your private surface",
        body: "Drop notes, drafts and account context into Workspace. Q reads from it when answering, so the more you put there, the sharper your answers get.",
        cta: { label: "Open Workspace", to: "/account/workspace" },
      },
    ],
  },
];

export function tipsForPath(pathname: string): TipGroup {
  // longest-prefix match
  const sorted = [...TIP_GROUPS].sort((a, b) => b.match.length - a.match.length);
  return (
    sorted.find((g) => pathname === g.match || pathname.startsWith(g.match)) ??
    TIP_GROUPS.find((g) => g.match === "/")!
  );
}
