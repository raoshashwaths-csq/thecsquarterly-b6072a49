import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Mic, Send, Sparkle, Square } from "lucide-react";
import { LumiMark } from "@/components/site/LumiMark";
import { useElevenLabsSpeechInput } from "@/hooks/useElevenLabsSpeechInput";
import { askCSFactorsQ } from "@/lib/csfactors-q.functions";
import type { LumiBriefing } from "@/lib/lumi-briefings";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

type Ctx = {
  open: (briefing?: LumiBriefing) => void;
  close: () => void;
  isOpen: boolean;
};

const LumiDrawerCtx = createContext<Ctx | null>(null);

export function useLumiDrawer() {
  const ctx = useContext(LumiDrawerCtx);
  if (!ctx) throw new Error("useLumiDrawer must be used within LumiDrawerProvider");
  return ctx;
}

export function LumiDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [briefing, setBriefing] = useState<LumiBriefing | null>(null);

  const open = useCallback((b?: LumiBriefing) => {
    setBriefing(b ?? null);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<Ctx>(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <LumiDrawerCtx.Provider value={value}>
      {children}
      <AskLumiDrawer open={isOpen} onClose={close} briefing={briefing} />
    </LumiDrawerCtx.Provider>
  );
}

function AskLumiDrawer({
  open,
  onClose,
  briefing,
}: {
  open: boolean;
  onClose: () => void;
  briefing: LumiBriefing | null;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speech = useElevenLabsSpeechInput({
    onTranscript: (text) => setInput((c) => (c ? `${c} ${text}` : text)),
  });
  const ask = useServerFn(askCSFactorsQ);

  const mut = useMutation({
    mutationFn: async (q: string) => ask({ data: { question: q, history: messages.slice(-10) } }),
    onSuccess: (res) => {
      setMessages((m) => [...m, { role: "assistant", content: res.reply || "(no reply)" }]);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open, briefing]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, mut.isPending]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  function send(text: string) {
    const q = text.trim();
    if (!q || mut.isPending) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    mut.mutate(q);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Ask Lumi"
        data-state={open ? "active" : "idle"}
        className={cn(
          "fixed top-0 right-0 z-50 h-screen w-full sm:w-[420px] bg-background border-l border-border",
          "flex flex-col shadow-[-20px_0_60px_-30px_rgba(0,0,0,0.5)]",
          "transition-transform duration-[240ms] ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <header className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <LumiMark variant="emblem" size={28} animated />
            <div className="min-w-0">
              <div className="eyebrow text-secondary-accent">CSFactors / Copilot</div>
              <div className="font-display text-base tracking-tight">
                Ask Lumi<span className="text-accent">.</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono uppercase tracking-[0.22em] text-[11px] text-muted-foreground hover:text-accent transition-colors"
          >
            [ Close ]
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {briefing ? (
            <article className="relative border border-border bg-card p-4 overflow-hidden">
              <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-accent" />
              <div className="eyebrow text-accent mb-2">{briefing.eyebrow}</div>
              <h3 className="font-display text-lg leading-snug tracking-tight mb-2">
                {briefing.headline}
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed mb-3">{briefing.body}</p>
              <ul className="space-y-1.5 mb-3">
                {briefing.bullets.map((b, i) => (
                  <li
                    key={i}
                    className="text-xs text-foreground/70 leading-snug flex gap-2 before:content-['—'] before:text-accent"
                  >
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {briefing.accountId ? (
                <Link
                  to="/csfactors/$accountId"
                  params={{ accountId: briefing.accountId }}
                  onClick={onClose}
                  className="font-mono uppercase tracking-[0.22em] text-[11px] text-accent hover:underline"
                >
                  Open account →
                </Link>
              ) : null}
            </article>
          ) : (
            <div className="text-sm text-foreground/70 leading-relaxed">
              <LumiMark variant="emblem" size={18} className="mr-1" />
              Lumi reads your live CSFactors data — accounts, stakeholders, QBR
              status, sentiment, renewals, and logged events. Ask anything.
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "assistant" ? (
                <div className="max-w-[92%] text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap bg-primary text-primary-foreground px-3 py-2">
                  {m.content}
                </div>
              )}
            </div>
          ))}

          {mut.isPending ? (
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground">
              <Sparkle className="h-3 w-3 animate-pulse text-accent" />
              Lumi is thinking…
            </div>
          ) : null}

          {error ? (
            <div className="text-xs font-mono text-destructive border border-destructive/40 bg-destructive/10 p-3">
              {error}
            </div>
          ) : null}
        </div>

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
            placeholder="Ask Lumi about an account, a renewal, a stakeholder…"
            className="flex-1 resize-none bg-transparent border border-border focus:border-accent outline-none px-3 py-2 text-sm font-sans"
          />
          {speech.supported ? (
            <button
              type="button"
              onClick={speech.toggle}
              disabled={speech.transcribing || mut.isPending}
              className={cn(
                "shrink-0 inline-flex items-center justify-center h-9 w-9 border border-border hover:border-accent hover:text-accent disabled:opacity-40 transition-colors",
                speech.recording && "border-accent text-accent animate-pulse",
              )}
              aria-label={speech.recording ? "Stop recording" : "Ask by voice"}
            >
              {speech.recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!input.trim() || mut.isPending}
            className="shrink-0 inline-flex items-center justify-center h-9 w-9 bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </aside>
    </>
  );
}
