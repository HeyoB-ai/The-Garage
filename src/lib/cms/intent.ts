/**
 * Command parser / intent model (MOCK).
 *
 * Turns a free-text customer instruction (typed or transcribed from speech)
 * into a structured intent. Today this uses simple keyword heuristics so the
 * dashboard is demonstrable offline. The PUBLIC SHAPE is the important part:
 * `analyzeCommand` is async and returns a `ParsedCommand`, so it can later be
 * swapped for a real LLM call (Claude / Gemini) without touching the UI.
 *
 * See AI_AGENT_ARCHITECTURE.md for how this fits the full pipeline.
 */

export type IntentName =
  | "add_news"
  | "edit_text"
  | "add_page"
  | "add_menu_item"
  | "add_section"
  | "update_opening_hours"
  | "add_faq"
  | "change_image"
  | "set_image"
  | "set_theme"
  | "create_preview"
  | "approve_deploy"
  // Steering intents from the LLM planner (no pipeline action of their own).
  | "clarify"
  | "unsupported"
  | "unknown";

// Whether a change touches only content or also the site's structure.
// Structural changes ALWAYS require human approval (see guardrails).
export type ChangeType = "content" | "structural" | "workflow" | "unknown";

export interface ParsedCommand {
  intent: IntentName;
  confidence: number; // 0..1
  changeType: ChangeType;
  requiresApproval: boolean;
  fields: Record<string, unknown>;
  rawText: string;
}

const STRUCTURAL_INTENTS: IntentName[] = [
  "add_page",
  "add_section",
  "add_menu_item",
];

const CONTENT_INTENTS: IntentName[] = [
  "add_news",
  "edit_text",
  "update_opening_hours",
  "add_faq",
  "change_image",
  "set_image",
  "set_theme",
];

const WORKFLOW_INTENTS: IntentName[] = ["create_preview", "approve_deploy"];

export function requiresApprovalFor(intent: IntentName): boolean {
  return STRUCTURAL_INTENTS.includes(intent);
}

export function changeTypeFor(intent: IntentName): ChangeType {
  if (STRUCTURAL_INTENTS.includes(intent)) return "structural";
  if (CONTENT_INTENTS.includes(intent)) return "content";
  if (WORKFLOW_INTENTS.includes(intent)) return "workflow";
  return "unknown";
}

const has = (text: string, ...words: string[]) =>
  words.some((w) => text.includes(w));

/**
 * Try to pull a short title from phrases like "...over onze open dag..."
 * or "...about our open day...".
 */
