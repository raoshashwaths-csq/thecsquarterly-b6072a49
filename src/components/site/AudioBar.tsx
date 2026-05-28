import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Gauge, Headphones } from "lucide-react";

// Acronyms most TTS voices mispronounce. Force letter-by-letter or a phonetic form.
const ACRONYM_MAP: Record<string, string> = {
  SaaS: "sass",
  AI: "A.I.",
  CS: "C.S.",
  CSM: "C.S.M.",
  NRR: "N.R.R.",
  GRR: "G.R.R.",
  ARR: "A.R.R.",
  MRR: "M.R.R.",
  QBR: "Q.B.R.",
  KPI: "K.P.I.",
  ROI: "R.O.I.",
  LLM: "L.L.M.",
  API: "A.P.I.",
  VP: "V.P.",
  CRM: "C.R.M.",
  SLA: "S.L.A.",
  TAM: "T.A.M.",
  ICP: "I.C.P.",
  PLG: "P.L.G.",
};

function pickIndianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const inEn = voices.filter((v) => /en[-_]IN/i.test(v.lang));
  const preferred = [
    /Rishi/i, /Veena/i, /Neerja/i, /Prabhat/i, /Heera/i, /Ravi/i,
    /Google.*Indian/i, /Google.*English.*India/i,
  ];
  for (const re of preferred) {
    const v = inEn.find((x) => re.test(x.name)) ?? voices.find((x) => re.test(x.name));
    if (v) return v;
  }
  if (inEn[0]) return inEn[0];
  const natural = voices.find(
    (v) => /en[-_]/i.test(v.lang) && /(natural|neural|premium|enhanced|google)/i.test(v.name),
  );
  return natural ?? voices.find((v) => /en[-_]/i.test(v.lang)) ?? null;
}

function expandAcronyms(text: string): string {
  return text.replace(/\b([A-Z]{2,5}|SaaS)\b/g, (m) => ACRONYM_MAP[m] ?? m);
}

function humanize(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/([.!?])\s+/g, "$1  ")
    .replace(/([,;:])\s+/g, "$1 ")
    .replace(/\s+—\s+/g, " — ")
    .trim();
}

function stripMarkdown(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*_>`]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1");
}

export function buildSpeechText(body: string, title?: string): string {
  const head = title ? `${title}. ` : "";
  return humanize(expandAcronyms(head + stripMarkdown(body)));
}

function formatTime(s: number): string {
  if (!isFinite(s) || s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function AudioBar({
  text,
  title,
  inline = false,
  onProgress,
}: {
  text: string;
  title: string;
  inline?: boolean;
  onProgress?: (ratio: number) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(0.95);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [hintDismissed, setHintDismissed] = useState(true);
  const [charIndex, setCharIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState("");
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const spoken = buildSpeechText(text, title);
  const total = spoken.length;
  const estDuration = (total / (14 * rate)) || 1;

  useEffect(() => {
    const ok = typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported(ok);
    if (!ok) return;
    try { setHintDismissed(localStorage.getItem("csq.hint.audio") === "1"); } catch { /* */ }

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
    try { localStorage.setItem("csq.hint.audio", "1"); } catch { /* */ }
  };

  if (!supported) return null;

  const emit = (idx: number) => {
    const r = total ? Math.min(1, Math.max(0, idx / total)) : 0;
    onProgressRef.current?.(r);
  };

  const buildUtterance = (body: string, r: number) => {
    const u = new SpeechSynthesisUtterance(body);
    u.rate = r;
    u.pitch = 1.02;
    u.volume = 1;
    u.lang = voice?.lang ?? "en-IN";
    if (voice) u.voice = voice;
    u.onboundary = (e) => {
      if (e.name && e.name !== "word") return;
      // Drive highlight ratio directly from the synthesizer's reported char
      // index. No RAF interpolation — that was the drift source.
      setCharIndex(e.charIndex);
      emit(e.charIndex);
      const slice = body.slice(e.charIndex, e.charIndex + 60);
      const word = slice.match(/^\W*([\w'-]+)/)?.[1] ?? "";
      setCurrentWord(word);
    };
    u.onend = () => {
      setPlaying(false);
      setPaused(false);
      setCharIndex(total);
      onProgressRef.current?.(1);
    };
    return u;
  };

  const start = () => {
    window.speechSynthesis.cancel();
    const u = buildUtterance(spoken, rate);
    uttRef.current = u;
    setCharIndex(0);
    emit(0);
    window.speechSynthesis.speak(u);
    setPlaying(true);
    setPaused(false);
  };

  const toggle = () => {
    if (!playing) return start();
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
    setCharIndex(0);
    onProgressRef.current?.(0);
  };

  const cycleRate = () => {
    const next = rate === 0.95 ? 1.1 : rate === 1.1 ? 1.25 : rate === 1.25 ? 0.85 : 0.95;
    setRate(next);
    if (playing) {
      window.speechSynthesis.cancel();
      const u = buildUtterance(spoken, next);
      uttRef.current = u;
      window.speechSynthesis.speak(u);
    }
  };

  const ratio = total ? Math.min(1, charIndex / total) : 0;
  const elapsed = ratio * estDuration;

  const container = inline
    ? "relative my-6 rounded-md border border-border bg-muted/30 px-3 py-2.5"
    : "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-2xl border border-border bg-background/95 backdrop-blur px-3 py-2.5 shadow-xl w-[min(92vw,640px)]";

  return (
    <div className={container} onClick={!hintDismissed ? dismissHint : undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <Headphones className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground pr-1">
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
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-mono uppercase tracking-wider hover:bg-muted rounded"
          aria-label="Change playback speed"
        >
          <Gauge className="w-3.5 h-3.5" /> {rate}x
        </button>
        <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
          {formatTime(elapsed)} / {formatTime(estDuration)}
        </span>
      </div>

      <div className="mt-2 h-1 w-full bg-border/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-[width] duration-150 ease-linear"
          style={{ width: `${(ratio * 100).toFixed(2)}%` }}
        />
      </div>

      {playing && currentWord && (
        <div className="mt-1.5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground truncate">
          Now reading · <span className="text-accent">{currentWord}</span>
        </div>
      )}

      {!hintDismissed && inline && !playing && (
        <div className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-accent animate-pulse">
          New · tap play to narrate this dispatch
        </div>
      )}
    </div>
  );
}
