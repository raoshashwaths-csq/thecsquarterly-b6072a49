import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterInline } from "@/components/site/NewsletterInline";
import { listPostsBySection } from "@/lib/posts.functions";

export type SectionPageProps = {
  eyebrow: string;
  title: string;
  italicWord?: string;
  tagline: string;
  description: string;
  pillars: { number: string; title: string; body: string }[];
  sectionSlug: "vanguard" | "retention-protocol" | "outcome-forum";
  extras?: ReactNode;
};

export const sectionPostsQuery = (slug: string) =>
  queryOptions({
    queryKey: ["posts", "section", slug],
    queryFn: () => listPostsBySection({ data: { section: slug } }),
  });

export function SectionPage({ eyebrow, title, italicWord, tagline, description, pillars, sectionSlug, extras }: SectionPageProps) {
  const { data: posts } = useSuspenseQuery(sectionPostsQuery(sectionSlug));

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <header className="max-w-5xl mx-auto px-6 pt-24 pb-16 animate-fade-up">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-6">
          {eyebrow}
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-8">
          {title}{italicWord && <> <span className="not-italic text-accent">{italicWord}</span></>}
        </h1>
        <p className="text-xl text-foreground/80 max-w-3xl text-pretty mb-6">{tagline}</p>
        <p className="text-base text-foreground/65 max-w-3xl text-pretty">{description}</p>
      </header>

      <div className="h-px bg-border max-w-7xl w-full mx-auto" />

      <section className="max-w-7xl w-full mx-auto px-6 py-20">
        <div className="flex justify-between items-end mb-12">
          <h2 className="font-display text-4xl">
            {posts.length > 0 ? "Dispatches in this section" : "What lives in this section"}
          </h2>
          <span className="font-mono uppercase tracking-widest text-xs text-muted-foreground">
            {posts.length} {posts.length === 1 ? "essay" : "essays"}
          </span>
        </div>

        {posts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
            {posts.map((p) => (
              <Link
                key={p.id}
                to="/insights/$slug"
                params={{ slug: p.slug }}
                className="group block border-t border-border pt-6"
              >
                <div className="flex justify-between font-mono uppercase tracking-widest text-xs text-muted-foreground mb-4">
                  <span className="text-accent">{p.category}</span>
                  <span>{p.read_minutes} min</span>
                </div>
                <h3 className="font-display text-2xl md:text-3xl mb-3 leading-tight transition-all">
                  {p.title}
                </h3>
                <p className="text-foreground/70 text-pretty">{p.excerpt}</p>
                <div className="mt-4 font-mono uppercase tracking-widest text-xs text-secondary-accent">
                  Read essay →
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-x-12 gap-y-12">
            {pillars.map((p) => (
              <article key={p.number} className="border-t border-border pt-6">
                <div className="font-mono text-xs text-secondary-accent mb-3">{p.number}</div>
                <h3 className="font-display text-2xl mb-3 leading-tight">{p.title}</h3>
                <p className="text-foreground/70 text-pretty">{p.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {posts.length > 0 && (
        <section className="max-w-7xl w-full mx-auto px-6 pb-20">
          <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground mb-10">
            The editorial spine of this section
          </div>
          <div className="grid md:grid-cols-3 gap-x-12 gap-y-12">
            {pillars.map((p) => (
              <article key={p.number} className="border-t border-border pt-6">
                <div className="font-mono text-xs text-secondary-accent mb-3">{p.number}</div>
                <h3 className="font-display text-xl mb-3 leading-tight">{p.title}</h3>
                <p className="text-sm text-foreground/70 text-pretty">{p.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {extras}



      <section className="bg-foreground text-background py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.3em] opacity-60 mb-6">
            Subscribe to the dispatch
          </div>
          <h3 className="font-display text-4xl md:text-5xl mb-6 leading-tight">
            One essay every Tuesday.
          </h3>
          <p className="text-background/70 mb-10 text-pretty">
            Subscribers see new entries in this section before they go public.
          </p>
          <div className="max-w-md mx-auto">
            <NewsletterInline source={`section-${sectionSlug}`} />
          </div>
          <Link to="/insights" className="inline-block mt-8 font-mono uppercase tracking-widest text-xs underline underline-offset-4 opacity-70 hover:opacity-100">
            ← Back to the full archive
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
