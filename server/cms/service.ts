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
import { draftFaqAnswer, draftNews, fetchArticleText, llmEnabled, planInstruction } from "./llm";
import { DEFAULT_IMAGE } from "../../src/lib/cms/executors/news";
import { buildSiteSnapshot } from "./snapshot";
import { pickOperation, validateOperations } from "./operations";

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
    const files = buildPreviewFiles(cmd, opts.image);

    if (git.enabled && files.length > 0) {
      const branch = `cms/${cmd.intent.replace(/_/g, "-")}-${shortId()}`;
      await git.createBranchWithCommit(branch, files, `CMS: ${cmd.plan?.summary ?? cmd.intent}`);
      const pr = await git.openPullRequest(branch, cmd.plan?.summary ?? cmd.intent, prBody(cmd));
      prNumber = pr.number || null;
      const previewUrl = deploy.enabled
        ? deploy.previewUrlForBranch(branch, pr.number)
        : undefined;
      return {
        ctx: { branchName: branch, previewUrl, appliedFiles: files.map((f) => f.path) },
        prNumber,
      };
    }

    if (opts.allowLocalWrite) {
      return { ctx: { appliedFiles: writeResolvedFiles(files).written }, prNumber };
    }
    // No provider + no local write ⇒ machine generates a simulated branch/preview.
    return { ctx: {}, prNumber };
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
