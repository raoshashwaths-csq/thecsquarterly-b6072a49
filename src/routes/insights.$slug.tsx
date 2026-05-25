import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Glasses, Smile, X } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterInline } from "@/components/site/NewsletterInline";
import { SeriesRail } from "@/components/site/SeriesRail";
import { useAuth } from "@/hooks/useAuth";
import { getPost } from "@/lib/posts.functions";

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
    return {
      meta: [
        { title: `${loaderData.title}, The CS Quarterly` },
        { name: "description", content: loaderData.excerpt },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/insights/${params.slug}` },
        { property: "article:author", content: loaderData.author },
        { property: "article:section", content: loaderData.category },
        { property: "article:published_time", content: loaderData.published_at },
      ],
      links: [{ rel: "canonical", href: `/insights/${params.slug}` }],
    };
  },
  component: PostPage,
});

function renderMarkdownLite(body: string) {
  return body.split("\n\n").map((para, i) => {
    const p = para.trim();
    if (!p) return null;
    if (p.startsWith("## ")) {
      return (
        <h2 key={i} className="font-display text-3xl md:text-4xl mt-14 mb-6 leading-tight tracking-tight">
          {p.replace(/^##\s+/, "")}
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
    if (/^[-*]\s/m.test(p)) {
      const items = p.split("\n").map((l) => l.replace(/^\s*[-*]\s+/, ""));
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

function renderInline(text: string) {
  // Minimal bold rendering for **...**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part) ? (
      <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

type Tone = "mckinsey" | "wodehouse";

function PostPage() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(postQuery(slug));
  const [tone, setTone] = useState<Tone>("mckinsey");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showToneHint, setShowToneHint] = useState(false);

  const hasMck = !!(post?.title_mckinsey && post?.body_mckinsey);
  const hasWod = !!(post?.title_wodehouse && post?.body_wodehouse);
  const hasBothTones = hasMck && hasWod;

  // Track distinct articles viewed. Allow 3 free, then paywall on a 4th new article.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "cs_articles_seen";
    let seen: string[] = [];
    try { seen = JSON.parse(window.localStorage.getItem(key) ?? "[]"); } catch { seen = []; }
    const isNew = !seen.includes(slug);
    if (isNew) {
      if (!user && seen.length >= 3) {
        navigate({ to: "/pricing" });
        return;
      }
      seen.push(slug);
      window.localStorage.setItem(key, JSON.stringify(seen));
    }
    if (hasBothTones && seen.length <= 2) {
      const t = window.setTimeout(() => setShowToneHint(true), 600);
      return () => window.clearTimeout(t);
    }
  }, [slug, user, hasBothTones, navigate]);

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
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-3">
          {post.series_title} · Part {post.series_part} of {post.series_total}
        </div>
      )}
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-6">
        {post.category} · {post.read_minutes} min read
      </div>
      <h1
        key={`title-${tone}`}
        className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-10 animate-tone-swap"
      >
        {title}
      </h1>
      <p className="text-2xl text-foreground/70 italic leading-snug mb-10 text-pretty">
        {post.excerpt}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-10 border-b border-border font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>By {post.author}</span>
          <span>·</span>
          <span>{new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
        </div>
        {hasBothTones && (
          <div className="relative flex items-center gap-2 shrink-0 leading-none">
            <span className="sm:hidden font-mono text-[10px] normal-case tracking-normal text-muted-foreground whitespace-nowrap leading-none">
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
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-secondary-accent mb-2 font-semibold">
                  <Glasses size={12} /> / <Smile size={12} /> Try the tone toggle
                </div>
                <p className="text-sm leading-snug text-background/85 normal-case tracking-normal font-body">
                  Read every essay in two voices, analytical or witty. Subscribers get unlimited access to both.
                </p>
                <button
                  onClick={() => setShowToneHint(false)}
                  className="mt-3 font-mono text-[10px] uppercase tracking-widest text-secondary-accent hover:text-background"
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

      <div key={`body-${tone}`} className="prose-content mt-12 animate-tone-swap">{renderMarkdownLite(body)}</div>

      {sources.length > 0 && (
        <section className="mt-20 pt-10 border-t border-border">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-5">
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
    </article>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

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
          className="font-mono text-[11px] uppercase tracking-widest border-b border-foreground pb-1 hover:text-accent hover:border-accent"
        >
          ← Back to all insights
        </Link>
      </div>

      <SiteFooter />
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
