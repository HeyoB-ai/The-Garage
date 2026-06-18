/**
 * Operation catalog + validation for the LLM planner.
 *
 * The planner returns a list of operations; we validate each against a strict
 * per-type field whitelist (unknown fields are dropped) and map known
 * operations to the EXISTING intents/executors. Two steering operations,
 * `clarify` and `unsupported`, carry a human-facing message instead of an
 * action.
 */
export type OperationType =
  | "add_news"
  | "edit_text"
  | "update_opening_hours"
  | "add_faq"
  | "add_section"
  | "clarify"
  | "unsupported";

// Operations that actually change the site (map to the existing executors).
export const ACTIONABLE_OPS: OperationType[] = [
  "add_news",
  "edit_text",
  "update_opening_hours",
  "add_faq",
  "add_section",
];

// Allowed fields per operation. Anything else the model sends is dropped.
const ALLOWED_FIELDS: Record<OperationType, string[]> = {
  add_news: ["title", "needsImage", "sourceUrl"],
  edit_text: ["targetId", "field", "value"],
  update_opening_hours: ["from", "to", "weekdays", "weekend"],
  add_faq: ["question", "answer"],
  add_section: ["sectionType", "menuLabel"],
  clarify: ["question"],
  unsupported: ["message"],
};

const KNOWN = new Set<string>(Object.keys(ALLOWED_FIELDS));

export interface ValidatedOp {
  type: OperationType;
  fields: Record<string, unknown>;
}

/** Validate raw planner output into a clean, whitelisted operation list. */
export function validateOperations(raw: unknown): ValidatedOp[] {
  if (!Array.isArray(raw)) return [];
  const out: ValidatedOp[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const type = (item as any).type;
    if (typeof type !== "string" || !KNOWN.has(type)) continue;

    // Accept fields either at the top level or nested under "fields".
    const nested = typeof (item as any).fields === "object" && (item as any).fields ? (item as any).fields : {};
    const bag = { ...nested, ...(item as any) };

    const fields: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS[type as OperationType]) {
      const v = bag[key];
      if (v !== undefined && v !== null && v !== "") fields[key] = v;
    }
    out.push({ type: type as OperationType, fields });
  }
  return out;
}

/**
 * Choose the operation to drive the command: prefer an actionable change,
 * otherwise a clarify, otherwise unsupported. Returns null if none usable.
 */
export function pickOperation(ops: ValidatedOp[]): ValidatedOp | null {
  return (
    ops.find((o) => ACTIONABLE_OPS.includes(o.type)) ||
    ops.find((o) => o.type === "clarify") ||
    ops.find((o) => o.type === "unsupported") ||
    null
  );
}
