import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PERSONA_OPTIONS, type Persona } from "@/hooks/usePersona";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in, The CS Quarterly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [persona, setPersona] = useState<Persona | "">("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!persona) {
          toast.error("Pick the role that best describes you.");
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/account`,
            data: { display_name: name, persona },
          },
        });
        if (error) throw error;
        // Best-effort upsert so persona is queryable immediately (covers the
        // case where the user is auto-signed-in without email confirmation).
        if (data.user) {
          await supabase.from("profiles").upsert(
            { id: data.user.id, email, display_name: name, persona },
            { onConflict: "id" },
          );
        }
        toast.success("Account created. Check your inbox to confirm your email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in.");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error((err as Error).message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4 text-center">
            Members
          </div>
          <h1 className="font-display text-4xl md:text-5xl mb-8 text-center leading-tight">
            {mode === "signin" ? "Welcome back." : "Join the Vanguard."}
          </h1>
          <div className="flex border border-border mb-8">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-3 font-mono text-[11px] uppercase tracking-widest ${mode === "signin" ? "bg-foreground text-background" : "hover:bg-muted"}`}
            >Sign in</button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-3 font-mono text-[11px] uppercase tracking-widest ${mode === "signup" ? "bg-foreground text-background" : "hover:bg-muted"}`}
            >Create account</button>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-border bg-background px-4 py-3 font-body"
                />
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                    Your role in the CS hierarchy
                  </label>
                  <select
                    value={persona}
                    onChange={(e) => setPersona(e.target.value as Persona)}
                    required
                    className="w-full border border-border bg-background px-4 py-3 font-body text-sm"
                  >
                    <option value="">Select your role…</option>
                    <optgroup label="Operators (IC track)">
                      {PERSONA_OPTIONS.filter((o) => o.group === "operator").map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Leaders">
                      {PERSONA_OPTIONS.filter((o) => o.group === "leader").map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Talent">
                      {PERSONA_OPTIONS.filter((o) => o.group === "recruiter").map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Recruiters & team leads see tools first; operators see articles first.
                  </p>
                </div>
              </>
            )}
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-border bg-background px-4 py-3"
            />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-border bg-background px-4 py-3"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-foreground text-background font-mono text-[11px] uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
            >
              {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing you agree to our editorial standards. Free tier includes the weekly dispatch.{" "}
            <Link to="/pricing" className="underline">See Vanguard pricing</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

