import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRequestHeader } from "@tanstack/react-start/server";

// ---------- helpers ----------
async function assertAdmin(userId: string) {
  const { data: roles } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId);
  if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
}

async function actorEmail(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles").select("email").eq("id", userId).maybeSingle();
  return data?.email ?? null;
}

async function logAudit(args: {
  actor_id: string;
  action: string;
  target_table?: string | null;
  target_id?: string | null;
  details?: Record<string, unknown>;
}) {
  try {
    const email = await actorEmail(args.actor_id);
    const ip = getRequestHeader("x-forwarded-for") ?? getRequestHeader("cf-connecting-ip") ?? null;
    const ua = getRequestHeader("user-agent") ?? null;
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: args.actor_id,
      actor_email: email,
      action: args.action,
      target_table: args.target_table ?? null,
      target_id: args.target_id ?? null,
      details: args.details ?? {},
      ip,
      user_agent: ua,
    });
  } catch (e) {
    console.error("[audit] log failed", e);
  }
}

// ---------- CSV serializer ----------
function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Array.from(
    rows.reduce<Set<string>>((s, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set())
  );
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    if (typeof v === "object") return esc(JSON.stringify(v));
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

const DATASETS = [
  "posts", "playbooks", "subscribers", "subscriptions", "purchases",
  "survey_responses", "q_runs", "admin_audit_log", "profiles", "user_roles",
  "email_send_log",
] as const;
type Dataset = typeof DATASETS[number];

// ---------- Export ----------
export const exportDataset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ dataset: z.enum(DATASETS) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const ds = data.dataset as Dataset;
    const { data: rows, error } = await supabaseAdmin
      .from(ds).select("*").limit(10000);
    if (error) throw new Error(error.message);
    const csv = toCSV((rows ?? []) as Record<string, unknown>[]);
    await logAudit({
      actor_id: context.userId,
      action: "export.csv",
      target_table: ds,
      details: { rows: rows?.length ?? 0 },
    });
    return { csv, count: rows?.length ?? 0, dataset: ds };
  });

// ---------- Import articles ----------
const ImportPostSchema = z.object({
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(1).max(300),
  subtitle: z.string().trim().max(500).optional().nullable(),
  excerpt: z.string().trim().min(1).max(800),
  body: z.string().trim().min(1).max(120000),
  title_mckinsey: z.string().trim().max(300).optional().nullable(),
  body_mckinsey: z.string().trim().max(120000).optional().nullable(),
  title_wodehouse: z.string().trim().max(300).optional().nullable(),
  body_wodehouse: z.string().trim().max(120000).optional().nullable(),
  category: z.string().trim().min(1).max(80).default("Vanguard"),
  section: z.enum(["vanguard", "retention-protocol", "outcome-forum", "codex"]).default("vanguard"),
  author: z.string().trim().min(1).max(120).default("The Editors"),
  read_minutes: z.coerce.number().int().min(1).max(120).default(7),
  tier: z.enum(["free", "premium"]).default("free"),
  published: z.coerce.boolean().default(true),
  published_at: z.string().trim().max(40).optional().nullable(),
  cover_image_url: z.string().trim().max(500).optional().nullable(),
  series_slug: z.string().trim().max(80).optional().nullable(),
  series_title: z.string().trim().max(200).optional().nullable(),
  series_part: z.coerce.number().int().min(1).max(99).optional().nullable(),
  series_total: z.coerce.number().int().min(1).max(99).optional().nullable(),
  sources: z.string().trim().max(8000).optional().nullable(),
});

export const importArticles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      articles: z.array(z.record(z.string(), z.any())).min(1).max(500),
      mode: z.enum(["upsert", "skip-existing"]).default("upsert"),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const results: { slug: string; status: "ok" | "skipped" | "error"; error?: string }[] = [];
    const cleaned: Record<string, unknown>[] = [];

    for (const raw of data.articles) {
      // Normalize empties to null for nullable fields
      const norm: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (typeof v === "string" && v.trim() === "") continue;
        norm[k] = v;
      }
      const parsed = ImportPostSchema.safeParse(norm);
      if (!parsed.success) {
        results.push({
          slug: String(raw.slug ?? "(no slug)"),
          status: "error",
          error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
        });
        continue;
      }
      cleaned.push({ ...parsed.data, is_premium: parsed.data.tier === "premium" });
    }

    if (data.mode === "skip-existing" && cleaned.length) {
      const slugs = cleaned.map((c) => c.slug as string);
      const { data: existing } = await supabaseAdmin
        .from("posts").select("slug").in("slug", slugs);
      const existingSlugs = new Set((existing ?? []).map((r) => r.slug));
      const toInsert = cleaned.filter((c) => {
        if (existingSlugs.has(c.slug as string)) {
          results.push({ slug: c.slug as string, status: "skipped" });
          return false;
        }
        return true;
      });
      if (toInsert.length) {
        const { error } = await supabaseAdmin.from("posts").insert(toInsert as never);
        if (error) {
          toInsert.forEach((c) =>
            results.push({ slug: c.slug as string, status: "error", error: error.message })
          );
        } else {
          toInsert.forEach((c) => results.push({ slug: c.slug as string, status: "ok" }));
        }
      }
    } else if (cleaned.length) {
      const { error } = await supabaseAdmin
        .from("posts").upsert(cleaned as never, { onConflict: "slug" });
      if (error) {
        cleaned.forEach((c) =>
          results.push({ slug: c.slug as string, status: "error", error: error.message })
        );
      } else {
        cleaned.forEach((c) => results.push({ slug: c.slug as string, status: "ok" }));
      }
    }

    const ok = results.filter((r) => r.status === "ok").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const errored = results.filter((r) => r.status === "error").length;

    await logAudit({
      actor_id: context.userId,
      action: "import.articles",
      target_table: "posts",
      details: { mode: data.mode, ok, skipped, errored, total: data.articles.length },
    });

    return { results, ok, skipped, errored };
  });

// ---------- Audit log ----------
export const listAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      limit: z.number().int().min(1).max(500).default(200),
      action: z.string().trim().max(80).optional(),
      actor_email: z.string().trim().max(255).optional(),
    }).parse(input ?? {})
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    let q = supabaseAdmin
      .from("admin_audit_log")
      .select("id, actor_id, actor_email, action, target_table, target_id, details, ip, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.action) q = q.eq("action", data.action);
    if (data.actor_email) q = q.ilike("actor_email", `%${data.actor_email}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---------- Manual audit logging from UI (e.g. for view actions) ----------
export const recordAdminAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      action: z.string().trim().min(1).max(80),
      target_table: z.string().trim().max(80).optional(),
      target_id: z.string().trim().max(200).optional(),
      details: z.record(z.string(), z.any()).optional(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await logAudit({
      actor_id: context.userId,
      action: data.action,
      target_table: data.target_table ?? null,
      target_id: data.target_id ?? null,
      details: data.details ?? {},
    });
    return { ok: true };
  });
