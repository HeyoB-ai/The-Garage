/**
 * Content generator for the `add_news` intent.
 *
 * Turns a parsed instruction into a real, valid news article file: the exact
 * bytes that will be written to /content/news. Pure (no I/O) so it can run in
 * the planner for preview and on the server for the actual write.
 *
 * SWAP TARGET: today excerpt/body are sensible placeholders. Replace this with
 * an LLM (Gemini/Claude) call that drafts real copy from the instruction — the
 * returned GeneratedFile shape stays the same.
 */
import type { NewsArticle } from "../../../types";
import { slugify } from "../slug";

// Neutral default image so a freshly generated article always renders. When the
// customer uploads a photo it replaces this path.
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200";

export interface GeneratedFile {
  path: string;
  content: string; // file bytes (pretty-printed JSON)
  article: NewsArticle;
}

export function buildNewsArticleFile(
  title: string,
  opts: { needsImage: boolean; date: string }
): GeneratedFile {
  const cleanTitle = title.trim() || "Nieuw bericht";
  const slug = slugify(cleanTitle) || "nieuw-bericht";

  const article: NewsArticle = {
    title: cleanTitle,
    slug,
    date: opts.date,
    excerpt: `${cleanTitle}. Read the full update from The Garage Jávea.`,
    image: opts.needsImage
      ? `/images/news/${slug}.jpg`
      : DEFAULT_IMAGE,
    author: "Website Editor",
    metaTitle: `${cleanTitle} | The Garage Jávea`,
    metaDescription: `${cleanTitle} — the latest news from The Garage Jávea.`,
    published: true,
    body:
      `## ${cleanTitle}\n\n` +
      `This article was drafted automatically from your instruction. ` +
      `Edit the text below to add the details you want to share.\n\n` +
      `- Add the key facts here\n` +
      `- Mention dates, times or locations if relevant\n\n` +
      `Reach out to our team for more information.`,
  };

  const fileName = `${opts.date}-${slug}.json`;
  return {
    path: `content/news/${fileName}`,
    content: JSON.stringify(article, null, 2) + "\n",
    article,
  };
}
