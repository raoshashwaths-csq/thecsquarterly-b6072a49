import { describe, expect, it, vi } from "vitest";
import * as jestDomMatchers from "@testing-library/jest-dom/matchers";
expect.extend(jestDomMatchers);
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
    select({ location: { hash: "" } }),
}));

import { PulseDashboard } from "./PulseDashboard";

function renderPulse() {
  return render(<PulseDashboard accounts={[]} firstName="Avery" onRowClick={vi.fn()} />);
}

describe("PulseDashboard responsive views", () => {
  it("renders account ledger in both mobile card and desktop table structures", () => {
    renderPulse();
    fireEvent.click(screen.getByRole("button", { name: /accounts/i }));

    const ledger = screen.getByTestId("accounts-ledger");
    expect(within(ledger).getByRole("table")).toBeInTheDocument();
    expect(within(ledger).getAllByRole("button", { name: /northbridge global/i })[0]).toBeInTheDocument();
  });

  it("renders the renewals timeline with lifecycle stages and uplift estimates", () => {
    renderPulse();
    fireEvent.click(screen.getByRole("button", { name: /renewals/i }));

    expect(screen.getByText(/contract lifecycle timeline/i)).toBeInTheDocument();
    expect(screen.getByText(/next 180 days/i)).toBeInTheDocument();
    expect(screen.getAllByText(/mutual plan|escalate|commercial align|monitor/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/uplift/i).length).toBeGreaterThan(0);
  });

  it("supports 360 trend graph metric and time-range interactions", () => {
    renderPulse();
    fireEvent.click(screen.getByRole("button", { name: /360 dashboard/i }));

    expect(screen.getByTestId("trend-graph")).toBeInTheDocument();
    expect(screen.getByText(/interactive trend graph/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "180D" }));
    fireEvent.click(screen.getByRole("button", { name: /NRR115%/i }));

    expect(screen.getByLabelText(/nrr trend graph/i)).toBeInTheDocument();
    expect(screen.getAllByText(/115%/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Dec/i)).toBeInTheDocument();
  });
});