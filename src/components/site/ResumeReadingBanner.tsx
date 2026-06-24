import { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { useArticleProgress, clearArticleProgress } from "@/hooks/useArticleProgress";
import { trackLumiEvent } from "@/lib/lumi-analytics";

const MIN_RESUME_PCT = 20;
const MIN_AGE_MS = 30 * 60 * 1000;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "earlier";
  }
}

export function ResumeReadingBanner({ slug, title }: { slug: string; title: string }) {
  const { savedEntry, resumeTo } = useArticleProgress(slug, title);
  const [dismissed, setDismissed] = useState(false);

  const eligible =
    !!savedEntry &&
    savedEntry.pct >= MIN_RESUME_PCT &&
    Date.now() - new Date(savedEntry.updatedAt).getTime() >= MIN_AGE_MS;

  useEffect(() => {
    if (!eligible || dismissed) return;
    trackLumiEvent("article.resume.shown", {
      surface: "insights",
      meta: { slug, pct: savedEntry?.pct },
    });
    const onScroll = () => setDismissed(true);
    window.addEventListener("scroll", onScroll, { passive: true, once: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [eligible, dismissed, slug, savedEntry?.pct]);

  if (!eligible || dismissed || !savedEntry) return null;

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border border-border bg-card px-4 py-3 animate-fade-up">
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/75">
        You read {savedEntry.pct}% of this piece on {formatDate(savedEntry.updatedAt)}.
      </span>
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            trackLumiEvent("article.resume.click", {
              surface: "insights",
              meta: { slug, pct: savedEntry.pct },
            });
            resumeTo(savedEntry.pct);
            setDismissed(true);
          }}
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent border-b border-accent/40 hover:border-accent pb-0.5 inline-flex items-center gap-1"
        >
          <ChevronDown size={12} /> Resume
        </button>
        <button
          onClick={() => {
            trackLumiEvent("article.resume.dismiss", {
              surface: "insights",
              meta: { slug },
            });
            clearArticleProgress(slug);
            setDismissed(true);
          }}
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <X size={12} /> Start over
        </button>
      </div>
    </div>
  );
}
