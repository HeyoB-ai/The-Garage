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

// Error that carries the HTTP status, so callers can distinguish a server error
// (the server responded, e.g. 500/409) from being truly offline (fetch rejects).
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function postCommand(path: string, body: unknown): Promise<ApiCommand> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new ApiError(detail.error || `Request to ${path} failed (${res.status}).`, res.status);
  }
  const data = (await res.json()) as CommandResponse;
  return data.command;
}

export const cmsApi = {
  analyze: (text: string, source: "text" | "voice" = "text") =>
    postCommand("/analyze", { text, source }),

  // `extra` carries optional payload such as an uploaded image on preview.
  transition: (command: ApiCommand, action: CommandAction, extra?: Record<string, unknown>) =>
    postCommand(`/${action}`, { command, ...extra }),

  /**
   * Ask the server whether a deploy-preview URL is reachable yet. Any failure
   * resolves to { ready: false } so the UI keeps showing "building" and never
   * crashes (e.g. offline / no backend).
   */
  async previewStatus(url: string): Promise<{ ready: boolean }> {
    try {
      const res = await fetch(`${BASE}/preview-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) return { ready: false };
      const data = (await res.json()) as { ready?: boolean };
      return { ready: data.ready === true };
    } catch {
      return { ready: false };
    }
  },

  async list(): Promise<ApiCommand[]> {
    const res = await fetch(`${BASE}/commands`);
    if (!res.ok) throw new Error(`Failed to list commands (${res.status}).`);
    const data = (await res.json()) as { commands: ApiCommand[] };
    return data.commands;
  },
};
