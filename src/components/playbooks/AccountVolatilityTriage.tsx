import {
  PlaybookShell,
  PlaybookSection,
  DecisionTree,
  OperatorChecklist,
  PlaybookWorksheet,
  type TreeConfig,
} from "./playbook-primitives";

const SLUG = "frontline-sovereignty-triage-playbook";

const tree: TreeConfig = {
  start: "entry",
  nodes: {
    entry: {
      id: "entry",
      question: "What is the client's core complaint?",
      detail: "First branch: technical or relational.",
      options: [
        { label: "A specific platform failure, data error, or integration breakdown.", next: "A1" },
        { label: "A missed commitment, expectation gap, or stakeholder misalignment.", next: "B1" },
      ],
    },
    A1: {
      id: "A1",
      question: "Is the failure currently active or historical?",
      options: [
        { label: "Currently active — client is experiencing impact right now.", next: "A2_LIVE" },
        { label: "Historical — failure already occurred, now being surfaced.", next: "A2_HIST" },
      ],
    },
    A2_LIVE: {
      id: "A2_LIVE",
      question: "Is revenue, compliance, or executive visibility directly affected?",
      options: [
        { label: "Yes — touches board reporting, revenue data, or regulatory compliance.", next: "A3_CRIT" },
        { label: "No — operational disruption but no executive visibility.", next: "A3_STD" },
      ],
    },
    A3_CRIT: {
      id: "A3_CRIT",
      kind: "critical",
      title: "Critical Response Protocol",
      bullets: [
        "Call (not email) the client executive contact within 30 minutes.",
        "Trigger the engineering war-room directly — bypass the standard ticket queue.",
        "Prepare the executive briefing note (template below) before any further client contact.",
        "Update every 4 hours until resolved.",
        "Own the timeline publicly — do not let it drift.",
      ],
      note: "If the client's senior leadership already knows, coordinate with your own exec before any further client contact.",
    },
    A3_STD: {
      id: "A3_STD",
      kind: "standard",
      title: "Standard Response Protocol",
      bullets: [
        "Email with a specific resolution timeline within 2 hours.",
        "Ticket number and named owner included.",
        "Next update committed within 24 hours.",
        "No executive involvement unless the client requests it.",
      ],
    },
    A2_HIST: {
      id: "A2_HIST",
      kind: "info",
      title: "Historical Failure Protocol",
      bullets: [
        "Document the full scope internally before any external communication.",
        "Never understate in the initial communication — discovered discrepancies are worse than disclosed ones.",
        "If there is data-integrity risk → treat as Critical.",
        "If there is no data-integrity risk → treat as Standard with full documentation.",
      ],
    },
    B1: {
      id: "B1",
      question: "What type of relational breach is this?",
      options: [
        { label: "A commitment we made that we did not keep.", next: "B2_EXP" },
        { label: "A gap between what they expected and what was delivered.", next: "B2_SCOPE" },
        { label: "A stakeholder change on their side that shifted the dynamic.", next: "B2_REL" },
      ],
    },
    B2_EXP: {
      id: "B2_EXP",
      kind: "critical",
      title: "Expectation Breach Protocol",
      bullets: [
        "Own it fully — no caveats, no qualifications.",
        "Document precisely: what was promised, when, by whom.",
        "Do not explain before you acknowledge.",
        "Recovery plan must be ready before the client call — not built during it.",
      ],
      note: "Then route to: can this be recovered at CSM level, or does this require executive involvement?",
    },
    B2_SCOPE: {
      id: "B2_SCOPE",
      kind: "standard",
      title: "Scope Breach Protocol",
      bullets: [
        "Map the gap specifically — where exactly did scope and delivery diverge?",
        "Do not present this as the client's misunderstanding.",
        "Present a specific remediation path — not general good intentions.",
      ],
    },
    B2_REL: {
      id: "B2_REL",
      kind: "standard",
      title: "Relationship Breach Protocol",
      bullets: [
        "Identify the new stakeholder before contacting anyone.",
        "Do not assume old context transfers.",
        "Start from a position of genuine re-introduction — not continuation.",
      ],
    },
  },
};

