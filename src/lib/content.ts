/**
 * Content access layer for the AI-CMS.
 *
 * This is the single place the UI reads content from. The AI agent edits the
 * underlying JSON files in /content and /src/config; nothing in the UI needs to
 * change when content is added. To add a news article, an agent simply drops a
 * new file in /content/news/*.json — it is picked up automatically below.
 */
import siteConfigJson from "../config/site.json";
import menuConfigJson from "../config/menu.json";
import faqJson from "../../content/faq/faq.json";
import type { NewsArticle, MenuItem, FaqItem, SiteConfig } from "../types";

// --- Site config ---------------------------------------------------------
export const siteConfig = siteConfigJson as SiteConfig;

// --- Menu ----------------------------------------------------------------
export function getMenu(): MenuItem[] {
  return (menuConfigJson.items as MenuItem[])
    .filter((item) => item.visible)
    .sort((a, b) => a.order - b.order);
}

// --- News ----------------------------------------------------------------
// Eagerly import every JSON file under /content/news. Adding a file here is all
// that is needed to publish a new article (subject to "published": true).
const newsModules = import.meta.glob<{ default: NewsArticle }>(
  "/content/news/*.json",
  { eager: true }
);

export function getAllNews(includeUnpublished = false): NewsArticle[] {
  return Object.values(newsModules)
    .map((m) => m.default)
    .filter((a) => includeUnpublished || a.published)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
}

export function getNewsBySlug(slug: string): NewsArticle | undefined {
  return getAllNews(true).find((a) => a.slug === slug);
}

// --- FAQ -----------------------------------------------------------------
export function getFaq(): FaqItem[] {
  return (faqJson.items as FaqItem[])
    .filter((item) => item.visible)
    .sort((a, b) => a.order - b.order);
}

// --- Formatting helpers --------------------------------------------------
export function formatDate(iso: string, locale = "en-GB"): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
