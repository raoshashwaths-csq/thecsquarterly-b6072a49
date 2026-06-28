import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Lock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useSubscriptionTier } from "@/hooks/useSubscriptionTier";
import { getLinkedPlaybook } from "@/lib/article-playbook-map";

/**
 * Article-foot CTA card linking a dispatch to its Codex playbook.
 *
 * Rendered between the article body and AnnotationBar in /insights/$slug.
 * Practitioner+ tier: link directly to /codex/<playbook-slug>.
 * Free / Reader / Visitor: open a slide-up sheet with the Practitioner gate.
 *
 * Renders nothing when the article slug has no linked playbook.
 */
export function PlaybookCtaCard({ slug }: { slug: string }) {
  const link = getLinkedPlaybook(slug);
  const sub = useSubscriptionTier();
  const [open, setOpen] = useState(false);

  if (!link) return null;

  const unlocked = !sub.loading && sub.canAccess("practitioner");
  // While entitlements are still loading, render the CTA as "unlocked" optimistically
  // — the destination route will gate again. Avoids a paywall flash for paid users.
  const treatAsUnlocked = unlocked || sub.loading;

  const card = (
    <div className="mt-12 border border-border bg-card">
      <div className="px-5 md:px-6 py-5 border-b border-border">
        <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-secondary-accent font-semibold mb-2 flex items-center gap-2">
          {!treatAsUnlocked && <Lock size={10} className="text-foreground/50" />} Codex Playbook
        </div>
        <p className="font-display text-lg md:text-xl text-foreground/90 leading-snug max-w-2xl">
          {link.description}
        </p>
      </div>
      <div className="px-5 md:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {treatAsUnlocked ? (
          <Link
            to="/codex/$slug"
            params={{ slug: link.playbookSlug }}
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-mono text-[11px] uppercase tracking-[0.25em] px-5 py-3 hover:bg-accent/90 transition-colors"
          >
            {link.ctaLabel} <ArrowRight size={14} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-mono text-[11px] uppercase tracking-[0.25em] px-5 py-3 hover:bg-accent/90 transition-colors"
          >
            {link.ctaLabel} <ArrowRight size={14} />
          </button>
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/55">
          Practitioner tier and above
        </span>
      </div>
    </div>
  );

  return (
    <>
      {card}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="border-t border-border bg-background p-0 sm:max-w-3xl sm:mx-auto sm:rounded-t-sm">
          <SheetHeader className="text-left px-6 pt-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-secondary-accent font-semibold mb-2">
              Practitioner playbook
            </div>
            <SheetTitle className="font-display text-2xl md:text-3xl tracking-tight">
              This playbook is available to Practitioner subscribers and above.
            </SheetTitle>
            <SheetDescription className="text-base text-foreground/70 mt-2 max-w-xl">
              The decision tree from this dispatch is built as a live, interactive operational tool —
              not a static document. Branching diagnostic, fill-in worksheets, and a completable
              operator checklist.
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-6 pt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <Link
              to="/pricing"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-mono text-[11px] uppercase tracking-[0.25em] px-5 py-3 hover:bg-accent/90 transition-colors"
            >
              Unlock with Practitioner — from $39/mo <ArrowRight size={14} />
            </Link>
            {!sub.isLoggedIn && (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="font-mono text-[11px] uppercase tracking-[0.25em] text-foreground/70 hover:text-accent border-b border-foreground/40 hover:border-accent pb-0.5 w-fit"
              >
                Already a subscriber? Sign in →
              </Link>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
