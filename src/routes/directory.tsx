import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/Reveal";
import { listDirectory } from "@/lib/enterprise.functions";

export const Route = createFileRoute("/directory")({
  head: () => ({
    meta: [
      { title: "Directory, The CS Quarterly" },
      { name: "description", content: "Verified Customer Success leaders, by company and credential." },
      { property: "og:title", content: "Directory" },
      { property: "og:description", content: "A vetted directory of operators in our network." },
    ],
    links: [{ rel: "canonical", href: "/directory" }],
  }),
  component: DirectoryPage,
});

function DirectoryPage() {
  const fetchData = useServerFn(listDirectory);
  const { data, isLoading } = useQuery({ queryKey: ["directory"], queryFn: () => fetchData() });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-6 py-16 max-w-6xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-6">
            Directory
          </p>
          <h1 className="font-display text-5xl md:text-6xl tracking-tight leading-[0.95]">
            The operators on the field.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Verified Customer Success leaders, vetted for credential and seat.
          </p>
        </Reveal>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {data && data.length === 0 && (
            <p className="text-muted-foreground text-sm italic col-span-full">
              No verified profiles published yet.
            </p>
          )}
          {(data ?? []).map((p: any) => (
            <article key={p.id} className="border border-border rounded p-5 hover:border-accent transition-colors">
              <div className="flex items-start gap-4">
                {p.headshot_url ? (
                  <img
                    src={p.headshot_url}
                    alt={p.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center font-display text-xl">
                    {p.name?.[0] ?? "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display text-lg tracking-tight truncate">{p.name}</h3>
                    <BadgeCheck className="w-4 h-4 text-secondary-accent shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.title}
                    {p.title && p.company ? " · " : ""}
                    {p.company}
                  </p>
                </div>
              </div>
              {p.bio && <p className="text-sm mt-4 leading-relaxed line-clamp-4">{p.bio}</p>}
              {p.credentials?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.credentials.map((c: string) => (
                    <span
                      key={c}
                      className="font-mono text-xs uppercase tracking-wider border border-border rounded px-1.5 py-0.5 text-muted-foreground"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
