import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

let mockPathname = "/csfactors";
vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { pathname: mockPathname } }),
}));

import { useTour } from "@/hooks/useTour";

beforeEach(() => {
  localStorage.clear();
  mockPathname = "/csfactors";
});

describe("useTour — start / skip lifecycle", () => {
  it("does not activate before start() is called", () => {
    const { result } = renderHook(() => useTour());
    expect(result.current.active).toBe(false);
    expect(result.current.step).toBeNull();
    expect(result.current.hasTour).toBe(true);
  });

  it("start() activates the tour at step 0", () => {
    const { result } = renderHook(() => useTour());
    act(() => result.current.start());
    expect(result.current.active).toBe(true);
    expect(result.current.stepIndex).toBe(0);
    expect(result.current.step?.id).toBe("csf-analytics");
  });

  it("skip() closes the tour and persists the route as completed", () => {
    const { result } = renderHook(() => useTour());
    act(() => result.current.start());
    act(() => result.current.skip());

    expect(result.current.active).toBe(false);
    expect(result.current.step).toBeNull();
    expect(result.current.hasCompleted()).toBe(true);
  });

  it("next() advances and finishing closes the tour", () => {
    const { result } = renderHook(() => useTour());
    act(() => result.current.start());
    const total = result.current.total;
    for (let i = 0; i < total; i++) {
      act(() => result.current.next());
    }
    expect(result.current.active).toBe(false);
    expect(result.current.hasCompleted()).toBe(true);
  });

  it("hasTour is false on a route with no registered steps", () => {
    mockPathname = "/route-without-tour";
    const { result } = renderHook(() => useTour());
    expect(result.current.hasTour).toBe(false);
    act(() => result.current.start());
    expect(result.current.active).toBe(false);
  });
});
