import { Link } from "@tanstack/react-router";
import { Mail, Linkedin, Twitter } from "lucide-react";

const SECTIONS = [
  { label: "The CS Vanguard", path: "/vanguard" },
  { label: "The Retention Protocol", path: "/retention-protocol" },
  { label: "The Outcome Forum", path: "/outcome-forum" },
  { label: "The CS Codex", path: "/codex" },
] as const;

const RESOURCES = [
  { label: "AI Readiness Diagnostic", path: "/ai-readiness" },
  { label: "Pricing", path: "/pricing" },
  { label: "Subscribe", path: "/subscribe" },
] as const;

const ABOUT_LINKS = [
  { label: "Our Mission", path: "/about" },
  { label: "Editorial Standards", path: "/about" },
  { label: "Contact", path: "/subscribe" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-baseline gap-1 mb-4">
              <span className="font-display text-xl font-semibold tracking-tight">
                The CS Quarterly
              </span>
              <span className="text-secondary-accent text-xl leading-none">.</span>
            </Link>
            <p className="font-body text-sm leading-relaxed text-background/60 mb-6">
              The architecture of retention. Strategic intelligence for Customer
              Success leaders navigating the autonomous revolution.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" aria-label="LinkedIn" className="text-background/40 hover:text-secondary-accent transition-colors">
                <Linkedin size={18} />
              </a>
              <a href="#" aria-label="Twitter" className="text-background/40 hover:text-secondary-accent transition-colors">
                <Twitter size={18} />
              </a>
              <Link to="/subscribe" aria-label="Email" className="text-background/40 hover:text-secondary-accent transition-colors">
                <Mail size={18} />
              </Link>
            </div>
          </div>

          {/* Sections */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-secondary-accent mb-6">
              Sections
            </h4>
            <ul className="space-y-3">
              {SECTIONS.map((l) => (
                <li key={l.path}>
                  <Link to={l.path} className="font-body text-sm text-background/60 hover:text-background transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-secondary-accent mb-6">
              Resources
            </h4>
            <ul className="space-y-3">
              {RESOURCES.map((l) => (
                <li key={l.label}>
                  <Link to={l.path} className="font-body text-sm text-background/60 hover:text-background transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-secondary-accent mb-6">
              About
            </h4>
            <ul className="space-y-3">
              {ABOUT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.path} className="font-body text-sm text-background/60 hover:text-background transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-mono text-xs text-background/40">
            © {new Date().getFullYear()} The CS Quarterly. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="font-mono text-xs text-background/40 hover:text-background/70 transition-colors">Privacy</a>
            <a href="#" className="font-mono text-xs text-background/40 hover:text-background/70 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
