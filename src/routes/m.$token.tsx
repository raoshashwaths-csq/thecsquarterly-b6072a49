import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getSharedMap, addCustomerComment, type MapMilestone, type MapPhase } from "@/lib/maps.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/m/$token")({
  ssr: false,
  head: () => ({ meta: [{ title: "Your Action Plan" }] }),
  component: SharedMap,
});

function SharedMap() {
  const { token } = Route.useParams();
  const fetchFn = useServerFn(getSharedMap);
  const commentFn = useServerFn(addCustomerComment);
  const { data, refetch } = useQuery({ queryKey: ["shared-map", token], queryFn: () => fetchFn({ data: { token } }) });

  if (!data) {
    return <div className="min-h-screen bg-white text-stone-900 p-10 font-mono text-xs">Loading…</div>;
  }
  if (!data.ok) {
    return (
      <div className="min-h-screen bg-white text-stone-900 grid place-items-center p-10">
        <div className="text-center">
          <div className="font-serif text-2xl mb-2">This plan is not currently shared</div>
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-stone-500">Please contact your account manager.</div>
        </div>
      </div>
    );
  }

  const { map, phases, milestones, comments } = data;
  const done = milestones.filter((m) => m.status === "completed").length;
  const currentPhase = phases.find((p) => milestones.some((m) => m.phase_id === p.id && m.status !== "completed")) ?? phases[phases.length - 1];

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-8">
          <span className="font-serif text-sm text-stone-700">The CS Quarterly<span style={{ color: "#8B6F35" }}>.</span></span>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl tracking-tight mb-1">{map.title}</h1>
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-1" style={{ color: "#8B6F35" }}>{map.account_name}</div>
        <div className="font-mono text-[9px] text-stone-500">
          Shared by {map.csm_name ?? "your CSM"} · {new Date().toLocaleDateString()}
        </div>

        <div className="mt-8 border p-6" style={{ borderColor: "#E8E0D0" }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-3" style={{ color: "#8B6F35" }}>Your Onboarding Plan</div>
          <div className="font-serif text-lg mb-3">{done} of {milestones.length} milestones complete</div>
          <div className="h-1.5 w-full" style={{ background: "#EAE4DA" }}>
            <div className="h-full" style={{ width: `${(done / Math.max(1, milestones.length)) * 100}%`, background: "#C4A45A" }} />
          </div>
          {currentPhase && (
            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-stone-600">
              Current phase: <span style={{ color: currentPhase.color }}>{currentPhase.title}</span>
            </div>
          )}
        </div>

        <div className="mt-10 space-y-8">
          {phases.map((phase) => (
            <PhaseView
              key={phase.id}
              phase={phase}
              milestones={milestones.filter((m) => m.phase_id === phase.id)}
              comments={comments}
              onComment={async (milestoneId, content, name) => {
                await commentFn({ data: { token, milestone_id: milestoneId, content, author_name: name } });
                refetch();
              }}
            />
          ))}
        </div>

        <div className="mt-16 pt-6 border-t font-mono text-[9px] text-stone-400" style={{ borderColor: "#E8E0D0" }}>
          Powered by The CS Quarterly — CSFactors
        </div>
      </div>
    </div>
  );
}

function PhaseView({ phase, milestones, comments, onComment }: {
  phase: MapPhase;
  milestones: MapMilestone[];
  comments: { id: string; milestone_id: string | null; author_type: string; author_name: string | null; content: string; created_at: string }[];
  onComment: (milestoneId: string, content: string, name: string) => Promise<void>;
}) {
  return (
    <section>
      <div className="pb-2 mb-3 border-b-2" style={{ borderColor: phase.color }}>
        <h2 className="font-serif text-xl">{phase.title}</h2>
      </div>
      <div className="space-y-4">
        {milestones.map((m) => (
          <MilestoneRow
            key={m.id}
            milestone={m}
            comments={comments.filter((c) => c.milestone_id === m.id)}
            onComment={(content, name) => onComment(m.id, content, name)}
          />
        ))}
      </div>
    </section>
  );
}

function MilestoneRow({ milestone, comments, onComment }: {
  milestone: MapMilestone;
  comments: { id: string; author_type: string; author_name: string | null; content: string; created_at: string }[];
  onComment: (content: string, name: string) => Promise<void>;
}) {
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const showInput = milestone.status !== "completed" && (milestone.owner === "customer" || milestone.owner === "shared");

  const icon =
    milestone.status === "completed" ? <span className="text-emerald-700">✓</span>
    : milestone.status === "in_progress" ? <span style={{ color: "#8B6F35" }}>◑</span>
    : milestone.status === "blocked" ? <span className="text-red-600">⚠</span>
    : <span className="text-stone-300">○</span>;

  return (
    <div className="border-l pl-4 py-2" style={{ borderColor: "#E8E0D0" }}>
      <div className="flex items-start gap-3">
        <div className="text-lg leading-none mt-0.5">{icon}</div>
        <div className="flex-1">
          <div className="font-serif text-base">
            {milestone.title}
            {milestone.owner === "customer" && (
              <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.22em]" style={{ color: "#8B6F35" }}>(Your action)</span>
            )}
          </div>
          {milestone.status === "completed" && milestone.completed_at && (
            <div className="font-mono text-[9px] text-stone-500 mt-1">Completed {new Date(milestone.completed_at).toLocaleDateString()}</div>
          )}
          {milestone.status === "in_progress" && (
            <div className="font-mono text-[9px] text-stone-500 mt-1">In progress</div>
          )}
          {milestone.status === "blocked" && (
            <div className="font-mono text-[9px] text-red-600 mt-1">Awaiting resolution</div>
          )}
          {milestone.completion_note && (
            <div className="font-serif italic text-stone-500 text-sm mt-2">{milestone.completion_note}</div>
          )}

          {comments.length > 0 && (
            <div className="mt-3 space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="text-sm p-2" style={{ background: c.author_type === "csm" ? "#FDF6E3" : "#F5F2EC" }}>
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-stone-500">
                    {c.author_name ?? c.author_type} · {new Date(c.created_at).toLocaleDateString()}
                  </div>
                  <div className="font-serif">{c.content}</div>
                </div>
              ))}
            </div>
          )}

          {showInput && (
            <div className="mt-3 flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="rounded-none w-32 text-xs" />
              <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Add a note or question…" className="rounded-none flex-1 text-xs" />
              <Button
                disabled={!content.trim()}
                onClick={async () => { await onComment(content, name || "Customer"); setContent(""); }}
                className="rounded-none text-xs font-mono uppercase tracking-[0.22em]"
                style={{ background: "#8B6F35", color: "white" }}
              >
                Send
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
