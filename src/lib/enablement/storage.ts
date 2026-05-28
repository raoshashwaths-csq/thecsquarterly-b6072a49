// SSR-safe localStorage wrappers for the enablement layer.
const isBrowser = typeof window !== "undefined";

export function readSet(key: string): Set<string> {
  if (!isBrowser) return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function writeSet(key: string, set: Set<string>) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* noop */
  }
}

export function readFlag(key: string): boolean {
  if (!isBrowser) return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeFlag(key: string, value: boolean) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* noop */
  }
}

export const STORAGE_KEYS = {
  dismissedTips: "enablement.dismissedTips",
  tourCompleted: "enablement.tourCompleted",
  tourSeenSuggestion: "enablement.tourSeenSuggestion",
} as const;
