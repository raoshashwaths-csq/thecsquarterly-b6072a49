import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { BackButton } from "@/components/site/BackButton";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { trackDiagnosticEvent } from "@/lib/diagnostics-analytics";
import { SharedScoreView } from "@/components/diagnostics/SharedScoreView";

const onStartAiReadiness = () =>
  trackDiagnosticEvent("diagnostic.cta_click", {
    slug: "ai-readiness",
    surface: "ai-readiness.landing",
  });

const TIER_INTERPRETATION: Record<string, { label: string; tone: string; body: string }> = {
  Block: {
    label: "Block — foundation gaps",
    tone: "text-destructive",
    body: "The operating model is not yet ready to absorb agentic AI. Foundational gaps in segmentation, health scoring, or onboarding will compound under automation. Fix the discipline first; the AI layer comes after.",
  },
  Pilot: {
    label: "Pilot — selective deployment",
    tone: "text-secondary-accent",
    body: "Several dimensions are operating at top-quartile discipline, but pockets of inconsistency remain. Deploy AI in two or three contained motions where the underlying playbook is already proven — not as a horizontal sweep.",
  },
  Scale: {
    label: "Scale — productionising the motion",
    tone: "text-accent",
    body: "The operating model is mature enough to scale AI across the full CS motion. Focus the next 90 days on instrumentation: telemetry on every play, feedback loops into health scores, and clear ownership of the AI-assisted workflows.",
  },
  "AI Native": {
    label: "AI Native — top decile",
    tone: "text-foreground",
    body: "You operate in the top decile. Your edge is no longer process discipline — it is the speed at which you can ship new agentic motions against your competitors. Treat AI roadmap as a product roadmap, not a project list.",
  },
};

function useSharedAiReadiness(): { score: number; tier: string } | null {
  const [val, setVal] = useState<{ score: number; tier: string } | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const score = Number(sp.get("score"));
    const tier = sp.get("tier") ?? "";
    if (!Number.isFinite(score) || score < 0 || score > 100) return;
    if (!TIER_INTERPRETATION[tier]) return;
    setVal({ score: Math.round(score), tier });
  }, []);
  return val;
}



export const Route = createFileRoute("/diagnostics/ai-readiness/")({
  head: () => ({
    meta: [
      { title: "CS Operating Maturity Diagnostic, The CS Quarterly" },
      {
        name: "description",
        content: "A 6-minute diagnostic across 8 dimensions and 32 metrics. Benchmark your Customer Success operating model against top-decile retention orgs and see whether you're ready to deploy agentic AI.",
      },
      { property: "og:title", content: "CS Operating Maturity Diagnostic" },
      { property: "og:description", content: "8 dimensions · 32 metrics · Personalised 90-day plan." },
      { property: "og:url", content: "/diagnostics/ai-readiness" },
    ],
    links: [{ rel: "canonical", href: "/diagnostics/ai-readiness" }],
  }),
  component: AiReadinessLanding,
});

const PILLARS = [
  { name: "Account Segmentation & Coverage", weight: 15, blurb: "Whether your book is intentionally tiered and whether coverage matches contract value, expansion potential, and risk." },
  { name: "Health Score & Risk Signal Quality", weight: 10, blurb: "Whether your health score is a leading indicator, calibrated against actual churn, or theatre dressed up as a dashboard." },
  { name: "Onboarding & Time-to-Value", weight: 15, blurb: "Whether the first 90 days run on a deterministic playbook with measured TTV, or on hand-waved goodwill." },
  { name: "Stakeholder Mapping Discipline", weight: 10, blurb: "Whether you can name the four people who actually control renewal, or whether you only know the champion." },
  { name: "Renewal & Expansion Forecasting", weight: 15, blurb: "Whether your 90/60/30-day forecast holds inside ±5% and whether CS owns expansion explicitly, not by influence." },
  { name: "Escalation Playbook Maturity", weight: 10, blurb: "Whether a Sev 1/2 account triggers a sequenced, exec-tested protocol, or whether everyone improvises in Slack." },
  { name: "QBR & Value Realisation Reporting", weight: 15, blurb: "Whether QBRs produce decisions and quantified ROI, or status slides with adoption screenshots." },
  { name: "AI & Automation in the CS Motion", weight: 10, blurb: "Whether you have a sequenced AI roadmap with production use cases, or a Slack channel of vendor demos." },
];

function AiReadinessLanding() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <div className="max-w-5xl mx-auto px-6 pt-10 w-full">
        <BackButton label="Back to Diagnostics" fallbackTo="/diagnostics" />
      </div>

      <header className="max-w-5xl mx-auto px-6 pt-8 pb-16 text-center animate-fade-up">

        <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-6 font-medium">
          6 Minutes · 8 Dimensions · 32 Metrics
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-10">
          Is your CS function <span className="not-italic text-accent">built to retain?</span>
        </h1>
        <p className="text-xl text-foreground/75 max-w-2xl mx-auto text-pretty mb-12">
          The CS Operating Maturity Diagnostic scores your Customer Success organisation across 8 operating dimensions, surfaces your top three gaps, and delivers a 90-day plan tailored to your tier, from foundation to AI-native.
        </p>
        <Link
          to="/diagnostics/ai-readiness/survey"
          onClick={onStartAiReadiness}
          className="inline-block px-10 py-5 bg-foreground text-background font-mono text-xs uppercase tracking-widest font-bold hover:bg-accent transition-colors"
        >
          Start the diagnostic
        </Link>
        <p className="mt-6 font-mono uppercase tracking-widest text-xs text-muted-foreground">
          Block · Pilot · Scale · AI Native, find your tier instantly
        </p>
      </header>

      <div className="h-px bg-border max-w-7xl w-full mx-auto" />

      <section className="max-w-7xl w-full mx-auto px-6 py-20">
        <SectionCard
          eyebrow="What we measure"
          title="Eight operating dimensions, thirty-two metrics."
          description="Each dimension is weighted by its leverage on retention. Top-decile orgs score evenly; fragile orgs spike on one and crater on the rest."
        >
          <MetricGrid cols={4}>
            {PILLARS.map((d, i) => (
              <MetricCard
                key={d.name}
                eyebrow={`Dimension ${String(i + 1).padStart(2, "0")}`}
                value={d.weight}
                unit="pts"
                accent={i % 2 === 0 ? "accent" : "secondary"}
                footer={
                  <div>
                    <div className="font-display text-base leading-tight mb-2">{d.name}</div>
                    <p className="text-xs text-foreground/70 text-pretty">{d.blurb}</p>
                  </div>
                }
              />
            ))}
          </MetricGrid>
        </SectionCard>
      </section>


      <section className="bg-foreground text-background py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.3em] opacity-60 mb-6">External Research</div>
          <p className="font-display text-3xl md:text-4xl mb-10 leading-tight italic">
            "The median SaaS company loses 13% of ARR to churn and downsell every year. Top-decile retention orgs lose less than 4%."
          </p>
          <p className="font-mono uppercase tracking-widest text-xs opacity-60 mb-12">, SaaS Capital Retention Benchmarks, 2024</p>
          <Link
            to="/diagnostics/ai-readiness/survey"
            onClick={onStartAiReadiness}
            className="inline-block px-10 py-5 bg-background text-foreground font-mono text-xs uppercase tracking-widest font-bold hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Begin →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
