import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { getMe } from "@/lib/auth.functions";
import {
  listAllPostsAdmin, listAllPlaybooksAdmin, upsertPost, deletePost,
  upsertPlaybook, deletePlaybook,
} from "@/lib/posts.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — The CS Quarterly" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

const SECTIONS = ["vanguard", "retention-protocol", "outcome-forum", "codex"] as const;

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchMe = useServerFn(getMe);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), enabled: !!user });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (me.data && !me.data.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center px-6 py-20 text-center">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-accent mb-3">Restricted</div>
            <h1 className="font-display text-4xl mb-4">Editorial access only.</h1>
            <p className="text-muted-foreground max-w-md">Your account doesn't have admin privileges.</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">Editorial dashboard</div>
        <h1 className="font-display text-5xl mb-10">The Newsroom</h1>
        {me.data?.isAdmin && (
          <div className="grid lg:grid-cols-2 gap-12">
            <PostsAdmin />
            <PlaybooksAdmin />
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function PostsAdmin() {
  const fetchAll = useServerFn(listAllPostsAdmin);
  const save = useServerFn(upsertPost);
  const del = useServerFn(deletePost);
  const list = useQuery({ queryKey: ["admin-posts"], queryFn: () => fetchAll() });
  const [editing, setEditing] = useState<any | null>(null);

  const blank = () => setEditing({
    slug: "", title: "", subtitle: "", excerpt: "", body: "## Heading\n\nWrite here.",
    category: "Vanguard", section: "vanguard", author: "The Editors",
    read_minutes: 7, tier: "free", published: true, cover_image_url: "",
  });

  const submit = async () => {
    try {
      const payload = { ...editing };
      if (!payload.id) delete payload.id;
      if (!payload.cover_image_url) delete payload.cover_image_url;
      if (!payload.subtitle) delete payload.subtitle;
      await save({ data: payload });
      toast.success("Saved.");
      setEditing(null);
      list.refetch();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl">Posts</h2>
        <button onClick={blank} className="px-4 py-2 bg-foreground text-background font-mono text-[10px] uppercase tracking-widest">+ New post</button>
      </div>
      <div className="border border-border divide-y divide-border max-h-96 overflow-auto">
        {(list.data ?? []).map((p) => (
          <div key={p.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-lg truncate">{p.title}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {p.section} · {p.tier} · {p.published ? "live" : "draft"}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setEditing(p)} className="px-3 py-1 border border-border text-xs">Edit</button>
              <button onClick={async () => { if (confirm("Delete?")) { await del({ data: { id: p.id } }); list.refetch(); } }} className="px-3 py-1 border border-destructive text-destructive text-xs">Delete</button>
            </div>
          </div>
        ))}
        {list.data?.length === 0 && <div className="p-6 text-sm text-muted-foreground">No posts yet.</div>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-foreground/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border border-border w-full max-w-2xl p-6 my-8">
            <div className="font-display text-2xl mb-4">{editing.id ? "Edit post" : "New post"}</div>
            <div className="grid gap-3 text-sm">
              <input placeholder="Slug (lowercase-with-dashes)" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="border border-border px-3 py-2" />
              <input placeholder="Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="border border-border px-3 py-2" />
              <input placeholder="Subtitle (optional)" value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} className="border border-border px-3 py-2" />
              <textarea placeholder="Excerpt" value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} rows={2} className="border border-border px-3 py-2" />
              <textarea placeholder="Body (markdown lite: ## heading, - bullet)" value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} rows={12} className="border border-border px-3 py-2 font-mono text-xs" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Category" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="border border-border px-3 py-2" />
                <select value={editing.section} onChange={(e) => setEditing({ ...editing, section: e.target.value })} className="border border-border px-3 py-2">
                  {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input placeholder="Author" value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} className="border border-border px-3 py-2" />
                <input type="number" min={1} max={120} value={editing.read_minutes} onChange={(e) => setEditing({ ...editing, read_minutes: parseInt(e.target.value) })} className="border border-border px-3 py-2" />
                <select value={editing.tier} onChange={(e) => setEditing({ ...editing, tier: e.target.value })} className="border border-border px-3 py-2">
                  <option value="free">Free</option><option value="premium">Premium</option>
                </select>
                <label className="flex items-center gap-2"><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Published</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border border-border text-sm">Cancel</button>
              <button onClick={submit} className="px-4 py-2 bg-foreground text-background text-sm font-mono uppercase tracking-widest">Save</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PlaybooksAdmin() {
  const fetchAll = useServerFn(listAllPlaybooksAdmin);
  const save = useServerFn(upsertPlaybook);
  const del = useServerFn(deletePlaybook);
  const list = useQuery({ queryKey: ["admin-playbooks"], queryFn: () => fetchAll() });
  const [editing, setEditing] = useState<any | null>(null);

  const blank = () => setEditing({
    slug: "", title: "", summary: "", body: "## Section\n\nContent.",
    category: "Framework", price_cents: 4900, pages: 12, included_in_vanguard: true, published: true,
  });

  const submit = async () => {
    try {
      const payload = { ...editing };
      if (!payload.id) delete payload.id;
      await save({ data: payload });
      toast.success("Saved.");
      setEditing(null);
      list.refetch();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl">Codex Playbooks</h2>
        <button onClick={blank} className="px-4 py-2 bg-foreground text-background font-mono text-[10px] uppercase tracking-widest">+ New playbook</button>
      </div>
      <div className="border border-border divide-y divide-border max-h-96 overflow-auto">
        {(list.data ?? []).map((p: any) => (
          <div key={p.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-lg truncate">{p.title}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {p.category} · ${(p.price_cents/100).toFixed(0)} · {p.pages}pp
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setEditing(p)} className="px-3 py-1 border border-border text-xs">Edit</button>
              <button onClick={async () => { if (confirm("Delete?")) { await del({ data: { id: p.id } }); list.refetch(); } }} className="px-3 py-1 border border-destructive text-destructive text-xs">Delete</button>
            </div>
          </div>
        ))}
        {list.data?.length === 0 && <div className="p-6 text-sm text-muted-foreground">No playbooks yet.</div>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-foreground/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border border-border w-full max-w-2xl p-6 my-8">
            <div className="font-display text-2xl mb-4">{editing.id ? "Edit playbook" : "New playbook"}</div>
            <div className="grid gap-3 text-sm">
              <input placeholder="Slug" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="border border-border px-3 py-2" />
              <input placeholder="Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="border border-border px-3 py-2" />
              <textarea placeholder="Summary" value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} rows={2} className="border border-border px-3 py-2" />
              <textarea placeholder="Body (markdown lite)" value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} rows={10} className="border border-border px-3 py-2 font-mono text-xs" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Category" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="border border-border px-3 py-2" />
                <input type="number" placeholder="Price (cents)" value={editing.price_cents} onChange={(e) => setEditing({ ...editing, price_cents: parseInt(e.target.value) })} className="border border-border px-3 py-2" />
                <input type="number" placeholder="Pages" value={editing.pages} onChange={(e) => setEditing({ ...editing, pages: parseInt(e.target.value) })} className="border border-border px-3 py-2" />
                <label className="flex items-center gap-2"><input type="checkbox" checked={editing.included_in_vanguard} onChange={(e) => setEditing({ ...editing, included_in_vanguard: e.target.checked })} /> In Vanguard</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Published</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border border-border text-sm">Cancel</button>
              <button onClick={submit} className="px-4 py-2 bg-foreground text-background text-sm font-mono uppercase tracking-widest">Save</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
