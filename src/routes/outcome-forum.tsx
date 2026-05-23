import { createFileRoute } from "@tanstack/react-router";
import { SectionPage, sectionPostsQuery } from "@/components/site/SectionPage";

export const Route = createFileRoute("/outcome-forum")({
  head: () => ({
    meta: [
      { title: "The Outcome Forum, Validated CS case studies with the numbers" },
      { name: "description", content: "Validated case studies showing how specific CS strategies turned relationships around and moved revenue. With figures, statistics, and what to copy." },
      { property: "og:title", content: "The Outcome Forum" },
      { property: "og:url", content: "/outcome-forum" },
    ],
    links: [{ rel: "canonical", href: "/outcome-forum" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(sectionPostsQuery("outcome-forum")),
  component: () => (
    <SectionPage
      sectionSlug="outcome-forum"
      eyebrow="The Outcome Forum"
      title="Validated outcomes, with the"
      italicWord="receipts."
      tagline="Real client situations, real strategies, and the verifiable numbers behind the turnaround."
      description="Every case study in the Outcome Forum names the strategy applied, the metrics moved, and the timeline involved. No hagiography, no anonymous heroes, only what worked, by how much, in what context."
      pillars={[
        { number: "01", title: "Turnarounds", body: "Accounts flagged for churn that returned to growth, what the CS lead changed, and the NRR/expansion impact." },
        { number: "02", title: "Benchmarks", body: "Industry-segmented retention, time-to-value, and expansion-rate benchmarks pulled from peer programmes." },
        { number: "03", title: "Strategy Teardowns", body: "Decomposed playbooks: which mechanism drove which result, with quantified attribution." },
      ]}
    />
  ),
});
