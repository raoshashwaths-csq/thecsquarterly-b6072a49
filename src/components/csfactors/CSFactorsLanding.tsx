import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { StageRevealSection } from "@/components/home/StageRevealSection";
import { CSFLogo } from "@/components/csfactors/CSFLogo";

type LandingMode = "visitor" | "below-tier";

export function CSFactorsLanding({ mode }: { mode: LandingMode }) {
  const primary =
    mode === "visitor"
      ? { to: "/login" as const, label: "Start free" }
      : { to: "/pricing" as const, label: "Upgrade to Practitioner" };

  return (
    <div className="min-h-screen bg-background">
      <header className="max-w-7xl w-full mx-auto px-6 md:px-10 pt-8 pb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.22em] text-xs text-muted-foreground hover:text-accent border-b border-transparent hover:border-accent pb-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to The CS Quarterly
        </Link>
        <CSFLogo size="md" />
      </header>

      {/* Hero */}
      <section className="max-w-7xl w-full mx-auto px-6 md:px-10 pt-8 pb-16 md:pt-14 md:pb-24 animate-fade-up">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-secondary-accent mb-6">
          CSFactors · The operator's command center
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.98] tracking-tight text-balance max-w-4xl mb-6">
          Three stages of customer success, one operating platform.
        </h1>
        <p className="text-lg md:text-xl text-foreground/75 leading-relaxed max-w-2xl text-pretty mb-10">
          From the CSM triaging the burning three to the CCO defending the
          number at the board — CSFactors is built for every stage of the
          retention engine.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={primary.to}
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-[0.22em] px-5 py-3 hover:opacity-90 transition-opacity"
          >
            {primary.label} →
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 border border-border font-mono text-xs uppercase tracking-[0.22em] px-5 py-3 hover:border-foreground transition-colors"
          >
            See all tiers →
          </Link>
        </div>
      </section>

      <StageRevealSection
        stages={[
          {
            label: "The CSM",
            caption: (
              <div className="max-w-xl">
                <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent mb-6">
                  Stage 01 / Practitioner
                </div>
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-tight mb-6 text-balance">
                  For the practitioner managing thirty accounts.
                </h2>
                <p className="text-base text-foreground/75 leading-relaxed mb-6 text-pretty">
                  A personal command centre for the CSM in the trenches. Triage
                  the burning three before standup, surface the renewals that
                  need a real conversation, and keep every account note in one
                  operator-grade canvas.
                </p>
              </div>
            ),
            mock: <StageMock variant="pulse" />,
          },
          {
            label: "The Leader",
            caption: (
              <div className="max-w-xl">
                <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent mb-6">
                  Stage 02 / Operator · Team
                </div>
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-tight mb-6 text-balance">
                  For the VP carrying the NRR number.
                </h2>
                <p className="text-base text-foreground/75 leading-relaxed mb-6 text-pretty">
                  Roll every CSM's book into a single 360° portfolio. Watch NRR
                  move in real time, see which segments are bleeding gross
                  retention, and act before the QBR turns into a post-mortem.
                </p>
              </div>
            ),
            mock: <StageMock variant="threeSixty" />,
          },
          {
            label: "The Enterprise",
            caption: (
              <div className="max-w-xl">
                <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent mb-6">
                  Stage 03 / Scale · Enterprise
                </div>
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-tight mb-6 text-balance">
                  For the CCO presenting to the board on Monday.
                </h2>
                <p className="text-base text-foreground/75 leading-relaxed mb-6 text-pretty">
                  A risk register, capacity model and renewal waterfall the
                  board will actually read. Export the slide, defend the
                  number, and walk out with the next quarter already mapped.
                </p>
              </div>
            ),
            mock: <StageMock variant="risk" />,
          },
        ]}
      />

      {/* Feature highlight cards — fade up after the stage reveal */}
      <section className="max-w-7xl w-full mx-auto px-6 md:px-10 py-20 md:py-28 animate-fade-up">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-secondary-accent mb-6">
          Inside CSFactors
        </div>
        <h2 className="font-display text-3xl md:text-5xl leading-[1.05] tracking-tight text-balance mb-12 max-w-3xl">
          Built for the work, not the demo.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              eyebrow: "Lumi",
              title: "Lumi Possibilities",
              body: "Your agent across the canvas — drafts, summaries, escalation paths, and the next best action, always one keystroke away.",
            },
            {
              eyebrow: "Pulse",
              title: "The Burning Three",
              body: "Every morning, the three accounts most likely to hurt the number — ranked, contextualised, and ready to action.",
            },
            {
              eyebrow: "Plan",
              title: "Mutual Action Plan",
              body: "Co-author the path to renewal with the customer. Every milestone, owner and date in one shared, defensible artefact.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="border border-border bg-card p-6 hover:border-foreground transition-colors card-lift"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent mb-3">
                {c.eyebrow}
              </div>
              <h3 className="font-display text-xl md:text-2xl leading-tight mb-3">
                {c.title}
              </h3>
              <p className="text-sm text-foreground/70 leading-snug text-pretty">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-border bg-card/40">
        <div className="max-w-5xl w-full mx-auto px-6 py-16 md:py-20 text-center">
          <h2 className="font-display text-3xl md:text-5xl leading-[1.05] tracking-tight text-balance mb-5">
            Run customer success like an operator.
          </h2>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-foreground/75 text-pretty mb-8">
            CSFactors unlocks at the Practitioner tier.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to={primary.to}
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-[0.22em] px-5 py-3 hover:opacity-90 transition-opacity"
            >
              {primary.label} →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StageMock({ variant }: { variant: "pulse" | "threeSixty" | "risk" }) {
  return (
    <div className="w-full max-w-full md:max-w-3xl mx-auto bg-card border border-border shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/50">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
          {variant === "pulse"
            ? "csfactors / pulse"
            : variant === "threeSixty"
            ? "csfactors / 360"
            : "csfactors / risk-register"}
        </div>
        <span className="w-8" />
      </div>
      <div className="p-5 space-y-4">
        {variant === "pulse" && (
          <>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
              The Burning Three
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Acme Corp", v: "82%", c: "bg-destructive/15 text-destructive" },
                { label: "Globex", v: "61%", c: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
                { label: "Initech", v: "44%", c: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
              ].map((m) => (
                <div key={m.label} className="p-3 border border-border bg-background/40">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">
                    {m.label}
                  </div>
                  <div className={`text-lg font-display ${m.c} px-1.5 py-0.5 inline-block`}>
                    {m.v}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-px bg-border" />
            <div className="space-y-2">
              {["Q3 renewal · 14 days", "Champion change · Northwind", "Expansion signal · Soylent"].map((r) => (
                <div key={r} className="flex items-center justify-between text-xs">
                  <span className="text-foreground/75">{r}</span>
                  <span className="font-mono text-[10px] text-accent">open →</span>
                </div>
              ))}
            </div>
          </>
        )}
        {variant === "threeSixty" && (
          <>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Net Revenue Retention
                </div>
                <div className="font-display text-4xl text-accent mt-1">118.4%</div>
              </div>
              <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                ▲ 3.2pts QoQ
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {[40, 55, 48, 62, 71, 65, 78, 84, 76, 88, 92, 95].map((h, i) => (
                <div key={i} className="flex-1 bg-accent/70" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
              {[
                { l: "Gross Ret.", v: "94.1%" },
                { l: "Expansion", v: "+$2.1M" },
                { l: "Churn $", v: "-$340K" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    {s.l}
                  </div>
                  <div className="font-display text-lg">{s.v}</div>
                </div>
              ))}
            </div>
          </>
        )}
        {variant === "risk" && (
          <>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
              Risk Register · Board Export
            </div>
            <div className="space-y-2">
              {[
                { a: "Stark Industries", arr: "$1.8M", sev: "Critical", c: "bg-destructive text-destructive-foreground" },
                { a: "Wayne Enterprises", arr: "$1.2M", sev: "High", c: "bg-amber-500 text-background" },
                { a: "Pied Piper", arr: "$840K", sev: "High", c: "bg-amber-500 text-background" },
                { a: "Hooli", arr: "$620K", sev: "Watch", c: "bg-foreground/20 text-foreground" },
              ].map((r) => (
                <div key={r.a} className="flex items-center justify-between px-3 py-2 border border-border bg-background/40">
                  <div>
                    <div className="text-sm font-medium">{r.a}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{r.arr} ARR</div>
                  </div>
                  <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-1 ${r.c}`}>
                    {r.sev}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Total at risk
              </div>
              <div className="font-display text-xl text-accent">$4.46M</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
