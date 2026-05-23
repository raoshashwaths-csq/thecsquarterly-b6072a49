import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterInline } from "@/components/site/NewsletterInline";

export const Route = createFileRoute("/subscribe")({
  head: () => ({
    meta: [
      { title: "Subscribe, The CS Quarterly" },
      {
        name: "description",
        content:
          "Join 12,000+ Customer Success leaders. One essay every Tuesday on stakeholder management, escalation, negotiation, and AI deployment.",
      },
      { property: "og:title", content: "Subscribe to The CS Quarterly" },
      {
        property: "og:description",
        content: "One essay every Tuesday for senior CS operators.",
      },
      { property: "og:url", content: "/subscribe" },
    ],
    links: [{ rel: "canonical", href: "/subscribe" }],
  }),
  component: SubscribePage,
});

function SubscribePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 animate-fade-up text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-6">
          The Weekly Dispatch
        </div>
        <h1 className="font-display text-6xl md:text-8xl leading-[0.95] tracking-tight text-balance mb-10 max-w-4xl">
          Read what the <span className="italic">best CS leaders</span> read.
        </h1>
        <p className="text-xl text-foreground/75 max-w-xl mb-12 text-pretty">
          Curated insights on stakeholder management, escalation, negotiation, and the practical use of AI in post-sales. Free, weekly, no fluff.
        </p>
        <div className="w-full">
          <NewsletterInline source="subscribe-page" cta="Subscribe" placeholder="you@company.com" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
