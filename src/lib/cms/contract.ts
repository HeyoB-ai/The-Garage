/**
 * Shared API contract between the dashboard (front-end) and the backend
 * (/api/cms/*). Pure types only — safe to import from both the browser and the
 * server. This is the stable surface the future LLM/GitHub/Netlify wiring plugs
 * into; keep it additive.
 */
import type { ChangeType, IntentName } from "./intent";

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
  status: CommandStatus;
  branchName: string | null;
  previewUrl: string | null;
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
