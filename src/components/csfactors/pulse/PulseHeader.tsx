import { useEffect, useState } from "react";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function todayStamp() {
  const d = new Date();
  return d
    .toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

export function PulseHeader({
  firstName,
  scope,
  onScopeChange,
}: {
  firstName: string;
  scope: "me" | "team";
  onScopeChange: (s: "me" | "team") => void;
}) {
  const [greet, setGreet] = useState("Hello");
  const [stamp, setStamp] = useState("");
  useEffect(() => {
    setGreet(greeting());
    setStamp(todayStamp());
  }, []);

  return (
    <header className="pb-6 border-b border-border mb-8">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="eyebrow text-secondary-accent">CSFactors / Pulse</div>
        <div className="hidden md:block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground tabular-nums">
          {stamp}
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <h1
          className="font-display text-4xl md:text-6xl leading-[0.95] tracking-tight"
          suppressHydrationWarning
        >
          {greet},{" "}
          <em className="italic font-display tracking-tight pr-[0.04em]">
            {firstName}
          </em>
          <span className="text-accent not-italic">.</span>
        </h1>
        <div
          role="tablist"
          aria-label="Portfolio scope"
          className="inline-flex border border-border self-start md:self-end"
        >
          {(["me", "team"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={scope === s}
              onClick={() => onScopeChange(s)}
              className={
                "px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.28em] transition-colors " +
                (scope === s
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {s === "me" ? "My book" : "Whole team"}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