const FIVE_STEPS = [
  {
    n: 1,
    title: "Receive without reducing",
    say: '"I have read every word of your message and I understand the severity of what you are describing."',
    avoid: '"I understand your frustration."',
  },
  {
    n: 2,
    title: "Name the impact before naming the cause",
    say: '"The implication of this for [specific client outcome] is real and I am not going to pretend otherwise."',
    avoid: "Opening with an explanation.",
  },
  {
    n: 3,
    title: "Shift from problem to posture",
    say: '"Here is how we are going to operate from this point forward..."',
    avoid: "Re-litigating what went wrong.",
  },
  {
    n: 4,
    title: "Assign ownership visibly",
    say: '"I am personally owning the resolution of this. Not my team, not a ticket queue — me."',
    avoid: "Hiding behind the system.",
  },
  {
    n: 5,
    title: "Concrete time commitment",
    say: '"[Specific deliverable] by [specific day] at [specific time]."',
    avoid: '"As quickly as possible."',
  },
];

export default function AccountVolatilityTriage() {
  return (
    <PlaybookShell>
      <PlaybookSection
        eyebrow="Section 1 — Triage Entry"
        title="Is this technical or relational?"
        description="Walk through the branching diagnostic. Each terminal action card is the protocol for that branch."
      >
        <DecisionTree config={tree} storageKey={SLUG} />
      </PlaybookSection>

      <PlaybookSection
        eyebrow="Section 2 — The Five-Step Communication Sequence"
        title="Controlled pressure absorption, in order"
        description="Applies regardless of which branch above you took. Use the exact phrasing."
      >
        <ol className="space-y-4">
          {FIVE_STEPS.map((s) => (
            <li key={s.n} className="border border-border p-4">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-secondary-accent">
                  Step {s.n}
                </span>
                <h5 className="font-display text-lg tracking-tight">{s.title}</h5>
              </div>
              <p className="text-sm text-foreground/85 mb-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/55 mr-2">
                  Say
                </span>
                {s.say}
              </p>
              <p className="text-sm text-foreground/55">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-destructive mr-2">
                  Avoid
                </span>
                {s.avoid}
              </p>
            </li>
          ))}
        </ol>
      </PlaybookSection>

      <PlaybookSection
        eyebrow="Section 3 — Executive Briefing Note"
        title="Fill before any further client contact"
        description="Subject line: [Account Name] — Situation Update and Recovery Plan."
      >
        <PlaybookWorksheet
          storageKey={SLUG}
          fields={[
            { id: "situation", label: "Situation (one sentence — what happened and when)", multiline: true },
            { id: "status", label: "Current status (Active / Contained / Resolved)" },
            { id: "impact", label: "Business impact on client (revenue / compliance / reporting / operational)", multiline: true },
            { id: "root", label: "Root cause (preliminary or confirmed)", multiline: true },
            { id: "timeline", label: "Recovery timeline (specific dates, not ranges)" },
            { id: "next", label: "Next update (specific time)" },
            { id: "owner", label: 'Owner (full name — not "the team")' },
          ]}
        />
      </PlaybookSection>

      <PlaybookSection
        eyebrow="Section 4 — Operator's Checklist"
        title="Mark each step as it lands"
      >
        <OperatorChecklist
          storageKey={SLUG}
          items={[
            "Failure type identified (technical or relational)",
            "Blast radius mapped",
            "Response protocol selected",
            "Client acknowledged within [time commitment]",
            "Personal ownership stated explicitly",
            "Specific recovery timeline committed",
            "Internal stakeholders briefed",
            "Next update scheduled",
            "Root cause analysis started",
            "Post-incident review date set",
          ]}
        />
      </PlaybookSection>
    </PlaybookShell>
  );
}
