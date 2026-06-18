/**
 * Server-side content executor.
 *
 * Writes the files described by a ChangePlan to disk. This is the only place in
 * the backend that mutates the working tree, so the guardrails are enforced
 * HARD here: writes are allowed ONLY inside content/ and public/images/, never
 * with path traversal, and only when the planner produced file contents
 * (`preview`). Image placeholders without bytes are skipped.
 *
 * Today this writes directly into the working tree (great for local dev — the
 * new article shows up immediately). SWAP TARGET: route these writes through a
 * GitHub provider (branch + commit) so changes land on a branch and Netlify can
 * build a real preview — see AI_AGENT_ARCHITECTURE.md.
 */
import fs from "fs";
import path from "path";
import type { ChangePlan } from "../../src/lib/cms/contract";

const ROOT = process.cwd();
const ALLOWED_PREFIXES = ["content/", "public/images/"];

function isAllowed(relPath: string): boolean {
  const norm = relPath.replace(/\\/g, "/");
  if (norm.includes("..")) return false;
  if (!ALLOWED_PREFIXES.some((p) => norm.startsWith(p))) return false;
  const abs = path.resolve(ROOT, norm);
  return abs.startsWith(ROOT + path.sep);
}

export interface ExecutionResult {
  written: string[];
  skipped: string[];
}

export function writePlanFiles(plan: ChangePlan | null): ExecutionResult {
  const written: string[] = [];
  const skipped: string[] = [];
  if (!plan) return { written, skipped };

  for (const f of plan.files) {
    if (f.action === "delete" || !f.preview || !isAllowed(f.path)) {
      skipped.push(f.path);
      continue;
    }
    const abs = path.resolve(ROOT, f.path);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, f.preview, "utf8");
    written.push(f.path);
  }
  return { written, skipped };
}
