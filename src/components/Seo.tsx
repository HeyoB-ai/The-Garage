import { useEffect } from "react";
import { siteConfig } from "../lib/content";

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Lightweight, dependency-free SEO. Updates the document title and meta tags on
 * mount/update. NOTE: this is client-side only. For crawler-grade SEO, add a
 * prerender / SSR step at build time (see AI_AGENT_ARCHITECTURE.md, "SEO").
 */
export default function Seo({ title, description, image }: SeoProps) {
  useEffect(() => {
    const fullTitle = title
      ? siteConfig.seo.titleTemplate.replace("%s", title)
      : siteConfig.seo.defaultTitle;
    const desc = description || siteConfig.seo.defaultDescription;

    document.title = fullTitle;
    upsertMeta("name", "description", desc);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:type", "website");
    if (image) upsertMeta("property", "og:image", image);
  }, [title, description, image]);

  return null;
}
