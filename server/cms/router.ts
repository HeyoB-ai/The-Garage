/**
 * /api/cms — Express mount of the AI-CMS API (local dev / self-hosted).
 *
 * Stateless flow shared with the Netlify Function via ./service:
 *   POST /api/cms/analyze   { text, source }      -> { command }   (analyzed)
 *   POST /api/cms/plan      { command }            -> { command }   (planned)
 *   POST /api/cms/preview   { command }            -> { command }   (preview_ready)
 *   POST /api/cms/approve   { command }            -> { command }   (approved)
 *   POST /api/cms/deploy    { command }            -> { command }   (live)
 *   POST /api/cms/cancel    { command }            -> { command }   (cancelled)
 *   GET  /api/cms/commands                         -> { commands }  (local store, debug)
 *
 * The client sends the full command back with each transition (the dashboard is
 * the source of truth), so this works identically on serverless. The local
 * in-memory store is kept only to support the debug GET endpoints.
 */
import { Router } from "express";
import type { ApiCommand, CommandAction } from "../../src/lib/cms/contract";
import { TransitionError } from "../../src/lib/cms/machine";
import { analyzeText, runTransition } from "./service";
import { store } from "./store";

export const cmsRouter = Router();

const ACTIONS: CommandAction[] = ["plan", "preview", "approve", "deploy", "cancel"];

cmsRouter.post("/analyze", (req, res) => {
  const { text, source } = req.body ?? {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Field 'text' is required." });
  }
  const command = analyzeText(text, source === "voice" ? "voice" : "text");
  store.save(command);
  res.json({ command });
});

for (const action of ACTIONS) {
  cmsRouter.post(`/${action}`, async (req, res) => {
    const command = (req.body ?? {}).command as ApiCommand | undefined;
    if (!command || !command.id) {
      return res.status(400).json({ error: "Field 'command' is required." });
    }
    try {
      const next = await runTransition(command, action, { allowLocalWrite: true });
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
