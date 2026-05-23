import { createFileRoute } from "@tanstack/react-router";
import { SectionPage, sectionPostsQuery } from "@/components/site/SectionPage";

export const Route = createFileRoute("/retention-protocol")({
  head: () => ({
    meta: [
      { title: "The Retention Protocol, Identify and mitigate churn" },
      { name: "description", content: "Diagnostic frameworks for spotting churn signals early and the operating protocols to reverse them." },
      { property: "og:title", content: "The Retention Protocol" },
      { property: "og:url", content: "/retention-protocol" },
    ],
    links: [{ rel: "canonical", href: "/retention-protocol" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(sectionPostsQuery("retention-protocol")),
  component: () => (
    <SectionPage
      sectionSlug="retention-protocol"
      eyebrow="The Retention Protocol"
      title="Identify churn early. Reverse it"
      italicWord="systematically."
      tagline="A clinical approach to detecting at-risk accounts and the protocols that actually move them back into the green."
      description="Less anecdote, more procedure. The Retention Protocol catalogues the early-warning signals worth tracking and the operating responses that consistently land."
      pillars={[
        { number: "01", title: "Signal Taxonomy", body: "The 14 leading indicators of churn, categorised by lead time, severity, and reversibility." },
        { number: "02", title: "Recovery Playbooks", body: "Step-by-step response protocols for usage decline, champion loss, exec change, and procurement-led RFPs." },
        { number: "03", title: "Save-vs-Walk Math", body: "When to invest in a save, when to plan a graceful exit, and how to justify either to the CFO." },
      ]}
    />
  ),
});
