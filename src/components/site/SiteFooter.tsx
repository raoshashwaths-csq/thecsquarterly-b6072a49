import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SiteFooter() {
  const { t } = useTranslation();

  const SECTIONS = [
    { labelKey: "footer.sectionLinks.vanguard", path: "/vanguard" },
    { labelKey: "footer.sectionLinks.retention", path: "/retention-protocol" },
    { labelKey: "footer.sectionLinks.outcome", path: "/outcome-forum" },
    { labelKey: "footer.sectionLinks.codex", path: "/codex" },
  ] as const;

  const RESOURCES = [
    { labelKey: "footer.resourceLinks.diagnostic", path: "/diagnostics" },
    { labelKey: "footer.resourceLinks.calculator", path: "/calculator" },
    { labelKey: "footer.resourceLinks.benchmarks", path: "/benchmarks" },
    { labelKey: "footer.resourceLinks.directory", path: "/directory" },
    { labelKey: "footer.resourceLinks.teams", path: "/teams" },
    { labelKey: "footer.resourceLinks.sequencer", path: "/sequencer" },
    { labelKey: "footer.resourceLinks.jobBoard", path: "/job-board", comingSoon: true },
    { labelKey: "footer.resourceLinks.pricing", path: "/pricing" },
    { labelKey: "footer.resourceLinks.subscribe", path: "/subscribe" },
  ] as const;

  const COMPANY = [
    { labelKey: "footer.companyLinks.mission", path: "/about" },
    { labelKey: "footer.companyLinks.editorial", path: "/about" },
    { labelKey: "footer.companyLinks.contact", path: "/subscribe" },
    { labelKey: "footer.companyLinks.login", path: "/login" },
  ] as const;

  const SOCIAL = [
    { label: "LinkedIn", href: "#" },
    { label: "Twitter / X", href: "#" },
    { label: "RSS", href: "#" },
  ] as const;

  return (
    <footer className="bg-foreground text-background relative overflow-hidden">
      {/* Top CTA strip */}
      <div className="border-b border-background/10">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary-accent mb-4">
              {t("footer.ctaEyebrow")}
            </p>
            <h2 className="font-display text-3xl md:text-5xl leading-[1.05] tracking-tight">
              {t("footer.ctaHeadlineLine1")}<br />{t("footer.ctaHeadlineLine2")}
            </h2>
          </div>
          <Link
            to="/subscribe"
            className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-accent text-foreground font-mono text-xs uppercase tracking-[0.2em] hover:bg-background hover:text-foreground transition-colors whitespace-nowrap"
          >
            {t("footer.subscribeFree")} <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Link columns */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          <FooterCol title={t("footer.sections")} links={SECTIONS.map(l => ({ label: t(l.labelKey), path: l.path }))} stayTuned={t("footer.stayTuned")} />
          <FooterCol title={t("footer.resources")} links={RESOURCES.map(l => ({ label: t(l.labelKey), path: l.path, comingSoon: "comingSoon" in l ? l.comingSoon : undefined }))} stayTuned={t("footer.stayTuned")} />
          <FooterCol title={t("footer.company")} links={COMPANY.map(l => ({ label: t(l.labelKey), path: l.path }))} stayTuned={t("footer.stayTuned")} />
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.25em] text-background/40 mb-6">
              {t("footer.social")}
            </h4>
            <ul className="space-y-3">
              {SOCIAL.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="group inline-flex items-center gap-1.5 font-body text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {l.label}
                    <ArrowUpRight size={12} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Giant wordmark */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pb-8">
        <Link to="/" className="block group" aria-label="The CS Quarterly home">
          <div className="font-display font-medium tracking-[-0.04em] leading-[0.85] text-background/95 select-none whitespace-nowrap [font-size:clamp(3rem,11.5vw,10.5rem)]">
            The CS Quarterly<span className="text-secondary-accent">.</span>
          </div>
        </Link>
      </div>

      {/* Meta bar */}
      <div className="border-t border-background/10">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-background/40">
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="font-mono text-xs uppercase tracking-[0.2em] text-background/40 hover:text-background transition-colors">{t("footer.privacy")}</a>
            <a href="#" className="font-mono text-xs uppercase tracking-[0.2em] text-background/40 hover:text-background transition-colors">{t("footer.terms")}</a>
            <a href="#" className="font-mono text-xs uppercase tracking-[0.2em] text-background/40 hover:text-background transition-colors">{t("footer.colophon")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
  stayTuned,
}: {
  title: string;
  links: ReadonlyArray<{ label: string; path: string; comingSoon?: boolean }>;
  stayTuned: string;
}) {
  return (
    <div>
      <h4 className="font-mono text-xs uppercase tracking-[0.25em] text-background/40 mb-6">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            {l.comingSoon ? (
              <span className="inline-flex items-center gap-2 font-body text-sm">
                <span className="text-background/40 blur-[5px] select-none">{l.label}</span>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-secondary-accent whitespace-nowrap">
                  {stayTuned} ✨
                </span>
              </span>
            ) : (
              <Link
                to={l.path}
                className="font-body text-sm text-background/70 hover:text-background transition-colors"
              >
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
