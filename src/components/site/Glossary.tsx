import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GLOSSARY, GLOSSARY_TERMS } from "@/lib/glossary";

// Inline acronym with a dotted gold underline + 1-sentence definition.
// The period in "Q." stays as a logo — never use this for "Q".
export function Acronym({ term, children }: { term: string; children?: React.ReactNode }) {
  const entry = GLOSSARY[term];
  if (!entry) return <>{children ?? term}</>;
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className="cursor-help underline decoration-dotted decoration-1 underline-offset-[5px] decoration-[var(--secondary-accent,#B19453)]"
          >
            {children ?? entry.term}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs border border-border bg-popover text-popover-foreground shadow-md"
        >
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-accent mb-1">
            {entry.term}
          </div>
          <p className="text-sm leading-snug">{entry.definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Auto-wrap known acronyms inside a plain-text string. Whole-word match,
// case-sensitive — won't munge "ARRis" or lowercase prose.
export function withGlossary(text: string | null | undefined): React.ReactNode {
  if (!text) return text ?? null;
  if (GLOSSARY_TERMS.length === 0) return text;
  const pattern = new RegExp(`\\b(${GLOSSARY_TERMS.join("|")})\\b`, "g");
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    GLOSSARY[part] ? <Acronym key={`g-${i}`} term={part} /> : <React.Fragment key={`t-${i}`}>{part}</React.Fragment>,
  );
}
