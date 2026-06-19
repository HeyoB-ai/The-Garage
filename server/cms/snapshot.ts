/**
 * Compact site snapshot for the LLM planner: a small JSON inventory of
 * everything that is editable, so the model can reference real target ids
 * instead of guessing. Kept intentionally small — ids + labels + a few key
 * fields, never full bodies.
 *
 * Reads the NEW content layer (content/site/*) that the public site renders, so
 * the planner plans against what the visitor actually sees:
 *   - data.json   → language-independent facts (stock, news records, hours)
 *   - {source}.json → prose (used here only for human labels/titles)
 *   - theme.json  → brand tokens
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SOURCE_LOCALE = "en";

function readJson(rel: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  } catch {
    return null;
  }
}

export interface SiteSnapshot {
  news: { id: string; type: "news"; title: string; date: string; published: boolean }[];
  stock: { id: string; type: "stock"; make: string; model: string; status: string; price: number }[];
  portfolio: { id: string; type: "portfolio"; title: string }[];
  faq: { id: string; type: "faq"; question: string }[];
  sections: { id: string; type: "section"; label: string }[];
  pages: { id: string; type: "page"; title: string }[];
  openingHours: { weekdays?: string; weekend?: string };
  theme: {
    accent: string;
    accentStrong: string;
    background: string;
    font: string;
    logo: string | null;
  };
}

export function buildSiteSnapshot(): SiteSnapshot {
  const data = readJson("content/site/data.json") ?? {};
  const prose = readJson(`content/site/${SOURCE_LOCALE}.json`) ?? {};
  const theme = readJson("content/site/theme.json") ?? {};

  const news = (Array.isArray(data.news) ? data.news : []).slice(0, 30).map((n: any) => ({
    id: String(n.id),
    type: "news" as const,
    title: String(prose?.news?.items?.[n.id]?.title ?? n.id),
    date: String(n.date ?? ""),
    published: true,
  }));

  const stock = (Array.isArray(data.stock) ? data.stock : []).map((c: any) => ({
    id: String(c.id),
    type: "stock" as const,
    make: String(c.make ?? ""),
    model: String(c.model ?? ""),
    status: String(c.status ?? ""),
    price: Number(c.price ?? 0),
  }));

  return {
    news,
    stock,
    // The new site does not (yet) expose these surfaces.
    portfolio: [],
    faq: [],
    sections: [],
    pages: [],
    openingHours: {
      weekdays: data?.openingHours?.weekdays,
      weekend: data?.openingHours?.weekend,
    },
    theme: {
      accent: String(theme.accent ?? "#154a6b"),
      accentStrong: String(theme.accentStrong ?? "#1c5c84"),
      background: String(theme.background ?? "#f5f2ec"),
      font: String(theme.font ?? "Hanken Grotesk, system-ui, sans-serif"),
      logo: theme.logo ?? null,
    },
  };
}
