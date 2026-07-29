import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Glasses, Smile, X } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { BackButton } from "@/components/site/BackButton";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterInline } from "@/components/site/NewsletterInline";
import { SeriesRail } from "@/components/site/SeriesRail";
import { AnnotationBar } from "@/components/site/AnnotationBar";
import { AudioBar } from "@/components/site/AudioBar";
import { HighlightedBody } from "@/components/site/HighlightedBody";
import { Paywall, BlurredTeaser } from "@/components/site/Paywall";
import { PaywallOverlay, PaywallBlur } from "@/components/site/PaywallOverlay";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionTier } from "@/hooks/useSubscriptionTier";
import { ArticleSignalRow } from "@/components/site/ArticleSignalRow";
import { ResumeReadingBanner } from "@/components/site/ResumeReadingBanner";
import { RelatedIntelligencePanel } from "@/components/site/RelatedIntelligencePanel";
import { getPost } from "@/lib/posts.functions";
import { LumiDebriefCard } from "@/components/lumi/LumiDebriefCard";
import { DispatchReactionCard } from "@/components/lumi/DispatchReactionCard";
import { PlaybookCtaCard } from "@/components/site/PlaybookCtaCard";
import { StripPlacement } from "@/components/strip/StripPlacement";

const postQuery = (slug: string) =>
  queryOptions({
    queryKey: ["post", slug],
    queryFn: () => getPost({ data: { slug } }),
  });

export const Route = createFileRoute("/insights/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(postQuery(params.slug));
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Insight, The CS Quarterly" }] };
    const url = `https://www.thecsquarterly.com/insights/${params.slug}`;
    const image = loaderData.cover_image_url
      ? (loaderData.cover_image_url.startsWith("http")
          ? loaderData.cover_image_url
          : `https://www.thecsquarterly.com${loaderData.cover_image_url}`)
      : undefined;
    const meta: Array<Record<string, string>> = [
      { title: `${loaderData.title}, The CS Quarterly` },
      { name: "description", content: loaderData.excerpt },
      { property: "og:title", content: loaderData.title },
      { property: "og:description", content: loaderData.excerpt },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { property: "article:author", content: loaderData.author },
      { property: "article:section", content: loaderData.category },
      { property: "article:published_time", content: loaderData.published_at },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
      meta.push({ name: "twitter:card", content: "summary_large_image" });
    }
    const ld: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: loaderData.title,
      description: loaderData.excerpt,
      datePublished: loaderData.published_at,
      author: { "@type": "Person", name: loaderData.author },
      publisher: {
        "@type": "Organization",
        name: "The CS Quarterly",
        logo: {
          "@type": "ImageObject",
          url: "https://www.thecsquarterly.com/favicon.ico",
        },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      articleSection: loaderData.category,
    };
    if (image) ld.image = image;
    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(ld),
        },
      ],
    };
  },
  component: PostPage,
});

