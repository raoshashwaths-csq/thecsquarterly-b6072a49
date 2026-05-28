import { afterEach, expect, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

// Radix UI requires these on jsdom.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList;
}

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
const g = globalThis as unknown as Record<string, unknown>;
g.ResizeObserver = g.ResizeObserver ?? RO;
g.IntersectionObserver = g.IntersectionObserver ?? RO;

const ep = Element.prototype as unknown as Record<string, unknown>;
if (!ep.scrollIntoView) ep.scrollIntoView = vi.fn();
if (!ep.hasPointerCapture) ep.hasPointerCapture = () => false;
if (!ep.scrollTo) ep.scrollTo = () => {};
