import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "csq-theme";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  // Default to the CS Factors midnight-slate aesthetic for the whole site.
  return "dark";
}

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
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

  function applyTheme(next: "light" | "dark") {
    document.documentElement.classList.toggle("dark", next === "dark");
    setTheme(next);
  }

  function toggle() {
    if (animatingRef.current) return;
    const next: "light" | "dark" = isDark ? "light" : "dark";
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const doc = document as DocWithVT;
    if (reduce || typeof doc.startViewTransition !== "function") {
      applyTheme(next);
      return;
    }

    const rect = btnRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth - 40;
    const cy = rect ? rect.top + rect.height / 2 : 40;
    const radius = Math.hypot(
      Math.max(cx, window.innerWidth - cx),
      Math.max(cy, window.innerHeight - cy),
    );

    animatingRef.current = true;
    const root = document.documentElement;
    root.style.setProperty("--theme-x", `${cx}px`);
    root.style.setProperty("--theme-y", `${cy}px`);
    root.style.setProperty("--theme-r", `${radius}px`);

    const transition = doc.startViewTransition!(() => {
      applyTheme(next);
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${cx}px ${cy}px)`,
              `circle(${radius}px at ${cx}px ${cy}px)`,
            ],
          },
          {
            duration: 520,
            easing: "cubic-bezier(0.65, 0, 0.35, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {
        /* unsupported — already applied */
      });

    transition.finished.finally(() => {
      animatingRef.current = false;
    });
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
