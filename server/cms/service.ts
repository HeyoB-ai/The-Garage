/**
 * Stateless CMS service — the core used by BOTH the Express server and the
 * Netlify Function. It holds no state: `analyzeText` creates a command and
 * `runTransition` takes a full command + action and returns the next command,
 * running the side effects (filesystem write and/or GitHub commit + Netlify
 * preview) along the way.
 *
 * Statelessness is what lets this run on serverless Functions: the client is the
 * source of truth for command state and sends the whole command with each call.
 */
import type { ApiCommand, CommandAction } from "../../src/lib/cms/contract";
import { applyAction, createCommand, createCommandFrom } from "../../src/lib/cms/machine";
import type { TransitionContext } from "../../src/lib/cms/machine";
import { changeTypeFor, requiresApprovalFor, type IntentName } from "../../src/lib/cms/intent";
import { resolvePlanFiles, writeResolvedFiles, type ResolvedFile } from "./executor";
import { getDeployProvider, getGitProvider } from "./providers";
import { draftFaqAnswer, draftNews, fetchArticleText, fetchImageAsBase64, llmEnabled, planInstruction } from "./llm";
import { DEFAULT_IMAGE } from "../../src/lib/cms/executors/news";
import { buildSiteSnapshot, type SiteSnapshot } from "./snapshot";
import { pickOperation, validateOperations } from "./operations";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();

