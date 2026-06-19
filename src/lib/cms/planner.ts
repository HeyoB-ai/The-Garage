/**
 * Mock change planner.
 *
 * Given a parsed intent, produce a concrete ChangePlan: which files would be
 * touched and a human summary. Today the mapping is deterministic and rule
 * based. SWAP TARGET: replace `buildPlan` with an LLM call (Claude) that reads
 * the repo and proposes a real diff — the returned shape stays the same.
 *
 * The planner also runs a guardrail check: it never plans a write to a
 * forbidden path (see AI_CMS_GUARDRAILS.md). Forbidden hits become warnings and
 * force approval.
 */
import type { ChangePlan, PlannedFileChange } from "./contract";
import type { ChangeType, IntentName } from "./intent";
import { slugify } from "./slug";
import { DEFAULT_IMAGE } from "./executors/news";
import { buildFaqEntry } from "./executors/faq";
import { buildOpeningHours } from "./executors/openingHours";

export interface PlanInput {
  intent: IntentName;
  confidence: number;
  changeType: ChangeType;
  requiresApproval: boolean;
  fields: Record<string, unknown>;
}

// Paths the agent may never write (subset of guardrails, enforced here too).
const FORBIDDEN_PATTERNS: RegExp[] = [
  /^\.env/,
  /(^|\/)server\.ts$/,
  /vite\.config/,
  /netlify\.toml$/,
  /(^|\/)package(-lock)?\.json$/,
  /tsconfig.*\.json$/,
  /(^|\/)\.github\//,
];

export function isForbiddenPath(path: string): boolean {
  return FORBIDDEN_PATTERNS.some((re) => re.test(path));
}

