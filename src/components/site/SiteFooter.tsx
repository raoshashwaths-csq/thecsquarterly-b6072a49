import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background mt-20 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-24 mb-24">
          <div>
            <h4 className="font-display text-5xl mb-8 leading-tight text-balance">
              Subscribe to the weekly dispatch.
            </h4>
            <p className="text-background/60 text-lg mb-10 max-w-md">
              Every Tuesday, the most rigorous thinking on Customer Success
              leadership — delivered to operators who run revenue, not tickets.
            </p>
            <Link
              to="/subscribe"
              className="inline-block px-8 py-4 bg-accent text-accent-foreground font-mono text-[11px] uppercase tracking-widest font-bold hover:brightness-110 transition-all"
            >
              Join the list
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-12 font-mono text-[10px] uppercase tracking-widest">
            <div className="space-y-6">
              <div className="opacity-40">Navigation</div>
              <Link to="/insights" className="block hover:text-accent">Insights</Link>
              <Link to="/ai-readiness" className="block hover:text-accent">Readiness Survey</Link>
              <Link to="/about" className="block hover:text-accent">About</Link>
            </div>
            <div className="space-y-6">
              <div className="opacity-40">Connect</div>
              <a href="#" className="block hover:text-accent">LinkedIn</a>
              <a href="#" className="block hover:text-accent">Twitter / X</a>
              <Link to="/subscribe" className="block hover:text-accent">Newsletter</Link>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-background/10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end font-mono text-[9px] opacity-40 tracking-tighter uppercase">
          <div>© {new Date().getFullYear()} The CS Quarterly. All rights reserved.</div>
          <div className="flex gap-8">
            <span>Built for the modern CS executive</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
