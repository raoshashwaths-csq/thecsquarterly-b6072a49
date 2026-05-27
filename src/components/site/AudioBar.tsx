import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Gauge, Headphones } from "lucide-react";

// Best-effort selection of a natural-sounding Indian English voice with sensible fallbacks.
function pickIndianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const inEn = voices.filter((v) => /en[-_]IN/i.test(v.lang));
  const preferredNames = [
    /Rishi/i,        // Apple en-IN
    /Veena/i,        // Apple en-IN
    /Neerja/i,       // Microsoft en-IN
    /Prabhat/i,      // Microsoft en-IN
    /Heera/i,        // Microsoft en-IN
    /Ravi/i,         // Microsoft en-IN
    /Google.*Indian/i,
    /Google.*English.*India/i,
  ];
  for (const re of preferredNames) {
    const v = inEn.find((x) => re.test(x.name)) ?? voices.find((x) => re.test(x.name));
    if (v) return v;
  }
  if (inEn[0]) return inEn[0];
  // Fallback: any "natural"/"neural"/"premium" English voice for less robotic output
  const natural = voices.find((v) =>
    /en[-_]/i.test(v.lang) && /(natural|neural|premium|enhanced|google)/i.test(v.name),
  );
  return natural ?? voices.find((v) => /en[-_]/i.test(v.lang)) ?? null;
}

// Insert micro-pauses and break long sentences for more natural cadence.
function humanize(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/([.!?])\s+/g, "$1  ")   // longer pause at sentence boundaries
    .replace(/([,;:])\s+/g, "$1 ")    // small breath at commas
    .replace(/\s+—\s+/g, " — ")
    .trim();
}

export function AudioBar({ text, title, inline = false }: { text: string; title: string; inline?: boolean }) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(0.95);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [hintDismissed, setHintDismissed] = useState(true);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported(ok);
    if (!ok) return;
    try { setHintDismissed(localStorage.getItem("csq.hint.audio") === "1"); } catch { /* ignore */ }

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      const picked = pickIndianVoice(v);
      if (picked) setVoice(picked);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const dismissHint = () => {
    setHintDismissed(true);
    try { localStorage.setItem("csq.hint.audio", "1"); } catch { /* ignore */ }
  };

  if (!supported) return null;

  const plain = humanize(
    text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[#*_>`]/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1"),
  );

  const buildUtterance = (body: string, r: number) => {
    const u = new SpeechSynthesisUtterance(body);
    u.rate = r;
    u.pitch = 1.02;
    u.volume = 1;
    u.lang = voice?.lang ?? "en-IN";
    if (voice) u.voice = voice;
    u.onend = () => { setPlaying(false); setPaused(false); };
    return u;
  };

  const start = () => {
    window.speechSynthesis.cancel();
    const u = buildUtterance(`${title}. ${plain}`, rate);
    uttRef.current = u;
    window.speechSynthesis.speak(u);
    setPlaying(true);
    setPaused(false);
  };

  const toggle = () => {
    if (!playing) return start();
    if (paused) { window.speechSynthesis.resume(); setPaused(false); }
    else { window.speechSynthesis.pause(); setPaused(true); }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
  };

  const cycleRate = () => {
    const next = rate === 0.95 ? 1.1 : rate === 1.1 ? 1.25 : rate === 1.25 ? 0.85 : 0.95;
    setRate(next);
    if (playing) {
      window.speechSynthesis.cancel();
      const u = buildUtterance(plain, next);
      uttRef.current = u;
      window.speechSynthesis.speak(u);
    }
  };

  const container = inline
    ? "relative my-6 flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
    : "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full border border-border bg-background/95 backdrop-blur px-3 py-2 shadow-xl";

  return (
    <div className={container} onClick={!hintDismissed ? dismissHint : undefined}>
      <Headphones className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground pr-1">
        Listen{voice && /en[-_]IN/i.test(voice.lang) ? " · IN" : ""}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); dismissHint(); toggle(); }}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-accent text-accent-foreground hover:opacity-90"
        aria-label={playing && !paused ? "Pause" : "Play"}
      >
        {playing && !paused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      {playing && (
        <button
          onClick={(e) => { e.stopPropagation(); stop(); }}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted"
          aria-label="Stop"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); cycleRate(); }}
        className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider hover:bg-muted rounded"
      >
        <Gauge className="w-3.5 h-3.5" /> {rate}x
      </button>
      {!hintDismissed && inline && (
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em] text-accent animate-pulse">
          New · tap to narrate
        </span>
      )}
    </div>
  );
}
