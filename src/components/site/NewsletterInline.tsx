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
      <div className="flex flex-col sm:flex-row sm:items-center sm:border-b sm:border-foreground/30 sm:focus-within:border-foreground transition-colors sm:py-2 gap-3 sm:gap-0">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          disabled={status === "loading" || status === "ok"}
          className="w-full bg-transparent outline-none py-2 text-base sm:text-lg placeholder:text-muted-foreground/50 disabled:opacity-60 border-b border-foreground/30 sm:border-b-0 focus:border-foreground sm:focus:border-b-0"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "ok"}
          className="font-mono text-[11px] uppercase tracking-widest font-bold whitespace-nowrap sm:pl-4 hover:text-accent disabled:opacity-50 py-2 sm:py-0 border border-foreground sm:border-0 self-start sm:self-auto px-4 sm:px-0 hover:bg-foreground hover:text-background sm:hover:bg-transparent sm:hover:text-accent transition-colors"
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
