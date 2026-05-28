import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { FEATURE_GLOSSARY, filterGlossary } from "@/lib/enablement/glossary";

export function FeatureGlossary({ autoFocus = false }: { autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => filterGlossary(FEATURE_GLOSSARY, query), [query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          autoFocus={autoFocus}
          type="search"
          placeholder="Search features, metrics, formulas…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9 h-10"
          aria-label="Search the feature glossary"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent/10 hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {results.length === 0 ? (
        <div className="rounded-md border border-border bg-card/60 p-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">No matches</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing in the glossary matches &ldquo;{query}&rdquo;. Try a metric name, a formula, or
            a feature.
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {results.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="text-left">
                <div className="flex flex-col items-start gap-1 pr-3">
                  <span className="font-display text-base leading-snug">{item.term}</span>
                  <span className="text-xs text-muted-foreground">{item.short}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-1">
                  <p className="text-sm leading-relaxed">{item.definition}</p>
                  {item.formula ? (
                    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent mb-1">
                        Formula
                      </p>
                      <p className="font-mono text-xs">{item.formula}</p>
                    </div>
                  ) : null}
                  {item.whyItMatters ? (
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent mb-1">
                        Why it matters
                      </p>
                      <p className="text-sm text-muted-foreground">{item.whyItMatters}</p>
                    </div>
                  ) : null}
                  {item.link ? (
                    <Link
                      to={item.link.to}
                      className="inline-block font-mono text-xs uppercase tracking-[0.2em] text-accent underline-offset-4 hover:underline"
                    >
                      {item.link.label} →
                    </Link>
                  ) : null}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
