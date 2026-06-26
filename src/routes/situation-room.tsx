import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mic, Save, Send, Sparkles, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useElevenLabsSpeechInput } from "@/hooks/useElevenLabsSpeechInput";
import { LumiMark } from "@/components/site/LumiMark";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  startSituation,
  continueSituation,
  saveSituationLog,
  listSituationSessions,
} from "@/lib/situation-room.functions";
import { listMyQRuns, listMyTaggedLumiRuns } from "@/lib/q-agent.functions";
import { getNode, getTree } from "@/lib/q-trees";
import { trackLumiEvent } from "@/lib/lumi-analytics";

export const Route = createFileRoute("/situation-room")({
  head: () => ({
    meta: [
      { title: "Lumi Situation Room — The CS Quarterly" },
      {
        name: "description",
        content:
          "Bring your live CS problem to Lumi. The Situation Room surfaces the exact past dispatches, frameworks, and benchmarks that apply — then coaches you through it.",
      },
      { property: "og:title", content: "Lumi Situation Room — bring the problem, find the dispatch" },
      {
        property: "og:description",
        content:
          "Real-time coaching on renewal risk, escalations, champion loss, and stakeholder displacement — grounded in the CS Quarterly archive.",
      },
    ],
    links: [{ rel: "canonical", href: "/situation-room" }],
  }),
  component: SituationRoomPage,
});

const EXAMPLE_SITUATION =
  "My largest account just went silent three weeks before renewal. I can't get a meeting with the new CFO and the champion who sold us in left last month.";

type Dispatch = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  section: string;
  excerpt: string;
  similarity: number;
  framework: string;
  why: string;
};

type ChatMsg = { role: "user" | "assistant"; content: string };

