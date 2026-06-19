import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getProse, siteData, type Locale, type Prose, type SiteData } from "./content";

interface SiteContext {
  locale: Locale;
  t: Prose; // localized prose
  data: SiteData; // language-independent facts
}

const Ctx = createContext<SiteContext | null>(null);

export function SiteProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<SiteContext>(
    () => ({ locale, t: getProse(locale), data: siteData }),
    [locale]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite(): SiteContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSite must be used within <SiteProvider>");
  return ctx;
}

/** Build a locale-prefixed path, e.g. localePath("en", "#contact"). */
export function localePath(locale: Locale, suffix = ""): string {
  return `/${locale}${suffix}`;
}