function extractTitle(text: string): string | undefined {
  const m = text.match(/\b(?:over|about|getiteld|titled|genaamd)\s+(.+)$/i);
  if (!m) return undefined;
  let t = m[1]
    .replace(/\bmet (een )?(foto|afbeelding|image|picture).*$/i, "")
    .replace(/\bwith (an? )?(photo|image|picture).*$/i, "")
    .replace(/[.?!]+$/, "")
    .replace(/^onze?\s+/i, "")
    .replace(/^our\s+/i, "")
    .trim();
  if (!t) return undefined;
  // Capitalize first letter
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Pull two clock times from a phrase like "...naar 09:00 - 17:00" or
 * "...from 9.00 to 17.30". Returns normalised "HH:MM" strings.
 */
function extractTimes(text: string): { from?: string; to?: string } {
  const m = text.match(
    /(\d{1,2}[:.]\d{2})\s*(?:-|–|—|tot|t\/m|to|until|en)\s*(\d{1,2}[:.]\d{2})/i
  );
  if (!m) return {};
  const norm = (s: string) => {
    const [h, min] = s.replace(".", ":").split(":");
    return `${h.padStart(2, "0")}:${min}`;
  };
  return { from: norm(m[1]), to: norm(m[2]) };
}

/**
 * Pull a candidate question for a FAQ from the instruction: prefer text after a
 * colon, otherwise the topic after "over"/"about".
 */
function extractQuestion(text: string): string | undefined {
  const colon = text.match(/:\s*(.+)$/);
  if (colon) return colon[1].replace(/[.]+$/, "").trim();
  return extractTitle(text);
}

/**
 * Synchronous heuristic classifier. Order matters: more specific patterns
 * (e.g. "news SECTION" = structural) are checked before broader ones.
 */
export function classify(rawText: string): ParsedCommand {
  const text = rawText.toLowerCase().trim();
  const needsImage = has(text, "foto", "afbeelding", "image", "picture", "plaatje");
  // An external article/source link the beheerder wants turned into a news item.
  const urlMatch = rawText.match(/https?:\/\/[^\s)<>"']+/i);
  const sourceUrl = urlMatch ? urlMatch[0] : undefined;

  const build = (
    intent: IntentName,
    confidence: number,
    fields: Record<string, unknown> = {}
  ): ParsedCommand => ({
    intent,
    confidence,
    changeType: changeTypeFor(intent),
    requiresApproval: STRUCTURAL_INTENTS.includes(intent),
    fields,
    rawText,
  });

  // --- Workflow commands ---
  if (has(text, "keur", "approve", "ga live", "publiceer", "zet live"))
    return build("approve_deploy", 0.9);
  if (has(text, "preview", "voorbeeld bekijken", "voorvertoning"))
    return build("create_preview", 0.85);

  // --- Structural (require approval) ---
  // A whole new section/module — check BEFORE add_news so "nieuwssectie" wins.
  if (has(text, "sectie", "section", "module", "blok")) {
    const isNews = has(text, "nieuws", "news");
    return build("add_section", 0.95, {
      sectionType: isNews ? "news" : undefined,
      menuLabel: has(text, "menu") ? (isNews ? "Nieuws" : undefined) : undefined,
    });
  }
  if (has(text, "menu-item", "menukeuze", "menu item", "menu-keuze") ||
      (has(text, "menu") && has(text, "toevoegen", "add", "nieuw", "new"))) {
    return build("add_menu_item", 0.85, {
      label: extractTitle(text),
    });
  }
  if (has(text, "pagina", "page") && has(text, "nieuw", "new", "toevoegen", "add", "maak", "create")) {
    return build("add_page", 0.85, { title: extractTitle(text) });
  }

  // --- Content (auto-allowed, still previewed) ---
  // Note: add_section ("nieuwssectie") is checked above and still wins.
  if (
    has(text, "nieuwsbericht", "news post", "news article", "bericht", "artikel", "article", "item", "post", "blog") ||
    (has(text, "nieuws", "news") && has(text, "toevoegen", "add", "plaats", "post")) ||
    (sourceUrl &&
      has(text, "maak", "make", "item", "artikel", "article", "post", "blog", "nieuws", "news", "bericht"))
  ) {
    return build("add_news", 0.9, {
      // Title may stay empty; the server fills it from the linked article.
      title: extractTitle(text),
      needsImage,
      sourceUrl,
    });
  }
  if (has(text, "openingstijd", "opening hour", "opening time", "openingsuren")) {
    const times = extractTimes(rawText);
    return build("update_opening_hours", 0.85, times);
  }
  if (has(text, "faq", "veelgestelde", "vraag en antwoord", "frequently asked"))
    return build("add_faq", 0.8, { question: extractQuestion(rawText) });
  if (has(text, "foto", "afbeelding", "image", "picture") &&
      has(text, "verander", "wijzig", "vervang", "change", "replace", "update"))
    return build("change_image", 0.8, { needsImage: true });
  if (has(text, "tekst", "text", "wijzig", "verander", "aanpas", "edit", "change", "herschrijf", "rewrite"))
    return build("edit_text", 0.7, {});

  return build("unknown", 0.3, {});
}

/**
 * Async entry point used by the UI. Currently wraps the local heuristic
 * classifier. SWAP TARGET: replace the body with a fetch to a backend route
 * (e.g. POST /api/cms/analyze) that calls Claude or Gemini and returns the
 * same ParsedCommand shape.
 */
export async function analyzeCommand(rawText: string): Promise<ParsedCommand> {
  return classify(rawText);
}

// Human-friendly labels for the dashboard.
export const INTENT_LABELS: Record<IntentName, string> = {
  add_news: "Add news article",
  edit_text: "Edit text",
  add_page: "Add page",
  add_menu_item: "Add menu item",
  add_section: "Add section / module",
  update_opening_hours: "Update opening hours",
  add_faq: "Add FAQ",
  change_image: "Change image",
  set_image: "Set image",
  set_theme: "Edit theme",
  create_preview: "Create preview",
  approve_deploy: "Approve & deploy",
  clarify: "Needs clarification",
  unsupported: "Not supported",
  unknown: "Needs clarification",
};
