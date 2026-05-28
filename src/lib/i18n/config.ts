import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "@/locales/en/common.json";
import arCommon from "@/locales/ar/common.json";
import idCommon from "@/locales/id/common.json";
import thCommon from "@/locales/th/common.json";
import viCommon from "@/locales/vi/common.json";
import tlCommon from "@/locales/tl/common.json";

export const SUPPORTED_LOCALES = ["en", "ar", "id", "th", "vi", "tl"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

const STORAGE_KEY = "tcsq.lang";

/**
 * Read initial language from localStorage (browser only). Safe on server.
 */
function readInitialLang(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved)) {
      return saved as Locale;
    }
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

/**
 * Bootstrapped i18next instance. Phase 1 ships UI chrome only — translation
 * resources are bundled inline (one JSON per locale per namespace).
 * URL-prefix routing (`/ar/about`) lands in Stage B; for now we drive language
 * off localStorage and re-render via the i18n context.
 */
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { common: enCommon },
      ar: { common: arCommon },
      id: { common: idCommon },
      th: { common: thCommon },
      vi: { common: viCommon },
      tl: { common: tlCommon },
    },
    lng: readInitialLang(),
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: "common",
    ns: ["common"],
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export function persistLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

export default i18n;
