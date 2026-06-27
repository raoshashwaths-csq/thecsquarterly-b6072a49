import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { trackDiagnosticEvent } from "@/lib/diagnostics-analytics";
import { useTilt } from "@/hooks/useTilt";



export const Route = createFileRoute("/diagnostics/")({
  head: () => ({
    meta: [
      { title: "Diagnostics, The CS Quarterly" },
      {
        name: "description",
        content:
          "Short, structured diagnostics for Customer Success leaders. Score your operating maturity, your champion dependency, and more, in minutes.",
      },
      { property: "og:title", content: "Diagnostics, The CS Quarterly" },
      {
        property: "og:description",
        content: "Short, structured diagnostics. Run in minutes.",
      },
      { property: "og:url", content: "/diagnostics" },
    ],
    links: [{ rel: "canonical", href: "/diagnostics" }],
  }),
  component: DiagnosticsIndex,
});

type Diagnostic = {
  slug: string;
  to: "/diagnostics/ai-readiness" | "/diagnostics/champion-dependency";
  category: string;
  title: string;
  blurb: string;
  meta: Array<[string, string]>;
};

const DIAGNOSTICS: Diagnostic[] = [
  {
    slug: "ai-readiness",
    to: "/diagnostics/ai-readiness",
    category: "Operating Maturity",
    title: "CS Operating Maturity Diagnostic",
    blurb:
      "Score your Customer Success function across 8 operating dimensions and 32 metrics. Surface your top three gaps and get a 90-day plan tailored to your tier, from foundation to AI-native.",
    meta: [
      ["6 min", "Assessment time"],
      ["8 dimensions", "32 metrics"],
      ["Block · Pilot · Scale · AI Native", "Tier output"],
    ],
  },
  {
    slug: "champion-dependency",
    to: "/diagnostics/champion-dependency",
    category: "Stakeholder Management",
    title: "Champion Dependency Diagnostic",
    blurb:
      "Calculate the percentage of your portfolio that depends on a single relationship. Score your single-threading exposure across relationship depth, departure detection, and structural process.",
    meta: [
      ["4 min", "Assessment time"],
      ["8 vectors", "Evaluated"],
      ["1 number", "That reshapes Monday"],
    ],
  },
];

function DiagnosticsIndex() {
  useTilt();
  useFlipCards();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <header className="max-w-7xl w-full mx-auto px-6 pt-20 pb-12 animate-fade-up">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-6">
          Diagnostics
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-6 max-w-4xl">
          Short, structured diagnostics.{" "}
          <span className="not-italic text-accent">Run in minutes.</span>
        </h1>
        <p className="text-xl text-foreground/75 max-w-2xl text-pretty">
          Each diagnostic scores one operating risk, benchmarks you against
          top-decile retention orgs, and hands back a tier and a next move.
          More diagnostics are added each quarter.
        </p>
      </header>

      <div className="h-px bg-border max-w-7xl w-full mx-auto" />

      <main className="max-w-7xl w-full mx-auto px-6 py-16 flex-1">
        <div className="grid md:grid-cols-2 gap-8">
          {DIAGNOSTICS.map((d) => (
            <article
              key={d.slug}
              data-tilt
              className="flip-card border border-border bg-card flex flex-col group hover:border-foreground transition-colors card-lift"
            >
              <div className="flip-card-inner">
                <div className="flip-front p-8 flex flex-col flex-1">
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent mb-4">
                    {d.category}
                  </div>
                  <h2 className="font-display text-3xl mb-4 leading-tight">
                    {d.title}
                  </h2>
                  <p className="text-sm text-foreground/70 text-pretty mb-8 flex-1">
                    {d.blurb}
                  </p>

                  <div className="flex flex-wrap gap-x-8 gap-y-4 mb-8">
                    {d.meta.map(([k, v]) => (
                      <div key={k}>
                        <div className="font-display text-base leading-tight">
                          {k}
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                          {v}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    to={d.to}
                    onClick={() =>
                      trackDiagnosticEvent("diagnostic.cta_click", {
                        slug: d.slug,
                        surface: "diagnostics.hub",
                      })
                    }
                    className="block w-full py-3 text-center bg-foreground text-background font-mono uppercase tracking-widest text-xs hover:bg-accent transition-colors"
                  >
                    View diagnostic →
                  </Link>
                </div>

                <div className="flip-back p-8 bg-card border-l-4 border-l-accent">
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent mb-4">
                    What you'll learn
                  </div>
                  <h3 className="font-display text-2xl mb-4 leading-tight">
                    {d.title}
                  </h3>
                  <ul className="space-y-2 mb-6 flex-1">
                    {d.meta.map(([k, v]) => (
                      <li key={k} className="text-sm">
                        <span className="font-display">{k}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-2">
                          {v}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={d.to}
                    className="block w-full py-3 text-center bg-accent text-accent-foreground font-mono uppercase tracking-widest text-xs hover:opacity-90 transition-opacity"
                  >
                    Start now →
                  </Link>
                </div>
              </div>
            </article>
          ))}

        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-12">
          More diagnostics in development · Renewal forecasting · Onboarding velocity
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
