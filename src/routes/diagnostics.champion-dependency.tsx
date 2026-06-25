import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { BackButton } from "@/components/site/BackButton";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useDiagnosticFlow, useCountUp } from "@/hooks/useDiagnosticFlow";
import { useEntitlements } from "@/hooks/useEntitlements";
import { trackDiagnosticEvent } from "@/lib/diagnostics-analytics";
import { LeadCaptureGate } from "@/components/diagnostics/LeadCaptureGate";
import { canonicalUrl } from "@/lib/canonical-url";
import { downloadDiagnosticPdf } from "@/lib/diagnostic-pdf";
import { SharedScoreView } from "@/components/diagnostics/SharedScoreView";

export const Route = createFileRoute("/diagnostics/champion-dependency")({
  head: () => ({
    meta: [
      { title: "Champion Dependency Diagnostic, The CS Quarterly" },
      {
        name: "description",
        content:
          "Calculate the percentage of your CS portfolio that is single-threaded — dependent on one contact with no backup relationship.",
      },
      { property: "og:title", content: "The Champion Dependency Diagnostic" },
      {
        property: "og:description",
        content: "How much of your book is one relationship away from risk?",
      },
      { property: "og:url", content: "/diagnostics/champion-dependency" },
    ],
    links: [{ rel: "canonical", href: "/diagnostics/champion-dependency" }],
  }),
  component: ChampionDependencyDiagnostic,
});

const QUESTIONS = [
  {
    question:
      "On your highest-value accounts, how many people do you have an active, two-way relationship with at Director level or above?",
    options: [
      "Typically just one person",
      "One primary contact, occasionally others",
      "Two to three people regularly",
      "Four or more across different functions",
    ],
  },
  {
    question:
      "If your primary contact at a top account left tomorrow, how would you find out?",
    options: [
      "We'd likely notice when they stop responding to emails",
      "Someone else at the account might mention it eventually",
      "We monitor LinkedIn for role changes on key accounts",
      "We have a proactive alert and a backup relationship already in place",
    ],
  },
  {
    question:
      "How often do you formally map the stakeholders at your accounts (org chart, roles, sentiment)?",
    options: [
      "We don't — relationships exist mostly in CSMs' heads",
      "Occasionally, usually before a renewal",
      "At onboarding, but rarely updated after",
      "Continuously, as part of how we manage the account",
    ],
  },
  {
    question:
      "When a champion goes quiet (no response in 2+ weeks), what typically happens?",
    options: [
      "The CSM keeps trying the same contact",
      "The CSM escalates internally but has no other relationship to fall back on",
      "The CSM has at least one other contact to reach out to",
      "There's a defined re-engagement process with multiple paths",
    ],
  },
  {
    question:
      "How many of your accounts have an executive sponsor (VP+ or economic buyer) who is NOT your day-to-day contact?",
    options: [
      "Almost none — we deal with one level only",
      "A handful, but the relationship is dormant",
      "About half, with occasional touchpoints",
      "Most — we maintain active multi-level relationships",
    ],
  },
  {
    question:
      "When you onboard a new account, how many stakeholders are formally introduced to your team?",
    options: [
      "Usually just the buyer or main point of contact",
      "The buyer plus one or two end users",
      "A small group across roles, but not systematically",
      "A structured stakeholder map is built during onboarding",
    ],
  },
  {
    question:
      "How would you describe your team's current visibility into champion turnover risk?",
    options: [
      "We find out reactively, usually too late",
      "We sometimes catch it from account activity dropping",
      "We have some signals but they're not consistently used",
      "We have proactive, systematic visibility",
    ],
  },
  {
    question:
      "If asked right now, could you produce a list of accounts that are 'single-threaded' (one contact, no backup) within the hour?",
    options: [
      "No — I wouldn't know where to start",
      "I could estimate roughly but not with confidence",
      "I could pull it together with some work",
      "Yes — this is something we already track",
    ],
  },
];

const SCORE_MAP: Record<number, number[]> = {
  0: [0, 10, 22, 33],
  1: [0, 8, 20, 33],
  2: [0, 10, 18, 33],
  3: [0, 10, 20, 33],
  4: [0, 8, 18, 33],
  5: [0, 10, 18, 33],
  6: [0, 8, 18, 33],
  7: [0, 10, 20, 33],
};

