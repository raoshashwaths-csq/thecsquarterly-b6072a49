import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { QMark } from "@/components/site/QMark";
import { LumiMark } from "@/components/site/LumiMark";
import { PERSONA_OPTIONS, type Persona } from "@/hooks/usePersona";
import { finishOnboarding } from "@/lib/onboarding.functions";
import { saveFutureOperatorOnboarding } from "@/lib/future-operator.functions";
import { useEntitlements } from "@/hooks/useEntitlements";

type Props = {
  open: boolean;
  initialPersona: Persona | null;
  onComplete: () => void;
  onDismiss: () => void;
  /** When "future-operator", skip the 5 profile steps and only collect FO context. */
  mode?: "full" | "future-operator";
};

const ACV_BANDS = [
  { value: "lt_10k", label: "Under $10k" },
  { value: "10_50k", label: "$10k – $50k" },
  { value: "50_250k", label: "$50k – $250k" },
  { value: "250k_1m", label: "$250k – $1M" },
  { value: "gt_1m", label: "$1M+" },
  { value: "mixed", label: "Mixed book" },
];

const ARR_RANGES = [
  { value: "lt_5m", label: "Under $5M ARR" },
  { value: "5_20m", label: "$5M – $20M" },
  { value: "20_100m", label: "$20M – $100M" },
  { value: "100m_1b", label: "$100M – $1B" },
  { value: "gt_1b", label: "$1B+" },
];

const CHALLENGES: { value: string; label: string; blurb: string }[] = [
  { value: "churn_risk", label: "Churn risk", blurb: "Renewals at risk, contraction looming." },
  { value: "expansion_motion", label: "Expansion motion", blurb: "Net new ARR from existing customers." },
  { value: "stakeholder_coverage", label: "Stakeholder coverage", blurb: "Sponsor risk, single-threaded accounts." },
  { value: "team_capability", label: "Team capability", blurb: "Hiring, ramp, performance." },
  { value: "ai_readiness", label: "AI readiness", blurb: "Embedding AI into CS workflows." },
];

type FormState = {
  persona: string;
  acv_band: string;
  company_arr_range: string;
  challenges: string[];
  difficult_account: string;
  // Step 6 — Future Operator (Practitioner+ only)
  future_team_state: string;
  core_commitments: string[];
  current_focus_account: string;
};

