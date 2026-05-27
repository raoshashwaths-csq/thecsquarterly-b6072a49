import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Gauge } from "lucide-react";

export function AudioBar({ text, title }: { text: string; title: string }) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported) return null;

  const plain = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*_>`]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  const start = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${title}. ${plain}`);
    u.rate = rate;
    u.pitch = 1;
    u.onend = () => {
      setPlaying(false);
      setPaused(false);
    };
    uttRef.current = u;
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
  };

  const cycleRate = () => {
    const next = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : rate === 1.5 ? 0.85 : 1;
    setRate(next);
    if (playing && uttRef.current) {
      // Web Speech can't change mid-utterance reliably; restart at new rate.
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(plain);
      u.rate = next;
      u.onend = () => {
        setPlaying(false);
        setPaused(false);
      };
      uttRef.current = u;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full border border-border bg-background/95 backdrop-blur px-3 py-2 shadow-xl">
      <button
        onClick={toggle}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-accent text-accent-foreground hover:opacity-90"
        aria-label={playing && !paused ? "Pause" : "Play"}
      >
        {playing && !paused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      {playing && (
        <button
          onClick={stop}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted"
          aria-label="Stop"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        onClick={cycleRate}
        className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider hover:bg-muted rounded"
      >
        <Gauge className="w-3.5 h-3.5" /> {rate}x
      </button>
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground pr-2 hidden sm:inline">
        Narration
      </span>
    </div>
  );
}
