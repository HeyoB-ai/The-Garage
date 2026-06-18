/**
 * Pure command state machine — the single source of truth for the CMS
 * lifecycle, shared by the backend (server/cms) and the offline demo fallback
 * (browser). No I/O, no framework: given a command and an action it returns the
 * next command.
 *
 * The "apply" (branch/commit) and "preview"/"deploy" steps currently generate
 * MOCK identifiers. SWAP TARGET: inject real results via `TransitionContext`
 * (branchName from the GitHub API, previewUrl from the Netlify API) — the state
 * transitions themselves do not change.
 */
import type {
  ApiCommand,
  CommandAction,
  CommandLogEntry,
  CommandStatus,
} from "./contract";
import { classify } from "./intent";
import { buildPlan } from "./planner";

function nowIso(): string {
  return new Date().toISOString();
}

function rid(n = 5): string {
  return Math.random().toString(36).slice(2, 2 + n);
}

function logEntry(step: string, message: string): CommandLogEntry {
  return { step, message, at: nowIso() };
}

export interface TransitionContext {
  // Optional injected results from real providers (GitHub / Netlify).
  branchName?: string;
  previewUrl?: string;
  // Files actually written to disk by the server executor, for an honest log.
  appliedFiles?: string[];
}

export function createCommand(
  text: string,
  source: "text" | "voice" = "text"
): ApiCommand {
  const parsed = classify(text);
  return {
    id: `cmd_${Date.now().toString(36)}_${rid()}`,
    inputText: text,
    transcriptSource: source,
    intent: parsed.intent,
    confidence: parsed.confidence,
    changeType: parsed.changeType,
    requiresApproval: parsed.requiresApproval,
    fields: parsed.fields,
    status: "analyzed",
    branchName: null,
    previewUrl: null,
    plan: null,
    logs: [
      logEntry(
        "analyze",
        `Interpreted as "${parsed.intent}" (${Math.round(parsed.confidence * 100)}% confidence).`
      ),
    ],
    createdAt: nowIso(),
    approvedAt: null,
    deployedAt: null,
  };
}

class TransitionError extends Error {}

function expect(cmd: ApiCommand, status: CommandStatus, action: string): void {
  if (cmd.status !== status) {
    throw new TransitionError(
      `Cannot ${action}: command is "${cmd.status}", expected "${status}".`
    );
  }
}

function withLog(cmd: ApiCommand, entry: CommandLogEntry): CommandLogEntry[] {
  return [...cmd.logs, entry];
}

export function applyAction(
  cmd: ApiCommand,
  action: CommandAction,
  ctx: TransitionContext = {}
): ApiCommand {
  switch (action) {
    case "plan": {
      expect(cmd, "analyzed", "plan");
      const plan = buildPlan(cmd);
      return {
        ...cmd,
        plan,
        requiresApproval: plan.requiresApproval,
        status: "planned",
        logs: withLog(cmd, logEntry("plan", plan.summary)),
      };
    }

    case "preview": {
      expect(cmd, "planned", "create preview");
      const branchName =
        ctx.branchName ?? `cms/${cmd.intent.replace(/_/g, "-")}-${rid()}`;
      const previewUrl =
        ctx.previewUrl ??
        `https://deploy-preview-${rid(4)}--the-garage.netlify.app`;
      const applyMsg =
        ctx.appliedFiles && ctx.appliedFiles.length > 0
          ? `Wrote ${ctx.appliedFiles.length} file(s) on branch ${branchName}: ${ctx.appliedFiles.join(", ")}.`
          : `Committed changes to branch ${branchName}.`;
      let logs = withLog(cmd, logEntry("apply", applyMsg));
      logs = [...logs, logEntry("build", "typecheck + build passed.")];
      logs = [...logs, logEntry("preview", `Netlify preview ready at ${previewUrl}.`)];
      return { ...cmd, branchName, previewUrl, status: "preview_ready", logs };
    }

    case "approve": {
      expect(cmd, "preview_ready", "approve");
      return {
        ...cmd,
        status: "approved",
        approvedAt: nowIso(),
        logs: withLog(cmd, logEntry("approve", "Change approved by customer.")),
      };
    }

    case "deploy": {
      expect(cmd, "approved", "deploy");
      return {
        ...cmd,
        status: "live",
        deployedAt: nowIso(),
        logs: withLog(
          cmd,
          logEntry("deploy", `Merged ${cmd.branchName ?? "branch"} to main — live on production.`)
        ),
      };
    }

    case "cancel": {
      if (cmd.status === "live" || cmd.status === "cancelled") {
        throw new TransitionError(`Cannot cancel a "${cmd.status}" command.`);
      }
      return {
        ...cmd,
        status: "cancelled",
        logs: withLog(cmd, logEntry("cancel", "Change cancelled.")),
      };
    }

    default:
      throw new TransitionError(`Unknown action "${action}".`);
  }
}

export { TransitionError };
