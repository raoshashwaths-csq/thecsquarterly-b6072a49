import { describe, expect, it, vi } from "vitest";
import * as jestDomMatchers from "@testing-library/jest-dom/matchers";
expect.extend(jestDomMatchers);
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, hash, ...rest }: { children: React.ReactNode; to: string; hash?: string } & Record<string, unknown>) => (
    <a href={hash ? `${to}#${hash}` : to} {...rest}>
      {children}
    </a>
  ),
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
    select({ location: { pathname: "/csfactors" } }),
}));

import { MobileNavDrawer } from "./MobileNavDrawer";
import { NAV_GROUPS, STANDALONE_LINKS } from "./csfactorsNav";

describe("MobileNavDrawer grouped navigation", () => {
  function openDrawer() {
    render(<MobileNavDrawer onOpenWorkspace={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation/i }));
  }

  it("renders every desktop NAV_GROUP heading with the same labels", () => {
    openDrawer();
    for (const group of NAV_GROUPS) {
      expect(screen.getByText(group.label)).toBeInTheDocument();
    }
    // Modules section is mobile-mirrored from desktop sidebar
    expect(screen.getByText(/modules/i)).toBeInTheDocument();
  });

  it("includes every link from each NAV_GROUP under its group heading", () => {
    openDrawer();
    for (const group of NAV_GROUPS) {
      const heading = screen.getByText(group.label);
      const container = heading.parentElement as HTMLElement;
      for (const link of group.links) {
        expect(within(container).getByText(link.label)).toBeInTheDocument();
      }
    }
  });

  it("surfaces every STANDALONE_LINK (NRR Benchmarks, Diagnostic, etc.) in Modules", () => {
    openDrawer();
    for (const link of STANDALONE_LINKS) {
      expect(screen.getByText(link.label)).toBeInTheDocument();
    }
  });

  it("exposes the four analytics lenses (NRR Waterfall, Retention Funnel, Stakeholder Radar, Team Leaderboard) on mobile", () => {
    openDrawer();
    expect(screen.getByText(/nrr waterfall/i)).toBeInTheDocument();
    expect(screen.getByText(/retention funnel/i)).toBeInTheDocument();
    expect(screen.getByText(/stakeholder radar/i)).toBeInTheDocument();
    expect(screen.getByText(/team leaderboard/i)).toBeInTheDocument();
  });
});
