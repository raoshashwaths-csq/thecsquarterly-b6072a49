import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterInline } from "@/components/site/NewsletterInline";

export type SectionPageProps = {
  eyebrow: string;
  title: string;
  italicWord?: string;
  tagline: string;
  description: string;
  pillars: { number: string; title: string; body: string }[];
  comingSoon?: string;
};

export function SectionPage({ eyebrow, title, italicWord, tagline, description, pillars, comingSoon }: SectionPageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <header className="max-w-5xl mx-auto px-6 pt-24 pb-16 animate-fade-up">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-6">
          {eyebrow}
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-8">
          {title}{italicWord && <> <span className="italic text-accent">{italicWord}</span></>}
        </h1>
        <p className="text-xl text-foreground/80 max-w-3xl text-pretty mb-6">{tagline}</p>
        <p className="text-base text-foreground/65 max-w-3xl text-pretty">{description}</p>
      </header>

      <div className="h-px bg-border max-w-7xl w-full mx-auto" />

      <section className="max-w-7xl w-full mx-auto px-6 py-20">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-10">
          What lives in this section
        </div>
        <div className="grid md:grid-cols-3 gap-x-12 gap-y-12">
          {pillars.map((p) => (
            <article key={p.number} className="border-t border-border pt-6">
              <div className="font-mono text-[11px] text-secondary-accent mb-3">{p.number}</div>
              <h2 className="font-display text-2xl mb-3 leading-tight">{p.title}</h2>
              <p className="text-foreground/70 text-pretty">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-foreground text-background py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-60 mb-6">
            {comingSoon ?? "In production"}
          </div>
          <h3 className="font-display text-4xl md:text-5xl mb-6 leading-tight">
            The first essays land soon.
          </h3>
          <p className="text-background/70 mb-10 text-pretty">
            Subscribers see this section before it goes public. Get the dispatch.
          </p>
          <div className="max-w-md mx-auto">
            <NewsletterInline source={`section-${eyebrow.toLowerCase().replace(/\s+/g, "-")}`} />
          </div>
          <Link to="/insights" className="inline-block mt-8 font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 opacity-70 hover:opacity-100">
            ← Back to the archive
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
