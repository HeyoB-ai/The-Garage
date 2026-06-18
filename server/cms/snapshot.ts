/**
 * Compact site snapshot for the LLM planner: a small JSON inventory of
 * everything that is editable, so the model can reference real target ids
 * instead of guessing. Kept intentionally small — ids + labels + a few key
 * fields, never full bodies.
 *
 * Data sources: src/data.ts (stock, portfolio — bundled), src/config (menu,
 * theme — bundled), and content/** (news, faq, pages — read from disk).
 */
import fs from "fs";
import path from "path";
import { CARS_STOCK, PORTFOLIO_ITEMS } from "../../src/data";
import menuConfig from "../../src/config/menu.json";
import siteConfig from "../../src/config/site.json";

const ROOT = process.cwd();

function readJson(rel: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  } catch {
    return null;
  }
}

function listJsonDir(rel: string): any[] {
  try {
    return fs
      .readdirSync(path.join(ROOT, rel))
      .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
      .map((f) => readJson(`${rel}/${f}`))
      .filter(Boolean);
  } catch {
    return [];
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
  theme: { accent: string; font: string; logo: string };
}

export function buildSiteSnapshot(): SiteSnapshot {
  const news = listJsonDir("content/news")
    .slice(0, 30)
    .map((a) => ({
      id: String(a.slug ?? ""),
      type: "news" as const,
      title: String(a.title ?? ""),
      date: String(a.date ?? ""),
      published: a.published !== false,
    }));

  const faqData = readJson("content/faq/faq.json");
  const faq = Array.isArray(faqData?.items)
    ? faqData.items.map((f: any) => ({ id: String(f.id ?? ""), type: "faq" as const, question: String(f.question ?? "") }))
    : [];

  const pages = listJsonDir("content/pages").map((p) => ({
    id: String(p.slug ?? ""),
    type: "page" as const,
    title: String(p.title ?? ""),
  }));

  // Opening hours: prefer the on-disk config (reflects runtime edits), else the
  // bundled default.
  const liveSite = readJson("src/config/site.json") ?? (siteConfig as any);

  const sections = ((menuConfig as any).items ?? [])
    .filter((i: any) => i.type === "section")
    .map((i: any) => ({ id: String(i.id), type: "section" as const, label: String(i.label) }));

  return {
    news,
    stock: CARS_STOCK.map((c) => ({
      id: c.id,
      type: "stock" as const,
      make: c.make,
      model: c.model,
      status: c.status,
      price: c.price,
    })),
    portfolio: PORTFOLIO_ITEMS.map((p) => ({ id: p.id, type: "portfolio" as const, title: p.title })),
    faq,
    sections,
    pages,
    openingHours: {
      weekdays: liveSite?.openingHours?.weekdays,
      weekend: liveSite?.openingHours?.weekend,
    },
    theme: {
      accent: String(liveSite?.theme?.accent ?? "amber"),
      font: "Tailwind default sans",
      logo: `text logo: ${liveSite?.shortName ?? "The Garage"} / Jávea`,
    },
  };
}
