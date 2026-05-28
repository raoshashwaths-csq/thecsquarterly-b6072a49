import { useCallback, useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { readFlag, writeFlag, STORAGE_KEYS } from "@/lib/enablement/storage";

export type TourStep = {
  id: string;
  target: string; // data-tour attribute value
  route: string;
  title: string;
  body: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "workspace-icon",
    target: "workspace-icon",
    route: "/",
    title: "Your Workspace",
    body: "Your private surface for notes, drafts and account context. Q reads from it when answering.",
  },
  {
    id: "csf-box",
    target: "csf-box",
    route: "/",
    title: "The CSF Box",
    body: "The executive read of your portfolio in one glance. It's the homepage on purpose.",
  },
  {
    id: "analytics-dropdown",
    target: "analytics-dropdown",
    route: "/csfactors",
    title: "Analytics",
    body: "Slice NRR, GRR, stakeholder coverage and renewals across cohorts.",
  },
  {
    id: "standalone-modules",
    target: "standalone-modules",
    route: "/csfactors",
    title: "Standalone modules",
    body: "ROI Calculator, NRR Benchmarks and the AI Readiness diagnostic — pull them in when you need a focused view.",
  },
  {
    id: "ask-q",
    target: "ask-q",
    route: "/csfactors",
    title: "Ask Q",
    body: "Type plain-English questions about your portfolio. Q handles the routing.",
  },
];

export function useTour() {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const step = active ? TOUR_STEPS[stepIndex] : null;

  // Navigate to the step's route if we're not on it.
  useEffect(() => {
    if (!active || !step) return;
    if (pathname !== step.route) {
      navigate({ to: step.route });
    }
  }, [active, step, pathname, navigate]);

  const start = useCallback(() => {
    setStepIndex(0);
    setActive(true);
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i + 1 >= TOUR_STEPS.length) {
        setActive(false);
        writeFlag(STORAGE_KEYS.tourCompleted, true);
        return 0;
      }
      return i + 1;
    });
  }, []);

  const skip = useCallback(() => {
    setActive(false);
    writeFlag(STORAGE_KEYS.tourCompleted, true);
  }, []);

  return {
    active,
    step,
    stepIndex,
    total: TOUR_STEPS.length,
    start,
    next,
    skip,
    hasCompleted: () => readFlag(STORAGE_KEYS.tourCompleted),
  };
}
