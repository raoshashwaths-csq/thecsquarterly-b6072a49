import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { QUESTIONS, SCORE_OPTIONS, GAP_FIXES, AGENT_INFO } from "@/lib/survey";
import type { ScoreResult } from "@/lib/survey";
import { submitSurvey } from "@/lib/survey.functions";
import { trackDiagnosticEvent } from "@/lib/diagnostics-analytics";
import { useEntitlements } from "@/hooks/useEntitlements";
import { downloadDiagnosticPdf } from "@/lib/diagnostic-pdf";
import { canonicalUrl } from "@/lib/canonical-url";
import { toast } from "sonner";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Route = createFileRoute("/diagnostics/ai-readiness/survey")({
  head: () => ({
    meta: [
      { title: "CS Operating Maturity Diagnostic, The CS Quarterly" },
      {
        name: "description",
        content: "8 dimensions, 32 metrics. Benchmark your Customer Success operating model against the discipline of top-decile retention orgs.",
      },
      { property: "og:url", content: "/diagnostics/ai-readiness/survey" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/diagnostics/ai-readiness/survey" }],
  }),
  component: SurveyPage,
});

const TIER_TINT: Record<string, string> = {
  Block: "bg-destructive/15 text-destructive",
  Pilot: "bg-secondary-accent/20 text-secondary-accent-foreground",
  Scale: "bg-accent/15 text-accent",
  "AI Native": "bg-foreground text-background",
};

function SurveyPage() {
  const submitFn = useServerFn(submitSurvey);
  const [step, setStep] = useState(-1); // -1 = lead form, 0..N-1 = questions
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [segment, setSegment] = useState("");
  const [hcm, setHcm] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);

  const emailValid = EMAIL_PATTERN.test(email.trim());
  const leadValid = name.trim() && emailValid && company.trim() && title.trim() && segment;
  const currentQuestion = step >= 0 ? QUESTIONS[step] : null;
  const allCurrentAnswered = currentQuestion
    ? currentQuestion.metrics.every((m) => typeof answers[m.id] === "number")
    : true;

  useEffect(() => {
    trackDiagnosticEvent("diagnostic.survey_start", {
      slug: "ai-readiness",
      surface: "ai-readiness.survey",
    });
  }, []);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await submitFn({
        data: { name, email, company, title, segment, hcm_status: hcm, answers },
      });
      setResult(res);
      trackDiagnosticEvent("diagnostic.submit", {
        slug: "ai-readiness",
        surface: "ai-readiness.survey",
        meta: { tier: res?.tier, score: res?.finalScore },
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) return <ResultsView result={result} email={email} firstName={name.split(" ")[0]} company={company} />;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {step >= 0 && (
        <div className="max-w-3xl mx-auto px-6 w-full pt-12">
          <div className="flex justify-between font-mono uppercase tracking-widest text-xs text-muted-foreground mb-3">
            <span>{currentQuestion!.section}</span>
            <span>Question {step + 1} of {QUESTIONS.length}</span>
          </div>
          <div className="h-px bg-border relative">
            <div
              className="absolute left-0 top-0 h-px bg-accent transition-all duration-500"
              style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 pt-12 pb-16 w-full">
        {step === -1 && (
          <div className="animate-fade-up">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-6">
              6 minutes · 8 dimensions · 32 metrics
            </div>
            <h1 className="font-display text-5xl md:text-6xl leading-[0.95] mb-6">
              Is your CS function <span className="text-secondary-accent">built to retain?</span>
            </h1>
            <p className="text-lg text-foreground/75 mb-10 text-pretty">
              Benchmark your operating model, segmentation, health, onboarding, forecasting, escalation, QBRs, AI, against the discipline of top-decile retention orgs.
            </p>
            <div className="space-y-7">
              <div className="grid sm:grid-cols-2 gap-7">
                <Field label="Full name *" value={name} onChange={setName} placeholder="Jane Doe" />
                <Field label="Work email *" value={email} onChange={setEmail} type="email" placeholder="you@company.com" />
              </div>
              <div className="grid sm:grid-cols-2 gap-7">
                <Field label="Company *" value={company} onChange={setCompany} placeholder="Acme Inc." />
                <Field label="Job title *" value={title} onChange={setTitle} placeholder="VP CS / CCO / Head of CS" />
              </div>
              <div className="grid sm:grid-cols-2 gap-7">
                <SelectField label="ARR band *" value={segment} onChange={setSegment}>
                  <option value="">Select range</option>
                  <option value="growth">$20M – $50M ARR</option>
                  <option value="growth">$50M – $100M ARR</option>
                  <option value="enterprise">$100M – $300M ARR</option>
                  <option value="enterprise">$300M – $1B ARR</option>
                  <option value="enterprise">$1B+ ARR</option>
                </SelectField>
                <SelectField label="CS platform in use" value={hcm} onChange={setHcm}>
                  <option value="">Select status</option>
                  <option value="none">Spreadsheets / CRM only</option>
                  <option value="legacy">Gainsight / Totango / ChurnZero</option>
                  <option value="modern">Vitally / Catalyst / Planhat</option>
                  <option value="evaluating">Currently evaluating</option>
                </SelectField>
              </div>
            </div>
            <div className="flex justify-end mt-12 pt-8 border-t border-border">
              {email.trim() && !emailValid && (
                <p className="text-destructive font-mono text-xs uppercase tracking-widest">
                  Enter a valid work email to start.
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!leadValid) {
                    setError(email.trim() && !emailValid ? "Enter a valid work email to start." : "Complete all required fields to start.");
                    return;
                  }
                  setError(null);
                  setStep(0);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={!leadValid}
                className="px-8 py-4 bg-foreground text-background font-mono text-xs uppercase tracking-widest font-bold disabled:opacity-30 hover:bg-accent transition-colors"
              >
                Start the diagnostic →
              </button>
            </div>
          </div>
        )}

        {currentQuestion && (
          <div key={currentQuestion.id} className="animate-fade-up">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-4">
              Dimension {currentQuestion.id} · Weight {currentQuestion.weight} pts
            </div>
            <h2 className="font-display text-3xl md:text-5xl leading-[1.1] mb-4 text-balance">
              {currentQuestion.title}
            </h2>
            <p className="text-foreground/70 mb-12 text-pretty">{currentQuestion.desc}</p>

            <div className="space-y-8">
              {currentQuestion.metrics.map((m) => (
                <div key={m.id} className="border-t border-border pt-6">
                  <div className="mb-1 font-semibold text-foreground">{m.label}</div>
                  <p className="text-sm text-muted-foreground mb-4">{m.help}</p>
                  <div className="flex flex-wrap gap-2">
                    {SCORE_OPTIONS.map((opt) => {
                      const selected = answers[m.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setAnswers((a) => ({ ...a, [m.id]: opt.value }))}
                          title={opt.desc}
                          className={`px-4 py-2 border font-mono text-xs uppercase tracking-widest transition-colors ${
                            selected
                              ? "bg-foreground text-background border-foreground"
                              : "border-border hover:border-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-destructive font-mono text-xs uppercase tracking-widest mt-8">
                {error}
              </p>
            )}

            <div className="flex justify-between items-center mt-16 pt-8 border-t border-border">
              <button
                onClick={() => { setStep((s) => Math.max(-1, s - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              {step < QUESTIONS.length - 1 ? (
                <button
                  onClick={() => { setStep((s) => s + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  disabled={!allCurrentAnswered}
                  className="px-8 py-4 bg-foreground text-background font-mono text-xs uppercase tracking-widest font-bold disabled:opacity-30 hover:bg-accent transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !allCurrentAnswered}
                  className="px-8 py-4 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-widest font-bold disabled:opacity-50"
                >
                  {submitting ? "Scoring…" : "See my score →"}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function ResultsView({ result, email, firstName, company }: { result: ScoreResult; email: string; firstName: string; company: string }) {
  const { rank } = useEntitlements();
  const isUnlocked = rank >= 1; // Practitioner+ gets the full blueprint PDF

  const handleDownload = () => {
    downloadDiagnosticPdf({
      slug: "ai-readiness",
      diagnosticName: "CS Operating Maturity Diagnostic",
      scoreLabel: "Final score",
      scoreValue: `${result.finalScore}/100`,
      tierLabel: result.tierLabel,
      interpretation: result.headline,
      subScores: Object.values(result.dimensionScores).map((d) => ({
        label: d.label,
        value: Math.round((d.weighted / d.weight) * 100),
      })),
      isUnlocked,
      shareUrlPath: "/diagnostics/ai-readiness",
      blueprintSections: isUnlocked
        ? [
            { eyebrow: "Recommended Path", title: "Where to start", body: result.recommendation },
            ...result.topGaps.map((d, i) => ({
              eyebrow: `Gap 0${i + 1}`,
              title: d.label,
              body: GAP_FIXES[d.id] ?? "",
            })),
            ...result.ninetyDayPlan.map((p, i) => ({
              eyebrow: p.week,
              title: `${i + 1}. ${p.title}`,
              body: p.items.map((it) => `• ${it}`),
            })),
          ]
        : [],
    });
  };

  const handleCopyLink = async () => {
    const url = canonicalUrl(
      `/diagnostics/ai-readiness?score=${result.finalScore}&tier=${encodeURIComponent(result.tier)}`,
    );
    const text = `I scored ${result.finalScore}/100 (${result.tierLabel}) on The CS Quarterly's CS Operating Maturity Diagnostic. ${url}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "My CS Operating Maturity score", text, url }); return; } catch { /* fallthrough */ }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try { await navigator.clipboard.writeText(text); toast.success("Link copied"); } catch { /* noop */ }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="max-w-4xl mx-auto px-6 pt-16 pb-16 w-full animate-fade-up">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-6">
          Your Super Agent Readiness Report
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-3">
          Hello {firstName || "there"}.
        </h1>
        <p className="text-lg text-foreground/70 mb-12">
          Here's how ready {company || "your organisation"} is for agentic AI.
        </p>

        <div className="grid md:grid-cols-3 gap-8 items-end border-t border-b border-border py-10 mb-12">
          <div className="md:col-span-1">
            <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground mb-2">Final Score</div>
            <div className="font-display text-8xl leading-none">{result.finalScore}<span className="text-2xl text-muted-foreground">/100</span></div>
          </div>
          <div className="md:col-span-2">
            <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground mb-2">Tier</div>
            <span className={`inline-block px-4 py-2 font-mono text-xs uppercase tracking-widest ${TIER_TINT[result.tier]}`}>
              {result.tierLabel}
            </span>
            <div className="mt-4 font-mono uppercase tracking-widest text-xs text-muted-foreground">
              Foundational {Math.round(result.foundationalTotal)}/50 · Agent-Level {Math.round(result.agentTotal)}/50
            </div>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="font-display text-3xl mb-4">What this means for you</h2>
          <p className="text-lg leading-relaxed text-foreground/85 text-pretty">{result.headline}</p>
          <div className="mt-8 bg-foreground text-background p-8">
            <div className="font-mono uppercase tracking-widest text-xs opacity-60 mb-2">Recommended Path</div>
            <div className="text-xl leading-relaxed">{result.recommendation}</div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-12 mb-16">
          <Breakdown title="Foundational Discipline" max={50} total={result.foundationalTotal} items={Object.values(result.dimensionScores).filter((d) => d.section === "Foundational Discipline")} />
          <Breakdown title="Strategic Operating" max={50} total={result.agentTotal} items={Object.values(result.dimensionScores).filter((d) => d.section === "Strategic Operating")} />
        </section>

        <section className="mb-16">
          <h2 className="font-display text-3xl mb-8">Your top 3 gaps to close</h2>
          <ol className="space-y-8">
            {result.topGaps.map((d, i) => {
              const pct = Math.round((d.weighted / d.weight) * 100);
              return (
                <li key={d.id} className="border-t border-border pt-6">
                  <div className="flex justify-between items-baseline mb-2">
                    <div className="flex items-baseline gap-4">
                      <span className="font-mono text-xs text-secondary-accent">GAP 0{i + 1}</span>
                      <span className="font-display text-2xl">{d.label}</span>
                    </div>
                    <span className="font-mono text-sm text-muted-foreground">{pct}% of max</span>
                  </div>
                  <p className="text-foreground/80 leading-relaxed">{GAP_FIXES[d.id]}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {result.recommendedAgents.length > 0 && (
          <section className="mb-16">
            <h2 className="font-display text-3xl mb-8">Recommended starter agents</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {result.recommendedAgents.map((id) => {
                const a = AGENT_INFO[id];
                const d = result.dimensionScores[id];
                const ready = d.weighted / d.weight >= 0.6;
                return (
                  <div key={id} className={`border p-6 ${ready ? "border-accent" : "border-secondary-accent"}`}>
                    <div className="flex justify-between items-baseline mb-2">
                      <h3 className="font-display text-xl">{a.name}</h3>
                      <span className={`font-mono uppercase tracking-widest text-xs ${ready ? "text-accent" : "text-secondary-accent"}`}>
                        {ready ? "Ready" : "Prep"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{a.desc}</p>
                    <div className="font-mono uppercase tracking-widest text-xs">
                      Readiness: <span className="font-bold">{Math.round((d.weighted / d.weight) * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mb-16">
          <h2 className="font-display text-3xl mb-8">Your 90-day preparation plan</h2>
          <ol className="space-y-8">
            {result.ninetyDayPlan.map((p, i) => (
              <li key={i} className="border-t border-border pt-6">
                <div className="flex justify-between items-baseline mb-3">
                  <h3 className="font-display text-2xl">{i + 1}. {p.title}</h3>
                  <span className="font-mono text-xs uppercase tracking-widest text-secondary-accent">{p.week}</span>
                </div>
                <ul className="space-y-2">
                  {p.items.map((it, j) => (
                    <li key={j} className="flex gap-3 text-foreground/80">
                      <span className="text-accent">→</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-wrap gap-3 mb-8 pt-8 border-t border-border">
          <button
            type="button"
            onClick={handleDownload}
            className="px-6 py-3 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity"
          >
            {isUnlocked ? "Download branded PDF (score + 90-day plan)" : "Download branded score PDF"}
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-6 py-3 border border-border font-mono text-xs uppercase tracking-widest hover:border-foreground transition-colors"
          >
            Share result
          </button>
          {!isUnlocked && (
            <Link
              to="/pricing"
              className="px-6 py-3 border border-accent text-accent font-mono text-xs uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Unlock full blueprint — $39/mo
            </Link>
          )}
        </div>

        <div className="bg-foreground text-background p-10">
          <h3 className="font-display text-3xl mb-3">You're now on the dispatch.</h3>
          <p className="text-background/70 mb-6">
            We added {email} to The CS Quarterly. Look for the next issue on Tuesday.
          </p>
          <Link
            to="/insights"
            className="inline-block px-6 py-3 border border-background/30 font-mono text-xs uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors"
          >
            Browse the archive
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Breakdown({ title, max, total, items }: { title: string; max: number; total: number; items: { id: string; label: string; weight: number; weighted: number }[] }) {
  return (
    <div>
      <h3 className="font-display text-2xl mb-1">{title}</h3>
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">
        {Math.round(total)} / {max} pts
      </div>
      <ul className="space-y-4">
        {items.map((d) => {
          const pct = (d.weighted / d.weight) * 100;
          const tone = pct >= 70 ? "bg-accent" : pct >= 50 ? "bg-secondary-accent" : "bg-destructive";
          return (
            <li key={d.id}>
              <div className="flex justify-between text-sm mb-1.5">
                <span>{d.label}</span>
                <span className="font-mono text-xs">{d.weighted.toFixed(1)} / {d.weight}</span>
              </div>
              <div className="h-[3px] bg-border relative">
                <div className={`absolute left-0 top-0 h-full ${tone}`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="font-mono uppercase tracking-widest text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-2 bg-transparent border-b border-foreground/30 focus:border-foreground outline-none py-3 text-xl placeholder:text-muted-foreground/40"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono uppercase tracking-widest text-xs text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-2 bg-transparent border-b border-foreground/30 focus:border-foreground outline-none py-3 text-lg"
      >
        {children}
      </select>
    </label>
  );
}
