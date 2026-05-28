import { createFileRoute, Link } from "@tanstack/react-router";
import { SectionPage, sectionPostsQuery } from "@/components/site/SectionPage";

export const Route = createFileRoute("/vanguard")({
  head: () => ({
    meta: [
      { title: "The CS Vanguard, Proactive plays for Customer Success" },
      { name: "description", content: "Proactive moves CS managers should be making to engineer fruitful engagement long before a renewal conversation." },
      { property: "og:title", content: "The CS Vanguard" },
      { property: "og:url", content: "/vanguard" },
    ],
    links: [{ rel: "canonical", href: "/vanguard" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(sectionPostsQuery("vanguard")),
  component: () => (
    <SectionPage
      sectionSlug="vanguard"
      eyebrow="The CS Vanguard"
      title="Proactive plays for"
      italicWord="fruitful engagement."
      tagline="The moves elite CS managers make before the customer asks, and long before the renewal cycle begins."
      description="Vanguard is a playbook section, not a news feed. Every dispatch here is a sequenced motion: what to do, when to do it, and what to expect when you do."
      pillars={[
        { number: "01", title: "Executive Cadence Design", body: "Choreographing QBRs, exec syncs, and value reviews so leadership is engaged before they need to be." },
        { number: "02", title: "Adoption Pre-Mortems", body: "Identifying drop-off risks in week 30 by reading week 4 signals, and intervening early." },
        { number: "03", title: "Champion Engineering", body: "Building, multi-threading, and protecting champions across the buyer's organisation." },
      ]}
      extras={
        <section className="max-w-7xl w-full mx-auto px-6 pb-20">
          <div className="font-mono uppercase tracking-widest text-xs text-foreground font-semibold mb-10">
            Pair the dispatches with playbooks & diagnostics
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              to="/codex"
              className="group block border border-border bg-card/60 hover:bg-card hover:border-foreground transition-colors p-8"
            >
              <div className="font-mono text-[11px] text-secondary-accent font-semibold mb-3">The Codex</div>
              <h3 className="font-display text-2xl md:text-3xl mb-2 leading-tight">
                Vanguard playbooks, ready to run.
              </h3>
              <p className="text-sm text-foreground/70 mb-4">
                Templates, frameworks, and decks for the exact motions referenced in every Vanguard essay. Included with subscription.
              </p>
              <div className="font-mono uppercase tracking-widest text-xs text-foreground/60 group-hover:text-accent transition-colors">
                Open the Codex →
              </div>
            </Link>
            <Link
              to="/ai-readiness"
              className="group block border border-border bg-card/60 hover:bg-card hover:border-foreground transition-colors p-8"
            >
              <div className="font-mono text-[11px] text-secondary-accent font-semibold mb-3">The Diagnostic</div>
              <h3 className="font-display text-2xl md:text-3xl mb-2 leading-tight">
                Benchmark your Vanguard motion.
              </h3>
              <p className="text-sm text-foreground/70 mb-4">
                The Super Agent Readiness Diagnostic scores your team across 11 dimensions and ships a 90-day plan.
              </p>
              <div className="font-mono uppercase tracking-widest text-xs text-foreground/60 group-hover:text-accent transition-colors">
                Take the diagnostic →
              </div>
            </Link>
          </div>
        </section>
      }
    />
  ),
});
