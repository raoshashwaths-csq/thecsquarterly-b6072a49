import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Lock, FileText } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { listPlaybooks } from "@/lib/playbooks.functions";

const playbooksQuery = queryOptions({
  queryKey: ["playbooks"],
  queryFn: () => listPlaybooks(),
});

export const Route = createFileRoute("/codex/")({
  head: () => ({
    meta: [
      { title: "The CS Codex, Executive playbooks for revenue operators" },
      { name: "description", content: "The reference library of frameworks, templates, and playbooks for elite Customer Success teams. Buy individually or unlock all with Vanguard." },
      { property: "og:title", content: "The CS Codex" },
      { property: "og:url", content: "/codex" },
    ],
    links: [{ rel: "canonical", href: "/codex" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(playbooksQuery),
  component: CodexPage,
});

function CodexPage() {
  const { data: playbooks } = useSuspenseQuery(playbooksQuery);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <header className="max-w-7xl w-full mx-auto px-6 pt-20 pb-12 animate-fade-up">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-6">The CS Codex</div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance mb-6 max-w-4xl">
          The reference library for <span className="italic text-accent">serious operators.</span>
        </h1>
        <p className="text-xl text-foreground/75 max-w-2xl text-pretty">
          Frameworks, decks, calculators, and templates. Each one a self-contained executive asset. Buy à la carte or unlock the entire archive with Vanguard.
        </p>
      </header>

      <div className="h-px bg-border max-w-7xl w-full mx-auto" />

      <main className="max-w-7xl w-full mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {playbooks.map((p) => (
            <article key={p.id} className="border border-border bg-card flex flex-col group hover:border-foreground transition-colors">
              <div className="aspect-[4/3] bg-foreground text-background relative overflow-hidden flex items-center justify-center">
                <div className="absolute top-4 left-4 flex items-center gap-2 font-mono uppercase tracking-widest text-xs opacity-80">
                  <Lock size={12} /> Premium
                </div>
                <div className="absolute top-4 right-4 font-mono text-xs opacity-50">{p.pages}pp</div>
                <FileText size={48} className="opacity-30" />
                <div className="absolute bottom-4 left-4 right-4 font-mono text-[9px] uppercase tracking-widest opacity-50">
                  {p.category}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h2 className="font-display text-2xl mb-3 leading-tight">{p.title}</h2>
                <p className="text-sm text-foreground/70 text-pretty mb-6 flex-1">{p.summary}</p>
                <div className="space-y-2">
                  <Link
                    to="/codex/$slug"
                    params={{ slug: p.slug }}
                    className="block w-full py-3 text-center bg-foreground text-background font-mono uppercase tracking-widest text-xs hover:bg-accent transition-colors"
                  >
                    ${(p.price_cents / 100).toFixed(0)} · View playbook
                  </Link>
                  {p.included_in_vanguard && (
                    <Link to="/pricing" className="block text-center uppercase tracking-widest text-xs font-mono text-secondary-accent hover:text-accent">
                      Or unlock instantly with Vanguard →
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {playbooks.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            The Codex is being populated. Check back shortly.
          </div>
        )}
      </main>

      <section className="bg-foreground text-background py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.3em] opacity-60 mb-6">The economics</div>
          <h3 className="font-display text-4xl md:text-5xl mb-6 leading-tight">
            $500+ of playbooks. <span className="italic">$49 a month.</span>
          </h3>
          <p className="text-background/70 mb-10 text-pretty">
            One Vanguard subscription pays for itself the moment you open a second playbook. Everything in the Codex, every premium dispatch, every Custom Blueprint, included.
          </p>
          <Link to="/pricing" className="inline-block px-8 py-4 bg-secondary-accent text-secondary-accent-foreground font-mono text-[11px] uppercase tracking-widest hover:opacity-90">
            See Vanguard pricing
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
