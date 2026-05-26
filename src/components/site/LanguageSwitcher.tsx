import { useEffect, useState } from "react";
import { Globe, Check } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Editions we plan to ship next. SEA + MENA focus per editorial roadmap.
// The English edition is live; others fall back to English with a toast for now.
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
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia", region: "SEA" },
  { code: "ms", label: "Malay", native: "Bahasa Melayu", region: "SEA" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt", region: "SEA" },
  { code: "th", label: "Thai", native: "ภาษาไทย", region: "SEA" },
  { code: "tl", label: "Filipino", native: "Filipino", region: "SEA" },

  // MENA
  { code: "ar", label: "Arabic", native: "العربية", region: "MENA", dir: "rtl" },
  { code: "fa", label: "Persian", native: "فارسی", region: "MENA", dir: "rtl" },
  { code: "he", label: "Hebrew", native: "עברית", region: "MENA", dir: "rtl" },
  { code: "tr", label: "Turkish", native: "Türkçe", region: "MENA" },
];

const STORAGE_KEY = "tcsq.lang";

export function LanguageSwitcher() {
  const [current, setCurrent] = useState<string>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCurrent(saved);
    } catch {
      // ignore
    }
  }, []);

  const onSelect = (lang: Lang) => {
    setCurrent(lang.code);
    try {
      localStorage.setItem(STORAGE_KEY, lang.code);
    } catch {
      // ignore
    }
    if (lang.live) {
      toast.success("English edition active.");
    } else {
      toast(`${lang.native} edition launching soon. We'll email you when it ships.`, {
        description: `${lang.region} rollout · the dispatch will arrive in ${lang.native}.`,
      });
    }
  };

  const active = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];
  const grouped: Record<Region, Lang[]> = { Global: [], SEA: [], MENA: [] };
  for (const l of LANGUAGES) grouped[l.region].push(l);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Choose language edition"
        className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 border border-transparent hover:border-border hover:text-accent transition-colors text-[10px] font-semibold uppercase tracking-widest"
      >
        <Globe size={13} aria-hidden />
        <span className="leading-none">{active.code.toUpperCase()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/55">
          Editions
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(["Global", "SEA", "MENA"] as Region[]).map((region) => (
          <div key={region}>
            <DropdownMenuLabel className="font-mono text-[9px] uppercase tracking-[0.25em] text-secondary-accent pt-2">
              {region === "Global" ? "Global" : region === "SEA" ? "Southeast Asia" : "Middle East & North Africa"}
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
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      {lang.label}
                      {!lang.live && " · soon"}
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
