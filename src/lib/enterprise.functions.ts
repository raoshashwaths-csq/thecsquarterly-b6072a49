import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---------- TEAMS ----------
export const listMyTeams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: owned } = await supabase.from("teams").select("*").eq("owner_id", userId);
    const { data: memberRows } = await supabase
      .from("team_members")
      .select("team_id, role, teams(*)")
      .eq("user_id", userId);
    const memberTeams =
      memberRows
        ?.map((r: any) => r.teams ? { ...r.teams, role: r.role } : null)
        .filter(Boolean) ?? [];
    return { owned: owned ?? [], member: memberTeams };
  });

export const createTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string }) => z.object({ name: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: t, error } = await supabase
      .from("teams")
      .insert({ name: data.name, owner_id: userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return t;
  });

export const listTeamMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { teamId: string }) => z.object({ teamId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: members } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", data.teamId);
    return members ?? [];
  });

// ---------- SEQUENCES ----------
export const listMySequences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("reading_sequences")
      .select("*")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false });
    return data ?? [];
  });

export const saveSequence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; name: string; items: any[]; teamId?: string | null }) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(120),
        items: z.array(z.any()).max(100),
        teamId: z.string().uuid().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.id) {
      const { data: row, error } = await supabase
        .from("reading_sequences")
        .update({ name: data.name, items: data.items, team_id: data.teamId ?? null })
        .eq("id", data.id)
        .eq("owner_id", userId)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await supabase
      .from("reading_sequences")
      .insert({
        owner_id: userId,
        name: data.name,
        items: data.items,
        team_id: data.teamId ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- BENCHMARKS ----------
export const listBenchmarks = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("benchmark_drops")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
});

// ---------- DIRECTORY ----------
export const listDirectory = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("directory_profiles")
    .select("id, name, title, company, credentials, bio, headshot_url, verified")
    .eq("verified", true)
    .eq("public", true)
    .order("name", { ascending: true });
  return data ?? [];
});

export const upsertMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    name: string;
    title?: string;
    company?: string;
    credentials?: string[];
    bio?: string;
    public?: boolean;
  }) =>
    z
      .object({
        name: z.string().min(1).max(120),
        title: z.string().max(160).optional(),
        company: z.string().max(160).optional(),
        credentials: z.array(z.string().max(60)).max(20).optional(),
        bio: z.string().max(2000).optional(),
        public: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = {
      user_id: userId,
      name: data.name,
      title: data.title ?? null,
      company: data.company ?? null,
      credentials: data.credentials ?? [],
      bio: data.bio ?? null,
      public: data.public ?? false,
    };
    const { data: row, error } = await supabase
      .from("directory_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
