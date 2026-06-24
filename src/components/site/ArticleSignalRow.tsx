import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSubscriptionTier } from "@/hooks/useSubscriptionTier";
import { deriveComplexity, complexityCopy } from "@/lib/article-signals";
import { trackLumiEvent } from "@/lib/lumi-analytics";
import type { Post } from "@/lib/posts.functions";

type Props = {
  post: Pick<Post, "slug" | "category" | "section" | "tier" | "read_minutes">;
};

export function ArticleSignalRow({ post }: Props) {
  const sub = useSubscriptionTier();
  const complexity = deriveComplexity(post);
  const copy = complexityCopy(complexity, sub.tier);

  useEffect(() => {
    trackLumiEvent("article.signal.shown", {
      surface: "insights",
      meta: { slug: post.slug, complexity, tier: sub.tier },
    });
  }, [post.slug, complexity, sub.tier]);

  const eyebrowClass = "font-mono text-xs uppercase tracking-[0.3em]";
  const dotColor = copy.muted ? "text-muted-foreground" : "text-accent";

  const chip = (
    <span className={`${eyebrowClass} ${dotColor} inline-flex items-center gap-2`}>
      <span>{post.category}</span>
      <span aria-hidden>·</span>
      <span>{post.read_minutes} min read</span>
      <span aria-hidden>·</span>
      <span className={copy.muted ? "underline decoration-dotted underline-offset-4" : "font-semibold"}>
        {complexity}
      </span>
    </span>
  );

  return (
    <div className="mb-6 flex flex-col gap-1">
      {copy.tooltip ? (
        <TooltipProvider delayDuration={120}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/pricing" className="inline-flex w-fit">
                {chip}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs font-body text-xs normal-case tracking-normal">
              {copy.tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        chip
      )}
      {copy.microLine && (
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-secondary-accent">
          {copy.microLine}
        </span>
      )}
    </div>
  );
}
