import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Plus } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/Reveal";
import { listMyTeams, createTeam } from "@/lib/enterprise.functions";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "Teams, The CS Quarterly" },
      { name: "description", content: "Seat usage and reading activity for your team." },
      { property: "og:title", content: "Teams, The CS Quarterly" },
      { property: "og:description", content: "Team-level visibility for CS leaders managing multi-seat licenses." },
    ],
    links: [{ rel: "canonical", href: "/teams" }],
  }),
  component: TeamsPage,
});

function TeamsPage() {
  const fetchTeams = useServerFn(listMyTeams);
  const create = useServerFn(createTeam);
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["myTeams"], queryFn: () => fetchTeams() });
  const mut = useMutation({
    mutationFn: (n: string) => create({ data: { name: n } }),
    onSuccess: () => {
      setName("");
      qc.invalidateQueries({ queryKey: ["myTeams"] });
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-6 py-16 max-w-5xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-6">Teams</p>
          <h1 className="font-display text-5xl md:text-6xl tracking-tight leading-[0.95]">
            Your bench, on one page.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Spin up a team workspace, invite operators, and see what your bench is actually reading.
          </p>
        </Reveal>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) mut.mutate(name.trim());
          }}
          className="mt-12 flex gap-2 max-w-md"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New team name"
            className="flex-1 bg-transparent border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={mut.isPending}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono uppercase tracking-wider bg-foreground text-background rounded disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Create
          </button>
        </form>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {data && [...data.owned, ...data.member].length === 0 && (
            <p className="text-muted-foreground text-sm">No teams yet.</p>
          )}
          {data &&
            data.owned.map((t: any) => (
              <TeamCard key={t.id} team={t} role="owner" />
            ))}
          {data &&
            data.member.map((t: any) => <TeamCard key={t.id} team={t} role={t.role} />)}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function TeamCard({ team, role }: { team: any; role: string }) {
  return (
    <div className="border border-border rounded p-5 hover:border-accent transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-secondary-accent" />
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {role}
          </span>
        </div>
      </div>
      <h3 className="font-display text-2xl tracking-tight mt-2">{team.name}</h3>
      <p className="text-xs text-muted-foreground mt-1">
        Created {new Date(team.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
