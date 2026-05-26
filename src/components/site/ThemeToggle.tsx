import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "csq-theme";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Resolve the *next* theme's background by briefly flipping the root class.
function getThemeBg(next: "light" | "dark"): string {
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  const shouldBeDark = next === "dark";
  if (wasDark !== shouldBeDark) root.classList.toggle("dark", shouldBeDark);
  const bg = getComputedStyle(root).getPropertyValue("--background").trim();
  if (wasDark !== shouldBeDark) root.classList.toggle("dark", wasDark);
  if (bg) return bg.startsWith("oklch") || bg.startsWith("#") || bg.startsWith("rgb") ? bg : `oklch(${bg})`;
  return next === "dark" ? "#121212" : "#fbf9f6";
}

// Disable any global CSS transitions on color/background tokens during the
// reveal so the underlying page doesn't cross-fade and fight the mask.
function suppressGlobalTransitions(): () => void {
  const style = document.createElement("style");
  style.setAttribute("data-theme-suppress", "");
  style.textContent =
    "*,*::before,*::after{transition:none!important;animation-duration:0s!important}";
  document.head.appendChild(style);
  return () => {
    requestAnimationFrame(() => style.remove());
  };
}

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
    // Pad for organic displacement spill.
    const radius = Math.hypot(dx, dy) * 1.15 + 120;
    const nextBg = getThemeBg(next);

    // Stable, namespace-safe id per invocation.
    const fid = `csq-ink-${Math.random().toString(36).slice(2, 8)}`;

    // SVG overlay: a single filled circle with a turbulence + displacement
    // filter so the expanding edge reads as an organic ink/fabric front,
    // not a geometric ring. The whole svg is GPU-composited via will-change.
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", String(vw));
    svg.setAttribute("height", String(vh));
    svg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:9999",
      "pointer-events:none",
      "will-change:transform,opacity",
      "contain:strict",
    ].join(";");

    svg.innerHTML = `
      <defs>
        <filter id="${fid}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="${Math.floor(Math.random() * 100)}" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="140" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      <circle cx="${cx}" cy="${cy}" r="0" fill="${nextBg}" filter="url(#${fid})"></circle>
    `;

    document.body.appendChild(svg);
    const circle = svg.querySelector("circle") as SVGCircleElement;

    const restoreTransitions = suppressGlobalTransitions();
    animatingRef.current = true;

    const anim = circle.animate(
      [{ r: "0" }, { r: String(radius) }],
      {
        duration: 350,
        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
        fill: "forwards",
      },
    );

    // Apply the theme just before the mask fully covers the viewport so the
    // swap happens under cover. With duration=350ms, swap at ~55% (when the
    // ink front has already passed every pixel after displacement).
    const swapAt = window.setTimeout(apply, 200);

    anim.onfinish = () => {
      window.clearTimeout(swapAt);
      // Ensure theme is applied (in case onfinish fires before the timeout).
      document.documentElement.classList.toggle("dark", next === "dark");
      setTheme(next);
      svg.remove();
      restoreTransitions();
      animatingRef.current = false;
    };
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