// An image uploaded from the dashboard (a data URL + original filename).
export interface UploadedImage {
  dataUrl: string;
  filename?: string;
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // ~4MB (serverless payload headroom)

function decodeDataUrl(dataUrl: string): { ext: string; base64: string } | null {
  const m = /^data:image\/(png|jpe?g|webp|gif|avif);base64,(.+)$/i.exec(dataUrl ?? "");
  if (!m) return null;
  let ext = m[1].toLowerCase();
  if (ext === "jpeg") ext = "jpg";
  const base64 = m[2];
  if (base64.length * 0.75 > MAX_IMAGE_BYTES) return null; // too large
  return { ext, base64 };
}

function isNewsJson(p: string): boolean {
  return /^content\/news\/.+\.json$/.test(p);
}

/* ---------------------------------------------------------------------- *
 * set_image: set/replace the photo on an EXISTING item (news / stock /
 * portfolio), targeted by id. News patches its JSON file; stock & portfolio
 * patch src/data.ts with a precise, validated edit.
 * ---------------------------------------------------------------------- */

export type SnapshotArea = "news" | "stock" | "portfolio";

/** Find which area an id belongs to, or null if it doesn't exist. */
export function resolveArea(targetId: string, snapshot: SiteSnapshot): SnapshotArea | null {
  if (snapshot.stock.some((s) => s.id === targetId)) return "stock";
  if (snapshot.portfolio.some((p) => p.id === targetId)) return "portfolio";
  if (snapshot.news.some((n) => n.id === targetId)) return "news";
  return null;
}

function findNewsFileBySlug(slug: string): { path: string; json: any } | null {
  try {
    for (const f of fs.readdirSync(path.join(ROOT, "content/news"))) {
      if (!f.endsWith(".json") || f.startsWith("_")) continue;
      const rel = `content/news/${f}`;
      const json = JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
      if (json?.slug === slug) return { path: rel, json };
    }
  } catch {
    /* ignore */
  }
  return null;
}

const countChar = (s: string, ch: string) => s.split(ch).length - 1;

/**
 * Precise, validated patch of an item's `image` field in src/data.ts. Finds the
 * object with `id: "<targetId>"`, replaces (or inserts) only its `image` value,
 * and verifies the result is structurally intact. Returns null on any doubt, so
 * the file is NEVER written in a broken state.
 */
function patchDataTsImage(text: string, targetId: string, imageRef: string): string | null {
  const safeRef = imageRef.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  if (/[\n\r]/.test(imageRef)) return null;

  let idIdx = text.indexOf(`id: "${targetId}"`);
  if (idIdx < 0) idIdx = text.indexOf(`id: '${targetId}'`);
  if (idIdx < 0) return null;

  // Bound the object to before the next `id:` so we patch the right one.
  const searchFrom = idIdx + 6;
  const nextDq = text.indexOf('id: "', searchFrom);
  const nextSq = text.indexOf("id: '", searchFrom);
  let nextIdx = -1;
  for (const n of [nextDq, nextSq]) if (n >= 0 && (nextIdx < 0 || n < nextIdx)) nextIdx = n;
  const regionEnd = nextIdx >= 0 ? nextIdx : text.length;

  const before = text.slice(0, idIdx);
  const region = text.slice(idIdx, regionEnd);
  const after = text.slice(regionEnd);

  const imgRe = /image:\s*(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/;
  let newRegion: string;
  if (imgRe.test(region)) {
    newRegion = region.replace(imgRe, `image: "${safeRef}"`);
  } else {
    const idLineEnd = region.indexOf("\n");
    if (idLineEnd < 0) return null;
    newRegion = region.slice(0, idLineEnd + 1) + `    image: "${safeRef}",\n` + region.slice(idLineEnd + 1);
  }
  const result = before + newRegion + after;

  // Validation: structure intact, exactly one matching id, image present.
  const ok =
    countChar(result, "{") === countChar(text, "{") &&
    countChar(result, "}") === countChar(text, "}") &&
    countChar(result, "[") === countChar(text, "[") &&
    countChar(result, "]") === countChar(text, "]") &&
    countChar(result, "id:") === countChar(text, "id:") &&
    countChar(result, "image:") >= countChar(text, "image:") &&
    result.includes(`image: "${safeRef}"`);
  return ok ? result : null;
}

/** Resolve the image bytes: uploaded image, else fetched URL, else the raw URL. */
async function resolveSetImageSource(
  image: UploadedImage | undefined,
  imageUrl: string | undefined
): Promise<{ kind: "local"; base64: string; ext: string } | { kind: "remote"; url: string } | null> {
  if (image) {
    const decoded = decodeDataUrl(image.dataUrl);
    if (decoded) return { kind: "local", ...decoded };
  }
  if (imageUrl) {
    const fetched = await fetchImageAsBase64(imageUrl);
    if (fetched) return { kind: "local", ...fetched };
    return { kind: "remote", url: imageUrl }; // fall back to the URL itself
  }
  return null;
}

async function buildSetImageFiles(cmd: ApiCommand, image?: UploadedImage): Promise<ResolvedFile[]> {
  const targetId = typeof cmd.fields.targetId === "string" ? cmd.fields.targetId : "";
  const area = cmd.fields.area as SnapshotArea | undefined;
  const imageUrl = typeof cmd.fields.imageUrl === "string" ? cmd.fields.imageUrl : undefined;
  if (!targetId || !area) return [];

  const src = await resolveSetImageSource(image, imageUrl);
  if (!src) return [];

  // Where the item will point, and the optional committed image file.
  let imageRef: string;
  let imageFile: ResolvedFile | null = null;
  if (src.kind === "local") {
    imageRef = `/images/${area}/${targetId}.${src.ext}`;
    imageFile = { path: `public/images/${area}/${targetId}.${src.ext}`, content: src.base64, encoding: "base64" };
  } else {
    imageRef = src.url;
  }

  const files: ResolvedFile[] = [];
  if (area === "news") {
    const nf = findNewsFileBySlug(targetId);
    if (!nf) return [];
    nf.json.image = imageRef;
    files.push({ path: nf.path, content: JSON.stringify(nf.json, null, 2) + "\n" });
  } else {
    let text: string | null = null;
    try {
      text = fs.readFileSync(path.join(ROOT, "src/data.ts"), "utf8");
    } catch {
      return [];
    }
    const patched = patchDataTsImage(text, targetId, imageRef);
    if (!patched) return []; // validation failed → never write a broken file
    files.push({ path: "src/data.ts", content: patched });
  }
  if (imageFile) files.push(imageFile);
  return files;
}

/* ---------------------------------------------------------------------- *
 * set_theme: edit brand tokens (colours, font, logo) in src/config/site.json.
 * ---------------------------------------------------------------------- */

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
export function isHexColor(v: unknown): v is string {
  return typeof v === "string" && HEX_RE.test(v);
}

/** Darken a hex colour (~18%) for hover/strong accent. Falls back to input. */
function darkenHex(hex: string): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return hex;
  const ch = (shift: number) => {
    const v = Math.round(((n >> shift) & 0xff) * 0.82);
    return Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
  };
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

async function buildSetThemeFiles(cmd: ApiCommand, image?: UploadedImage): Promise<ResolvedFile[]> {
  const f = cmd.fields;
  let site: any;
  try {
    site = JSON.parse(fs.readFileSync(path.join(ROOT, "src/config/site.json"), "utf8"));
  } catch {
    return [];
  }
  site.theme = site.theme ?? {};

  const accent = isHexColor(f.accentColor) ? f.accentColor : isHexColor(f.primaryColor) ? f.primaryColor : undefined;
  if (accent) {
    site.theme.accent = accent;
    site.theme.accentStrong = darkenHex(accent);
  }
  if (isHexColor(f.backgroundColor)) site.theme.background = f.backgroundColor;
  if (typeof f.fontFamily === "string" && f.fontFamily.trim()) site.theme.font = f.fontFamily.trim();

  // Logo: uploaded image or fetched URL, committed locally; else fall back to URL.
  const logoUrl = typeof f.logoUrl === "string" ? f.logoUrl : undefined;
  let logoFile: ResolvedFile | null = null;
  if (image || logoUrl) {
    const src = await resolveSetImageSource(image, logoUrl);
    if (src?.kind === "local") {
      site.theme.logo = `/images/brand/logo.${src.ext}`;
      logoFile = { path: `public/images/brand/logo.${src.ext}`, content: src.base64, encoding: "base64" };
    } else if (src?.kind === "remote") {
      site.theme.logo = src.url;
    }
  }

  const files: ResolvedFile[] = [
    { path: "src/config/site.json", content: JSON.stringify(site, null, 2) + "\n" },
  ];
  if (logoFile) files.push(logoFile);
  return files;
}

/**
 * Build the files for the preview commit: the plan's content files plus, for a
 * news article, the uploaded image (committed to public/images/news). The
 * article's `image` field is patched to point at the committed file; if no image
 * was uploaded, a placeholder /images/news path is swapped for a default remote
 * image so the article never renders broken.
 */
function buildPreviewFiles(cmd: ApiCommand, image?: UploadedImage): ResolvedFile[] {
  const files = resolvePlanFiles(cmd.plan);
  const newsFile = files.find((f) => isNewsJson(f.path));
  if (!newsFile) return files;

  let article: any;
  try {
    article = JSON.parse(newsFile.content);
  } catch {
    return files;
  }

  const decoded = image ? decodeDataUrl(image.dataUrl) : null;
  if (decoded && typeof article.slug === "string") {
    const imagePath = `public/images/news/${article.slug}.${decoded.ext}`;
    article.image = `/images/news/${article.slug}.${decoded.ext}`;
    newsFile.content = JSON.stringify(article, null, 2) + "\n";
    files.push({ path: imagePath, content: decoded.base64, encoding: "base64" });
  } else if (typeof article.image === "string" && article.image.startsWith("/images/news/")) {
    // Needed an image but none uploaded → avoid a broken link.
    article.image = DEFAULT_IMAGE;
    newsFile.content = JSON.stringify(article, null, 2) + "\n";
  }
  return files;
}

function shortId(n = 5): string {
  return Math.random().toString(36).slice(2, 2 + n);
}

function prBody(cmd: ApiCommand): string {
  return [
    `Automated change from the AI-CMS.`,
    ``,
    `**Instruction:** ${cmd.inputText}`,
    `**Intent:** ${cmd.intent} (${cmd.changeType})`,
    cmd.plan ? `**Plan:** ${cmd.plan.summary}` : "",
  ].join("\n");
}

export function analyzeText(text: string, source: "text" | "voice"): ApiCommand {
  return createCommand(text, source);
}

/**
 * Analyse an instruction. With an LLM key configured, uses the planner (free
 * text + site snapshot -> validated operation) and supports clarify/unsupported.
 * Without a key (or on any failure), falls back to the keyword classifier. The
 * returned ApiCommand has the same shape, so the rest of the pipeline is
 * unchanged.
 */
export async function planCommand(text: string, source: "text" | "voice"): Promise<ApiCommand> {
  if (!llmEnabled()) return createCommand(text, source); // keyword fallback (no key)

  try {
    const snapshot = buildSiteSnapshot();
    const result = await planInstruction(text, snapshot);
    if (result) {
      const op = pickOperation(validateOperations(result.operations));
      if (op) {
        const intent = op.type as IntentName;
        const fields: Record<string, unknown> = { ...op.fields };

        // set_image: resolve the target id to an area, or ask which item.
        if (intent === "set_image") {
          const targetId = typeof fields.targetId === "string" ? fields.targetId : "";
          const area = targetId ? resolveArea(targetId, snapshot) : null;
          if (!area) {
            return createCommandFrom(text, source, {
              intent: "clarify",
              changeType: "unknown",
              requiresApproval: false,
              fields: {
                question:
                  "Welk item bedoel je precies? Noem bijvoorbeeld het nieuwsbericht of het voertuig waarvan je de foto wilt aanpassen.",
              },
              understood: result.understood,
            });
          }
          fields.area = area;
          if (typeof fields.image === "string" && /^https?:\/\//i.test(fields.image)) {
            fields.imageUrl = fields.image;
          }
          delete fields.image;
        }

        // set_theme: validate colours as hex, move a logo URL aside.
        if (intent === "set_theme") {
          for (const key of ["primaryColor", "accentColor", "backgroundColor"]) {
            const v = fields[key];
            if (v != null && !isHexColor(v)) {
              return createCommandFrom(text, source, {
                intent: "clarify",
                changeType: "unknown",
                requiresApproval: false,
                fields: {
                  question:
                    "Welke kleur bedoel je precies? Geef een geldige hex-kleur, bijvoorbeeld #22c55e voor groen.",
                },
                understood: result.understood,
              });
            }
          }
          if (typeof fields.logo === "string" && /^https?:\/\//i.test(fields.logo)) {
            fields.logoUrl = fields.logo;
          }
          delete fields.logo;
        }

        // Robustness for add_news: derive image/source hints from the raw text.
        if (intent === "add_news") {
          if (fields.needsImage == null) {
            fields.needsImage = /foto|afbeelding|image|picture|plaatje/i.test(text);
          }
          if (!fields.sourceUrl) {
            const m = text.match(/https?:\/\/[^\s)<>"']+/i);
            if (m) fields.sourceUrl = m[0];
          }
        }

        return createCommandFrom(text, source, {
          intent,
          changeType: changeTypeFor(intent),
          requiresApproval: requiresApprovalFor(intent),
          fields,
          understood: result.understood,
        });
      }
      // Model replied but produced no usable operation → friendly clarify.
      return createCommandFrom(text, source, {
        intent: "clarify",
        changeType: "unknown",
        requiresApproval: false,
        fields: { question: "Sorry, I didn't fully understand that. Could you rephrase what you'd like to change?" },
        understood: result.understood,
      });
    }
  } catch (err) {
    console.error("LLM planner failed; falling back to keyword classifier:", err);
  }
  return createCommand(text, source); // safe fallback on any failure
}

interface SideEffectOptions {
  /** Allow writing to the local working tree (Express dev). Off on serverless. */
  allowLocalWrite?: boolean;
  /** Image uploaded from the dashboard, committed during preview. */
  image?: UploadedImage;
}

async function runSideEffects(
  action: CommandAction,
  cmd: ApiCommand,
  opts: SideEffectOptions
): Promise<{ ctx: TransitionContext; prNumber: number | null }> {
  let prNumber = cmd.prNumber ?? null;

  if (action === "preview") {
    const git = getGitProvider();
    const deploy = getDeployProvider();
    const files =
      cmd.intent === "set_image"
        ? await buildSetImageFiles(cmd, opts.image)
        : cmd.intent === "set_theme"
        ? await buildSetThemeFiles(cmd, opts.image)
        : buildPreviewFiles(cmd, opts.image);

    if (git.enabled && files.length > 0) {
      const branch = `cms/${cmd.intent.replace(/_/g, "-")}-${shortId()}`;
      await git.createBranchWithCommit(branch, files, `CMS: ${cmd.plan?.summary ?? cmd.intent}`);
      const pr = await git.openPullRequest(branch, cmd.plan?.summary ?? cmd.intent, prBody(cmd));
      prNumber = pr.number || null;
      const previewUrl = deploy.enabled
        ? deploy.previewUrlForBranch(branch, pr.number)
        : undefined;
      if (previewUrl) {
        return {
          ctx: { branchName: branch, previewUrl, appliedFiles: files.map((f) => f.path), previewSimulated: false },
          prNumber,
        };
      }
      // Committed for real, but no Netlify preview URL available.
      return {
        ctx: {
          branchName: branch,
          appliedFiles: files.map((f) => f.path),
          previewSimulated: true,
          previewNote: "Wijziging gecommit, maar geen Netlify preview-URL beschikbaar (NETLIFY_SITE_NAME ontbreekt).",
        },
        prNumber,
      };
    }

    // No GitHub provider ⇒ no real commit/deploy. Be honest about it.
    const note = "GitHub niet geconfigureerd (GITHUB_TOKEN/GITHUB_REPO ontbreekt) — preview gesimuleerd.";
    if (opts.allowLocalWrite) {
      return {
        ctx: { appliedFiles: writeResolvedFiles(files).written, previewSimulated: true, previewNote: note },
        prNumber,
      };
    }
    return { ctx: { previewSimulated: true, previewNote: note }, prNumber };
  }

  if (action === "deploy") {
    const git = getGitProvider();
    if (git.enabled && prNumber) await git.mergePullRequest(prNumber);
  }

  if (action === "cancel") {
    const git = getGitProvider();
    if (git.enabled && prNumber) {
      await git.closePullRequest(prNumber).catch(() => undefined);
    }
  }

  return { ctx: {}, prNumber };
}

/**
 * Before planning, enrich the command's fields with real LLM-drafted copy
 * (news excerpt/body, FAQ answer). Fail-safe: any miss leaves the placeholders.
 * The drafted copy lands in `fields`, which the planner's generators read.
 */
async function enrichWithCopy(cmd: ApiCommand): Promise<ApiCommand> {
  if (!llmEnabled()) return cmd;
  try {
    if (cmd.intent === "add_news") {
      const title = typeof cmd.fields.title === "string" ? cmd.fields.title : "";
      const sourceUrl = typeof cmd.fields.sourceUrl === "string" ? cmd.fields.sourceUrl : "";

      // If a source link was given, fetch + summarize it (fail-safe).
      let source: { url: string; text: string } | undefined;
      if (sourceUrl) {
        const text = await fetchArticleText(sourceUrl);
        if (text) source = { url: sourceUrl, text };
      }

      const draft = await draftNews(cmd.inputText, title || "Nieuw bericht", source);
      if (draft) {
        const fields: Record<string, unknown> = {
          ...cmd.fields,
          excerpt: draft.excerpt,
          body: draft.body,
        };
        // Fill the title from the draft only if the instruction didn't have one.
        if (!title && draft.title) fields.title = draft.title;
        return { ...cmd, fields };
      }
    } else if (cmd.intent === "add_faq") {
      const q = typeof cmd.fields.question === "string" ? cmd.fields.question : "";
      const answer = await draftFaqAnswer(q || cmd.inputText);
      if (answer) return { ...cmd, fields: { ...cmd.fields, answer } };
    }
  } catch (err) {
    console.error("Copy enrichment failed; using placeholders:", err);
  }
  return cmd;
}

export type RunTransitionOptions = SideEffectOptions;

export async function runTransition(
  command: ApiCommand,
  action: CommandAction,
  opts: SideEffectOptions = { allowLocalWrite: true }
): Promise<ApiCommand> {
  // Draft real copy at plan time (when the content is generated).
  const cmd = action === "plan" ? await enrichWithCopy(command) : command;
  const { ctx, prNumber } = await runSideEffects(action, cmd, opts);
  return { ...applyAction(cmd, action, ctx), prNumber };
}

/**
 * Server-side reachability check for a Netlify deploy preview (no CORS issues).
 * Only probes *.netlify.app hosts, so it can't be used to scan arbitrary URLs.
 * Returns true only on a 2xx response; false on 404 / error / timeout.
 */
export async function checkPreviewReady(url: string): Promise<boolean> {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return false;
  }
  if (!host.endsWith(".netlify.app")) return false;

  const probe = async (method: "HEAD" | "GET"): Promise<boolean> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "TheGarageCMS/1.0 (+preview check)" },
      });
      return res.ok; // 2xx only
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  };

  // HEAD first; some hosts don't support it, so fall back to GET.
  if (await probe("HEAD")) return true;
  return probe("GET");
}
