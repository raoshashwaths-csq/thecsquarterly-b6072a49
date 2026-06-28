import { useState, useEffect, type ReactNode } from "react";
import { ArrowLeft, RotateCcw, AlertTriangle, CheckCircle2, Circle } from "lucide-react";

/**
 * Shared primitives for the interactive Codex playbooks
 * (Account Volatility Triage, Churn Volatility Decision, Upward Alignment).
 *
 * Visual language: --accent / --secondary-accent / emerald / destructive
 * via semantic tokens. No new color tokens. Renders inside the existing
 * codex.$slug.tsx prose container (not-prose wrapper applied).
 */

export function PlaybookShell({ children }: { children: ReactNode }) {
  return <div className="not-prose space-y-8">{children}</div>;
}

export function PlaybookSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-border bg-card">
      <header className="px-5 md:px-6 pt-5 pb-4 border-b border-border">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-2">
          {eyebrow}
        </div>
        <h3 className="font-display text-xl md:text-2xl tracking-tight">{title}</h3>
        {description ? (
          <p className="text-sm text-foreground/65 mt-2 max-w-2xl">{description}</p>
        ) : null}
      </header>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

export type TreeNode = {
  id: string;
  question: string;
  detail?: string;
  options: { label: string; next: string }[];
};

export type TerminalNode = {
  id: string;
  kind: "critical" | "standard" | "info";
  title: string;
  bullets: string[];
  note?: string;
};

export type TreeConfig = {
  start: string;
  nodes: Record<string, TreeNode | TerminalNode>;
};

function isTerminal(n: TreeNode | TerminalNode): n is TerminalNode {
  return (n as TerminalNode).kind !== undefined;
}

export function DecisionTree({ config, storageKey }: { config: TreeConfig; storageKey: string }) {
  const [history, setHistory] = useState<string[]>([config.start]);
  const current = config.nodes[history[history.length - 1]];

  const advance = (next: string) => setHistory((h) => [...h, next]);
  const back = () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  const reset = () => setHistory([config.start]);

  // Persist last position per playbook for resume-on-return.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(`pb-tree:${storageKey}`, JSON.stringify(history));
    } catch {
      /* ignore quota */
    }
  }, [history, storageKey]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-foreground/60">
        <span>Step {history.length}</span>
        <span aria-hidden>·</span>
        <button
          onClick={back}
          disabled={history.length <= 1}
          className="inline-flex items-center gap-1 hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={12} /> Back
        </button>
        <button onClick={reset} className="inline-flex items-center gap-1 hover:text-accent ml-2">
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {isTerminal(current) ? (
        <ActionCard node={current} />
      ) : (
        <div>
          <p className="font-display text-lg md:text-xl text-foreground mb-2">{current.question}</p>
          {current.detail ? (
            <p className="text-sm text-foreground/65 mb-4">{current.detail}</p>
          ) : null}
          <div className="grid grid-cols-1 gap-2">
            {current.options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => advance(opt.next)}
                className="text-left border border-border px-4 py-3 hover:border-accent hover:bg-accent/5 transition-colors group"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-secondary-accent group-hover:text-accent">
                  Option →
                </span>
                <div className="text-sm text-foreground/85 mt-1">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ node }: { node: TerminalNode }) {
  const styles =
    node.kind === "critical"
      ? "border-l-4 border-l-accent border-accent/40 bg-accent/5"
      : node.kind === "standard"
        ? "border-l-4 border-l-secondary-accent border-secondary-accent/40 bg-secondary-accent/5"
        : "border-l-4 border-l-border bg-muted/30";
  const Icon = node.kind === "critical" ? AlertTriangle : CheckCircle2;
  const eyebrow =
    node.kind === "critical" ? "Critical protocol" : node.kind === "standard" ? "Standard protocol" : "Protocol";
  const iconClass = node.kind === "critical" ? "text-accent" : "text-secondary-accent";

  return (
    <div className={`border ${styles} p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${iconClass}`} />
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] font-semibold text-foreground/75">
          {eyebrow}
        </span>
      </div>
      <h4 className="font-display text-xl mb-3 tracking-tight">{node.title}</h4>
      <ul className="space-y-2">
        {node.bullets.map((b, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground/85 flex gap-2">
            <span className="text-secondary-accent mt-1.5 select-none">·</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {node.note ? (
        <p className="mt-4 text-xs font-mono uppercase tracking-[0.2em] text-foreground/55 border-t border-border pt-3">
          {node.note}
        </p>
      ) : null}
    </div>
  );
}

/** Persistent operator checklist keyed by playbook slug. */
export function OperatorChecklist({ items, storageKey }: { items: string[]; storageKey: string }) {
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(`pb-checklist:${storageKey}`);
      if (raw) {
        const parsed = JSON.parse(raw) as boolean[];
        if (Array.isArray(parsed) && parsed.length === items.length) setChecked(parsed);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = prev.map((v, idx) => (idx === i ? !v : v));
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(`pb-checklist:${storageKey}`, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  };

  const done = checked.filter(Boolean).length;

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-foreground/55 mb-3">
        {done} of {items.length} complete
      </div>
      <ul className="space-y-2">
        {items.map((label, i) => {
          const isOn = checked[i];
          const Icon = isOn ? CheckCircle2 : Circle;
          return (
            <li key={i}>
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-start gap-3 text-left border border-border px-3 py-2 hover:border-accent transition-colors"
              >
                <Icon
                  className={`h-4 w-4 shrink-0 mt-0.5 ${isOn ? "text-emerald-600 dark:text-emerald-400" : "text-foreground/40"}`}
                />
                <span
                  className={`text-sm ${isOn ? "text-foreground/55 line-through" : "text-foreground/85"}`}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Persistent fill-in worksheet keyed by playbook slug. */
export function PlaybookWorksheet({
  fields,
  storageKey,
}: {
  fields: { id: string; label: string; placeholder?: string; multiline?: boolean }[];
  storageKey: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(`pb-worksheet:${storageKey}`);
      if (raw) setValues(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const set = (id: string, v: string) => {
    setValues((prev) => {
      const next = { ...prev, [id]: v };
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(`pb-worksheet:${storageKey}`, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.id}>
          <label className="font-mono text-[11px] uppercase tracking-[0.25em] text-foreground/55 block mb-1.5">
            {f.label}
          </label>
          {f.multiline ? (
            <textarea
              value={values[f.id] ?? ""}
              onChange={(e) => set(f.id, e.target.value)}
              placeholder={f.placeholder}
              rows={3}
              className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          ) : (
            <input
              type="text"
              value={values[f.id] ?? ""}
              onChange={(e) => set(f.id, e.target.value)}
              placeholder={f.placeholder}
              className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          )}
        </div>
      ))}
    </div>
  );
}
