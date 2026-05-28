import { useEffect, useState } from "react";
import { Globe, Check } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import i18n, {
  SUPPORTED_LOCALES,
  type Locale,
  persistLocale,
} from "@/lib/i18n/config";

// Editions we plan to ship next. SEA + MENA focus per editorial roadmap.
// Codes marked `live` are wired up in i18next; others toast as "soon" until
// translations land.
type Region = "Global" | "SEA" | "MENA";
type Lang = {
  code: string;
  label: string;
  native: string;
  region: Region;
  dir?: "rtl";
  live?: boolean;
};

const LANGUAGES: Lang[] = [
  { code: "en", label: "English", native: "English", region: "Global", live: true },

  // SEA
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia", region: "SEA", live: true },
  { code: "ms", label: "Malay", native: "Bahasa Melayu", region: "SEA" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt", region: "SEA", live: true },
  { code: "th", label: "Thai", native: "ภาษาไทย", region: "SEA", live: true },
  { code: "tl", label: "Filipino", native: "Filipino", region: "SEA", live: true },

  // MENA
  { code: "ar", label: "Arabic", native: "العربية", region: "MENA", dir: "rtl", live: true },
  { code: "fa", label: "Persian", native: "فارسی", region: "MENA", dir: "rtl" },
  { code: "he", label: "Hebrew", native: "עברית", region: "MENA", dir: "rtl" },
  { code: "tr", label: "Turkish", native: "Türkçe", region: "MENA" },
];

export function LanguageSwitcher() {
  const { t, i18n: i18nInstance } = useTranslation();
  const [current, setCurrent] = useState<string>(i18nInstance.language || "en");

  useEffect(() => {
    const onChange = (lng: string) => setCurrent(lng);
    i18nInstance.on("languageChanged", onChange);
    return () => {
      i18nInstance.off("languageChanged", onChange);
    };
  }, [i18nInstance]);

  const onSelect = (lang: Lang) => {
    if (lang.live && (SUPPORTED_LOCALES as readonly string[]).includes(lang.code)) {
      void i18n.changeLanguage(lang.code);
      persistLocale(lang.code as Locale);
      setCurrent(lang.code);
      toast.success(t("langSwitcher.activeToast", { native: lang.native }));
    } else {
      toast(t("langSwitcher.soonToast", { native: lang.native }), {
        description: t("langSwitcher.soonDescription", {
          region: lang.region,
          native: lang.native,
        }),
      });
    }
  };

  const active = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];
  const grouped: Record<Region, Lang[]> = { Global: [], SEA: [], MENA: [] };
  for (const l of LANGUAGES) grouped[l.region].push(l);

  const regionLabel = (r: Region) =>
    r === "Global"
      ? t("langSwitcher.regions.global")
      : r === "SEA"
        ? t("langSwitcher.regions.sea")
        : t("langSwitcher.regions.mena");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("langSwitcher.label")}
        className="inline-flex items-center gap-1.5 px-2 py-1 border border-transparent hover:border-border hover:text-accent transition-colors text-xs font-semibold uppercase tracking-widest"
      >
        <Globe size={13} aria-hidden />
        <span className="leading-none">{active.code.toUpperCase()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-mono text-xs uppercase tracking-[0.25em] text-foreground/55">
          {t("langSwitcher.editions")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(["Global", "SEA", "MENA"] as Region[]).map((region) => (
          <div key={region}>
            <DropdownMenuLabel className="font-mono text-xs uppercase tracking-[0.25em] text-secondary-accent pt-2">
              {regionLabel(region)}
            </DropdownMenuLabel>
            {grouped[region].map((lang) => {
              const selected = lang.code === current;
              return (
                <DropdownMenuItem
                  key={lang.code}
                  onSelect={() => onSelect(lang)}
                  className="flex items-center justify-between gap-3 font-body normal-case tracking-normal"
                  dir={lang.dir}
                >
                  <div className="flex flex-col">
                    <span className="text-sm leading-tight">{lang.native}</span>
                    <span className="text-xs text-muted-foreground leading-tight">
                      {lang.label}
                      {!lang.live && ` · ${t("langSwitcher.soon")}`}
                    </span>
                  </div>
                  {selected && <Check size={14} className="shrink-0 text-accent" aria-hidden />}
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
