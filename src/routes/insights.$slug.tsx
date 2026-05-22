import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterInline } from "@/components/site/NewsletterInline";
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
    if (!loaderData) return { meta: [{ title: "Insight — The CS Quarterly" }] };
    return {
      meta: [
        { title: `${loaderData.title} — The CS Quarterly` },
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
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: loaderData.title,
            description: loaderData.excerpt,
            author: { "@type": "Person", name: loaderData.author },
            datePublished: loaderData.published_at,
            articleSection: loaderData.category,
          }),
        },
      ],
    };
  },
  component: PostPage,
});

function renderMarkdownLite(body: string) {
  return body.split("\n\n").map((para, i) => {
    if (para.startsWith("## ")) {
      return (
        <h2 key={i} className="font-display text-3xl md:text-4xl mt-12 mb-6 leading-tight">
          {para.replace(/^##\s+/, "")}
        </h2>
      );
    }
    if (/^\d+\.\s/.test(para)) {
      const items = para.split("\n").map((l) => l.replace(/^\d+\.\s+/, ""));
      return (
        <ol key={i} className="list-decimal pl-6 space-y-2 text-lg leading-relaxed my-6">
          {items.map((it, j) => (
            <li key={j}>{it}</li>
          ))}
        </ol>
      );
    }
    if (para.startsWith("- ")) {
      const items = para.split("\n").map((l) => l.replace(/^-\s+/, ""));
      return (
        <ul key={i} className="list-disc pl-6 space-y-2 text-lg leading-relaxed my-6">
          {items.map((it, j) => (
            <li key={j}>{it}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={i} className="text-lg leading-relaxed my-6 text-foreground/85">
        {para}
      </p>
    );
  });
}

function PostPage() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(postQuery(slug));
  if (!post) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <article className="max-w-3xl mx-auto px-6 pt-20 pb-16 animate-fade-up">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-6">
          {post.category} · {post.read_minutes} min read
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-10">
          {post.title}
        </h1>
        <p className="text-2xl text-foreground/70 italic leading-snug mb-10 text-pretty">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-4 pb-10 border-b border-border font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <span>By {post.author}</span>
          <span>·</span>
          <span>{new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
        </div>

        <div className="aspect-[21/9] bg-muted my-12 grayscale flex items-center justify-center">
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">
            {post.category}
          </span>
        </div>

        <div className="prose-content">{renderMarkdownLite(post.body)}</div>
      </article>

      {/* Inline newsletter CTA */}
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
