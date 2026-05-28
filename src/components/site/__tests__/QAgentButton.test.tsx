import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// --- Mocks (declared before importing the component) ---

const tourStart = vi.fn();
const tourSkip = vi.fn();
const tourState = {
  active: false,
  step: null as null | { id: string; target: string; title: string; body: string },
  stepIndex: 0,
  total: 0,
  hasTour: true,
  start: tourStart,
  next: vi.fn(),
  skip: tourSkip,
  hasCompleted: () => false,
};

vi.mock("@/hooks/useTour", () => ({
  useTour: () => tourState,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock("@/hooks/useElevenLabsSpeechInput", () => ({
  useElevenLabsSpeechInput: () => ({
    supported: false,
    recording: false,
    transcribing: false,
    error: null,
    toggle: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { pathname: "/" } }),
  Link: ({ children, ...rest }: { children: React.ReactNode } & Record<string, unknown>) => {
    const { to, ...domProps } = rest as { to?: string } & Record<string, unknown>;
    return (
      <a href={typeof to === "string" ? to : "#"} {...(domProps as Record<string, unknown>)}>
        {children}
      </a>
    );
  },
}));

vi.mock("@tanstack/react-start", () => ({
  useServerFn: () => vi.fn().mockResolvedValue({ reply: "", hits: [] }),
}));

vi.mock("@tanstack/react-query", () => ({
const stableServerFn = vi.fn().mockResolvedValue({ reply: "", hits: [] });
vi.mock("@tanstack/react-start", () => ({
  useServerFn: () => stableServerFn,
}));
vi.mock("@/lib/q-agent.functions", () => ({
  askQ: vi.fn(),
  getQEntitlement: vi.fn(),
}));
vi.mock("@/lib/q-usage.functions", () => ({ getMonthlyQUsage: vi.fn() }));
vi.mock("@/lib/discovery.functions", () => ({ globalSearch: vi.fn() }));

vi.mock("@/components/enablement/RouteTipsList", () => ({
  RouteTipsList: () => <div data-testid="route-tips-list">Route tips content</div>,
}));

vi.mock("@/components/enablement/FeatureGlossary", () => ({
  FeatureGlossary: () => <div data-testid="feature-glossary">Glossary content</div>,
}));

vi.mock("@/components/enablement/PlaybookTour", () => ({
  PlaybookTour: () => <div data-testid="playbook-tour">tour overlay</div>,
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() } }));

// Import after mocks are set up.
import { QAgentButton } from "@/components/site/QAgentButton";

async function openDrawer() {
  const user = userEvent.setup();
  render(<QAgentButton />);
  await user.click(screen.getByRole("button", { name: /meet q/i }));
  // The dialog renders into a portal; find it by role.
  const dialog = await screen.findByRole("dialog");
  return { user, dialog };
}

beforeEach(() => {
  tourStart.mockClear();
  tourSkip.mockClear();
  tourState.hasTour = true;
  tourState.active = false;
});

describe("Q drawer — panel switching & tour", () => {
  it("opens on the chat view by default (Suggested Vectors visible)", async () => {
    const { dialog } = await openDrawer();
    expect(within(dialog).getByText(/suggested vectors/i)).toBeInTheDocument();
    expect(within(dialog).queryByTestId("route-tips-list")).not.toBeInTheDocument();
    expect(within(dialog).queryByTestId("feature-glossary")).not.toBeInTheDocument();
  });

  it("switches to Quick Tips, replacing the Suggested Vectors area", async () => {
    const { user, dialog } = await openDrawer();
    await user.click(within(dialog).getByRole("button", { name: /quick tips/i }));

    expect(within(dialog).getByTestId("route-tips-list")).toBeInTheDocument();
    expect(within(dialog).queryByText(/suggested vectors/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByTestId("feature-glossary")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /quick tips/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("switches from Quick Tips to Glossary, never showing both at once", async () => {
    const { user, dialog } = await openDrawer();
    await user.click(within(dialog).getByRole("button", { name: /quick tips/i }));
    await user.click(within(dialog).getByRole("button", { name: /glossary/i }));

    expect(within(dialog).getByTestId("feature-glossary")).toBeInTheDocument();
    expect(within(dialog).queryByTestId("route-tips-list")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /glossary/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(dialog).getByRole("button", { name: /quick tips/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("returns to the chat view when the active panel button is toggled off", async () => {
    const { user, dialog } = await openDrawer();
    const tipsBtn = within(dialog).getByRole("button", { name: /quick tips/i });

    await user.click(tipsBtn);
    expect(within(dialog).getByTestId("route-tips-list")).toBeInTheDocument();

    await user.click(tipsBtn);
    expect(within(dialog).queryByTestId("route-tips-list")).not.toBeInTheDocument();
    expect(within(dialog).getByText(/suggested vectors/i)).toBeInTheDocument();
    expect(tipsBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking 'Tour page' starts the tour and closes the drawer", async () => {
    const { user, dialog } = await openDrawer();
    await user.click(within(dialog).getByRole("button", { name: /tour page/i }));

    expect(tourStart).toHaveBeenCalledTimes(1);
    // Sheet should unmount the dialog after close.
    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("disables the tour button and does not call start() when no tour exists", async () => {
    tourState.hasTour = false;
    const { user, dialog } = await openDrawer();
    const noTourBtn = within(dialog).getByRole("button", { name: /no tour/i });

    expect(noTourBtn).toBeDisabled();
    await user.click(noTourBtn);
    expect(tourStart).not.toHaveBeenCalled();
    // Drawer remains open.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
