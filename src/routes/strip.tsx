import { createFileRoute } from "@tanstack/react-router";
import { strips as fallbackStrips, type Strip } from "@/data/strips";
import { listPublishedComicStrips } from "@/lib/admin-content.functions";
import { StripCard } from "@/components/strip/StripCard";
import "@/styles/strip.css";

export const Route = createFileRoute("/strip")({
  head: () => ({
    meta: [
      { title: "Felix & Nora — The CS Quarterly" },
      {
        name: "description",
        content:
          "A weekly strip about customer success and the people who practice it.",
      },
      { property: "og:title", content: "Felix & Nora — The CS Quarterly" },
      {
        property: "og:description",
        content:
          "A weekly strip about customer success and the people who practice it.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://www.thecsquarterly.com/strip" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Felix & Nora — The CS Quarterly" },
      {
        name: "twitter:description",
        content:
          "A weekly strip about customer success and the people who practice it.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://www.thecsquarterly.com/strip" },
    ],
  }),
  loader: async () => {
    const dbStrips = await listPublishedComicStrips().catch(() => []);
    return { strips: dbStrips.length ? dbStrips : fallbackStrips };
  },
  component: StripPage,
});

function StripPage() {
  const { strips } = Route.useLoaderData();
  return (
    <div className="strip-page">
      <header className="strip-page-header">
        <div className="strip-eyebrow">THE CS QUARTERLY</div>
        <h1 className="strip-page-title">Felix &amp; Nora</h1>
        <p className="strip-page-subtitle">
          A weekly strip about customer success and the people who practice it.
        </p>
        <hr className="strip-page-divider" />
        <div className="strip-character-key">
          <div>
            <div className="strip-key-name">FELIX</div>
            <p className="strip-key-desc">
              Twenty-eight years. Knows what matters. Rarely says so.
            </p>
          </div>
          <div className="strip-key-divider" aria-hidden="true" />
          <div>
            <div className="strip-key-name">NORA</div>
            <p className="strip-key-desc">
              Every framework. Every certification. Learning what the frameworks
              don't cover.
            </p>
          </div>
        </div>
      </header>

      <main>
        {strips.map((s) => (
          <StripCard key={s.id} strip={s} />
        ))}
      </main>

      <footer className="strip-page-footer">New strip every week.</footer>
    </div>
  );
}