function str(fields: Record<string, unknown>, key: string): string | undefined {
  const v = fields[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export function buildPlan(input: PlanInput, today = new Date()): ChangePlan {
  const { intent, fields } = input;
  const dateStr = today.toISOString().slice(0, 10);
  const files: PlannedFileChange[] = [];
  const warnings: string[] = [];
  let summary = "";

  switch (intent) {
    case "add_news": {
      // New content layer: a record in data.json#news + prose in the source
      // locale. Other languages are translated in a later step (hook below).
      const title = str(fields, "title") ?? "Nieuw bericht";
      const excerpt = str(fields, "excerpt") ?? `${title}.`;
      const sourceLocale = str(fields, "sourceLocale") ?? "en";
      const id = slugify(title) || `news-${dateStr}`;
      const record = { id, date: dateStr, image: DEFAULT_IMAGE, sourceLocale };

      files.push({
        path: "content/site/data.json",
        action: "update",
        description: `Add news record "${title}" (${id})`,
        preview: JSON.stringify(record, null, 2),
        mutation: { kind: "appendNewsRecord", record },
      });
      files.push({
        path: `content/site/${sourceLocale}.json`,
        action: "update",
        description: `Add ${sourceLocale} news text for "${title}"`,
        preview: JSON.stringify({ title, excerpt }, null, 2),
        mutation: { kind: "setNewsProse", id, title, excerpt },
      });
      warnings.push(
        `Written in ${sourceLocale}; the other languages can be auto-translated next (TODO: translate_content).`
      );
      summary = `Add news "${title}" to the content layer (${sourceLocale}). Set a photo afterwards with "set a photo on ${id}".`;
      break;
    }
    case "add_faq": {
      const entry = buildFaqEntry(str(fields, "question") ?? "", str(fields, "answer"));
      files.push({
        path: "content/faq/faq.json",
        action: "update",
        description: `Append FAQ "${entry.question}"`,
        preview: JSON.stringify(entry, null, 2),
        mutation: { kind: "appendFaq", entry },
      });
      summary = `Add a new FAQ "${entry.question}".`;
      break;
    }
    case "update_opening_hours": {
      const from = str(fields, "from");
      const to = str(fields, "to");
      const hours = buildOpeningHours(from, to);
      if (!hours.weekdays) {
        warnings.push("No clear opening times found — please state them like '09:00 - 17:00'.");
      }
      files.push({
        path: "content/site/data.json",
        action: "update",
        description: "Update openingHours.weekdays (time range) in the site content layer",
        preview: JSON.stringify(hours, null, 2),
        mutation: { kind: "updateOpeningHours", ...hours },
      });
      summary = hours.weekdays
        ? `Update weekday opening hours to ${from} – ${to}.`
        : "Update opening hours (times unclear — needs confirmation).";
      break;
    }
    case "change_image":
      files.push({
        path: "public/images/...",
        action: "create",
        description: "Add/replace an image asset",
      });
      warnings.push("Target image and reference need to be confirmed.");
      summary = "Replace or add an image and update the reference.";
      break;
    case "edit_text":
      files.push({
        path: "content/... or src/config/site.json",
        action: "update",
        description: "Edit an existing text field",
      });
      warnings.push("The exact text field to edit needs to be located.");
      summary = "Edit an existing piece of text content.";
      break;
    case "add_section": {
      const sectionType = str(fields, "sectionType");
      const menuLabel = str(fields, "menuLabel");
      files.push({
        path: `src/components/sections/${sectionType ?? "NewSection"}.tsx`,
        action: "create",
        description: "New reusable section component",
      });
      if (menuLabel) {
        files.push({
          path: "src/config/menu.json",
          action: "update",
          description: `Add menu item "${menuLabel}"`,
        });
      }
      summary = `Add a new ${sectionType ?? "custom"} section${menuLabel ? ` with a "${menuLabel}" menu item` : ""} (structural).`;
      break;
    }
    case "add_menu_item": {
      const label = str(fields, "label");
      files.push({
        path: "src/config/menu.json",
        action: "update",
        description: `Add menu item${label ? ` "${label}"` : ""}`,
      });
      summary = "Add a navigation menu item (structural).";
      break;
    }
    case "add_page": {
      const title = str(fields, "title") ?? "New Page";
      const slug = slugify(title) || "new-page";
      files.push(
        {
          path: `content/pages/${slug}.json`,
          action: "create",
          description: `New page "${title}"`,
        },
        {
          path: "src/main.tsx",
          action: "update",
          description: "Register the new route",
        }
      );
      summary = `Add a new page "${title}" with its own route (structural).`;
      break;
    }
    case "set_image": {
      const targetId = str(fields, "targetId") ?? "item";
      const area = str(fields, "area") ?? "item";
      files.push({
        path: "content/site/data.json",
        action: "update",
        description: `Set the image of ${area} item "${targetId}" in the content layer`,
      });
      files.push({
        path: `public/images/${area}/${targetId}`,
        action: "create",
        description: "Image asset (uploaded or fetched at preview)",
      });
      summary = `Set/replace the image on ${area} item "${targetId}".`;
      break;
    }
    case "set_theme": {
      const parts: string[] = [];
      if (str(fields, "accentColor") || str(fields, "primaryColor")) parts.push("accent colour");
      if (str(fields, "backgroundColor")) parts.push("background");
      if (str(fields, "fontFamily")) parts.push("font");
      if (str(fields, "logoUrl") || fields.needsImage) parts.push("logo");
      files.push({
        path: "content/site/theme.json",
        action: "update",
        description: "Update theme tokens (colours / font / logo)",
      });
      summary = `Update the site theme${parts.length ? `: ${parts.join(", ")}` : ""}.`;
      break;
    }
    case "create_preview":
      summary = "Create a preview deploy for the current change.";
      break;
    case "approve_deploy":
      summary = "Approve the pending change and publish it live.";
      break;
    default:
      warnings.push("The instruction could not be confidently understood.");
      summary = "No actionable plan — please rephrase the request.";
  }

  // Guardrail: forbidden paths can never be auto-written.
  let requiresApproval = input.requiresApproval;
  for (const f of files) {
    if (isForbiddenPath(f.path)) {
      warnings.push(`Blocked: ${f.path} is a protected file and cannot be changed automatically.`);
      requiresApproval = true;
    }
  }
  if (input.confidence < 0.5) {
    warnings.push("Low confidence — human review recommended.");
    requiresApproval = true;
  }

  return { summary, changeType: input.changeType, requiresApproval, files, warnings };
}
