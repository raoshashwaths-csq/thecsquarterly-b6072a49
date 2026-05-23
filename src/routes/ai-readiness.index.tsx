import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/ai-readiness/")({
  head: () => ({
    meta: [
      { title: "Super Agent Readiness Diagnostic — The CS Quarterly" },
      {
        name: "description",
        content: "An 8-minute diagnostic across 11 readiness dimensions and 44 metrics. Discover whether your HR and CS organisation is ready to deploy agentic AI.",
      },
      { property: "og:title", content: "Super Agent Readiness Diagnostic" },
      { property: "og:description", content: "11 dimensions · 44 metrics · Personalised 90-day plan." },
      { property: "og:url", content: "/ai-readiness" },
    ],
    links: [{ rel: "canonical", href: "/ai-readiness" }],
  }),
  component: AiReadinessLanding,
});

const PILLARS = [
  { name: "HCM Data Foundation", weight: 15, blurb: "The cleanliness of employee records, hierarchy, positions, and self-service adoption." },
  { name: "Identity, Permissions & Approvals", weight: 10, blurb: "SSO, RBAC, digital approvals, and segregation-of-duties." },
  { name: "Integration & MCP-Readiness", weight: 10, blurb: "API access to ITSM, finance, comms — and your existing AI agent footprint." },
  { name: "Governance, Audit & Compliance", weight: 8, blurb: "DPIA, decision-authority matrix, and a named AI governance owner." },
  { name: "Workflow Digitisation", weight: 7, blurb: "Whether your top processes live in workflows — or in email and PDFs." },
  { name: "Six Persona Agents", weight: 50, blurb: "Per-persona readiness for Employee, Manager, Recruiter, HRBP, Payroll, and Cross-System agents." },
];

function AiReadinessLanding() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <header className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center animate-fade-up">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-6 font-medium">
          8 Minutes · 11 Dimensions · 44 Metrics
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-10">
          Is your organisation ready for <span className="italic text-accent">agentic AI?</span>
        </h1>
        <p className="text-xl text-foreground/75 max-w-2xl mx-auto text-pretty mb-12">
          The Super Agent Readiness Diagnostic scores your HR and CS organisation across 11 readiness dimensions, surfaces your top three gaps, and delivers a 90-day plan tailored to your tier.
        </p>
        <Link
          to="/ai-readiness/survey"
          className="inline-block px-10 py-5 bg-foreground text-background font-mono text-[11px] uppercase tracking-widest font-bold hover:bg-accent transition-colors"
        >
          Start the diagnostic
        </Link>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Block · Pilot · Scale · AI Native — find your tier instantly
        </p>
      </header>

      <div className="h-px bg-border max-w-7xl w-full mx-auto" />

      <section className="max-w-7xl w-full mx-auto px-6 py-24">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-10">
          What we measure
        </div>
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
          {PILLARS.map((d, i) => (
            <div key={d.name} className="border-t border-border pt-6">
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-mono text-[11px] text-secondary-accent">Pillar {String(i + 1).padStart(2, "0")}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{d.weight} pts</span>
              </div>
              <h2 className="font-display text-3xl mb-3">{d.name}</h2>
              <p className="text-foreground/75 text-pretty">{d.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-foreground text-background py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-60 mb-6">External Research</div>
          <p className="font-display text-3xl md:text-4xl mb-10 leading-tight italic">
            "Only 13% of organisations are truly AI-ready."
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-60 mb-12">— Cisco AI Readiness Index, 2025</p>
          <Link
            to="/ai-readiness/survey"
            className="inline-block px-10 py-5 bg-background text-foreground font-mono text-[11px] uppercase tracking-widest font-bold hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Begin →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
