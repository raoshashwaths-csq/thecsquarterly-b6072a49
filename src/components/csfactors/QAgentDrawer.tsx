import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mic, Send, Sparkle, Square, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { QMark } from "@/components/site/QMark";
import { useElevenLabsSpeechInput } from "@/hooks/useElevenLabsSpeechInput";
import { CSFACTORS_Q_TREE } from "@/lib/csfactors-q-tree";
import { askCSFactorsQ } from "@/lib/csfactors-q.functions";
import { getMonthlyQUsage } from "@/lib/q-usage.functions";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

export function QAgentDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speech = useElevenLabsSpeechInput({
    onTranscript: (text) => setInput((current) => (current ? `${current} ${text}` : text)),
  });

  const ask = useServerFn(askCSFactorsQ);
  const fetchUsage = useServerFn(getMonthlyQUsage);
  const usage = useQuery({
    queryKey: ["q-monthly-usage"],
    queryFn: () => fetchUsage(),
    enabled: open,
    staleTime: 30_000,
  });
  const capped = usage.data && usage.data.cap !== null && usage.data.used >= usage.data.cap;

  const mut = useMutation({
    mutationFn: async (q: string) => ask({ data: { question: q, history: messages.slice(-10) } }),
    onSuccess: (res) => {
      setMessages((m) => [...m, { role: "assistant", content: res.reply || "(no reply)" }]);
      setError(null);
      usage.refetch();
    },
    onError: (e: Error) => setError(e.message),
  });

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, mut.isPending]);

  function send(text: string) {
    const q = text.trim();
    if (!q || mut.isPending || capped) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    mut.mutate(q);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col bg-background border-l border-border"
      >
        {/* Header */}
        <header className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-display text-2xl">
              <QMark />
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.25em] text-secondary-accent font-semibold">
                CSFactors / Analyst
              </div>
              <div className="font-display text-sm">Ask Q about your portfolio</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-border hover:border-accent hover:text-accent transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Transcript / empty state */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {messages.length === 0 && !mut.isPending ? (
            <div className="space-y-6">
              <p className="text-sm text-foreground/70 leading-relaxed">
                <QMark /> reads your live CSFactors data — accounts, stakeholders, QBR status, sentiment, renewals, and logged events. Ask anything, or start with a prompt:
              </p>
              {CSFACTORS_Q_TREE.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="font-mono text-xs uppercase tracking-[0.25em] text-accent font-semibold">
                    {group.label}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.prompts.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => send(p)}
                        className="text-left text-xs leading-snug border border-border bg-card hover:border-accent hover:text-accent px-3 py-2 transition-colors max-w-full"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" ? (
                <div className="max-w-[92%] text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap bg-primary text-primary-foreground px-3 py-2 rounded-md">
                  {m.content}
                </div>
              )}
            </div>
          ))}

          {mut.isPending ? (
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <Sparkle className="h-3 w-3 animate-pulse text-accent" />
              Q is thinking…
            </div>
          ) : null}

          {error ? (
            <div className="text-xs font-mono text-destructive border border-destructive/40 bg-destructive/10 p-3">
              {error}
            </div>
          ) : null}
        </div>

        {/* Cap banner */}
        {usage.data && usage.data.cap !== null ? (
          <div className={cn(
            "border-t border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] flex items-center justify-between",
            capped ? "bg-accent/10 text-accent" : "bg-card text-foreground/60",
          )}>
            <span>
              {usage.data.used} / {usage.data.cap} Q interactions this month
            </span>
            {capped ? (
              <Link to="/pricing" className="underline hover:text-accent">
                Upgrade →
              </Link>
            ) : null}
          </div>
        ) : null}

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-border px-4 py-3 flex items-end gap-2 bg-card"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            disabled={capped}
            placeholder={capped ? "Monthly cap reached — upgrade to keep asking Q." : "Ask Q about an account, a renewal, a stakeholder…"}
            className="flex-1 resize-none bg-transparent border border-border focus:border-accent outline-none px-3 py-2 text-sm font-sans disabled:opacity-50"
          />
          {speech.supported ? (
            <button
              type="button"
              onClick={speech.toggle}
              disabled={speech.transcribing || mut.isPending || capped}
              className={cn(
                "shrink-0 inline-flex items-center justify-center h-9 w-9 border border-border hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors",
                speech.recording && "border-accent text-accent animate-pulse",
              )}
              aria-label={speech.recording ? "Stop recording" : "Ask by voice"}
              title={speech.error ?? (speech.transcribing ? "Transcribing…" : "Ask by voice")}
            >
              {speech.recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!input.trim() || mut.isPending || capped}
            className="shrink-0 inline-flex items-center justify-center h-9 w-9 bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function QAgentLauncher({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 pl-4 pr-5 py-3 bg-accent text-accent-foreground shadow-lg hover:opacity-95 transition-opacity font-mono text-[11px] uppercase tracking-[0.2em] font-semibold"
      aria-label="Ask Q about your portfolio"
    >
      <span className="font-display text-base normal-case tracking-normal">
        <QMark periodClassName="text-accent-foreground" />
      </span>
      Ask Q
    </button>
  );
}

const DOCK_PROMPTS = [
  "Slice NRR by Enterprise segment",
  "Show low-health accounts",
  "Filter high-risk cohort",
  "QBRs overdue this quarter",
];

export function QAgentDock({
  onSubmit,
  onChip,
}: {
  onSubmit: (text: string) => void;
  onChip: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none px-3 pb-4">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="flex flex-wrap gap-1.5 justify-center mb-2">
          {DOCK_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChip(p)}
              className="font-mono text-xs uppercase tracking-[0.18em] border border-border bg-card/95 backdrop-blur px-2.5 py-1.5 hover:border-accent hover:text-accent transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = value.trim();
            if (!v) return;
            onSubmit(v);
            setValue("");
          }}
          className="flex items-center gap-2 bg-card border border-border shadow-lg px-3 py-2 focus-within:border-accent"
        >
          <span className="font-display text-lg leading-none shrink-0">
            <QMark />
          </span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask Q about your portfolio…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            aria-label="Ask Q"
          />
          <button
            type="submit"
            className="font-mono text-xs uppercase tracking-[0.2em] bg-accent text-accent-foreground px-3 py-1.5 hover:opacity-90 disabled:opacity-40"
            disabled={!value.trim()}
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
