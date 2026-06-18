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
import { applyAction, createCommand } from "../../src/lib/cms/machine";
import type { TransitionContext } from "../../src/lib/cms/machine";
import { resolvePlanFiles, writePlanFiles } from "./executor";
import { getDeployProvider, getGitProvider } from "./providers";
import { draftFaqAnswer, draftNews, llmEnabled } from "./llm";

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

interface SideEffectOptions {
  /** Allow writing to the local working tree (Express dev). Off on serverless. */
  allowLocalWrite?: boolean;
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
    const files = resolvePlanFiles(cmd.plan);

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
      return { ctx: { appliedFiles: writePlanFiles(cmd.plan).written }, prNumber };
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
      const draft = await draftNews(cmd.inputText, title || "Nieuw bericht");
      if (draft) return { ...cmd, fields: { ...cmd.fields, ...draft } };
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
