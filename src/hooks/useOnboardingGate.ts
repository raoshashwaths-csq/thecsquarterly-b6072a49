import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getOnboardingStatus } from "@/lib/onboarding.functions";

const DISMISS_KEY = "csq-onboarding-dismissed";

/**
 * Opens the onboarding stepper on first authenticated load when the user
 * has not yet completed it. "Finish later" sets a session-scoped flag so it
 * doesn't reopen until the next session.
 */
export function useOnboardingGate() {
  const { user, loading } = useAuth();
  const fetchStatus = useServerFn(getOnboardingStatus);
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["onboarding-status", user?.id],
    queryFn: () => fetchStatus(),
    enabled: !!user && !loading,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!user || !q.data) return;
    if (q.data.onboarded) return;
    if (typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1") return;
    setOpen(true);
  }, [user, q.data]);

  return {
    open,
    close: () => setOpen(false),
    dismiss: () => {
      if (typeof window !== "undefined") sessionStorage.setItem(DISMISS_KEY, "1");
      setOpen(false);
    },
    complete: () => {
      if (typeof window !== "undefined") sessionStorage.removeItem(DISMISS_KEY);
      setOpen(false);
      q.refetch();
    },
    initialPersona: q.data?.profile?.persona ?? null,
  };
}
