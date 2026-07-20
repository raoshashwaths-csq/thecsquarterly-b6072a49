import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { QHint } from "@/components/site/QHint";

const SECTIONS = [
  { to: "/vanguard", name: "The CS Vanguard", key: "vanguard" },
  { to: "/retention-protocol", name: "The Retention Protocol", key: "retention" },
  { to: "/outcome-forum", name: "The Outcome Forum", key: "outcome" },
  { to: "/codex", name: "The CS Codex", key: "codex" },
  { to: "/diagnostics", name: "The Diagnostics", key: "diagnostic" },
] as const;

export function SectionsFillGrid() {
  const { t } = useTranslation();

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
      {SECTIONS.map((s, i) => (
        <Link
          key={s.to}
          to={s.to}
          data-tilt
          className="group relative block border border-border bg-card hover:bg-card hover:border-foreground transition-colors p-6 pt-7 card-lift"
        >
          <span aria-hidden className="absolute -top-px left-0 right-0 h-px bg-foreground/80" />
          <div className="font-mono text-xs font-semibold mb-3 text-secondary-accent">
            0{i + 1} / 0{SECTIONS.length}
          </div>
          <h2 className="font-display text-xl md:text-2xl mb-2 leading-tight">
            {t(`home.sections.items.${s.key}.name`, { defaultValue: s.name })}
          </h2>
          <p className="text-sm text-pretty mb-4 text-foreground/65">
            {t(`home.sections.items.${s.key}.blurb`)}
          </p>
          <div className="font-mono uppercase tracking-widest text-xs mb-3 text-foreground/65">
            {t("home.sections.enter")}
          </div>
          <QHint>{t(`home.sections.items.${s.key}.hint`)}</QHint>
        </Link>
      ))}
    </div>
  );
}
