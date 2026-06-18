/**
 * Shared API contract between the dashboard (front-end) and the backend
 * (/api/cms/*). Pure types only — safe to import from both the browser and the
 * server. This is the stable surface the future LLM/GitHub/Netlify wiring plugs
 * into; keep it additive.
 */
import type { ChangeType, IntentName } from "./intent";
import type { FaqItem } from "../../types";

// A structured content mutation the server executor knows how to apply. Keeps
// generation pure (produce the value) while the executor handles the
// read-modify-write against real files. Additive — add new kinds as needed.
export type Mutation =
  | { kind: "createFile"; content: string }
  | { kind: "appendFaq"; entry: FaqItem }
  | { kind: "updateOpeningHours"; weekdays?: string; weekend?: string };

export type CommandStatus =
  | "analyzed"
  | "planned"
  | "preview_ready"
  | "approved"
  | "live"
  | "cancelled"
  | "error";

// The ordered "happy path" used by the dashboard stepper.
export const STATUS_FLOW: CommandStatus[] = [
  "analyzed",
  "planned",
  "preview_ready",
  "approved",
  "live",
];

export type CommandAction = "plan" | "preview" | "approve" | "deploy" | "cancel";

export interface PlannedFileChange {
  path: string;
  action: "create" | "update" | "delete";
  description: string;
  // Generated file contents, when the planner can already produce them (e.g.
  // a news article). For display in the dashboard.
  preview?: string;
  // Structured instruction the server executor applies to produce the final
  // file. createFile = full bytes; appendFaq / updateOpeningHours = read-modify-
  // write against the existing file.
  mutation?: Mutation;
}

export interface ChangePlan {
  summary: string;
  changeType: ChangeType;
  requiresApproval: boolean;
  files: PlannedFileChange[];
  warnings: string[];
}

export interface CommandLogEntry {
  step: string;
  message: string;
  at: string; // ISO timestamp
}

// One customer instruction and its full lifecycle. Mirrors the `ai_commands`
// table in DATABASE_SCHEMA.md (snake_case there, camelCase on the wire).
export interface ApiCommand {
  id: string;
  inputText: string;
  transcriptSource: "text" | "voice";
  intent: IntentName;
  confidence: number;
  changeType: ChangeType;
  requiresApproval: boolean;
  fields: Record<string, unknown>;
  // One-sentence summary of what the LLM planner understood (preferred over the
  // confidence number in the UI). Undefined for the keyword fallback.
  understood?: string;
  status: CommandStatus;
  branchName: string | null;
  previewUrl: string | null;
  prNumber: number | null;
  plan: ChangePlan | null;
  logs: CommandLogEntry[];
  createdAt: string;
  approvedAt: string | null;
  deployedAt: string | null;
}

// Standard envelope for every /api/cms response.
export interface CommandResponse {
  command: ApiCommand;
}
