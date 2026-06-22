/**
 * Content access for the public site. All copy/data is read from /content/site
 * (never inline in components). Prose is per-locale under identical keys; data
 * is language-independent. The EN file is the type source, so every locale must
 * share its shape (TS enforces parity).
 */
import en from "../../content/site/en.json";
import nl from "../../content/site/nl.json";
import de from "../../content/site/de.json";
import es from "../../content/site/es.json";
import dataJson from "../../content/site/data.json";

export type Locale = "nl" | "en" | "de" | "es";
export const locales: Locale[] = ["nl", "en", "de", "es"];
export const defaultLocale: Locale = "en";

export type Prose = typeof en;
const prose: Record<Locale, Prose> = {
  en,
  nl: nl as Prose,
  de: de as Prose,
  es: es as Prose,
};

export function getProse(locale: Locale): Prose {
  return prose[locale] ?? prose[defaultLocale];
}

export type SiteData = typeof dataJson;
export const siteData = dataJson as SiteData;
export type Car = SiteData["stock"][number];
export type NewsRecord = SiteData["news"][number];

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as string[]).includes(value);
}

/** Best-effort detection of the visitor's preferred locale. */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return defaultLocale;
  for (const lang of navigator.languages ?? [navigator.language]) {
    const short = lang?.slice(0, 2).toLowerCase();
    if (isLocale(short)) return short;
  }
  return defaultLocale;
}

export function formatPrice(value: number, locale: Locale): string {
  const map: Record<Locale, string> = { nl: "nl-NL", en: "en-GB", de: "de-DE", es: "es-ES" };
  return new Intl.NumberFormat(map[locale], { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export interface ResolvedNews {
  id: string;
  date: string;
  image: string;
  title: string;
  excerpt: string;
}

/** News records joined with prose for `locale`, falling back to the source language. */
export function resolveNews(locale: Locale = defaultLocale): ResolvedNews[] {
  const active = getProse(locale).news.items as Record<string, { title: string; excerpt: string }>;
  return siteData.news.map((n) => {
    const src = isLocale((n as { sourceLocale?: string }).sourceLocale)
      ? ((n as { sourceLocale?: string }).sourceLocale as Locale)
      : defaultLocale;
    const fallback = getProse(src).news.items as Record<string, { title: string; excerpt: string }>;
    const prose = active[n.id] ?? fallback[n.id] ?? { title: n.id, excerpt: "" };
    return { id: n.id, date: n.date, image: n.image, title: prose.title, excerpt: prose.excerpt };
  });
}

export function getNewsById(id: string, locale: Locale = defaultLocale): ResolvedNews | undefined {
  return resolveNews(locale).find((n) => n.id === id);
}
