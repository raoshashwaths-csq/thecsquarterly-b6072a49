import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { LumiMark } from "@/components/site/LumiMark";
import { cn } from "@/lib/utils";
import {
  completeQuest,
  getFutureOperatorProfile,
  pauseFutureOperator,
  resumeFutureOperator,
} from "@/lib/future-operator.functions";

export const Route = createFileRoute("/account/quests")({
  head: () => ({
    meta: [
      { title: "Future Operator — Today's Quests · The CS Quarterly" },
      {
        name: "description",
        content:
          "Three specific operator actions for today, sent from the Future Operator — the version of you 12 months from now.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FutureOperatorQuestsPage,
});

type Quest = {
  id: string;
  label: string;
  instruction: string;
  commitment?: string;
  estimated_minutes?: number;
  lumi_followup?: string;
  completed?: boolean;
};

type Profile = {
  future_team_state: string | null;
  core_commitments: string[] | null;
  current_focus_account: string | null;
  pending_renewal_at: string | null;
  active_quests: Quest[] | null;
  paused_until: string | null;
};

function FutureOperatorQuestsPage() {
  const fetchProfile = useServerFn(getFutureOperatorProfile);
  const complete = useServerFn(completeQuest);
  const pause = useServerFn(pauseFutureOperator);
  const resume = useServerFn(resumeFutureOperator);
  const queryClient = useQueryClient();

  const q = useQuery({
    queryKey: ["future-operator", "page"],
    queryFn: () => fetchProfile(),
    staleTime: 30_000,
  });

  if (q.isLoading) {
    return (
      <Shell>
        <p className="text-muted-foreground">Loading…</p>
      </Shell>
    );
  }

  if (!q.data?.eligible) {
    return (
      <Shell>
        <SectionCard
          eyebrow="Future Operator"
          title="Available for Practitioner subscribers"
          description="The Future Operator is a Lumi persona that sends you daily quests, drift signals, and reflection prompts from the version of you 12 months from now."
        >
          <div className="mt-4">
            <Link
              to="/pricing"
              className="inline-flex items-center px-4 py-2 border border-foreground hover:bg-foreground hover:text-background font-mono text-[11px] uppercase tracking-widest"
            >
              See pricing →
            </Link>
          </div>
        </SectionCard>
      </Shell>
    );
  }

  const profile = (q.data.profile ?? null) as Profile | null;

  if (!profile) {
    return (
      <Shell>
        <SectionCard
          eyebrow="Future Operator"
          title="Meet the version of you who already figured it out."
          description="Complete the three onboarding questions to activate your Future Operator. Today's quests will arrive tomorrow morning."
        >
          <div className="mt-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Onboarding step coming soon · for now, your profile is empty.
          </div>
        </SectionCard>
      </Shell>
    );
  }

  const quests = (profile.active_quests ?? []) as Quest[];
  const paused = profile.paused_until && new Date(profile.paused_until) > new Date();

  async function onComplete(id: string) {
    try {
      await complete({ data: { questId: id } });
      toast.success("Marked complete");
      await queryClient.invalidateQueries({ queryKey: ["future-operator"] });
    } catch (e) {
      toast.error("Could not mark complete", { description: String((e as Error).message ?? e) });
    }
  }

  async function onPause(days: number) {
    await pause({ data: { days } });
    toast.success(`Paused for ${days} days`);
    await queryClient.invalidateQueries({ queryKey: ["future-operator"] });
  }

  async function onResume() {
    await resume();
    toast.success("Future Operator resumed");
    await queryClient.invalidateQueries({ queryKey: ["future-operator"] });
  }

  return (
    <Shell>
      <header className="flex items-start gap-4 mb-10">
        <LumiMark variant="gold" size={56} />
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Future Operator
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight text-balance mt-2">
            Today's three quests.
          </h1>
          {profile.future_team_state && (
            <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
              <span className="font-mono text-[10px] uppercase tracking-widest mr-2">12-mo target</span>
              {profile.future_team_state}
            </p>
          )}
        </div>
      </header>

      {!quests.length ? (
        <SectionCard
          eyebrow="No quests yet"
          title="Your first three quests arrive tomorrow morning."
          description="The Future Operator generates a new set every day at 07:30 in your timezone."
        />
      ) : (
        <ul className="space-y-4">
          {quests.map((q) => (
            <li
              key={q.id}
              className={cn(
                "border border-border p-5 transition-colors",
                q.completed ? "bg-muted/30" : "bg-background",
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0",
                    q.completed
                      ? "bg-secondary-accent border-secondary-accent text-background"
                      : "border-border",
                  )}
                  aria-hidden
                >
                  {q.completed && <Check size={14} strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      "font-display text-lg leading-snug",
                      q.completed && "line-through text-muted-foreground",
                    )}
                  >
                    {q.label}
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                    {q.instruction}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {q.commitment && <span>· {q.commitment}</span>}
                    {typeof q.estimated_minutes === "number" && (
                      <span>· ~{q.estimated_minutes} min</span>
                    )}
                  </div>
                  <div className="mt-4 flex gap-3">
                    {!q.completed ? (
                      <button
                        type="button"
                        onClick={() => onComplete(q.id)}
                        className="px-3 py-1.5 bg-accent text-accent-foreground hover:bg-accent/90 font-mono text-[11px] uppercase tracking-widest"
                      >
                        Mark complete
                      </button>
                    ) : (
                      <a
                        href="/?lumi=open"
                        className="font-mono text-[11px] uppercase tracking-widest text-secondary-accent hover:text-accent"
                      >
                        Open Lumi debrief →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <SectionCard eyebrow="Commitments" title="What I won't skip this year.">
          <ul className="mt-3 space-y-2 text-sm">
            {(profile.core_commitments ?? []).map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-secondary-accent">·</span>
                <span>{c}</span>
              </li>
            ))}
            {!(profile.core_commitments ?? []).length && (
              <li className="text-muted-foreground">Not set yet.</li>
            )}
          </ul>
        </SectionCard>

        <SectionCard
          eyebrow={paused ? "Paused" : "Cadence"}
          title={paused ? "Future Operator is paused." : "Pause Future Operator"}
          description={
            paused
              ? `Resumes ${new Date(profile.paused_until!).toLocaleDateString()}.`
              : "Mute drift signals, daily quests, and reflection prompts."
          }
        >
          <div className="mt-3 flex flex-wrap gap-2">
            {paused ? (
              <button
                type="button"
                onClick={onResume}
                className="px-3 py-1.5 border border-foreground hover:bg-foreground hover:text-background font-mono text-[11px] uppercase tracking-widest"
              >
                Resume now
              </button>
            ) : (
              <>
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => onPause(days)}
                    className="px-3 py-1.5 border border-border hover:border-accent hover:text-accent font-mono text-[11px] uppercase tracking-widest"
                  >
                    Pause {days}d
                  </button>
                ))}
              </>
            )}
          </div>
        </SectionCard>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16">{children}</main>
      <SiteFooter />
    </div>
  );
}
