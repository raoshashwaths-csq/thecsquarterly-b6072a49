import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

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
// @ts-expect-error jsdom polyfill
globalThis.ResizeObserver = globalThis.ResizeObserver ?? RO;
// @ts-expect-error jsdom polyfill
globalThis.IntersectionObserver = globalThis.IntersectionObserver ?? RO;

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
if (!Element.prototype.hasPointerCapture) {
  // @ts-expect-error jsdom missing
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.scrollTo) {
  // @ts-expect-error jsdom missing
  Element.prototype.scrollTo = () => {};
}
