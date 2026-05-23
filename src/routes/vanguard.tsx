import { createFileRoute } from "@tanstack/react-router";
import { SectionPage, sectionPostsQuery } from "@/components/site/SectionPage";

export const Route = createFileRoute("/vanguard")({
  head: () => ({
    meta: [
      { title: "The CS Vanguard, Proactive plays for Customer Success" },
      { name: "description", content: "The proactive moves CS managers should be making to engineer fruitful engagement long before a renewal conversation." },
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
    />
  ),
});
