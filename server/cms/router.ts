/**
 * /api/cms — the backend API surface for the AI-CMS.
 *
 * Endpoints (contract: src/lib/cms/contract.ts):
 *   POST /api/cms/analyze   { text, source }   -> ApiCommand (status: analyzed)
 *   POST /api/cms/plan      { commandId }       -> ApiCommand (status: planned)
 *   POST /api/cms/preview   { commandId }       -> ApiCommand (status: preview_ready)
 *   POST /api/cms/approve   { commandId }       -> ApiCommand (status: approved)
 *   POST /api/cms/deploy    { commandId }       -> ApiCommand (status: live)
 *   POST /api/cms/cancel    { commandId }       -> ApiCommand (status: cancelled)
 *   GET  /api/cms/commands                      -> { commands: ApiCommand[] }
 *   GET  /api/cms/commands/:id                  -> { command }
 *
 * Logic lives in the shared, pure state machine (src/lib/cms/machine.ts), which
 * is identical to what the browser uses offline. This module adds HTTP,
 * persistence, and side effects (filesystem + GitHub/Netlify) behind the
 * machine's TransitionContext. With no provider credentials it falls back to the
 * local executor + simulated branch/preview — see AI_AGENT_ARCHITECTURE.md.
 */
import { Router } from "express";
import type { ApiCommand, CommandAction } from "../../src/lib/cms/contract";
import {
  applyAction,
  createCommand,
  TransitionError,
} from "../../src/lib/cms/machine";
import type { TransitionContext } from "../../src/lib/cms/machine";
import { store } from "./store";
import { resolvePlanFiles, writePlanFiles } from "./executor";
import { getDeployProvider, getGitProvider } from "./providers";

export const cmsRouter = Router();

const ACTIONS: CommandAction[] = ["plan", "preview", "approve", "deploy", "cancel"];

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

/**
 * Run the side effects for a transition and return the TransitionContext +
 * any PR number to persist. With real providers this commits to GitHub and
 * derives a Netlify preview URL; otherwise it writes locally (mock path).
 */
async function runSideEffects(
  action: CommandAction,
  cmd: ApiCommand
): Promise<{ ctx: TransitionContext; prNumber: number | null }> {
  let prNumber = cmd.prNumber ?? null;

  if (action === "preview") {
    const git = getGitProvider();
    const deploy = getDeployProvider();
    // Final, guardrailed file contents (createFile + read-modify-write updates).
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
    // Mock path: write to the local working tree (great for dev).
    return { ctx: { appliedFiles: writePlanFiles(cmd.plan).written }, prNumber };
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

cmsRouter.post("/analyze", (req, res) => {
  const { text, source } = req.body ?? {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Field 'text' is required." });
  }
  const command = createCommand(text, source === "voice" ? "voice" : "text");
  store.save(command);
  res.json({ command });
});

for (const action of ACTIONS) {
  cmsRouter.post(`/${action}`, async (req, res) => {
    const { commandId } = req.body ?? {};
    const current = commandId ? store.get(commandId) : undefined;
    if (!current) {
      return res.status(404).json({ error: "Command not found." });
    }
    try {
      const { ctx, prNumber } = await runSideEffects(action, current);
      const next: ApiCommand = { ...applyAction(current, action, ctx), prNumber };
      store.save(next);
      res.json({ command: next });
    } catch (err) {
      if (err instanceof TransitionError) {
        return res.status(409).json({ error: err.message });
      }
      console.error("CMS transition error:", err);
      res.status(500).json({ error: "Internal error while applying the change." });
    }
  });
}

cmsRouter.get("/commands", (_req, res) => {
  res.json({ commands: store.list() });
});

cmsRouter.get("/commands/:id", (req, res) => {
  const command = store.get(req.params.id);
  if (!command) return res.status(404).json({ error: "Command not found." });
  res.json({ command });
});