export function OnboardingStepper({ open, initialPersona, onComplete, onDismiss }: Props) {
  const submit = useServerFn(finishOnboarding);
  const saveFutureOperator = useServerFn(saveFutureOperatorOnboarding);
  const { dRank } = useEntitlements();
  const isPractitionerPlus = dRank >= 1;
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [commitmentDraft, setCommitmentDraft] = useState("");
  const [form, setForm] = useState<FormState>({
    persona: initialPersona ?? "",
    acv_band: "",
    company_arr_range: "",
    challenges: [],
    difficult_account: "",
    future_team_state: "",
    core_commitments: [],
    current_focus_account: "",
  });

  const total = isPractitionerPlus ? 6 : 5;
  const canNext = useMemo(() => {
    if (step === 0) return !!form.persona;
    if (step === 1) return !!form.acv_band;
    if (step === 2) return !!form.company_arr_range;
    if (step === 3) return form.challenges.length >= 1 && form.challenges.length <= 3;
    if (step === 4) return true; // optional
    if (step === 5) {
      return form.future_team_state.trim().length >= 5 && form.core_commitments.length >= 1;
    }
    return true;
  }, [step, form]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submit({
        data: {
          persona: form.persona,
          acv_band: form.acv_band,
          company_arr_range: form.company_arr_range,
          challenges: form.challenges,
          difficult_account: form.difficult_account.trim(),
        },
      });
      if (isPractitionerPlus && form.future_team_state.trim() && form.core_commitments.length > 0) {
        try {
          const tz =
            typeof Intl !== "undefined" && Intl.DateTimeFormat
              ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
              : "UTC";
          await saveFutureOperator({
            data: {
              future_team_state: form.future_team_state.trim(),
              core_commitments: form.core_commitments,
              current_focus_account: form.current_focus_account.trim(),
              timezone: tz,
            },
          });
        } catch (foErr) {
          // Soft-fail: profile is saved; FO seed can be retried from /account/quests.
          console.warn("Future Operator save failed", foErr);
        }
      }
      toast.success("Lumi has your context. Ask anything.");
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onDismiss(); }}>
      <DialogContent className="max-w-2xl bg-background border border-border p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-foreground/5 border border-border flex items-center justify-center">
              <QMark className="text-sm" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent">
                Lumi · Operator profile
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                Step {step + 1} of {total} · ~90 seconds
              </div>
            </div>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === step ? "w-6 bg-accent" : i < step ? "w-3 bg-secondary-accent" : "w-3 bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-8 min-h-[320px]">
          {step === 0 && (
            <Step
              eyebrow="Question 1"
              title="What's your role?"
              hint="So Lumi pitches every answer at the right altitude."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PERSONA_OPTIONS.map((opt) => (
                  <ChoiceButton
                    key={opt.value}
                    selected={form.persona === opt.value}
                    onClick={() => setForm((f) => ({ ...f, persona: opt.value }))}
                  >
                    {opt.label}
                  </ChoiceButton>
                ))}
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step
              eyebrow="Question 2"
              title="What's your typical ACV band?"
              hint="The average annual contract value across the book you own."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ACV_BANDS.map((opt) => (
                  <ChoiceButton
                    key={opt.value}
                    selected={form.acv_band === opt.value}
                    onClick={() => setForm((f) => ({ ...f, acv_band: opt.value }))}
                  >
                    {opt.label}
                  </ChoiceButton>
                ))}
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step
              eyebrow="Question 3"
              title="What's your company's ARR range?"
              hint="Frames the operating context — playbooks change a lot across stages."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ARR_RANGES.map((opt) => (
                  <ChoiceButton
                    key={opt.value}
                    selected={form.company_arr_range === opt.value}
                    onClick={() => setForm((f) => ({ ...f, company_arr_range: opt.value }))}
                  >
                    {opt.label}
                  </ChoiceButton>
                ))}
              </div>
            </Step>
          )}

          {step === 3 && (
            <Step
              eyebrow="Question 4"
              title="What are you trying to fix right now?"
              hint="Pick one to three. Lumi will lean into these in every conversation."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CHALLENGES.map((opt) => {
                  const selected = form.challenges.includes(opt.value);
                  const disabled = !selected && form.challenges.length >= 3;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      disabled={disabled}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          challenges: selected
                            ? f.challenges.filter((c) => c !== opt.value)
                            : [...f.challenges, opt.value],
                        }))
                      }
                      className={`text-left p-4 border transition-colors ${
                        selected
                          ? "border-accent bg-accent/10"
                          : disabled
                          ? "border-border opacity-40 cursor-not-allowed"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      <div className="font-mono text-xs uppercase tracking-widest mb-1">{opt.label}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{opt.blurb}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {form.challenges.length}/3 selected
              </div>
            </Step>
          )}

          {step === 4 && (
            <Step
              eyebrow="Question 5"
              title="Describe your most difficult account, in one sentence."
              hint="Optional. Lumi will hold this and reference it in future conversations."
            >
              <textarea
                value={form.difficult_account}
                onChange={(e) =>
                  setForm((f) => ({ ...f, difficult_account: e.target.value.slice(0, 280) }))
                }
                rows={3}
                placeholder="e.g. Mid-market SaaS renewal, sponsor just left, 60 days to close."
                className="w-full p-3 bg-transparent border border-border focus:border-foreground outline-none text-sm font-serif resize-none"
              />
              <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-right">
                {form.difficult_account.length}/280
              </div>
            </Step>
          )}

          {step === 5 && isPractitionerPlus && (
            <Step
              eyebrow="Future Operator · One last thing"
              title="Where are you heading?"
              hint="Lumi's Future Operator persona will reference this in your daily quests and drift signals."
            >
              <div className="flex items-center gap-3 mb-5">
                <LumiMark variant="gold" className="h-10 w-10" />
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent">
                  Practitioner+ · Future Operator
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/70 mb-2 block">
                    1 · The future state of your team or book
                  </label>
                  <textarea
                    value={form.future_team_state}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, future_team_state: e.target.value.slice(0, 400) }))
                    }
                    rows={2}
                    placeholder="e.g. NRR above 120%, zero unforecasted churn, every CSM owning a strategic account."
                    className="w-full p-3 bg-transparent border border-border focus:border-foreground outline-none text-sm font-serif resize-none"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/70 mb-2 block">
                    2 · Your 1–3 core commitments to get there
                  </label>
                  <div className="space-y-2 mb-2">
                    {form.core_commitments.map((c, i) => (
                      <div key={i} className="flex items-center justify-between border border-border px-3 py-2 text-sm font-serif">
                        <span className="truncate">{c}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              core_commitments: f.core_commitments.filter((_, j) => j !== i),
                            }))
                          }
                          className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent ml-3"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  {form.core_commitments.length < 3 && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commitmentDraft}
                        onChange={(e) => setCommitmentDraft(e.target.value.slice(0, 280))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && commitmentDraft.trim()) {
                            e.preventDefault();
                            setForm((f) => ({
                              ...f,
                              core_commitments: [...f.core_commitments, commitmentDraft.trim()],
                            }));
                            setCommitmentDraft("");
                          }
                        }}
                        placeholder="e.g. Lead every renewal conversation, not react to it."
                        className="flex-1 p-3 bg-transparent border border-border focus:border-foreground outline-none text-sm font-serif"
                      />
                      <button
                        type="button"
                        disabled={!commitmentDraft.trim()}
                        onClick={() => {
                          if (!commitmentDraft.trim()) return;
                          setForm((f) => ({
                            ...f,
                            core_commitments: [...f.core_commitments, commitmentDraft.trim()],
                          }));
                          setCommitmentDraft("");
                        }}
                        className="px-4 border border-border font-mono text-[10px] uppercase tracking-widest hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  )}
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {form.core_commitments.length}/3 commitments
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/70 mb-2 block">
                    3 · Your single most important focus account right now
                  </label>
                  <input
                    type="text"
                    value={form.current_focus_account}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, current_focus_account: e.target.value.slice(0, 280) }))
                    }
                    placeholder="Optional. Name + the one outcome that matters."
                    className="w-full p-3 bg-transparent border border-border focus:border-foreground outline-none text-sm font-serif"
                  />
                </div>
              </div>
            </Step>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-border bg-foreground/[0.02]">
          <button
            type="button"
            onClick={onDismiss}
            className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Finish later
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="px-5 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:border-foreground transition-colors"
              >
                Back
              </button>
            )}
            {step < total - 1 ? (
              <button
                type="button"
                disabled={!canNext}
                onClick={() => setStep((s) => s + 1)}
                className="px-6 py-2.5 bg-foreground text-background font-mono text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-accent text-background font-mono text-xs uppercase tracking-widest disabled:opacity-40"
              >
                {submitting ? "Saving…" : "Finish onboarding"}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Step({
  eyebrow,
  title,
  hint,
  children,
}: {
  eyebrow: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-up">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">{eyebrow}</div>
      <h2 className="font-display text-3xl md:text-4xl leading-[1.05] tracking-tight mb-2 text-balance">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">{hint}</p>
      {children}
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left px-4 py-3 border transition-colors font-mono text-xs uppercase tracking-widest ${
        selected ? "border-accent bg-accent/10 text-foreground" : "border-border hover:border-foreground text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
