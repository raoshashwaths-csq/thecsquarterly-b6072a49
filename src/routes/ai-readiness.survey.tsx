import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SURVEY, MAX_SCORE } from "@/lib/survey";
import { submitSurvey } from "@/lib/survey.functions";

export const Route = createFileRoute("/ai-readiness/survey")({
  head: () => ({
    meta: [
      { title: "Take the AI Readiness Survey — The CS Quarterly" },
      {
        name: "description",
        content: "Twelve questions across Strategy, Data, Skills, and Culture. Get your tier and three recommendations.",
      },
      { property: "og:url", content: "/ai-readiness/survey" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/ai-readiness/survey" }],
  }),
  component: SurveyPage,
});

type Result = Awaited<ReturnType<typeof submitSurvey>>;

function SurveyPage() {
  const submitFn = useServerFn(submitSurvey);
  const [step, setStep] = useState(0); // 0 = intro fields, 1..N = questions, N+1 = submit
  const total = SURVEY.length + 1;

  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const introValid = email.trim() && company.trim() && role.trim();
  const currentQuestion = step > 0 ? SURVEY[step - 1] : null;
  const currentAnswered = currentQuestion ? answers[currentQuestion.id] !== undefined : true;

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await submitFn({ data: { email, company, role, answers } });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const pct = Math.round((result.score / MAX_SCORE) * 100);
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="max-w-3xl mx-auto px-6 pt-20 pb-16 animate-fade-up">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-6">
            Your Result
          </div>
          <h1 className="font-display text-6xl md:text-7xl leading-[0.95] mb-4">
            <span className="italic">{result.tier}.</span>
          </h1>
          <p className="font-mono text-sm text-muted-foreground mb-10">
            Score: {result.score} / {MAX_SCORE} · {pct}%
          </p>
          <p className="text-xl leading-relaxed text-foreground/85 mb-12 text-pretty">
            {result.blurb}
          </p>

          <div className="border-t border-border pt-8">
            <h2 className="font-display text-3xl mb-6">Your three next moves</h2>
            <ol className="space-y-6">
              {result.recommendations.map((r, i) => (
                <li key={i} className="flex gap-6">
                  <span className="font-mono text-[11px] text-accent pt-1.5">
                    0{i + 1}
                  </span>
                  <span className="text-lg leading-relaxed">{r}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-16 bg-foreground text-background p-10">
            <h3 className="font-display text-3xl mb-4">You're now on the dispatch.</h3>
            <p className="text-background/70 mb-6">
              We added {email} to The CS Quarterly. Look for the next issue on Tuesday.
            </p>
            <Link
              to="/insights"
              className="inline-block px-6 py-3 border border-background/30 font-mono text-[11px] uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors"
            >
              Browse the archive
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Progress */}
      <div className="max-w-3xl mx-auto px-6 w-full pt-12">
        <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
          <span>Step {Math.min(step + 1, total)} / {total}</span>
          <span>AI Readiness Survey</span>
        </div>
        <div className="h-px bg-border relative">
          <div
            className="absolute left-0 top-0 h-px bg-accent transition-all duration-500"
            style={{ width: `${((step) / (total - 1)) * 100}%` }}
          />
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 pt-16 pb-16 w-full">
        {step === 0 && (
          <div className="animate-fade-up">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-6">
              Before we start
            </div>
            <h1 className="font-display text-5xl md:text-6xl leading-[0.95] mb-10">
              Tell us who's asking.
            </h1>
            <div className="space-y-8">
              <Field label="Work email" value={email} onChange={setEmail} type="email" placeholder="you@company.com" />
              <Field label="Company" value={company} onChange={setCompany} placeholder="Acme Inc." />
              <Field label="Your role" value={role} onChange={setRole} placeholder="VP of Customer Success" />
            </div>
          </div>
        )}

        {currentQuestion && (
          <div key={currentQuestion.id} className="animate-fade-up">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-6">
              {currentQuestion.dimension}
            </div>
            <h2 className="font-display text-3xl md:text-5xl leading-[1.1] mb-12 text-balance">
              {currentQuestion.prompt}
            </h2>
            <div className="space-y-3">
              {currentQuestion.options.map((opt) => {
                const selected = answers[currentQuestion.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setAnswers((a) => ({ ...a, [currentQuestion.id]: opt.value }))
                    }
                    className={`w-full text-left px-6 py-5 border transition-colors flex items-center justify-between gap-4 ${
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    <span className="text-lg">{opt.label}</span>
                    <span className={`font-mono text-[10px] uppercase tracking-widest ${selected ? "opacity-60" : "text-muted-foreground"}`}>
                      {opt.value} pts
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <p className="text-destructive font-mono text-[11px] uppercase tracking-widest mt-8">
            {error}
          </p>
        )}

        {/* Nav */}
        <div className="flex justify-between items-center mt-16 pt-8 border-t border-border">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            ← Back
          </button>

          {step < SURVEY.length ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 ? !introValid : !currentAnswered}
              className="px-8 py-4 bg-foreground text-background font-mono text-[11px] uppercase tracking-widest font-bold disabled:opacity-30 hover:bg-accent transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-4 bg-accent text-accent-foreground font-mono text-[11px] uppercase tracking-widest font-bold disabled:opacity-50"
            >
              {submitting ? "Scoring…" : "Get my result →"}
            </button>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
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
