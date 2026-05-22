import { createFileRoute } from "@tanstack/react-router";
import { SectionPage } from "@/components/site/SectionPage";

export const Route = createFileRoute("/codex")({
  head: () => ({
    meta: [
      { title: "The CS Codex — The repository of all things Customer Success" },
      { name: "description", content: "A working repository: frameworks, templates, taxonomies, and definitions — the canonical reference for serious CS operators." },
      { property: "og:title", content: "The CS Codex" },
      { property: "og:url", content: "/codex" },
    ],
    links: [{ rel: "canonical", href: "/codex" }],
  }),
  component: () => (
    <SectionPage
      eyebrow="The CS Codex"
      title="The reference library for"
      italicWord="serious operators."
      tagline="Definitions, frameworks, templates, and taxonomies. Cited, versioned, and maintained."
      description="The Codex is what you reach for in the meeting. A working repository of every concept, formula, and template that recurs across The CS Quarterly — kept current, source-cited, and ready to be linked."
      pillars={[
        { number: "01", title: "Definitions & Formulas", body: "NRR, GRR, CSAT, NPS, health scoring composites — defined precisely, with the trade-offs spelled out." },
        { number: "02", title: "Templates", body: "QBR decks, escalation memos, save-plan briefs, exec-update emails — every artefact a CS operator drafts weekly." },
        { number: "03", title: "Taxonomies", body: "Persona maps, segmentation models, motion classifications — the shared vocabulary of the discipline." },
      ]}
    />
  ),
});
