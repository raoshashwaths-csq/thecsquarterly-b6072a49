import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeTier } from "@/lib/admin-tiers";

async function assertAdmin(userId: string) {
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
}

export const listTeamsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const [teamsRes, membersRes, seqRes, subsRes] = await Promise.all([
      supabaseAdmin.from("teams").select("id, name, owner_id, created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("team_members").select("team_id, user_id, role"),
      supabaseAdmin.from("reading_sequences").select("team_id"),
      supabaseAdmin.from("subscriptions").select("user_id, tier, designation, status").eq("status", "active"),
    ]);
    const teams = teamsRes.data ?? [];
    const members = membersRes.data ?? [];
    const seqs = seqRes.data ?? [];
    const subs = subsRes.data ?? [];

    const memberCountByTeam = new Map<string, number>();
    members.forEach((m) => memberCountByTeam.set(m.team_id, (memberCountByTeam.get(m.team_id) ?? 0) + 1));
    const seqCountByTeam = new Map<string, number>();
    seqs.forEach((s) => {
      if (s.team_id) seqCountByTeam.set(s.team_id, (seqCountByTeam.get(s.team_id) ?? 0) + 1);
    });
    const ownerSub = new Map<string, { tier: string; designation: string | null }>();
    subs.forEach((s) => ownerSub.set(s.user_id, { tier: s.tier, designation: s.designation ?? null }));

    return teams.map((t) => {
      const s = ownerSub.get(t.owner_id);
      const norm = s ? normalizeTier({ tier: s.tier, designation: s.designation }) : null;
      return {
        id: t.id,
        name: t.name,
        owner_id: t.owner_id,
        created_at: t.created_at,
        member_count: memberCountByTeam.get(t.id) ?? 0,
        sequence_count: seqCountByTeam.get(t.id) ?? 0,
        tier_label: norm?.label ?? "Free",
        tier_designation: norm?.designation ?? null,
      };
    });
  });

export const getTeamDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { teamId: string }) => z.object({ teamId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const [team, members, sequences] = await Promise.all([
      supabaseAdmin.from("teams").select("*").eq("id", data.teamId).maybeSingle(),
      supabaseAdmin.from("team_members").select("user_id, role, joined_at").eq("team_id", data.teamId),
      supabaseAdmin
        .from("reading_sequences")
        .select("id, name, updated_at")
        .eq("team_id", data.teamId)
        .order("updated_at", { ascending: false }),
    ]);
    return {
      team: team.data,
      members: members.data ?? [],
      sequences: sequences.data ?? [],
    };
  });
