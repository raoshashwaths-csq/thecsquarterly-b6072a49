import { useCallback, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { readSet, writeSet, STORAGE_KEYS } from "@/lib/enablement/storage";

export type TourStep = {
  id: string;
  target: string; // data-tour attribute value (falls back to centered modal if missing)
  title: string;
  body: string;
};

// Route-keyed tour registry. Longest-prefix match wins.
const TOUR_STEPS_BY_ROUTE: Record<string, TourStep[]> = {
  "/csfactors/": [
    {
      id: "drill-stakeholder",
      target: "stakeholder-map",
      title: "Stakeholder map",
      body: "Map champions, blockers and the economic buyer before any QBR. Gaps here are your earliest churn signal.",
    },
    {
      id: "drill-vault",
      target: "contract-vault",
      title: "Contract vault",
      body: "Renewal date, auto-renew clause and price hold live here. Pull them into your next 1:1.",
    },
    {
      id: "drill-back",
      target: "back-to-command",
      title: "Back to the Command Centre",
      body: "Jump back to your portfolio view anytime — your filter and Q context are preserved.",
    },
  ],
  "/csfactors": [
    {
      id: "csf-analytics",
      target: "analytics-dropdown",
      title: "Analytics",
      body: "Slice NRR, GRR, stakeholder coverage and renewals across cohorts.",
    },
    {
      id: "csf-standalone",
      target: "standalone-modules",
      title: "Standalone modules",
      body: "ROI Calculator, NRR Benchmarks and the AI Readiness diagnostic — focused views when you need them.",
    },
    {
      id: "csf-burning",
      target: "burning-three",
      title: "The Burning Three",
      body: "Never carry more than three burning accounts into a week. Promote, defuse or hand off — the queue must clear.",
    },
    {
      id: "csf-ask-q",
      target: "ask-q",
      title: "Ask Q",
      body: 'Try "Show me accounts with NRR < 90% and no QBR in 60 days." Q understands your portfolio.',
    },
  ],
  "/calculator": [
    {
      id: "calc-inputs",
      target: "calc-inputs",
      title: "Inputs",
      body: "Start with starting ARR, expansion and contraction. The model recomputes inline.",
    },
    {
      id: "calc-analytics",
      target: "calc-analytics",
      title: "Analytics package",
      body: "NRR, GRR, payback and the 36-month projection — read top-down for the board narrative.",
    },
    {
      id: "calc-scenarios",
      target: "calc-scenarios",
      title: "Scenarios",
      body: "Toggle the contraction floor: hold expansion at 0% and drop GRR by 5 points. That's your worst credible case.",
    },
  ],
  "/benchmarks": [
    {
      id: "bench-cohort",
      target: "bench-cohort",
      title: "Pick your cohort",
      body: "Filter by ACV band and motion (PLG vs sales-led). The global median is noise — your cohort is the line that matters.",
    },
    {
      id: "bench-chart",
      target: "bench-chart",
      title: "NRR distribution",
      body: "Where you sit in the cohort tells you whether you have a retention problem or a positioning problem.",
    },
  ],
  "/ai-readiness": [
    {
      id: "ai-band",
      target: "ai-band",
      title: "Your band",
      body: "Treat the score as a band, not a number. Reactive → Operational → Predictive — each step is one to two quarters.",
    },
    {
      id: "ai-survey",
      target: "ai-survey",
      title: "Run the survey",
      body: "Eleven dimensions, 44 metrics. Ten minutes for a band you can defend to your CRO.",
    },
  ],
  "/retention-protocol": [
    {
      id: "rp-playbooks",
      target: "rp-playbooks",
      title: "Pick one playbook",
      body: "Run one playbook end-to-end this quarter. Half-running five is how teams convince themselves they're operating systematically.",
    },
  ],
  "/": [
    {
      id: "home-workspace",
      target: "workspace-icon",
      title: "Your Workspace",
      body: "Private surface for notes, drafts and account context. Q reads from it when answering.",
    },
    {
      id: "home-csf-box",
      target: "csf-box",
      title: "The CSF Command Centre",
      body: "The executive read of your portfolio in one glance. It's the homepage on purpose.",
    },
  ],
};

function stepsForPath(pathname: string): { key: string; steps: TourStep[] } {
  const keys = Object.keys(TOUR_STEPS_BY_ROUTE).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (key === "/" ? pathname === "/" : pathname === key || pathname.startsWith(key + "/") || pathname.startsWith(key)) {
      return { key, steps: TOUR_STEPS_BY_ROUTE[key] };
    }
  }
  return { key: "", steps: [] };
}

export function useTour() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const { key, steps } = useMemo(() => stepsForPath(pathname), [pathname]);
  const hasTour = steps.length > 0;
  const step = active && hasTour ? steps[stepIndex] : null;

  const start = useCallback(() => {
    if (!hasTour) return;
    setStepIndex(0);
    setActive(true);
  }, [hasTour]);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i + 1 >= steps.length) {
        setActive(false);
        if (key) {
          const done = readSet(STORAGE_KEYS.tourCompleted);
          done.add(key);
          writeSet(STORAGE_KEYS.tourCompleted, done);
        }
        return 0;
      }
      return i + 1;
    });
  }, [steps.length, key]);

  const skip = useCallback(() => {
    setActive(false);
    if (key) {
      const done = readSet(STORAGE_KEYS.tourCompleted);
      done.add(key);
      writeSet(STORAGE_KEYS.tourCompleted, done);
    }
  }, [key]);

  return {
    active,
    step,
    stepIndex,
    total: steps.length,
    hasTour,
    start,
    next,
    skip,
    hasCompleted: () => readSet(STORAGE_KEYS.tourCompleted).has(key),
  };
}