const CALC_STEPS = [
  "Mapping your stakeholder coverage...",
  "Calculating single-threading exposure...",
  "Benchmarking against portfolio data...",
  "Generating your re-threading blueprint...",
];

function readinessScore(answers: Record<number, number>) {
  let total = 0;
  for (let i = 0; i < 8; i++) total += SCORE_MAP[i][answers[i]] ?? 0;
  return Math.min(100, Math.round((total / 264) * 100));
}

function exposureScore(answers: Record<number, number>) {
  return 100 - readinessScore(answers);
}

function subScores(answers: Record<number, number>) {
  const safe = (i: number) => SCORE_MAP[i][answers[i]] ?? 0;
  return {
    relationshipDepth: Math.round(((safe(0) + safe(4) + safe(5)) / 99) * 100),
    detectionCapability: Math.round(((safe(1) + safe(6) + safe(7)) / 99) * 100),
    structuralProcess: Math.round(((safe(2) + safe(3)) / 66) * 100),
  };
}

function useSharedScoreParam(): number | null {
  const [score, setScore] = useState<number | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("score");
    if (raw === null) return;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0 && n <= 100) setScore(Math.round(n));
  }, []);
  return score;
}

function ChampionDependencyDiagnostic() {
  // If a shared score is present in the URL, short-circuit to the read-only
  // shared view so recipients land on the score, not the start of the flow.
  const sharedScore = useSharedScoreParam();

  const flow = useDiagnosticFlow({
    questions: QUESTIONS,
    calcSteps: CALC_STEPS,
    calculateScore: exposureScore,
    calculateSubScores: subScores,
  });

  // Lead-capture gate — every diagnostic must collect work email before the
  // survey is rendered. Once unlocked for this session we don't ask again
  // even if the user retakes.
  const [leadUnlocked, setLeadUnlocked] = useState(false);

  useEffect(() => {
    if (flow.stage === "survey") {
      trackDiagnosticEvent("diagnostic.survey_start", {
        slug: "champion-dependency",
        surface: "diagnostics.champion-dependency",
      });
    } else if (flow.stage === "results") {
      trackDiagnosticEvent("diagnostic.submit", {
        slug: "champion-dependency",
        surface: "diagnostics.champion-dependency",
        meta: { exposure: flow.score },
      });
    }
  }, [flow.stage, flow.score]);

  const handleStart = () => {
    if (!leadUnlocked) {
      // Show the gate; flow.start() will run after onUnlock.
      setShowGate(true);
      return;
    }
    flow.start();
  };

  const [showGate, setShowGate] = useState(false);

  if (sharedScore !== null) {
    const bucket = bucketOf(sharedScore);
    const meta = BUCKET_META[bucket];
    return (
      <SharedScoreView
        eyebrow="Shared diagnostic result"
        diagnosticName="The Champion Dependency Diagnostic"
        scoreLabel="Single-threading exposure"
        scoreDisplay={`${sharedScore}%`}
        tierLabel={meta.label}
        tierTone={meta.tone}
        interpretation={INTERPRETATION[bucket]}
        retakeHref="/diagnostics/champion-dependency"
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col page-enter">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-6 pt-10 w-full">
        <BackButton label="Back to Diagnostics" fallbackTo="/diagnostics" />
      </div>
      <main className="flex-1">

        {flow.stage === "landing" && !showGate && <LandingState onStart={handleStart} />}
        {flow.stage === "landing" && showGate && (
          <LeadCaptureGate
            slug="champion-dependency"
            eyebrow="Free assessment — 2 of 8"
            title={<>Unlock the Champion Dependency Diagnostic<span className="text-accent">.</span></>}
            subtitle="Calculate the percentage of your portfolio that depends on a single relationship. Results delivered instantly."
            onUnlock={() => {
              setLeadUnlocked(true);
              setShowGate(false);
              flow.start();
            }}
          />
        )}
        {flow.stage === "survey" && <SurveyState flow={flow} />}
        {flow.stage === "calculating" && <CalculatingState step={flow.calcStep} steps={flow.calcSteps} />}
        {flow.stage === "results" && (
          <ResultsState
            exposure={flow.score}
            subs={flow.subScores as ReturnType<typeof subScores>}
            onRetake={flow.reset}
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}



/* ───────────────────────── Landing ───────────────────────── */

function LandingState({ onStart }: { onStart: () => void }) {
  return (
    <section className="border-b border-border">
      <div className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center animate-fade-up">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-8">
          Free assessment — 2 of 8
        </div>
        <h1 className="font-display text-4xl md:text-6xl leading-[1.1] tracking-tight text-balance mb-8">
          The Champion Dependency Diagnostic
          <span className="block not-italic text-accent mt-2">How exposed is your book?</span>
        </h1>
        <p className="text-xl text-foreground/75 max-w-2xl mx-auto leading-relaxed">
          Calculate the percentage of your portfolio that depends on a single relationship.
        </p>
        <p className="text-base text-muted-foreground max-w-xl mx-auto mt-4 leading-relaxed">
          Most CS leaders have never run this number. Most are surprised by it.
        </p>

        <div className="flex flex-wrap justify-center gap-12 my-12 text-left">
          {[
            ["4 min", "Assessment time"],
            ["8 vectors", "Evaluated"],
            ["1 number", "That changes how you prioritise Monday"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="font-display text-2xl">{k}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">{v}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          className="px-10 py-4 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-opacity"
        >
          Start the free assessment →
        </button>
        <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          No account required to start · Results delivered instantly
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Survey ───────────────────────── */

function SurveyState({ flow }: { flow: ReturnType<typeof useDiagnosticFlow<ReturnType<typeof subScores>>> }) {
  const q = flow.questions[flow.currentQuestion];
  const progress = ((flow.currentQuestion + 1) / flow.total) * 100;

  return (
    <section>
      <div className="max-w-3xl mx-auto px-6 pt-12 w-full">
        <div className="flex justify-between font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground mb-3">
          <span>Champion Dependency</span>
          <span>Question {flow.currentQuestion + 1} of {flow.total}</span>
        </div>
        <div className="h-px bg-border relative">
          <div
            className="absolute left-0 top-0 h-px bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div key={flow.currentQuestion} className="max-w-3xl mx-auto px-6 pt-12 pb-20 animate-fade-up">
        <h2 className="font-display text-2xl md:text-4xl leading-[1.2] text-balance mb-10">
          {q.question}
        </h2>

        <div className="space-y-3">
          {q.options.map((opt, i) => {
            const selected = flow.selectedOption === i;
            return (
              <button
                key={i}
                onClick={() => flow.setSelectedOption(i)}
                className={`w-full text-left px-5 py-4 border transition-colors flex items-start gap-4 ${
                  selected
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-foreground/40"
                }`}
              >
                <span
                  className={`mt-1 inline-block h-3 w-3 shrink-0 border ${
                    selected ? "border-accent bg-accent" : "border-border"
                  }`}
                />
                <span className="text-foreground/90">{opt}</span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-12 pt-8 border-t border-border">
          <button
            onClick={flow.previous}
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
          <button
            onClick={flow.next}
            disabled={flow.selectedOption === null}
            className="px-8 py-4 bg-foreground text-background font-mono text-xs uppercase tracking-[0.2em] font-bold disabled:opacity-30 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {flow.isLast ? "See my exposure →" : "Next →"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Calculating ───────────────────────── */

function CalculatingState({ step, steps }: { step: number; steps: string[] }) {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center animate-fade-up">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-8">
          Generating your result
        </div>
        <div className="mx-auto mb-10 h-10 w-10 border-2 border-border border-t-accent rounded-full animate-spin" />
        <div className="font-display text-2xl mb-8 min-h-[3.5rem] transition-opacity">
          {steps[step]}
        </div>
        <div className="h-px bg-border relative">
          <div
            className="absolute left-0 top-0 h-px bg-accent transition-all duration-700"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
        <ol className="mt-8 text-left space-y-2">
          {steps.map((s, i) => (
            <li
              key={s}
              className={`font-mono text-[11px] uppercase tracking-[0.15em] transition-colors ${
                i <= step ? "text-foreground" : "text-muted-foreground/50"
              }`}
            >
              {i <= step ? "▸" : "○"} {s}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────────────────── Results ───────────────────────── */

type Bucket = "high" | "moderate" | "low";
function bucketOf(exposure: number): Bucket {
  if (exposure > 60) return "high";
  if (exposure >= 30) return "moderate";
  return "low";
}
const BUCKET_META: Record<Bucket, { label: string; tone: string; bar: string; ring: string; text: string }> = {
  high: {
    label: "⚠ High exposure",
    tone: "text-destructive",
    bar: "bg-destructive",
    ring: "border-destructive/40",
    text: "text-destructive",
  },
  moderate: {
    label: "◆ Moderate exposure",
    tone: "text-accent",
    bar: "bg-accent",
    ring: "border-accent/40",
    text: "text-accent",
  },
  low: {
    label: "✓ Well-threaded",
    tone: "text-emerald-500",
    bar: "bg-emerald-500",
    ring: "border-emerald-500/40",
    text: "text-emerald-500",
  },
};
const INTERPRETATION: Record<Bucket, string> = {
  high:
    "More than half of your relationship coverage likely depends on single points of contact. If even a handful of your top accounts experience a champion departure this quarter, you would be finding out reactively — after the relationship has already gone cold.",
  moderate:
    "Your portfolio has partial relationship coverage, but gaps exist particularly at the executive sponsor level. The accounts most at risk are likely your largest ones, where a single departure has the highest revenue impact.",
  low:
    "Your portfolio shows strong multi-threading discipline. The opportunity now is in systematising what is likely currently relationship-driven — turning instinct into a repeatable stakeholder mapping process.",
};

function ResultsState({
  exposure,
  subs,
  onRetake,
}: {
  exposure: number;
  subs: ReturnType<typeof subScores>;
  onRetake: () => void;
}) {
  const { rank } = useEntitlements();
  const isUnlocked = rank >= 1; // vanguard or higher
  const bucket = bucketOf(exposure);
  const meta = BUCKET_META[bucket];
  const animated = useCountUp(exposure, 1200);

  // Persist score for logged-in users (best-effort; ignore errors)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        "champion_dependency",
        JSON.stringify({ score: exposure, takenAt: new Date().toISOString() }),
      );
    } catch {
      /* noop */
    }
  }, [exposure]);

  const shareText = useMemo(
    () =>
      `I scored ${exposure}% on The CS Quarterly's Champion Dependency Diagnostic — meaning ${exposure}% of my portfolio relationship coverage may be single-threaded. Worth running for your own book.`,
    [exposure],
  );

  const onShare = async () => {
    const url = canonicalUrl(`/diagnostics/champion-dependency?score=${exposure}`);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Champion Dependency Diagnostic", text: shareText, url });
        return;
      } catch {
        /* fallthrough */
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText} ${url}`).catch(() => {});
    }
  };

  return (
    <section className="py-16 md:py-20 animate-fade-up">
      <div className="max-w-[1100px] mx-auto px-6 grid md:grid-cols-2 gap-12">
        {/* Left — free score */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">
            Your exposure result
          </div>

          <div className={`bg-card border ${meta.ring} p-10 text-center`}>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">
              Single-threading exposure
            </div>
            <div className={`font-display font-bold leading-none ${meta.text}`} style={{ fontSize: "5rem" }}>
              {animated}
              <span className="font-mono text-xs text-muted-foreground align-top ml-1">%</span>
            </div>
            <div className={`mt-4 font-mono text-[11px] uppercase tracking-[0.18em] ${meta.tone}`}>
              {meta.label}
            </div>
          </div>

          <div className="border border-border bg-card mt-5 p-6 space-y-5">
            <SubBar label="Relationship Depth" value={subs.relationshipDepth} />
            <SubBar label="Departure Detection" value={subs.detectionCapability} />
            <SubBar label="Structural Process" value={subs.structuralProcess} />
          </div>

          <p className="text-[15px] text-foreground/75 leading-[1.75] mt-6 text-pretty">
            {INTERPRETATION[bucket]}
          </p>
        </div>

        {/* Right — blueprint */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">
            Your re-threading blueprint
          </div>

          <div className="relative border border-border bg-card p-7 min-h-[280px]">
            {isUnlocked ? (
              <FullBlueprint subs={subs} />
            ) : (
              <>
                <ul className="space-y-4">
                  {[
                    "Single-Threading Risk Map — Which Tiers Are Most Exposed",
                    "The Multi-Threading Sequence — Onboarding to Steady State",
                    "Executive Sponsor Mapping Framework",
                    "The Champion Departure Detection Protocol",
                    "30-Day Re-Threading Action Plan",
                  ].map((s) => (
                    <li key={s} className="text-foreground/80 border-b border-border pb-3 last:border-0">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mr-2">▸</span>
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="absolute inset-0 bg-card/70 backdrop-blur-[3px] flex flex-col items-center justify-center p-8 text-center">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">
                    Locked
                  </div>
                  <div className="font-display text-xl mb-6">Unlock your full re-threading blueprint</div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                    <Link
                      to="/checkout/return"
                      search={{ session_id: "champion-diagnostic-one-time" }}
                      className="px-6 py-3 border border-border font-mono text-[11px] uppercase tracking-[0.2em] hover:border-foreground transition-colors"
                    >
                      $49 one-time
                    </Link>
                    <Link
                      to="/pricing"
                      className="px-6 py-3 bg-accent text-accent-foreground font-mono text-[11px] uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-opacity"
                    >
                      $39/mo Practitioner
                    </Link>
                  </div>
                  <div className="mt-4 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    Practitioner unlocks the full blueprint for every diagnostic + all six Codex playbooks
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => downloadDiagnosticPdf(buildPdfInput(exposure, subs, bucket, isUnlocked))}
            className="mt-6 w-full px-6 py-4 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-opacity"
          >
            {isUnlocked ? "Download branded PDF (score + blueprint)" : "Download branded score PDF"}
          </button>
        </div>
      </div>

      {/* Actions row */}
      <div className="max-w-[1100px] mx-auto px-6 mt-16 pt-8 border-t border-border flex flex-wrap gap-3 justify-between items-center">
        <button
          onClick={onRetake}
          className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          ↻ Retake assessment
        </button>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onShare}
            className="px-5 py-3 border border-border font-mono text-[11px] uppercase tracking-[0.2em] hover:border-foreground transition-colors"
          >
            Share result
          </button>
          {isUnlocked ? (
            <Link
              to="/csfactors"
              className="px-5 py-3 border border-accent text-accent font-mono text-[11px] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              View your stakeholder graph →
            </Link>
          ) : (
            <Link
              to="/codex"
              className="px-5 py-3 border border-border font-mono text-[11px] uppercase tracking-[0.2em] hover:border-foreground transition-colors"
            >
              Explore the codex
            </Link>
          )}
        </div>
      </div>

      {/* Cross-promo to other diagnostic */}
      <div className="max-w-[1100px] mx-auto px-6 mt-20">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
          More free assessments
        </div>
        <Link
          to="/diagnostics/ai-readiness"
          className="block border border-border bg-card p-6 hover:border-accent transition-colors"
        >
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="font-display text-xl mb-1">The CS Operating Maturity Diagnostic</div>
              <p className="text-sm text-muted-foreground">8 dimensions, 32 metrics. Benchmark against top-decile retention orgs.</p>
            </div>
            <span className="font-mono text-xs text-accent">→</span>
          </div>
        </Link>
      </div>
    </section>
  );
}

function SubBar({ label, value }: { label: string; value: number }) {
  const tone = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-accent" : "bg-destructive";
  return (
    <div>
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
        <span>{label}</span>
        <span className="text-foreground">{value}</span>
      </div>
      <div className="h-1 bg-border relative overflow-hidden">
        <div className={`absolute left-0 top-0 h-full ${tone} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function FullBlueprint({ subs }: { subs: ReturnType<typeof subScores> }) {
  const gaps = Object.entries(subs).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([k]) => k);
  const gapLabel: Record<string, string> = {
    relationshipDepth: "relationship depth",
    detectionCapability: "departure detection",
    structuralProcess: "structural process",
  };
  return (
    <div className="space-y-8 text-[14px] leading-[1.7] text-foreground/85">
      <Section eyebrow="Section 01" title="Single-threading risk map">
        Your weakest vectors are <span className="text-accent">{gapLabel[gaps[0]]}</span> and <span className="text-accent">{gapLabel[gaps[1]]}</span>. In practice this shows up first on your highest-ARR accounts — where a single departure carries the largest revenue cost. Concentrate the first sweep there.
      </Section>
      <Section eyebrow="Section 02" title="The multi-threading sequence">
        Minimum contact count by tier: Enterprise 4+ across 3 seniority levels · Mid-market 2–3 contacts · SMB 1–2 acceptable. This is exactly what CSFactors' Stakeholder Graph tracks automatically, with a flag the moment any tier drops below threshold.
      </Section>
      <Section eyebrow="Section 03" title="Executive sponsor mapping">
        Identify the economic buyer — usually one level above your day-to-day contact. Open the relationship via a value-realisation briefing (quarterly outcomes, not status) so the existing champion is reinforced, not bypassed.
      </Section>
      <Section eyebrow="Section 04" title="Champion departure detection protocol">
        Weekly LinkedIn role-change sweep on top 20 accounts, email engagement drop &gt;40% over 14 days, two consecutive meeting cancellations. When triggered, Lumi's Champion Change Navigator walks the CSM through the re-engagement sequence for that account's tier and stage.
      </Section>
      <Section eyebrow="Section 05" title="30-day re-threading action plan">
        <ul className="space-y-2 mt-2">
          <li><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mr-2">Week 1</span>Stakeholder audit on top 10 accounts by ARR.</li>
          <li><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mr-2">Week 2</span>Identify and prioritise the 5 most single-threaded accounts.</li>
          <li><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mr-2">Week 3</span>Initiate outreach to secondary contacts on those 5.</li>
          <li><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mr-2">Week 4</span>Establish quarterly stakeholder-map refresh cadence.</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-5 first:border-0 first:pt-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent mb-1">{eyebrow}</div>
      <div className="font-display text-lg mb-2">{title}</div>
      <div>{children}</div>
    </div>
  );
}

/* ───────────────────────── PDF input builder ───────────────────────── */

function buildPdfInput(
  exposure: number,
  subs: ReturnType<typeof subScores>,
  bucket: Bucket,
  isUnlocked: boolean,
) {
  const meta = BUCKET_META[bucket];
  const gaps = Object.entries(subs).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([k]) => k);
  const gapLabel: Record<string, string> = {
    relationshipDepth: "relationship depth",
    detectionCapability: "departure detection",
    structuralProcess: "structural process",
  };
  return {
    slug: "champion-dependency",
    diagnosticName: "Champion Dependency Diagnostic",
    scoreLabel: "Single-threading exposure",
    scoreValue: `${exposure}%`,
    tierLabel: meta.label,
    interpretation: INTERPRETATION[bucket],
    subScores: [
      { label: "Relationship Depth", value: subs.relationshipDepth },
      { label: "Departure Detection", value: subs.detectionCapability },
      { label: "Structural Process", value: subs.structuralProcess },
    ],
    isUnlocked,
    shareUrlPath: "/diagnostics/champion-dependency",
    blueprintSections: isUnlocked
      ? [
          {
            eyebrow: "Section 01",
            title: "Single-threading risk map",
            body: `Your weakest vectors are ${gapLabel[gaps[0]]} and ${gapLabel[gaps[1]]}. In practice this shows up first on your highest-ARR accounts — where a single departure carries the largest revenue cost. Concentrate the first sweep there.`,
          },
          {
            eyebrow: "Section 02",
            title: "The multi-threading sequence",
            body: "Minimum contact count by tier: Enterprise 4+ across 3 seniority levels · Mid-market 2–3 contacts · SMB 1–2 acceptable. CSFactors' Stakeholder Graph tracks this automatically and flags any tier dropping below threshold.",
          },
          {
            eyebrow: "Section 03",
            title: "Executive sponsor mapping",
            body: "Identify the economic buyer — usually one level above your day-to-day contact. Open the relationship via a value-realisation briefing (quarterly outcomes, not status) so the existing champion is reinforced, not bypassed.",
          },
          {
            eyebrow: "Section 04",
            title: "Champion departure detection protocol",
            body: "Weekly LinkedIn role-change sweep on top 20 accounts, email engagement drop >40% over 14 days, two consecutive meeting cancellations. When triggered, Lumi's Champion Change Navigator walks the CSM through the re-engagement sequence for that account's tier and stage.",
          },
          {
            eyebrow: "Section 05",
            title: "30-day re-threading action plan",
            body: [
              "Week 1 — Stakeholder audit on top 10 accounts by ARR.",
              "Week 2 — Identify and prioritise the 5 most single-threaded accounts.",
              "Week 3 — Initiate outreach to secondary contacts on those 5.",
              "Week 4 — Establish quarterly stakeholder-map refresh cadence.",
            ],
          },
        ]
      : [],
  };
}

