import { useState } from "react";
import {
  PlaybookShell,
  PlaybookSection,
  OperatorChecklist,
  PlaybookWorksheet,
  DecisionTree,
  type TreeConfig,
} from "./playbook-primitives";

const SLUG = "upward-alignment-misold-contract-playbook";

const MISSELL_TYPES = [
  {
    id: "scope",
    label: "Scope mis-sell",
    detail: "Product was represented as capable of use cases it currently cannot support.",
  },
  {
    id: "segment",
    label: "Segment mis-sell",
    detail:
      "Account's company size, technical maturity, or budget cycle is outside viable ICP — and this was knowable at the point of sale.",
  },
  {
    id: "timeline",
    label: "Timeline mis-sell",
    detail:
      "Implementation or feature delivery timelines were committed that were not achievable, and the client built dependencies on them.",
  },
  {
    id: "stakeholder",
    label: "Stakeholder mis-sell",
    detail:
      "Deal closed with a champion who lacked organisational authority or executive support to drive adoption.",
  },
];

function MisSellDiagnostic() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const any = Object.values(selected).some(Boolean);
  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground/65 mb-2">
        Multiple selection permitted — most mis-sells are compound.
      </p>
      {MISSELL_TYPES.map((t) => (
        <button
          key={t.id}
          onClick={() => toggle(t.id)}
          className={`w-full text-left border p-4 transition-colors ${
            selected[t.id] ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-block h-3 w-3 border ${selected[t.id] ? "bg-accent border-accent" : "border-foreground/30"}`}
            />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/75">
              {t.label}
            </span>
          </div>
          <p className="text-sm text-foreground/85">{t.detail}</p>
        </button>
      ))}
      {any ? (
        <div className="border border-l-4 border-l-accent bg-accent/5 p-4 mt-3">
          <p className="text-sm text-foreground/85">
            Document this compound mis-sell pattern. Preserve the internal paper trail. This is
            governance material — do not share externally yet.
          </p>
        </div>
      ) : null}
    </div>
  );
}

const escalationTree: TreeConfig = {
  start: "i1",
  nodes: {
    i1: {
      id: "i1",
      question: "Does the CRO know this is a qualification mismatch?",
      detail: 'Language matters — use "qualification mismatch", not "mis-sell".',
      options: [
        { label: "Yes — and they accept it.", next: "align" },
        { label: "Yes — but they are defensive about it.", next: "data" },
        { label: "No — they have not been told.", next: "schedule" },
      ],
    },
    align: {
      id: "align",
      kind: "standard",
      title: "Align commercial position before client contact",
      bullets: [
        "Confirm the commercial structure both sides will support going into the client conversation.",
        "Decide jointly: full renewal, structured down-sell, pause, or release.",
        "Document the joint position in writing — even if it's just a one-line internal note.",
      ],
    },
    data: {
      id: "data",
      kind: "critical",
      title: "Run the commercial cost model — present as data, not complaint",
      bullets: [
        "Build the fully-loaded retention cost (CSM + engineering + PS + exec time).",
        "Express the position as net contribution vs ICP-matched cohort.",
        'Never: "your team sold badly." Always: "qualification mismatch."',
        "Bring a proposed qualification criterion, expressed as a binary, that improves the next deal cycle.",
      ],
    },
    schedule: {
      id: "schedule",
      kind: "info",
      title: "Schedule the bilateral with the CRO",
      bullets: [
        'Open with: contract value + retention cost + net contribution — the unit of analysis is commercial.',
        'Use the phrase "qualification mismatch" — never "mis-sell".',
        "Present insight, not grievance. Self-interest alignment is the goal: make the CRO's NRR exposure visible to them.",
      ],
    },
  },
};

export default function UpwardAlignmentMisSell() {
  return (
    <PlaybookShell>
      <PlaybookSection
        eyebrow="Section 1 — Mis-Sell Diagnostic"
        title="How was this account mis-sold?"
        description="Select all that apply. Most real mis-sells are compound."
      >
        <MisSellDiagnostic />
      </PlaybookSection>

      <PlaybookSection
        eyebrow="Section 2 — Internal Escalation Architecture"
        title="CRO posture, and how to walk in"
      >
        <DecisionTree config={escalationTree} storageKey={SLUG} />
      </PlaybookSection>

      <PlaybookSection
        eyebrow="Section 3 — The Commercial Cost Model"
        title="Convert CS operational data into board-level commercial language"
        description="Run this twice: once for the specific account, once for the pattern across all accounts with this mismatch type."
      >
        <PlaybookWorksheet
          storageKey={SLUG}
          fields={[
            { id: "arr", label: "Contract ARR ($)" },
            { id: "cs_time", label: "CS time invested — hours × fully-loaded cost ($)" },
            { id: "eng_cycles", label: "Engineering cycles consumed ($)" },
            { id: "ps", label: "Professional services deployed ($)" },
            { id: "exec_time", label: "Executive time cost — calls, reviews, escalations ($)" },
            { id: "total_cost", label: "Total organisational cost of retention ($)" },
            { id: "net_return", label: "Net return on retention — ARR minus total cost ($)" },
            {
              id: "pattern",
              label: "The pattern: number of accounts with this qualification mismatch + total ARR + total cost + % of CS bandwidth consumed",
              multiline: true,
            },
          ]}
        />
      </PlaybookSection>

      <PlaybookSection
        eyebrow="Section 4 — The Board-Level Risk Report"
        title="One page. Three sections. All data."
        description="Frame: this is not a complaint. It is a governance improvement proposal."
      >
        <PlaybookWorksheet
          storageKey={`${SLUG}-board`}
          fields={[
            {
              id: "pattern",
              label:
                "THE PATTERN: qualification characteristics shared across the mismatch cohort + commercial performance vs ICP-matched (NRR, expansion, retention cost, net contribution)",
              multiline: true,
            },
            {
              id: "cost",
              label:
                "THE COST: fully-loaded retention cost across the cohort + opportunity cost (bandwidth) + board-ready total net return vs ICP cohort",
              multiline: true,
            },
            {
              id: "gate",
              label:
                "PROPOSED QUALIFICATION GATE: specific, binary criteria — yes/no outcomes at deal review + predicted NRR improvement in 12 months",
              multiline: true,
            },
            {
              id: "moment",
              label:
                "WHEN TO PRESENT: which board/exec agenda item? (commercial efficiency, growth quality, NRR initiatives — never standalone, never ambush)",
            },
          ]}
        />
      </PlaybookSection>

      <PlaybookSection
        eyebrow="Section 5 — The CCO's Checklist"
        title="Track and report the improvement"
      >
        <OperatorChecklist
          storageKey={SLUG}
          items={[
            "Mis-sell type identified and documented (one or more of scope / segment / timeline / stakeholder)",
            "Internal paper trail preserved",
            "Product team briefed on functional gap before client engagement",
            "CRO briefed with commercial cost model, not narrative complaint",
            "Client posture assessed before engagement strategy chosen",
            "Legal counsel confirmed if client posture is adversarial",
            "Commercial cost model built for this account",
            "Pattern analysis across all similar accounts completed",
            "Board risk report drafted (one page, three sections)",
            "Board presentation moment identified and scheduled",
            "Post-qualification gate NRR tracking set up",
          ]}
        />
      </PlaybookSection>
    </PlaybookShell>
  );
}
