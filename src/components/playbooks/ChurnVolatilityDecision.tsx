import { useState, useMemo } from "react";
import {
  PlaybookShell,
  PlaybookSection,
  OperatorChecklist,
  PlaybookWorksheet,
} from "./playbook-primitives";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const SLUG = "churn-volatility-triage-playbook";

type AnswerValue = "yes" | "no" | "partial";

const Q = [
  {
    id: "useCase",
    text: "Does this account's primary use case match our current product capabilities?",
  },
  {
    id: "maturity",
    text: "Does their technical maturity allow them to realise product value independently?",
  },
  {
    id: "budget",
    text: "Does their budget structure map to our current pricing architecture?",
  },
  {
    id: "champion",
    text: "Is there an internal champion with genuine executive conviction in the product?",
  },
];

function ICPDiagnostic() {
  const [answers, setAnswers] = useState<Record<string, AnswerValue | "">>({
    useCase: "",
    maturity: "",
    budget: "",
    champion: "",
  });

  const yesCount = useMemo(
    () => Object.values(answers).filter((v) => v === "yes").length,
    [answers],
  );
  const noCount = useMemo(
    () => Object.values(answers).filter((v) => v === "no").length,
    [answers],
  );
  const answered = Object.values(answers).every((v) => v !== "");

  const route = !answered
    ? null
    : yesCount === 4
      ? {
          kind: "save" as const,
          label: "Strong ICP match",
          headline: "Save Protocol",
          color: "border-l-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
        }
      : yesCount === 3 && noCount === 1
        ? {
            kind: "conditional" as const,
            label: "Conditional ICP match",
            headline: "Conditional Save Protocol",
            color: "border-l-secondary-accent bg-secondary-accent/5",
          }
        : {
            kind: "release" as const,
            label: "ICP mismatch",
            headline: "Release Assessment",
            color: "border-l-accent bg-accent/5",
          };

  return (
    <div className="space-y-4">
      {Q.map((q) => (
        <div key={q.id} className="border border-border p-4">
          <p className="text-sm text-foreground/85 mb-3">{q.text}</p>
          <div className="grid grid-cols-3 gap-2">
            {(["yes", "partial", "no"] as AnswerValue[]).map((v) => (
              <button
                key={v}
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: v }))}
                className={`font-mono text-[11px] uppercase tracking-[0.2em] py-2 border transition-colors ${
                  answers[q.id] === v
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-foreground/70 hover:border-accent/40"
                }`}
              >
                {v === "yes" ? "Yes" : v === "partial" ? "Partially" : "No"}
              </button>
            ))}
          </div>
        </div>
      ))}

      {route ? (
        <div className={`border border-l-4 ${route.color} p-5 mt-2`}>
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-foreground/70 mb-2">
            {route.label} · {yesCount} of 4 yes
          </div>
          <h4 className="font-display text-xl tracking-tight mb-2">→ {route.headline}</h4>
          <p className="text-sm text-foreground/75">
            {route.kind === "save"
              ? "Proceed to Save Protocol. Split: product gap or relationship gap?"
              : route.kind === "conditional"
                ? "Proceed with explicit guardrails. Document the failing dimension before any commercial conversation."
                : "Do not initiate retention action. Route to Release Assessment — temporary or permanent mismatch."}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ProtocolCard({
  kind,
  title,
  bullets,
}: {
  kind: "save" | "release" | "info";
  title: string;
  bullets: string[];
}) {
  const styles =
    kind === "save"
      ? "border-l-emerald-500 bg-emerald-500/5"
      : kind === "release"
        ? "border-l-accent bg-accent/5"
        : "border-l-secondary-accent bg-secondary-accent/5";
  const Icon = kind === "release" ? AlertTriangle : CheckCircle2;
  const iconClass =
    kind === "release" ? "text-accent" : kind === "save" ? "text-emerald-600 dark:text-emerald-400" : "text-secondary-accent";
  return (
    <div className={`border border-l-4 ${styles} p-5`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${iconClass}`} />
        <h5 className="font-display text-lg tracking-tight">{title}</h5>
      </div>
      <ul className="space-y-2 mt-3">
        {bullets.map((b, i) => (
          <li key={i} className="text-sm text-foreground/85 flex gap-2">
            <span className="text-secondary-accent mt-1.5">·</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ChurnVolatilityDecision() {
  return (
    <PlaybookShell>
      <PlaybookSection
        eyebrow="Section 1 — ICP Match Diagnostic"
        title="Would we sign this account as a new logo today?"
        description="Run this before any retention action. Strip away the sunk-cost fallacy."
      >
        <ICPDiagnostic />
      </PlaybookSection>

      <PlaybookSection
        eyebrow="Section 2 — Save Protocol"
        title="If ICP match is confirmed: product gap or relationship gap?"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProtocolCard
            kind="save"
            title="Product gap"
            bullets={[
              "Is the feature on the committed roadmap within 6 months? Get written confirmation from product first — never offer roadmap equity that isn't confirmed.",
              "Structure the renewal around milestone delivery.",
              "If not on roadmap: can we bridge with current product + professional services? If no → Release Assessment.",
            ]}
          />
          <ProtocolCard
            kind="save"
            title="Relationship gap"
            bullets={[
              "CSM reassignment when the existing relationship is fatigued.",
              "Executive re-engagement when the client's exec sponsor has cooled.",
              "Formal account reset with documented mutual commitments — in writing.",
              "If none of these recover the relationship → Release Assessment.",
            ]}
          />
        </div>
      </PlaybookSection>

      <PlaybookSection
        eyebrow="Section 3 — Release Assessment"
        title="Temporary mismatch or permanent?"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProtocolCard
            kind="info"
            title="Temporary (fit is structurally sound)"
            bullets={[
              "Structured pause with reduced commercial commitment (90 days).",
              "Clear re-engagement criteria documented upfront.",
              "Executive sponsor assigned internally.",
              "60-day checkpoint with mutual exit option if criteria not met.",
            ]}
          />
          <ProtocolCard
            kind="release"
            title="Permanent — Retroactive Grace Protocol"
            bullets={[
              'CCO-level conversation with client CCO or VP. Frame: "We can see that the way your team works and the way our product is built have not aligned the way we both expected."',
              "Data export and transition documentation provided.",
              "Referrals to alternative solutions where genuine and appropriate.",
              'Internal team debrief with clear narrative (never "we failed").',
              "NRR impact documented and board narrative prepared.",
            ]}
          />
        </div>
      </PlaybookSection>

      <PlaybookSection
        eyebrow="Section 4 — Commercial Architecture"
        title="Four commercial options for accounts you decide to retain"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProtocolCard
            kind="save"
            title="Full renewal at current ACV"
            bullets={[
              "When: NPS recovery confirmed + exec alignment confirmed.",
              "Risk: retaining a difficult account at full value without structural change.",
            ]}
          />
          <ProtocolCard
            kind="info"
            title="Structured down-sell"
            bullets={[
              "When: scope reduction reflects the honest current relationship.",
              'Frame: "Based on where we are and what you are getting genuine value from, here is what I think the right commercial structure looks like."',
            ]}
          />
          <ProtocolCard
            kind="info"
            title="Pause and restructure"
            bullets={[
              "When: client is in budget-cycle disruption — not product dissatisfaction.",
              "Structure: 90-day pause with defined re-engagement criteria.",
            ]}
          />
          <ProtocolCard
            kind="save"
            title="Performance-linked renewal"
            bullets={[
              "When: trust needs rebuilding through demonstrated outcomes.",
              "Structure: renewal value tied to specific, measurable milestones.",
            ]}
          />
        </div>
      </PlaybookSection>

      <PlaybookSection
        eyebrow="Section 5 — NRR Impact Model"
        title="Fill before any commercial conversation"
      >
        <PlaybookWorksheet
          storageKey={SLUG}
          fields={[
            { id: "arr", label: "Account ARR ($)", placeholder: "e.g. 240,000" },
            {
              id: "retentionCost",
              label: "Retention cost to date (CSM + engineering + PS + exec time, $)",
              placeholder: "Fully loaded",
            },
            { id: "netCurrent", label: "Net contribution if retained at current ACV over 24 months ($)" },
            { id: "netRestructured", label: "Net contribution if restructured/down-sold over 24 months ($)" },
            { id: "graceCost", label: "Cost of retroactive grace (transition support + NRR impact, $)" },
            {
              id: "decision",
              label: "Decision: which commercial scenario produces the best 24-month return?",
              multiline: true,
            },
          ]}
        />
      </PlaybookSection>

      <PlaybookSection
        eyebrow="Section 6 — The CCO's Checklist"
        title="Run before, during, and after the commercial conversation"
      >
        <OperatorChecklist
          storageKey={SLUG}
          items={[
            "ICP match diagnostic completed before any retention action",
            "Emotional narrative separated from commercial assessment",
            "NRR impact model built for each commercial option",
            "Internal alignment (CRO + product) before client conversation",
            "Client conversation led with specific, honest language",
            "Commercial structure proposed proactively — not reactively",
            "Team narrative prepared before outcome is communicated",
            "Board slide prepared with clean commercial framing",
          ]}
        />
      </PlaybookSection>
    </PlaybookShell>
  );
}
