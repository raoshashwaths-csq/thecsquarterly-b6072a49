import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitLumiFeedback } from "@/lib/lumi-feedback.functions";

/**
 * Resolution-level feedback bar. Renders below Zone 3.
 * Two states: pristine → submitted. "Not quite" expands an inline textarea.
 */
export function LumiFeedbackBar({ runId }: { runId: string }) {
  const submit = useServerFn(submitLumiFeedback);
  const [stage, setStage] = useState<"idle" | "negative" | "done-yes" | "done-no">("idle");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendYes() {
    setSubmitting(true);
    setError(null);
    try {
      await submit({ data: { runId, rating: "1" } });
      setStage("done-yes");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function sendNo() {
    setSubmitting(true);
    setError(null);
    try {
      await submit({
        data: { runId, rating: "-1", note: note.trim() || undefined },
      });
      setStage("done-no");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === "done-yes" || stage === "done-no") {
    return (
      <section className="border-t border-border pt-8 pb-10">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">
          Feedback
        </div>
        <p className="font-body text-foreground/85">
          {stage === "done-yes"
            ? "Thank you — noted."
            : "Logged. We'll sharpen this for the next operator who hits the same situation."}
        </p>
      </section>
    );
  }

  return (
    <section className="border-t border-border pt-8 pb-10">
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-3">
        Was this helpful?
      </div>

      {stage === "idle" && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={sendYes}
            className="font-mono text-xs uppercase tracking-[0.25em] px-5 py-3 border border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
          >
            ◉ Yes — this helped
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => setStage("negative")}
            className="font-mono text-xs uppercase tracking-[0.25em] px-5 py-3 border border-border text-foreground/70 hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
          >
            ○ Not quite
          </button>
        </div>
      )}

      {stage === "negative" && (
        <div className="space-y-3">
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-foreground/60 mb-2 block">
              What was missing or off?
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="The advice didn't account for…"
              className="w-full bg-transparent border border-border focus:border-accent outline-none px-4 py-3 font-body text-[15px] leading-[1.6] resize-y"
              autoFocus
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={sendNo}
              className="font-mono text-xs uppercase tracking-[0.25em] px-5 py-3 border border-foreground/30 text-foreground hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send feedback"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStage("idle");
                setNote("");
              }}
              className="font-mono text-xs uppercase tracking-[0.25em] text-foreground/50 hover:text-foreground/80"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
