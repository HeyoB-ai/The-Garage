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
 * is identical to what the browser uses offline. This module only adds HTTP +
 * persistence. Real GitHub/Netlify/LLM wiring slots in behind the machine's
 * TransitionContext and the planner — see AI_AGENT_ARCHITECTURE.md.
 */
import { Router } from "express";
import type { CommandAction } from "../../src/lib/cms/contract";
import {
  applyAction,
  createCommand,
  TransitionError,
} from "../../src/lib/cms/machine";
import { store } from "./store";
import { writePlanFiles } from "./executor";

export const cmsRouter = Router();

const ACTIONS: CommandAction[] = ["plan", "preview", "approve", "deploy", "cancel"];

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
  cmsRouter.post(`/${action}`, (req, res) => {
    const { commandId } = req.body ?? {};
    const current = commandId ? store.get(commandId) : undefined;
    if (!current) {
      return res.status(404).json({ error: "Command not found." });
    }
    try {
      // The "preview" step is where the change is actually applied to disk.
      // Writes are guardrailed to content/ and public/images/ in the executor.
      const appliedFiles =
        action === "preview" ? writePlanFiles(current.plan).written : undefined;
      const next = applyAction(current, action, { appliedFiles });
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
