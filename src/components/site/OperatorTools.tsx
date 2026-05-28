import { Link } from "@tanstack/react-router";
import { Calculator, BarChart3, Users2, Layers3, ListOrdered, Briefcase } from "lucide-react";

type Tool = {
  to: "/calculator" | "/benchmarks" | "/directory" | "/teams" | "/sequencer" | "/job-board";
  label: string;
  blurb: string;
  icon: typeof Calculator;
  audience: "operator" | "leader" | "recruiter" | "all";
};

const TOOLS: Tool[] = [
  { to: "/calculator", label: "ROI Calculator",     blurb: "Quantify what a renewal saves the business.",    icon: Calculator,  audience: "operator" },
  { to: "/sequencer",  label: "Reading Sequencer",  blurb: "Stack this week's reading into a 25-min block.", icon: ListOrdered, audience: "operator" },
  { to: "/benchmarks", label: "NRR Benchmarks",     blurb: "Quarterly NRR, payback, and GRR baselines.",     icon: BarChart3,   audience: "leader" },
  { to: "/teams",      label: "Teams",              blurb: "Pooled compute, shared Workspace, central billing.", icon: Layers3, audience: "leader" },
  { to: "/directory",  label: "Operator Directory", blurb: "Search senior CS talent by archetype + ARR band.", icon: Users2,    audience: "recruiter" },
  { to: "/job-board",  label: "Job Board",          blurb: "Sponsored CS roles, $20M–$1B ARR companies.",     icon: Briefcase, audience: "recruiter" },
];

/**
 * Persona-aware tool grid.
 * Order rule:
 *   operator        → operator → leader → recruiter
 *   leader          → leader   → operator → recruiter
 *   recruiter       → recruiter → leader → operator
 */
function orderFor(group: "operator" | "leader" | "recruiter"): Tool["audience"][] {
  if (group === "recruiter") return ["recruiter", "leader", "operator"];
  if (group === "leader")    return ["leader", "operator", "recruiter"];
  return ["operator", "leader", "recruiter"];
}

export function OperatorTools({
  group = "operator",
  variant = "home",
}: {
  group?: "operator" | "leader" | "recruiter";
  variant?: "home" | "account";
}) {
  const rank = orderFor(group);
  const sorted = [...TOOLS].sort(
    (a, b) => rank.indexOf(a.audience) - rank.indexOf(b.audience),
  );

  const eyebrow = group === "recruiter"
    ? "Operator Bench · prioritized for talent"
    : group === "leader"
      ? "Leader Console · prioritized for hiring & benchmarks"
      : "Operator Toolkit · prioritized for individual contributors";

  return (
    <section
      className={
        variant === "home"
          ? "max-w-7xl w-full mx-auto px-6 py-16 animate-fade-up"
          : "mt-12"
      }
      aria-labelledby="operator-tools-heading"
    >
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2 font-semibold">
            {eyebrow}
          </div>
          <h2 id="operator-tools-heading" className="font-display text-2xl md:text-4xl tracking-tight">
            The instruments<span className="text-accent">.</span>
          </h2>
        </div>
        <p className="font-mono uppercase tracking-widest text-xs text-muted-foreground">
          {sorted.length} surfaces
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
        {sorted.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className="group bg-background p-5 md:p-6 hover:bg-accent/5 transition-colors min-h-[120px] flex flex-col"
            >
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">
                <Icon className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
                {t.audience === "recruiter" ? "Talent" : t.audience === "leader" ? "Leader" : "Operator"}
              </div>
              <div className="font-display text-lg md:text-xl tracking-tight group-hover:text-accent transition-colors">
                {t.label}
              </div>
              <p className="text-sm text-foreground/65 mt-1.5">{t.blurb}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