function SituationRoomPage() {
  const { user, loading: authLoading } = useAuth();
  const [situation, setSituation] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [reply, setReply] = useState("");
  const [composerError, setComposerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");

  const startFn = useServerFn(startSituation);
  const continueFn = useServerFn(continueSituation);
  const saveFn = useServerFn(saveSituationLog);

  const start = useMutation({
    mutationFn: async (s: string) => startFn({ data: { situation: s } }),
    onSuccess: (res) => {
      setSessionId(res.sessionId);
      setDispatches(res.dispatches);
      setMessages([{ role: "assistant", content: res.opening }]);
      trackLumiEvent("drawer.open", { surface: "situation-room", meta: { event: "situation_started" } });
    },
    onError: (e: Error) => setComposerError(e.message),
  });

  const cont = useMutation({
    mutationFn: async (msg: string) => continueFn({ data: { sessionId: sessionId!, message: msg } }),
    onSuccess: (res, msg) => {
      setMessages((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: res.reply }]);
      setReply("");
    },
  });

  const save = useMutation({
    mutationFn: async () => saveFn({ data: { sessionId: sessionId!, title: saveTitle.trim() || situation.slice(0, 80) } }),
    onSuccess: () => {
      setSaved(true);
      trackLumiEvent("drawer.open", { surface: "situation-room", meta: { event: "situation_saved" } });
    },
  });

  const speech = useElevenLabsSpeechInput({
    onTranscript: (t) => setSituation((prev) => (prev ? `${prev} ${t}` : t)),
  });

  function onSubmitSituation(e: React.FormEvent) {
    e.preventDefault();
    setComposerError(null);
    if (situation.trim().length < 20) {
      setComposerError("Give Lumi a few more details — at least 20 characters.");
      return;
    }
    start.mutate(situation.trim());
  }

  function reset() {
    setSituation("");
    setSessionId(null);
    setDispatches([]);
    setMessages([]);
    setReply("");
    setSaved(false);
    setSaveTitle("");
  }

  return (
    <div className="min-h-screen bg-background paper-grain">
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8 md:pt-16 pb-32">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.22em] text-xs text-muted-foreground hover:text-accent border-b border-transparent hover:border-accent pb-1 transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to The CS Quarterly
        </Link>

        <div className="mb-10">
          <div className="eyebrow text-secondary-accent mb-3 inline-flex items-center gap-2">
            <LumiMark variant="emblem" className="h-4 w-4" /> Lumi · Situation Room
          </div>
          <h1 className="font-display text-4xl md:text-6xl leading-[0.95] tracking-tight text-balance mb-4">
            Bring the problem. <span className="text-accent">Find the dispatch.</span>
          </h1>
          <p className="text-foreground/70 max-w-2xl text-lg leading-relaxed">
            Describe the live situation in your own words. Lumi pulls the exact past dispatches, frameworks, and benchmarks that apply, then walks you through the decision.
          </p>
        </div>

        {!sessionId ? (
          <form onSubmit={onSubmitSituation} className="space-y-4">
            <div className="relative">
              <Textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder={EXAMPLE_SITUATION}
                rows={8}
                disabled={!user || start.isPending}
                className="min-h-[200px] text-base leading-relaxed font-serif resize-y bg-card border-border focus-visible:ring-accent"
              />
              <button
                type="button"
                onClick={() => speech.toggle()}
                disabled={!user}
                className="absolute bottom-3 right-3 inline-flex items-center justify-center h-9 w-9 rounded-full border border-border bg-background hover:border-accent hover:text-accent transition-colors"
                aria-label={speech.recording ? "Stop dictation" : "Dictate"}
              >
                {speech.recording ? <span className="h-3 w-3 bg-accent" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
            {composerError ? (
              <p className="text-sm text-destructive font-mono">{composerError}</p>
            ) : null}
            {!authLoading && !user ? (
              <div className="border border-dashed border-border bg-card p-6 text-center">
                <p className="text-sm text-foreground/70 mb-3">
                  Sign in to use the Situation Room. Lumi needs context to coach you well.
                </p>
                <Link to="/login" className="font-mono text-xs uppercase tracking-widest border-b border-foreground/40 hover:text-accent hover:border-accent pb-1">
                  Sign in →
                </Link>
              </div>
            ) : (
              <Button
                type="submit"
                size="lg"
                disabled={start.isPending}
                className="lumi-cta inline-flex items-center gap-2"
              >
                {start.isPending ? "Lumi is reading…" : <>Find the dispatch <Sparkles className="h-4 w-4" /></>}
              </Button>
            )}
          </form>
        ) : (
          <SituationActive
            situation={situation}
            dispatches={dispatches}
            messages={messages}
            reply={reply}
            setReply={setReply}
            onSend={() => cont.mutate(reply.trim())}
            sending={cont.isPending}
            saved={saved}
            saveTitle={saveTitle}
            setSaveTitle={setSaveTitle}
            onSave={() => save.mutate()}
            onReset={reset}
          />
        )}

        {user ? <PastSessionsStrip /> : null}
        {user ? <LumiArchive /> : null}
      </div>
    </div>
  );
}

function SituationActive(props: {
  situation: string;
  dispatches: Dispatch[];
  messages: ChatMsg[];
  reply: string;
  setReply: (s: string) => void;
  onSend: () => void;
  sending: boolean;
  saved: boolean;
  saveTitle: string;
  setSaveTitle: (s: string) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const {
    situation, dispatches, messages, reply, setReply, onSend, sending,
    saved, saveTitle, setSaveTitle, onSave, onReset,
  } = props;

  return (
    <div className="space-y-10">
      <section className="border border-border bg-card p-6">
        <div className="eyebrow text-muted-foreground mb-2">Your situation</div>
        <p className="font-serif text-lg leading-relaxed text-foreground/90 italic">"{situation}"</p>
      </section>

      <section>
        <div className="eyebrow text-secondary-accent mb-4">3 dispatches Lumi pulled for you</div>
        <div className="grid md:grid-cols-3 gap-4">
          {dispatches.map((d, i) => (
            <Link
              key={d.id}
              to="/insights/$slug"
              params={{ slug: d.slug }}
              className="group border border-border bg-card hover:border-accent transition-colors p-5 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow text-muted-foreground">{d.section.replace(/_/g, " ")}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                  {Math.round(d.similarity * 100)}% match
                </span>
              </div>
              <h3 className="font-display text-lg leading-tight tracking-tight mb-2 group-hover:text-accent">
                {d.title}
              </h3>
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-secondary-accent mb-2">
                Framework · {d.framework}
              </div>
              <p className="text-sm text-foreground/70 leading-relaxed flex-1">{d.why}</p>
              <span className="mt-4 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-foreground/60 group-hover:text-accent">
                Read dispatch [{i + 1}] <ChevronRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="eyebrow text-secondary-accent mb-4 inline-flex items-center gap-2">
          <LumiMark variant="emblem" className="h-3.5 w-3.5" /> Coaching conversation
        </div>
        <div className="border border-border bg-card divide-y divide-border">
          {messages.map((m, i) => (
            <div key={i} className={`p-5 ${m.role === "assistant" ? "bg-background/40" : ""}`}>
              <div className="eyebrow text-muted-foreground mb-2">
                {m.role === "assistant" ? "Lumi" : "You"}
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none font-serif leading-relaxed whitespace-pre-wrap">
                {m.content}
              </div>
            </div>
          ))}
          {sending ? (
            <div className="p-5">
              <div className="eyebrow text-muted-foreground mb-2">Lumi</div>
              <div className="text-sm text-foreground/60 italic">Thinking…</div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex gap-3">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Reply to Lumi…"
            rows={3}
            disabled={sending}
            className="flex-1 bg-card border-border focus-visible:ring-accent"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && reply.trim()) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <Button
            onClick={onSend}
            disabled={sending || !reply.trim()}
            className="lumi-cta self-end inline-flex items-center gap-2"
          >
            <Send className="h-4 w-4" /> Send
          </Button>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-2">
          Cmd/Ctrl + Enter to send
        </p>
      </section>

      <section className="border-t border-border pt-6 flex flex-wrap items-center gap-3">
        {!saved ? (
          <>
            <Input
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Title for this Situation log…"
              className="max-w-sm bg-card border-border"
            />
            <Button onClick={onSave} variant="outline" className="inline-flex items-center gap-2">
              <Save className="h-4 w-4" /> Save to workspace
            </Button>
          </>
        ) : (
          <span className="font-mono text-xs uppercase tracking-widest text-accent">Saved to workspace ✓</span>
        )}
        <Button onClick={onReset} variant="ghost" className="ml-auto">
          Start new situation
        </Button>
      </section>
    </div>
  );
}

function PastSessionsStrip() {
  const listFn = useServerFn(listSituationSessions);
  const { data, isLoading } = useQuery({
    queryKey: ["situation-sessions"],
    queryFn: () => listFn(),
  });
  if (isLoading || !data?.length) return null;
  return (
    <section className="mt-16 border-t border-border pt-10">
      <div className="eyebrow text-secondary-accent mb-4">Past situations</div>
      <div className="space-y-2">
        {data.slice(0, 5).map((s) => (
          <div key={s.id} className="flex items-start gap-4 border border-border bg-card p-4 hover:border-accent transition-colors group">
            <div className="flex-1 min-w-0">
              <div className="font-serif text-sm leading-snug line-clamp-2">
                {s.title || s.situation}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                {new Date(s.created_at).toLocaleDateString()} {s.saved_to_workspace ? "· saved" : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * The Lumi Archive — past Lumi runs (tagged + untagged) and Playbooks,
 * organised in a grid with cards that expand on hover.
 */
function LumiArchive() {
  const runsFn = useServerFn(listMyQRuns);
  const taggedFn = useServerFn(listMyTaggedLumiRuns);
  const { data: runsResp } = useQuery({ queryKey: ["my-q-runs"], queryFn: () => runsFn() });
  const { data: taggedResp } = useQuery({ queryKey: ["my-tagged-runs"], queryFn: () => taggedFn() });

  const allRuns = (runsResp?.runs ?? []) as Array<{ id: string; node_id: string; created_at: string }>;
  const tagged = (taggedResp?.runs ?? []) as Array<{ id: string; nodeId: string; accountName: string | null; taggedAt: string | null }>;

  return (
    <section className="mt-16 border-t border-border pt-10 space-y-10">
      <div>
        <div className="eyebrow text-secondary-accent mb-1">Your Lumi archive</div>
        <h2 className="font-display text-2xl tracking-tight mb-2">Past runs &amp; playbooks</h2>
        <p className="text-sm text-foreground/60">
          Every Lumi run you've kicked off and every playbook in the library, in one place. Hover any card to expand.
        </p>
      </div>

      {allRuns.length ? (
        <div>
          <div className="eyebrow text-muted-foreground mb-3">Recent Lumi runs</div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allRuns.slice(0, 9).map((r) => {
              const node = getNode(r.node_id);
              const tree = node ? getTree(node.treeId) : null;
              return (
                <Link
                  key={r.id}
                  to="/q/response/$runId"
                  params={{ runId: r.id }}
                  className="group relative border border-border bg-card p-4 hover:border-accent hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
                >
                  <div className="eyebrow text-muted-foreground mb-2">
                    {tree?.title ?? "Lumi"}
                  </div>
                  <div className="font-display text-base leading-tight mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                    {node?.label ?? r.node_id}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                  <div className="max-h-0 group-hover:max-h-32 overflow-hidden transition-[max-height] duration-300 ease-out">
                    <p className="text-xs text-foreground/70 mt-3 leading-relaxed line-clamp-4">
                      {node?.description ?? "Open this run to see Lumi's diagnosis, playbook, and executable steps."}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {tagged && tagged.length ? (
        <div>
          <div className="eyebrow text-muted-foreground mb-3">Runs tagged to accounts</div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tagged.slice(0, 9).map((r: { id: string; nodeId: string; accountName: string | null; taggedAt: string | null }) => {
              const node = getNode(r.nodeId);
              return (
                <Link
                  key={r.id}
                  to="/q/response/$runId"
                  params={{ runId: r.id }}
                  className="group relative border border-border bg-card p-4 hover:border-accent hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
                >
                  <div className="eyebrow text-accent mb-2">{r.accountName ?? "Account"}</div>
                  <div className="font-display text-base leading-tight mb-2 line-clamp-2 group-hover:text-accent">
                    {node?.label ?? r.nodeId}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Tagged {r.taggedAt ? new Date(r.taggedAt).toLocaleDateString() : ""}
                  </div>
                  <div className="max-h-0 group-hover:max-h-32 overflow-hidden transition-[max-height] duration-300 ease-out">
                    <p className="text-xs text-foreground/70 mt-3 leading-relaxed line-clamp-4">
                      {node?.description ?? "Open the run to revisit Lumi's analysis on this account."}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <PlaybooksStrip />
    </section>
  );
}

function PlaybooksStrip() {
  type PbRow = { id: string; slug: string; title: string; summary: string; category: string };
  const { data } = useQuery<PbRow[]>({
    queryKey: ["playbooks-list"],
    queryFn: async () => {
      const mod = await import("@/lib/playbooks.functions");
      const res = (await mod.listPlaybooks()) as unknown as PbRow[];
      return res ?? [];
    },
  });
  if (!data?.length) return null;
  return (
    <div>
      <div className="eyebrow text-muted-foreground mb-3">Playbook library</div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((p) => (
          <Link
            key={p.id}
            to="/codex/$slug"
            params={{ slug: p.slug }}
            className="group relative border border-border bg-card p-4 hover:border-accent hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
          >
            <div className="eyebrow text-secondary-accent mb-2">{p.category}</div>
            <div className="font-display text-base leading-tight mb-2 line-clamp-2 group-hover:text-accent">
              {p.title}
            </div>
            <div className="max-h-0 group-hover:max-h-32 overflow-hidden transition-[max-height] duration-300 ease-out">
              <p className="text-xs text-foreground/70 mt-2 leading-relaxed line-clamp-4">
                {p.summary}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
