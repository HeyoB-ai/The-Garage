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
import { analyzeText, checkPreviewReady, runTransition } from "./service";
import { getStore } from "./stores";

export const cmsRouter = Router();

const ACTIONS: CommandAction[] = ["plan", "preview", "approve", "deploy", "cancel"];

cmsRouter.post("/analyze", async (req, res) => {
  const { text, source, customerId } = req.body ?? {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Field 'text' is required." });
  }
  const command = analyzeText(text, source === "voice" ? "voice" : "text");
  await getStore().save(command, customerId ?? null);
  res.json({ command });
});

for (const action of ACTIONS) {
  cmsRouter.post(`/${action}`, async (req, res) => {
    const { command, customerId, image } = req.body ?? {};
    if (!command || !(command as ApiCommand).id) {
      return res.status(400).json({ error: "Field 'command' is required." });
    }
    try {
      const next = await runTransition(command, action, { allowLocalWrite: true, image });
      await getStore().save(next, customerId ?? null);
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

cmsRouter.post("/preview-status", async (req, res) => {
  const url = (req.body ?? {}).url;
  if (typeof url !== "string" || !url) {
    return res.status(400).json({ error: "Field 'url' is required.", ready: false });
  }
  res.json({ ready: await checkPreviewReady(url) });
});

cmsRouter.get("/commands", async (req, res) => {
  const customerId = typeof req.query.customerId === "string" ? req.query.customerId : undefined;
  res.json({ commands: await getStore().list({ customerId }) });
});

cmsRouter.get("/commands/:id", async (req, res) => {
  const command = await getStore().get(req.params.id);
  if (!command) return res.status(404).json({ error: "Command not found." });
  res.json({ command });
});
