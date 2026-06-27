import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getOnboardingStatus } from "@/lib/onboarding.functions";

const DISMISS_KEY = "csq-onboarding-dismissed";
const FO_DISMISS_KEY = "csq-future-operator-dismissed";

export type OnboardingGateMode = "full" | "future-operator";

/**
 * Opens the onboarding stepper on first authenticated load when the user
 * has not yet completed it. "Finish later" sets a session-scoped flag so it
 * doesn't reopen until the next session.
 *
 * Also opens a Future-Operator-only stepper for legacy Practitioner+ users
 * who completed the original 5-step onboarding before the Future Operator
 * step existed and have no future_operator_profile yet.
 */
export function useOnboardingGate() {
  const { user, loading } = useAuth();
  const fetchStatus = useServerFn(getOnboardingStatus);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<OnboardingGateMode>("full");

  const q = useQuery({
    queryKey: ["onboarding-status", user?.id],
    queryFn: () => fetchStatus(),
    enabled: !!user && !loading,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!user || !q.data) return;
    const isClient = typeof window !== "undefined";
    if (!q.data.onboarded) {
      if (isClient && sessionStorage.getItem(DISMISS_KEY) === "1") return;
      setMode("full");
      setOpen(true);
      return;
    }
    if (q.data.needsFutureOperator) {
      if (isClient && sessionStorage.getItem(FO_DISMISS_KEY) === "1") return;
      setMode("future-operator");
      setOpen(true);
    }
  }, [user, q.data]);

  const activeKey = mode === "future-operator" ? FO_DISMISS_KEY : DISMISS_KEY;

  return {
    open,
    mode,
    close: () => setOpen(false),
    dismiss: () => {
      if (typeof window !== "undefined") sessionStorage.setItem(activeKey, "1");
      setOpen(false);
    },
    complete: () => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(DISMISS_KEY);
        sessionStorage.removeItem(FO_DISMISS_KEY);
      }
      setOpen(false);
      q.refetch();
    },
    initialPersona: q.data?.profile?.persona ?? null,
  };
}
