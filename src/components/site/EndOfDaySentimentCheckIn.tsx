import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { QMark } from "@/components/site/QMark";
import { useAuth } from "@/hooks/useAuth";
import { recordDailySentiment } from "@/lib/sentiment.functions";

const FLAG_KEY = "q.flagged.today";
const DISMISS_PREFIX = "endofday";
const EVENING_HOUR = 18;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function EndOfDaySentimentCheckIn() {
  const { user } = useAuth();
  const submit = useServerFn(recordDailySentiment);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !user) return;
    const tick = () => {
      try {
        const flag = sessionStorage.getItem(FLAG_KEY);
        if (!flag) return;
        const [flagDate, kws] = flag.split("|");
        if (flagDate !== todayKey()) return;
        const dismissKey = `${DISMISS_PREFIX}.${user.id}.${todayKey()}`;
        if (localStorage.getItem(dismissKey) === "1") return;
        const hour = new Date().getHours();
        if (hour < EVENING_HOUR) return;
        setKeywords((kws ?? "").split(",").filter(Boolean));
        setOpen(true);
      } catch { /* */ }
    };
    tick();
    const t = window.setInterval(tick, 60_000);
    return () => window.clearInterval(t);
  }, [user]);

  function dismiss() {
    if (typeof window !== "undefined" && user) {
      try { localStorage.setItem(`${DISMISS_PREFIX}.${user.id}.${todayKey()}`, "1"); } catch { /* */ }
    }
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const res = await submit({ data: { rawText: text.trim(), flaggedKeywords: keywords } });
      toast.success(`Logged — ${res.label}`);
      dismiss();
      setText("");
    } catch (err) {
      toast.error((err as Error).message || "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? setOpen(true) : dismiss())}>
      <SheetContent side="bottom" className="bg-background border-t border-border p-0">
        <div className="max-w-2xl mx-auto p-7 md:p-9">
          <SheetHeader className="text-left mb-5">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-3">
              <QMark /> · End-of-day check-in
            </div>
            <SheetTitle asChild>
              <h2 className="font-display text-3xl md:text-4xl leading-[0.95] tracking-tight">
                Checking in.
              </h2>
            </SheetTitle>
            <SheetDescription className="font-body text-base text-foreground/75 leading-relaxed pt-2">
              You flagged some critical corporate friction earlier today. How are you
              holding up? How did the escalation call or alignment connect turn out?
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              maxLength={4000}
              disabled={busy}
              placeholder="A few honest sentences. Q only uses this to log the day's sentiment."
              className="w-full bg-transparent border border-border focus:border-foreground outline-none px-4 py-3 font-body text-base resize-none disabled:opacity-50"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={busy || !text.trim()}
                className="flex-1 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-[0.3em] hover:bg-accent transition-colors disabled:opacity-40"
              >
                {busy ? "Logging…" : "Log today"}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="py-3 px-5 border border-border font-mono text-xs uppercase tracking-[0.3em] hover:border-foreground transition-colors"
              >
                Not now
              </button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
