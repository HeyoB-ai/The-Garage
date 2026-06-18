/**
 * Netlify Function: /api/cms/* (redirected to /.netlify/functions/cms/:splat).
 *
 * Serverless mount of the stateless CMS service. The action is taken from the
 * last path segment; transitions receive the full command in the body. Local
 * filesystem writes are disabled here (read-only runtime) — real changes happen
 * via the GitHub provider when GITHUB_TOKEN/GITHUB_REPO are configured in the
 * Netlify site's environment variables; otherwise the pipeline runs in
 * simulated mode.
 */
import type { ApiCommand, CommandAction } from "../../src/lib/cms/contract";
import { TransitionError } from "../../src/lib/cms/machine";
import { analyzeText, runTransition } from "../../server/cms/service";

const ACTIONS = new Set<CommandAction>(["plan", "preview", "approve", "deploy", "cancel"]);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ error: "POST only." }, 405);

  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  const action = segments[segments.length - 1];
  const body = await req.json().catch(() => ({} as any));

  try {
    if (action === "analyze") {
      if (!body.text || typeof body.text !== "string") {
        return json({ error: "Field 'text' is required." }, 400);
      }
      const command = analyzeText(body.text, body.source === "voice" ? "voice" : "text");
      return json({ command });
    }

    if (ACTIONS.has(action as CommandAction)) {
      const command = body.command as ApiCommand | undefined;
      if (!command || !command.id) {
        return json({ error: "Field 'command' is required." }, 400);
      }
      const next = await runTransition(command, action as CommandAction, {
        allowLocalWrite: false,
      });
      return json({ command: next });
    }

    return json({ error: `Unknown action "${action}".` }, 404);
  } catch (err) {
    if (err instanceof TransitionError) return json({ error: err.message }, 409);
    console.error("CMS function error:", err);
    return json({ error: "Internal error while applying the change." }, 500);
  }
};
