import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { subscribe } from "@/lib/subscribers.functions";

export function NewsletterInline({
  source = "inline",
  placeholder = "Enter your executive email",
  cta = "Join 12k Leaders",
}: {
  source?: string;
  placeholder?: string;
  cta?: string;
}) {
  const subscribeFn = useServerFn(subscribe);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await subscribeFn({ data: { email, source } });
      setStatus("ok");
      setMessage(res.message);
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl mx-auto w-full">
      <div className="relative flex items-center border-b border-foreground/30 focus-within:border-foreground transition-colors py-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          disabled={status === "loading" || status === "ok"}
          className="w-full bg-transparent outline-none py-2 text-lg placeholder:text-muted-foreground/50 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "ok"}
          className="font-mono text-[11px] uppercase tracking-widest font-bold whitespace-nowrap pl-4 hover:text-accent disabled:opacity-50"
        >
          {status === "loading" ? "Subscribing…" : status === "ok" ? "Subscribed" : cta}
        </button>
      </div>
      <p
        className={`mt-4 text-[13px] italic ${
          status === "error" ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {status === "idle" && "Join VPs at Snowflake, Gong, and Stripe. No spam, just logic."}
        {status === "loading" && "Adding you to the dispatch…"}
        {status === "ok" && message}
        {status === "error" && message}
      </p>
    </form>
  );
}
