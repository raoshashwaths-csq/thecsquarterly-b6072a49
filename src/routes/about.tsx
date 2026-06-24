import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About, The CS Quarterly" },
      {
        name: "description",
        content:
          "The CS Quarterly is a weekly dispatch and research hub for Customer Success leaders and mid-level managers.",
      },
      { property: "og:title", content: "About, The CS Quarterly" },
      { property: "og:description", content: "A weekly dispatch for CS leaders and managers." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <header className="max-w-3xl mx-auto px-6 pt-24 pb-12 animate-fade-up">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-6">
          About
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-10">
          For the operators who run <span className="not-italic">retention</span>.
        </h1>
        <div className="space-y-6 text-lg leading-relaxed text-foreground/85">
          <p>
            The CS Quarterly is a weekly dispatch for Customer Success leaders and the mid-level managers building their orgs. We write for VPs, Directors, and Senior CSMs at companies between $20M and $1B ARR.
          </p>
          <p>
            We cover the things you can't learn from a vendor webinar: stakeholder management at the C-suite, escalation playbooks under pressure, sales qualification done with rigor, and the art of negotiating renewals without discounting.
          </p>
          <p>
            We also run the annual AI Readiness Survey for CS and HR leaders, a 12-question diagnostic that benchmarks where you are and tells you what to do next.
          </p>
          <p className="font-display not-italic text-2xl pt-4">
            No noise. No vendor pitches. One essay every Tuesday.
          </p>
        </div>
      </header>

      <SiteFooter />
    </div>
  );
}