function renderMarkdownLite(body: string) {
  // Normalize: ensure heading lines are isolated by blank lines so they always
  // parse as their own block (handles authors who omit blank lines around ##).
  const normalized = body
    .replace(/\r\n/g, "\n")
    .replace(/([^\n])\n(#{1,6}[^#\n])/g, "$1\n\n$2")
    .replace(/(^|\n)(#{1,6}[^\n]*?)\n(?!\n)/g, "$1$2\n\n");

  return normalized.split(/\n{2,}/).map((para, i) => {
    // Strip trailing hash decorations like "## Heading ##" and collapse stray spaces.
    const p = para.trim().replace(/\s*#+\s*$/, "").trim();
    if (!p) return null;

    const h3 = p.match(/^###\s*(.+)$/);
    if (h3) {
      return (
        <h3 key={i} className="font-display text-2xl md:text-3xl mt-12 mb-4 leading-tight tracking-tight">
          {renderInline(h3[1].trim())}
        </h3>
      );
    }
    const h2 = p.match(/^##\s*(.+)$/);
    if (h2) {
      return (
        <h2 key={i} className="font-display text-3xl md:text-4xl mt-14 mb-6 leading-tight tracking-tight">
          {renderInline(h2[1].trim())}
        </h2>
      );
    }
    const h1 = p.match(/^#\s+(.+)$/);
    if (h1) {
      return (
        <h2 key={i} className="font-display text-3xl md:text-4xl mt-14 mb-6 leading-tight tracking-tight">
          {renderInline(h1[1].trim())}
        </h2>
      );
    }
    if (/^\d+\.\s/m.test(p)) {
      const items = p.split("\n").map((l) => l.replace(/^\s*\d+\.\s+/, ""));
      return (
        <ol key={i} className="list-decimal pl-6 space-y-2 text-lg leading-relaxed my-6 marker:text-secondary-accent marker:font-mono">
          {items.map((it, j) => (<li key={j}>{renderInline(it)}</li>))}
        </ol>
      );
    }
    // Bullet: hyphen, or a single asterisk NOT followed by another asterisk
    // (so "**Bold thing**" at line-start is never mis-detected as a bullet).
    if (/^(?:-|\*(?!\*))\s/m.test(p)) {
      const items = p.split("\n").map((l) => l.replace(/^\s*(?:-|\*(?!\*))\s+/, ""));
      return (
        <ul key={i} className="list-disc pl-6 space-y-2 text-lg leading-relaxed my-6 marker:text-secondary-accent">
          {items.map((it, j) => (<li key={j}>{renderInline(it)}</li>))}
        </ul>
      );
    }
    return (
      <p key={i} className="text-lg leading-relaxed my-6 text-foreground/85">
        {renderInline(p)}
      </p>
    );
  });
}

// Tolerant inline renderer:
//   ***x*** → <strong><em>x</em></strong>
//   **x**   → <strong>x</strong>  (non-greedy, allows inner single *)
//   *x*     → <em>x</em>          (only when not adjacent to another *)
// Any surviving stray ** or lone * (unbalanced authoring) is stripped so it
// never renders as a literal glyph in the article body.
function renderInline(text: string): React.ReactNode {
  type Token = { type: "text" | "bi" | "b" | "i"; value: string };
  const tokens: Token[] = [];
  let rest = text;
  // Order matters: triple, then double, then single.
  const patterns: { type: Token["type"]; re: RegExp }[] = [
    { type: "bi", re: /\*\*\*([^\n*][\s\S]*?[^\n*]|[^\n*])\*\*\*/ },
    { type: "b", re: /\*\*([\s\S]+?)\*\*/ },
    { type: "i", re: /(?<![\*\w])\*(?!\*)([^*\n]+?)\*(?!\*)/ },
  ];
  outer: while (rest.length) {
    for (const { type, re } of patterns) {
      const m = rest.match(re);
      if (m && m.index !== undefined) {
        if (m.index > 0) tokens.push({ type: "text", value: rest.slice(0, m.index) });
        tokens.push({ type, value: m[1] });
        rest = rest.slice(m.index + m[0].length);
        continue outer;
      }
    }
    tokens.push({ type: "text", value: rest });
    break;
  }
  // Strip stray ** or lone * from text tokens (unbalanced authoring residue).
  const clean = (s: string) => s.replace(/\*\*+/g, "").replace(/(^|\s)\*(\s|$)/g, "$1$2");
  return tokens.map((t, i) => {
    if (t.type === "bi") return <strong key={i} className="font-semibold text-foreground"><em>{t.value}</em></strong>;
    if (t.type === "b") return <strong key={i} className="font-semibold text-foreground">{t.value}</strong>;
    if (t.type === "i") return <em key={i}>{t.value}</em>;
    return <span key={i}>{clean(t.value)}</span>;
  });
}

type Tone = "mckinsey" | "wodehouse";

function PostPage() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(postQuery(slug));
  const [tone, setTone] = useState<Tone>("mckinsey");
  const { user, loading: authLoading } = useAuth();
  const sub = useSubscriptionTier();
  const navigate = useNavigate();
  const [showToneHint, setShowToneHint] = useState(false);
  const [progress, setProgress] = useState(0);

  // Visitor 4th-article soft gate (replaces previous hard redirect).
  const [visitorGate, setVisitorGate] = useState(false);
  // Free-user 52%-scroll gate.
  const [scrollGate, setScrollGate] = useState(false);
  // When the free user clicks "Continue reading for free" we let them through
  // but keep a slim persistent nudge at the top of the article.
  const [freeContinued, setFreeContinued] = useState(false);

  const hasMck = !!(post?.title_mckinsey && post?.body_mckinsey);
  const hasWod = !!(post?.title_wodehouse && post?.body_wodehouse);
  const hasBothTones = hasMck && hasWod;

  // Track distinct articles viewed. Visitors get 3 free; the 4th shows the
  // PaywallOverlay in-context instead of redirecting to /pricing.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (authLoading) return;
    const key = "cs_articles_seen";
    let seen: string[] = [];
    try { seen = JSON.parse(window.localStorage.getItem(key) ?? "[]"); } catch { seen = []; }
    const isNew = !seen.includes(slug);
    if (isNew) {
      if (!user && seen.length >= 3) {
        setVisitorGate(true);
        return;
      }
      seen.push(slug);
      window.localStorage.setItem(key, JSON.stringify(seen));
    }
    if (hasBothTones && seen.length <= 2) {
      const t = window.setTimeout(() => setShowToneHint(true), 600);
      return () => window.clearTimeout(t);
    }
  }, [slug, user, authLoading, hasBothTones]);

  // Free-tier scroll gate at 52% on premium content.
  useEffect(() => {
    if (sub.tier !== "free") return;
    if (!post?.locked) return;
    if (freeContinued) return;
    if (progress >= 0.52) setScrollGate(true);
  }, [progress, sub.tier, post?.locked, freeContinued]);

  const { title, body } = useMemo(() => {
    if (!post) return { title: "", body: "" };
    if (tone === "mckinsey" && hasMck) return { title: post.title_mckinsey!, body: post.body_mckinsey! };
    if (tone === "wodehouse" && hasWod) return { title: post.title_wodehouse!, body: post.body_wodehouse! };
    return { title: post.title, body: post.body };
  }, [post, tone, hasMck, hasWod]);

  if (!post) return null;

  const toneClass = tone === "wodehouse" ? "tone-witty" : "tone-analytic";
  const isSeries = !!post.series_slug;
  const sources = (post.sources ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const articleInner = (
    <article className={`animate-fade-up ${toneClass}`}>
      {isSeries && (
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-3">
          {post.series_title} · Part {post.series_part} of {post.series_total}
        </div>
      )}
      <ArticleSignalRow post={post} />
      <ResumeReadingBanner slug={slug} title={post.title} />
      <h1
        key={`title-${tone}`}
        className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-10 animate-tone-swap"
      >
        {title}
      </h1>
      <p className="text-2xl text-foreground/70 italic leading-snug mb-6 text-pretty">
        {post.excerpt}
      </p>
      <AudioBar text={body} title={post.title} inline onProgress={setProgress} />
      <div className="flex flex-wrap items-center justify-between gap-4 pb-10 border-b border-border font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>By {post.author}</span>
          <span>·</span>
          <span>{new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
        </div>
        {hasBothTones && (
          <div className="relative flex items-center gap-2 shrink-0 leading-none">
            <span className="sm:hidden font-mono text-xs normal-case tracking-normal text-muted-foreground whitespace-nowrap leading-none">
              Switch tone →
            </span>
            <ToneToggle tone={tone} setTone={setTone} />
            {showToneHint && (
              <div
                role="dialog"
                className="hidden sm:block absolute right-0 top-full mt-3 z-30 w-72 bg-foreground text-background p-4 shadow-xl animate-fade-up"
              >
                <button
                  aria-label="Dismiss"
                  onClick={() => setShowToneHint(false)}
                  className="absolute top-2 right-2 opacity-60 hover:opacity-100"
                >
                  <X size={14} />
                </button>
                <div className="flex items-center gap-2 font-mono uppercase tracking-widest text-xs text-secondary-accent mb-2 font-semibold">
                  <Glasses size={12} /> / <Smile size={12} /> Try the tone toggle
                </div>
                <p className="text-sm leading-snug text-background/85 normal-case tracking-normal font-body">
                  Read every essay in two voices, analytical or witty. Subscribers get unlimited access to both.
                </p>
                <button
                  onClick={() => setShowToneHint(false)}
                  className="mt-3 font-mono uppercase tracking-widest text-xs text-secondary-accent hover:text-background"
                >
                  Got it →
                </button>
                <span
                  aria-hidden
                  className="absolute -top-1.5 right-6 h-3 w-3 rotate-45 bg-foreground"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {visitorGate ? (
        <div className="relative mt-12">
          <PaywallBlur full>
            <HighlightedBody body={body} progress={0} className="prose-content" key={`body-${tone}`} />
          </PaywallBlur>
          <PaywallOverlay gate="article" tier="visitor" />
        </div>
      ) : post.locked && sub.tier === "free" && scrollGate ? (
        <div className="relative mt-12">
          <PaywallBlur>
            <HighlightedBody body={body} progress={progress} className="prose-content" key={`body-${tone}`} />
          </PaywallBlur>
          <PaywallOverlay
            gate="article"
            tier="free"
            continueAvailable
            onContinueFree={() => { setScrollGate(false); setFreeContinued(true); }}
          />
        </div>
      ) : post.locked && sub.tier === "visitor" ? (
        <>
          <BlurredTeaser>
            <HighlightedBody body={body} progress={progress} className="prose-content mt-12" key={`body-${tone}`} />
          </BlurredTeaser>
          <Paywall
            variant="card"
            oneOffLabel={`Unlock "${post.title}"`}
            oneOffPriceCents={900}
            onBuyOneOff={() => navigate({ to: "/pricing" })}
            subtitle="One essay. Or unlock the full archive with Practitioner from $39/mo."
          />
        </>
      ) : (
        <>
          {freeContinued && (
            <div className="mt-10 mb-6 border border-border bg-card px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/70">
                Reading on Free · upgrade for unlimited access and 50 Lumi sessions
              </span>
              <Link
                to="/pricing"
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent border-b border-accent/40 hover:border-accent pb-0.5"
              >
                See Practitioner →
              </Link>
            </div>
          )}
          <HighlightedBody body={body} progress={progress} className="prose-content mt-12 animate-tone-swap" key={`body-${tone}`} />

          <PlaybookCtaCard slug={slug} />

          <AnnotationBar slug={slug} />

          {sources.length > 0 && (
            <section className="mt-20 pt-10 border-t border-border">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-5">
                Sources & further reading
              </div>
              <ol className="space-y-2 list-decimal pl-6 marker:text-secondary-accent marker:font-mono text-sm text-foreground/75">
                {sources.map((src, i) => {
                  const m = src.match(/(https?:\/\/\S+)/);
                  if (m) {
                    const before = src.slice(0, m.index).replace(/[—\-:\s]+$/, "").trim();
                    return (
                      <li key={i}>
                        {before && <span>{before} — </span>}
                        <a href={m[1]} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-accent break-all">
                          {m[1]}
                        </a>
                      </li>
                    );
                  }
                  return <li key={i}>{src}</li>;
                })}
              </ol>
            </section>
          )}

          {/* Inline strip placements — confirmed by editorial team */}
          <StripPlacement targetType="post" targetSlug={slug} />

          <DispatchReactionCard postId={post.id} slug={slug} />

          <RelatedIntelligencePanel slug={slug} />
        </>
      )}
    </article>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-6 pt-10 w-full">
        <BackButton label="Back" fallbackTo="/insights" />
      </div>


      {isSeries ? (
        <div className="max-w-7xl w-full mx-auto px-6 pt-20 pb-16 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-x-16 gap-y-10">
          <SeriesRail
            seriesSlug={post.series_slug!}
            seriesTitle={post.series_title ?? "Series"}
            currentSlug={slug}
          />
          <div className="max-w-3xl">{articleInner}</div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-6 pt-20 pb-16">{articleInner}</div>
      )}

      <section className="bg-foreground text-background py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h3 className="font-display text-4xl md:text-5xl mb-6 leading-tight">
            Get the next dispatch in your inbox.
          </h3>
          <p className="text-background/70 mb-10">
            One essay every Tuesday. No noise.
          </p>
          <div className="bg-background text-foreground p-6 rounded-sm">
            <NewsletterInline source={`article:${slug}`} />
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          to="/insights"
          className="font-mono text-xs uppercase tracking-widest border-b border-foreground pb-1 hover:text-accent hover:border-accent"
        >
          ← Back to all insights
        </Link>
      </div>

      <SiteFooter />

      {/* Lumi Debrief — triggers at 90% scroll, once per slug per session. */}
      {!post.locked || sub.tier !== "free" ? (
        <LumiDebriefCard postId={post.id} slug={slug} title={post.title} progress={progress} />
      ) : null}
    </div>
  );
}

function ToneToggle({ tone, setTone }: { tone: Tone; setTone: (t: Tone) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Article tone"
      className="inline-flex items-stretch border border-border bg-background rounded-sm overflow-hidden"
    >
      <button
        role="tab"
        aria-label="Analytical tone"
        title="Analytical"
        aria-selected={tone === "mckinsey"}
        onClick={() => setTone("mckinsey")}
        className={`px-3 py-1.5 flex items-center justify-center transition-all duration-300 ${
          tone === "mckinsey" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Glasses size={16} strokeWidth={1.75} />
      </button>
      <button
        role="tab"
        aria-label="Witty tone"
        title="Witty"
        aria-selected={tone === "wodehouse"}
        onClick={() => setTone("wodehouse")}
        className={`px-3 py-1.5 flex items-center justify-center transition-all duration-300 ${
          tone === "wodehouse" ? "bg-secondary-accent text-secondary-accent-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Smile size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
}
