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

export async function runTransition(
  command: ApiCommand,
  action: CommandAction,
  opts: SideEffectOptions = { allowLocalWrite: true }
): Promise<ApiCommand> {
  const { ctx, prNumber } = await runSideEffects(action, command, opts);
  return { ...applyAction(command, action, ctx), prNumber };
}
