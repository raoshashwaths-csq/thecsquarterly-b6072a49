import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "csq-theme";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Resolve the *next* theme's --background as a computed rgb() string.
// We briefly flip the dark class on <html>, paint a hidden probe with
// background:var(--background), then read its computed backgroundColor —
// which the browser normalizes to rgb()/rgba(), safe for SVG fill.
function getThemeBgRgb(next: "light" | "dark"): string {
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  const shouldBeDark = next === "dark";
  if (wasDark !== shouldBeDark) root.classList.toggle("dark", shouldBeDark);

  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;background:var(--background)";
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).backgroundColor;
  probe.remove();

  if (wasDark !== shouldBeDark) root.classList.toggle("dark", wasDark);
  return rgb || (next === "dark" ? "rgb(18,18,18)" : "rgb(251,249,246)");
}

// Inject a style tag that disables transitions on color/background tokens
// during the reveal so the page doesn't cross-fade under the mask.
function suppressGlobalTransitions(): () => void {
  const style = document.createElement("style");
  style.setAttribute("data-theme-suppress", "");
  style.textContent =
    "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(style);
  return () => {
    requestAnimationFrame(() => style.remove());
  };
}

const EASE = (t: number) => {
  // cubic-bezier(0.65, 0, 0.35, 1) approximated via the standard
  // ease-in-out cubic formula. Matches the requested luxury feel.
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const animatingRef = useRef(false);

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const isDark = theme === "dark";

  function toggle() {
    if (animatingRef.current) return;
    const next: "light" | "dark" = isDark ? "light" : "dark";
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const apply = () => {
      document.documentElement.classList.toggle("dark", next === "dark");
      setTheme(next);
    };

    if (reduce) {
      apply();
      return;
    }

    const rect = btnRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth - 40;
    const cy = rect ? rect.top + rect.height / 2 : 40;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dx = Math.max(cx, vw - cx);
    const dy = Math.max(cy, vh - cy);
    // Pad to account for the displacement spill, so the mask fully covers
    // the viewport even after the turbulence pushes the edge inward.
    const radius = Math.hypot(dx, dy) * 1.25 + 200;
    const nextBg = getThemeBgRgb(next);

    const fid = `csq-ink-${Math.random().toString(36).slice(2, 8)}`;
    const seed = Math.floor(Math.random() * 1000);

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", String(vw));
    svg.setAttribute("height", String(vh));
    svg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      "width:100vw",
      "height:100vh",
      "z-index:2147483647",
      "pointer-events:none",
      "will-change:transform",
      "contain:strict",
    ].join(";");

    svg.innerHTML = `
      <defs>
        <filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.014" numOctaves="2" seed="${seed}" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="180" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      <circle cx="${cx}" cy="${cy}" r="0" fill="${nextBg}" filter="url(#${fid})"></circle>
    `;

    document.body.appendChild(svg);
    const circle = svg.querySelector("circle") as SVGCircleElement;

    const restoreTransitions = suppressGlobalTransitions();
    animatingRef.current = true;

    const duration = 350;
    const start = performance.now();
    let swapped = false;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = EASE(t);
      circle.setAttribute("r", String(eased * radius));

      // Swap the actual theme once the ink front has clearly passed
      // every pixel of the viewport. ~60% covers safely with displacement.
      if (!swapped && t >= 0.6) {
        swapped = true;
        apply();
      }

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        if (!swapped) apply();
        svg.remove();
        restoreTransitions();
        animatingRef.current = false;
      }
    };

    requestAnimationFrame(tick);
  }

  return (
    <button
      ref={btnRef}
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full border border-border hover:border-accent hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {isDark ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
