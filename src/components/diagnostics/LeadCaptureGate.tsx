/**
 * LeadCaptureGate — shared email-capture wall for every diagnostic.
 *
 * Mirrors the AI Readiness survey lead form (name, work email, company,
 * job title, ARR band) but is portable to any future diagnostic under
 * /diagnostics/*. Plug in by mounting this component before any survey
 * question UI; once the user submits, call `onUnlock(lead)` and persist
 * via `submitDiagnosticLead` (slug-keyed) inside the parent.
 *
 * Style: matches AI Readiness lead form so the gate experience is
 * identical across diagnostics.
 */
import { useState } from "react";
import { submitDiagnosticLead } from "@/lib/diagnostic-leads.functions";
import { useServerFn } from "@tanstack/react-start";

export type DiagnosticLead = {
  name: string;
  email: string;
  company: string;
  title: string;
  segment: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LeadCaptureGate({
  slug,
  eyebrow,
  title,
  subtitle,
  onUnlock,
}: {
  slug: string;
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  onUnlock: (lead: DiagnosticLead) => void;
}) {
  const submitLead = useServerFn(submitDiagnosticLead);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [titleVal, setTitleVal] = useState("");
  const [segment, setSegment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = EMAIL_PATTERN.test(email.trim());
  const valid = name.trim() && emailValid && company.trim() && titleVal.trim() && segment;

  async function handleStart() {
    if (!valid) {
      setError(email.trim() && !emailValid ? "Enter a valid work email to start." : "Complete all required fields to start.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const lead: DiagnosticLead = { name, email, company, title: titleVal, segment };
    try {
      await submitLead({ data: { slug, ...lead } });
    } catch {
      /* lead capture is best-effort — don't block the user */
    } finally {
      setSubmitting(false);
      onUnlock(lead);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pt-12 pb-16 w-full animate-fade-up">
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-6">{eyebrow}</div>
      <h1 className="font-display text-5xl md:text-6xl leading-[0.95] mb-6">{title}</h1>
      {subtitle && <p className="text-lg text-foreground/75 mb-10 text-pretty">{subtitle}</p>}

      <div className="space-y-7">
        <div className="grid sm:grid-cols-2 gap-7">
          <Field label="Full name *" value={name} onChange={setName} placeholder="Jane Doe" />
          <Field label="Work email *" value={email} onChange={setEmail} type="email" placeholder="you@company.com" />
        </div>
        <div className="grid sm:grid-cols-2 gap-7">
          <Field label="Company *" value={company} onChange={setCompany} placeholder="Acme Inc." />
          <Field label="Job title *" value={titleVal} onChange={setTitleVal} placeholder="VP CS / Head of CS" />
        </div>
        <SelectField label="ARR band *" value={segment} onChange={setSegment}>
          <option value="">Select range</option>
          <option value="growth">$20M – $50M ARR</option>
          <option value="growth">$50M – $100M ARR</option>
          <option value="enterprise">$100M – $300M ARR</option>
          <option value="enterprise">$300M – $1B ARR</option>
          <option value="enterprise">$1B+ ARR</option>
        </SelectField>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-end items-start sm:items-center mt-12 pt-8 border-t border-border">
        {error && (
          <p className="text-destructive font-mono text-xs uppercase tracking-widest">{error}</p>
        )}
        <button
          type="button"
          onClick={handleStart}
          disabled={!valid || submitting}
          className="px-8 py-4 bg-foreground text-background font-mono text-xs uppercase tracking-widest font-bold disabled:opacity-30 hover:bg-accent transition-colors"
        >
          {submitting ? "Starting…" : "Start the diagnostic →"}
        </button>
      </div>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Your score is delivered instantly. We'll add you to the Tuesday dispatch — unsubscribe anytime.
      </p>
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
