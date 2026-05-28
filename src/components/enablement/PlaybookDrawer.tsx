import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Compass, Sparkles } from "lucide-react";
import { useRouteTips } from "@/hooks/useRouteTips";
import { FeatureGlossary } from "./FeatureGlossary";
import { readSet, writeSet, STORAGE_KEYS } from "@/lib/enablement/storage";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStartTour: () => void;
};

export function PlaybookDrawer({ open, onOpenChange, onStartTour }: Props) {
  const group = useRouteTips();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  useEffect(() => {
    if (open) setDismissed(readSet(STORAGE_KEYS.dismissedTips));
  }, [open]);

  const toggleDismiss = (id: string, value: boolean) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      writeSet(STORAGE_KEYS.dismissedTips, next);
      return next;
    });
  };

  const visibleTips = showAll
    ? group.tips
    : group.tips.filter((t) => !dismissed.has(t.id));

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <div className="border-b border-border px-6 pt-6 pb-4">
            <SheetHeader className="space-y-2 text-left">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
                Playbook
              </p>
              <SheetTitle className="font-display text-2xl leading-tight">
                Command Centre Playbook &amp; Quick Tips
              </SheetTitle>
              <SheetDescription>
                Context-aware guidance for the surface you're on, plus a searchable feature
                glossary.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onStartTour();
                }}
                className="gap-1.5"
              >
                <Compass className="h-3.5 w-3.5" />
                Take a Quick Tour
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setGlossaryOpen(true)}
                className="gap-1.5"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Feature Glossary
              </Button>
            </div>
          </div>

          <Tabs defaultValue="tips" className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-border px-6 py-3">
              <TabsList className="w-full">
                <TabsTrigger value="tips" className="flex-1">
                  Quick Tips
                </TabsTrigger>
                <TabsTrigger value="glossary" className="flex-1">
                  Glossary
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="tips" className="flex-1 overflow-y-auto px-6 py-5 mt-0">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent">
                  {group.label}
                </p>
                <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden />
              </div>

              {visibleTips.length === 0 ? (
                <EmptyTips
                  showAll={showAll}
                  onShowAll={() => setShowAll(true)}
                  hasDismissed={dismissed.size > 0}
                />
              ) : (
                <ul className="space-y-3">
                  {visibleTips.map((tip) => (
                    <li
                      key={tip.id}
                      className="rounded-md border border-border bg-card/60 p-4 transition-colors hover:bg-card animate-fade-in"
                    >
                      <h4 className="font-display text-base leading-snug">{tip.title}</h4>
                      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                        {tip.body}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        {tip.cta ? (
                          <Link
                            to={tip.cta.to}
                            onClick={() => onOpenChange(false)}
                            className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent underline-offset-4 hover:underline"
                          >
                            {tip.cta.label} →
                          </Link>
                        ) : (
                          <span />
                        )}
                        <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
                          <Checkbox
                            checked={dismissed.has(tip.id)}
                            onCheckedChange={(v) => toggleDismiss(tip.id, Boolean(v))}
                            aria-label="Don't show this tip again"
                          />
                          Don&apos;t show again
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {dismissed.size > 0 && !showAll ? (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                >
                  Show all tips ({dismissed.size} hidden) →
                </button>
              ) : null}
              {showAll ? (
                <button
                  type="button"
                  onClick={() => setShowAll(false)}
                  className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                >
                  Hide dismissed
                </button>
              ) : null}
            </TabsContent>

            <TabsContent value="glossary" className="flex-1 overflow-y-auto px-6 py-5 mt-0">
              <FeatureGlossary />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <Dialog open={glossaryOpen} onOpenChange={setGlossaryOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
              Reference
            </p>
            <DialogTitle className="font-display text-2xl">
              Command Centre Feature Glossary
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            <FeatureGlossary autoFocus />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptyTips({
  showAll,
  onShowAll,
  hasDismissed,
}: {
  showAll: boolean;
  onShowAll: () => void;
  hasDismissed: boolean;
}) {
  return (
    <div className="rounded-md border border-dashed border-border bg-card/40 p-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent">
        All caught up
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasDismissed && !showAll
          ? "You've dismissed every tip for this surface."
          : "No tips registered here yet — try the Glossary tab."}
      </p>
      {hasDismissed && !showAll ? (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-accent hover:underline"
        >
          Restore dismissed tips →
        </button>
      ) : null}
    </div>
  );
}
