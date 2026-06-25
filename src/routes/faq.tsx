import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { Search, ThumbsUp, ThumbsDown, X } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getFaqContent, type FaqSection, type QA } from "@/lib/faq-content";
import { submitFaqFeedback } from "@/lib/faq-feedback.functions";
import { cn } from "@/lib/utils";

// FAQ JSON-LD always uses the English source of truth for crawlers.
const SEO_ENTRIES = getFaqContent("en").sections.flatMap((s) =>
  s.items.map((qa) => ({ q: qa.q, a: qa.a })),
);

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — The CS Quarterly" },
      {
        name: "description",
        content:
          "Answers about The CS Quarterly: Lumi, CSFactors, Workspace, exports, diagnostics, billing, sharing, and the CS glossary.",
      },
      { property: "og:title", content: "FAQ — The CS Quarterly" },
      {
        property: "og:description",
        content: "Everything you need to know about The CS Quarterly, in one place.",
      },
      { property: "og:url", content: "/faq" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: SEO_ENTRIES.map((qa) => ({
            "@type": "Question",
            name: qa.q,
            acceptedAnswer: { "@type": "Answer", text: qa.a },
          })),
        }),
      },
    ],
  }),
  component: FaqPage,
});

function normalize(s: string) {
  return s.toLowerCase().normalize("NFKD");
}

function FaqPage() {
  const { i18n } = useTranslation();
  const locale = i18n.language || "en";
  const { ui, sections } = useMemo(() => getFaqContent(locale), [locale]);

  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const needle = normalize(trimmed);

  const filtered: FaqSection[] = useMemo(() => {
    if (!needle) return sections;
    return sections
      .map((s) => ({
        ...s,
        items: s.items.filter((qa) =>
          normalize(qa.q + " " + qa.a + " " + s.title).includes(needle),
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [sections, needle]);

  const totalMatches = filtered.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <header className="max-w-3xl mx-auto px-6 pt-24 pb-10 animate-fade-up w-full">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-6">
          {ui.eyebrow}
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-8">
          {ui.title}
        </h1>
        <p className="text-lg leading-relaxed text-foreground/75 mb-10">{ui.sub}</p>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ui.searchPlaceholder}
            aria-label={ui.searchPlaceholder}
            className="w-full pl-11 pr-11 py-3.5 bg-background border border-border rounded-md font-body text-base focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
          />
          {trimmed && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={ui.searchClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded text-foreground/50 hover:text-foreground hover:bg-foreground/5"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full px-6 pb-24 space-y-16">
        {filtered.length === 0 ? (
          <p className="font-body text-foreground/60 py-12 text-center">
            {ui.searchNoResults}
          </p>
        ) : (
          filtered.map((section) => (
            <section key={section.slug} aria-labelledby={`faq-${section.slug}`}>
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-3">
                {section.eyebrow}
              </div>
              <h2
                id={`faq-${section.slug}`}
                className="font-display text-3xl md:text-4xl tracking-tight mb-6"
              >
                {section.title}
              </h2>
              <Accordion type="single" collapsible className="border-t border-border">
                {section.items.map((qa) => (
                  <AccordionItem
                    key={qa.slug}
                    value={`${section.slug}-${qa.slug}`}
                    className="border-b border-border"
                  >
                    <AccordionTrigger className="text-left font-body text-base md:text-lg py-5 hover:no-underline">
                      {qa.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 leading-relaxed text-base pb-5">
                      <p className="mb-5">{qa.a}</p>
                      <FeedbackRow
                        sectionSlug={section.slug}
                        item={qa}
                        locale={locale}
                        ui={ui}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))
        )}

        {trimmed && filtered.length > 0 && (
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-foreground/40">
            {totalMatches} / {sections.reduce((n, s) => n + s.items.length, 0)}
          </p>
        )}

        <div className="border-t border-border pt-10 text-sm text-foreground/60 font-body">
          {ui.contact}{" "}
          <a href="/subscribe" className="text-accent hover:underline">
            {ui.contactLink}
          </a>
          .
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function FeedbackRow({
  sectionSlug,
  item,
  locale,
  ui,
}: {
  sectionSlug: string;
  item: QA;
  locale: string;
  ui: ReturnType<typeof getFaqContent>["ui"];
}) {
  const submit = useServerFn(submitFaqFeedback);
  const storageKey = `tcsq.faq.vote.${sectionSlug}.${item.slug}`;
  const initial =
    typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
  const [voted, setVoted] = useState<"up" | "down" | null>(
    initial === "up" || initial === "down" ? (initial as "up" | "down") : null,
  );
  const [pending, setPending] = useState(false);

  async function cast(vote: 1 | -1) {
    if (voted || pending) return;
    setPending(true);
    try {
      await submit({
        data: { sectionSlug, itemSlug: item.slug, vote, locale },
      });
      const v = vote === 1 ? "up" : "down";
      setVoted(v);
      try {
        window.localStorage.setItem(storageKey, v);
      } catch {
        // ignore
      }
    } catch (err) {
      console.error("[faq feedback]", err);
    } finally {
      setPending(false);
    }
  }

  if (voted) {
    return (
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-foreground/50">
        {voted === "up" ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
        <span>{ui.feedbackThanks}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/50">
        {ui.feedbackPrompt}
      </span>
      <button
        type="button"
        onClick={() => cast(1)}
        disabled={pending}
        aria-label={ui.feedbackHelpful}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-mono uppercase tracking-[0.15em]",
          "hover:border-accent hover:text-accent transition-colors disabled:opacity-50",
        )}
      >
        <ThumbsUp size={12} /> {ui.feedbackHelpful}
      </button>
      <button
        type="button"
        onClick={() => cast(-1)}
        disabled={pending}
        aria-label={ui.feedbackNotHelpful}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-mono uppercase tracking-[0.15em]",
          "hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50",
        )}
      >
        <ThumbsDown size={12} /> {ui.feedbackNotHelpful}
      </button>
    </div>
  );
}
