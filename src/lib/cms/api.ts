/**
 * Front-end client for the /api/cms backend.
 *
 * Every call returns an ApiCommand. If the backend is unreachable (e.g. the
 * static Netlify deploy without functions, or offline), callers can fall back to
 * the pure machine in ./machine to keep the demo working — see DashboardPage.
 */
import type { ApiCommand, CommandAction, CommandResponse } from "./contract";

// The backend is stateless (it runs on serverless Functions in production), so
// the client is the source of truth and sends the full command with each
// transition rather than just an id.

const BASE = "/api/cms";

async function postCommand(path: string, body: unknown): Promise<ApiCommand> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `Request to ${path} failed (${res.status}).`);
  }
  const data = (await res.json()) as CommandResponse;
  return data.command;
}

export const cmsApi = {
  analyze: (text: string, source: "text" | "voice" = "text") =>
    postCommand("/analyze", { text, source }),

  transition: (command: ApiCommand, action: CommandAction) =>
    postCommand(`/${action}`, { command }),

  async list(): Promise<ApiCommand[]> {
    const res = await fetch(`${BASE}/commands`);
    if (!res.ok) throw new Error(`Failed to list commands (${res.status}).`);
    const data = (await res.json()) as { commands: ApiCommand[] };
    return data.commands;
  },
};
