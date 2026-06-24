import { useCallback, useEffect, useRef, useState } from "react";

const KEY = "csq.article.progress.v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type ArticleProgressEntry = {
  pct: number;
  updatedAt: string;
  title: string;
};

type Store = Record<string, ArticleProgressEntry>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    const now = Date.now();
    const fresh: Store = {};
    for (const [slug, entry] of Object.entries(parsed)) {
      if (!entry?.updatedAt) continue;
      if (now - new Date(entry.updatedAt).getTime() < TTL_MS) fresh[slug] = entry;
    }
    return fresh;
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch { /* quota */ }
}

export function readAllArticleProgress(): Store {
  return readStore();
}

export function clearArticleProgress(slug: string) {
  const store = readStore();
  if (slug in store) {
    delete store[slug];
    writeStore(store);
  }
}

/** Tracks scroll progress through the `<article>` ancestor and persists 15–95%. */
export function useArticleProgress(slug: string, title: string) {
  const [savedEntry] = useState<ArticleProgressEntry | null>(() => readStore()[slug] ?? null);
  const lastWriteRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      const now = Date.now();
      if (now - lastWriteRef.current < 250) return;
      lastWriteRef.current = now;
      const article = document.querySelector("article");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const viewport = window.innerHeight;
      const total = rect.height - viewport;
      if (total <= 0) return;
      const scrolled = Math.max(0, Math.min(total, -rect.top));
      const pct = Math.round((scrolled / total) * 100);
      const store = readStore();
      if (pct < 15 || pct >= 95) {
        if (slug in store) {
          delete store[slug];
          writeStore(store);
        }
        return;
      }
      store[slug] = { pct, updatedAt: new Date().toISOString(), title };
      writeStore(store);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug, title]);

  const resumeTo = useCallback((pct: number) => {
    if (typeof window === "undefined") return;
    const article = document.querySelector("article");
    if (!article) return;
    const rect = article.getBoundingClientRect();
    const viewport = window.innerHeight;
    const total = rect.height - viewport;
    if (total <= 0) return;
    const articleTop = rect.top + window.scrollY;
    const target = articleTop + (pct / 100) * total;
    window.scrollTo({ top: target, behavior: "smooth" });
  }, []);

  return { savedEntry, resumeTo };
}
