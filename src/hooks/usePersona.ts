import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Persona = "csm" | "senior_csm" | "manager" | "director" | "vp" | "recruiter" | "team_lead";

export const PERSONA_OPTIONS: { value: Persona; label: string; group: "operator" | "leader" | "recruiter" }[] = [
  { value: "csm",        label: "CSM / Account Manager",        group: "operator" },
  { value: "senior_csm", label: "Senior CSM / Strategic CSM",   group: "operator" },
  { value: "manager",    label: "Manager — CS",                  group: "operator" },
  { value: "director",   label: "Director — CS",                 group: "leader" },
  { value: "vp",         label: "VP / Head of CS",               group: "leader" },
  { value: "team_lead",  label: "Team Lead (multi-pod)",         group: "leader" },
  { value: "recruiter",  label: "Recruiter / Talent",            group: "recruiter" },
];

export type PersonaGroup = "operator" | "leader" | "recruiter";

export function groupOf(p?: Persona | null): PersonaGroup {
  if (!p) return "operator";
  const found = PERSONA_OPTIONS.find((o) => o.value === p);
  return found?.group ?? "operator";
}

/** Reads the signed-in user's persona from profiles. Defaults to "operator" group when unknown. */
export function usePersona() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["persona", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Persona | null> => {
      const { data } = await supabase
        .from("profiles")
        .select("persona")
        .eq("id", user!.id)
        .maybeSingle();
      return (data?.persona as Persona | null) ?? null;
    },
  });
  const persona = q.data ?? null;
  return {
    persona,
    group: groupOf(persona),
    isRecruiterOrLead: groupOf(persona) === "recruiter" || groupOf(persona) === "leader",
    loading: q.isLoading,
  };
}
