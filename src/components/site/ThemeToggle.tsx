import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "csq-theme";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Read the resolved background color of the *next* theme by briefly toggling the
// dark class on <html>, sampling, then reverting. CSS vars are defined on :root,
// so a hidden probe with a class won't work — we must flip the real root.
function getThemeBg(next: "light" | "dark"): string {
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  const shouldBeDark = next === "dark";
  if (wasDark !== shouldBeDark) root.classList.toggle("dark", shouldBeDark);
  const bg = getComputedStyle(root).getPropertyValue("--background").trim();
  if (wasDark !== shouldBeDark) root.classList.toggle("dark", wasDark);
  // --background is a raw oklch(...) string. Wrap it back into a valid color.
  if (bg) return bg.startsWith("oklch") || bg.startsWith("#") || bg.startsWith("rgb") ? bg : `oklch(${bg})`;
  return next === "dark" ? "#121212" : "#fbf9f6";
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
    const dx = Math.max(cx, window.innerWidth - cx);
    const dy = Math.max(cy, window.innerHeight - cy);
    const radius = Math.hypot(dx, dy);

    const nextBg = getThemeBg(next);

    const overlay = document.createElement("div");
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:9999",
      "pointer-events:none",
      `background:${nextBg}`,
      `clip-path:circle(0px at ${cx}px ${cy}px)`,
      "will-change:clip-path",
    ].join(";");
    document.body.appendChild(overlay);

    animatingRef.current = true;
    const anim = overlay.animate(
      [
        { clipPath: `circle(0px at ${cx}px ${cy}px)` },
        { clipPath: `circle(${radius}px at ${cx}px ${cy}px)` },
      ],
      { duration: 750, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "forwards" },
    );

    anim.onfinish = () => {
      // Swap theme under the cover, then fade the overlay out.
      apply();
      const fade = overlay.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 220, easing: "ease-out", fill: "forwards" },
      );
      fade.onfinish = () => {
        overlay.remove();
        animatingRef.current = false;
      };
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
