/**
 * Server-side content executor.
 *
 * Turns a ChangePlan's structured mutations into final file contents and writes
 * them. The only place in the backend that mutates the working tree, so the
 * guardrails are enforced HARD here: writes are allowed ONLY inside content/,
 * public/images/, and the single file src/config/site.json — never with path
 * traversal, never a forbidden file (.env, server.ts, menu.json, …).
 *
 * `resolvePlanFiles` computes the final {path, content} for each change
 * (createFile = bytes as-is; appendFaq / updateOpeningHours = read-modify-write
 * against the current file). `writePlanFiles` persists them locally. The same
 * resolved files are committed to GitHub on the real provider path, so content
 * updates work on both paths.
 *
 * NOTE: read-modify-write reads the local repo, which is correct for a
 * single-repo deploy. For a remote multi-tenant repo the read would go through
 * the GitHub API instead — see AI_AGENT_ARCHITECTURE.md.
 */
import fs from "fs";
import path from "path";
import type { ChangePlan, PlannedFileChange } from "../../src/lib/cms/contract";
import type { FaqItem } from "../../src/types";

const ROOT = process.cwd();
const ALLOWED_PREFIXES = ["content/", "public/images/"];
// src/data.ts holds stock/portfolio data and is patched (validated) by set_image.
const ALLOWED_FILES = ["src/config/site.json", "src/data.ts"];

function isAllowed(relPath: string): boolean {
  const norm = relPath.replace(/\\/g, "/");
  if (norm.includes("..")) return false;
  const ok =
    ALLOWED_PREFIXES.some((p) => norm.startsWith(p)) || ALLOWED_FILES.includes(norm);
  if (!ok) return false;
  const abs = path.resolve(ROOT, norm);
  return abs.startsWith(ROOT + path.sep);
}

function readJson(abs: string): any {
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch {
    return null;
  }
}

export interface ResolvedFile {
  path: string;
  content: string;
  encoding?: "utf8" | "base64";
}

/** True when this path may be written (re-exported guardrail for callers). */
export function isWritablePath(relPath: string): boolean {
  return isAllowed(relPath);
}

/** Compute the final file content for each mutation in the plan. */
export function resolvePlanFiles(plan: ChangePlan | null): ResolvedFile[] {
  if (!plan) return [];
  const resolved: ResolvedFile[] = [];

  for (const f of plan.files) {
    const content = resolveOne(f);
    if (content !== null) resolved.push({ path: f.path, content });
  }
  return resolved;
}

function resolveOne(f: PlannedFileChange): string | null {
  if (!f.mutation || !isAllowed(f.path)) return null;
  const abs = path.resolve(ROOT, f.path);

  switch (f.mutation.kind) {
    case "createFile":
      return f.mutation.content;

    case "appendFaq": {
      const data = readJson(abs);
      if (!data) return null; // never truncate: skip if the file can't be read
      const items: FaqItem[] = Array.isArray(data.items) ? data.items : [];
      const maxOrder = items.reduce((m, i) => Math.max(m, i.order ?? 0), 0);
      const entry: FaqItem = { ...f.mutation.entry, order: maxOrder + 1 };
      // Avoid duplicate ids.
      if (items.some((i) => i.id === entry.id)) {
        entry.id = `${entry.id}-${items.length + 1}`;
      }
      data.items = [...items, entry];
      return JSON.stringify(data, null, 2) + "\n";
    }

    case "updateOpeningHours": {
      const data = readJson(abs);
      if (!data) return null; // site.json must exist
      data.openingHours = data.openingHours ?? {};
      if (f.mutation.weekdays) data.openingHours.weekdays = f.mutation.weekdays;
      if (f.mutation.weekend) data.openingHours.weekend = f.mutation.weekend;
      return JSON.stringify(data, null, 2) + "\n";
    }

    default:
      return null;
  }
}

export interface ExecutionResult {
  written: string[];
  skipped: string[];
}

/** Write already-resolved files (text or base64 binary) to the working tree. */
export function writeResolvedFiles(files: ResolvedFile[]): ExecutionResult {
  const written: string[] = [];
  const skipped: string[] = [];
  for (const f of files) {
    if (!isAllowed(f.path)) {
      skipped.push(f.path);
      continue;
    }
    const abs = path.resolve(ROOT, f.path);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    if (f.encoding === "base64") {
      fs.writeFileSync(abs, Buffer.from(f.content, "base64"));
    } else {
      fs.writeFileSync(abs, f.content, "utf8");
    }
    written.push(f.path);
  }
  return { written, skipped };
}

/** Resolve and write the plan's files to the local working tree. */
export function writePlanFiles(plan: ChangePlan | null): ExecutionResult {
  return writeResolvedFiles(resolvePlanFiles(plan));
}
