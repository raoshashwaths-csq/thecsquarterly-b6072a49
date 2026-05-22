import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/ai-readiness")({
  head: () => ({
    meta: [
      { title: "AI Readiness Survey — The CS Quarterly" },
      {
        name: "description",
        content:
          "A 5-minute diagnostic for HR and CS leaders. Benchmark your organization's readiness to adopt AI across strategy, data, skills, and culture.",
      },
      { property: "og:title", content: "AI Readiness Survey for CS Leaders" },
      { property: "og:description", content: "Benchmark your org's AI readiness in 5 minutes." },
      { property: "og:url", content: "/ai-readiness" },
    ],
    links: [{ rel: "canonical", href: "/ai-readiness" }],
  }),
  component: AiReadinessLanding,
});

const DIMENSIONS = [
  {
    name: "Strategy",
    blurb: "Whether AI is funded, owned, and tied to measurable outcomes — or a side-of-desk experiment.",
  },
  {
    name: "Data",
    blurb: "How clean, unified, and accessible your customer health and revenue signal is.",
  },
  {
    name: "Skills",
    blurb: "Whether your CSMs and leaders can use, govern, and challenge AI outputs in their workflow.",
  },
  {
    name: "Culture",
    blurb: "Whether the org treats AI as a peer signal or as a threat — and whether HR and CS are aligned on role evolution.",
  },
];

function AiReadinessLanding() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <header className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center animate-fade-up">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-6 font-medium">
          The 2026 Audit · For HR & CS Leaders
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-10">
          Is your CS organization actually <span className="italic">ready</span> for AI?
        </h1>
        <p className="text-xl text-foreground/75 max-w-2xl mx-auto text-pretty mb-12">
          A 12-question diagnostic across four dimensions. You get a benchmarked tier, three concrete recommendations, and a copy of the dispatch.
        </p>
        <Link
          to="/ai-readiness/survey"
          className="inline-block px-10 py-5 bg-foreground text-background font-mono text-[11px] uppercase tracking-widest font-bold hover:bg-accent transition-colors"
        >
          Start the Survey
        </Link>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Takes about 5 minutes · Results emailed instantly
        </p>
      </header>

      <div className="h-px bg-border max-w-7xl w-full mx-auto" />

      <section className="max-w-7xl w-full mx-auto px-6 py-24">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-8">
          What we measure
        </div>
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
          {DIMENSIONS.map((d, i) => (
            <div key={d.name} className="border-t border-border pt-6">
              <div className="font-mono text-[11px] text-accent mb-3">
                Dimension {String(i + 1).padStart(2, "0")}
              </div>
              <h2 className="font-display text-4xl mb-4">{d.name}</h2>
              <p className="text-foreground/75 text-pretty">{d.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-foreground text-background py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h3 className="font-display text-4xl md:text-5xl mb-6 leading-tight">
            Ready when you are.
          </h3>
          <Link
            to="/ai-readiness/survey"
            className="inline-block mt-6 px-10 py-5 bg-background text-foreground font-mono text-[11px] uppercase tracking-widest font-bold hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Begin →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
