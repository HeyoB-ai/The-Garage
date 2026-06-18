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
import type { ChangeType, IntentName } from "./intent";
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
  // Set true when no real deploy preview was produced (offline / GitHub off).
  previewSimulated?: boolean;
  previewNote?: string;
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
    prNumber: null,
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

/**
 * Build a command from an already-decided intent + fields (e.g. from the LLM
 * planner) instead of the keyword classifier. Same ApiCommand shape as
 * createCommand, so the rest of the pipeline is unchanged.
 */
export function createCommandFrom(
  text: string,
  source: "text" | "voice",
  opts: {
    intent: IntentName;
    changeType: ChangeType;
    requiresApproval: boolean;
    fields: Record<string, unknown>;
    understood?: string;
  }
): ApiCommand {
  return {
    id: `cmd_${Date.now().toString(36)}_${rid()}`,
    inputText: text,
    transcriptSource: source,
    intent: opts.intent,
    confidence: 1,
    changeType: opts.changeType,
    requiresApproval: opts.requiresApproval,
    fields: opts.fields,
    status: "analyzed",
    branchName: null,
    previewUrl: null,
    prNumber: null,
    plan: null,
    understood: opts.understood,
    logs: [logEntry("analyze", opts.understood || `Interpreted as "${opts.intent}".`)],
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

      // Real preview ONLY when the server produced a real Netlify preview URL.
      const isReal = ctx.previewSimulated !== true && Boolean(ctx.previewUrl);
      if (isReal) {
        const branchName = ctx.branchName ?? `cms/${cmd.intent.replace(/_/g, "-")}-${rid()}`;
        const applyMsg =
          ctx.appliedFiles && ctx.appliedFiles.length > 0
            ? `Wrote ${ctx.appliedFiles.length} file(s) on branch ${branchName}: ${ctx.appliedFiles.join(", ")}.`
            : `Committed changes to branch ${branchName}.`;
        let logs = withLog(cmd, logEntry("apply", applyMsg));
        logs = [...logs, logEntry("build", "typecheck + build passed.")];
        logs = [...logs, logEntry("preview", `Netlify preview ready at ${ctx.previewUrl}.`)];
        return {
          ...cmd,
          branchName,
          previewUrl: ctx.previewUrl ?? null,
          previewSimulated: false,
          previewNote: undefined,
          status: "preview_ready",
          logs,
        };
      }

      // Simulated: NO fake URL and NO false success logs — one honest line.
      const note =
        ctx.previewNote ?? "Preview gesimuleerd (demo) — er is geen echte deploy preview gemaakt.";
      return {
        ...cmd,
        branchName: ctx.branchName ?? null,
        previewUrl: null,
        previewSimulated: true,
        previewNote: note,
        status: "preview_ready",
        logs: withLog(cmd, logEntry("preview", "Gesimuleerd (demo) — niet echt gecommit of gedeployd.")),
      };
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
