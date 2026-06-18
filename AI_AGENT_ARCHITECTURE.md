# AI Agent Architecture

How a spoken/typed customer instruction becomes a safe, live website change.
This document describes the **target** architecture; the current repository ships
the front-end scaffold and content layer for it (see "Current state" at the end).

---

## 1. End-to-end pipeline

```
 Customer            Dashboard            Backend / Agent           Git + Hosting
 ────────            ─────────            ───────────────           ─────────────
 1. speak/type  ──>  capture command
                     (voice or text)
                          │
 2. speech-to-text  <─────┘  (Web Speech API now; Whisper/Gemini later)
                          │
 3. transcript      ──>  POST /api/cms/analyze
                                          │
 4. intent analysis              LLM classifies intent
                                 (Claude / Gemini) ──> ParsedCommand
                                          │
 5. content vs structural?       guardrails decide approval need
                                          │
 6. apply change                 agent edits content/code on a NEW BRANCH
                                          │
 7. quality gate                 run `npm run typecheck` + `npm run build`
                                          │   (fail ⇒ stop, report)
                                          │
 8. commit + push  ───────────────────────────────────────────> branch on GitHub
                                          │
 9. preview deploy <──────────────────────────────────────────  Netlify Deploy Preview
                          │
10. customer approves <── preview link + Approve / Cancel
                          │
11. merge to main ────────────────────────────────────────────> PR merged
                          │
12. live deploy   <───────────────────────────────────────────  Netlify production
                          │
13. log            ──>  command_logs (every step persisted)
                          │
14. rollback        Git revert  OR  Netlify "publish previous deploy"  (always available)
```

Steps 6–7 differ by change type:

- **Content change** (news, FAQ, text, image, hours): the agent only edits JSON
  in `content/**` or `src/config/site.json` and image files in `public/**`. Low
  risk; preview is produced, publish may be near-automatic per guardrails.
- **Structural change** (page, section, menu item, form): the agent edits/adds
  components and config; **never merged without explicit customer approval**.

---

## 2. Component responsibilities

| Concern | Tool | Why |
| --- | --- | --- |
| Code/content edits, planning | **Claude API / Claude Code** | Strong at multi-file code edits, following guardrails, and reasoning about diffs. |
| Cheap content & multimodal | **Gemini** | Lower-cost text generation, audio transcription, image understanding. |
| Branches, commits, PRs | **GitHub API** | Source of truth; enables review + rollback via revert. |
| Preview & production deploy | **Netlify API** | Deploy Previews per branch; instant rollback via "publish previous deploy". |
| Users, projects, commands, logs | **Supabase** | Auth + Postgres for multi-tenant customer data (see `DATABASE_SCHEMA.md`). |
| Image / file uploads | **Supabase Storage** (or Netlify Blobs) | Stores customer-uploaded media; agent references the resulting URL. |

### Model routing (suggested)
- **Intent classification & small edits** → Gemini Flash (cheap, fast).
- **Structural/code generation & multi-file edits** → Claude (Opus/Sonnet).
- **Transcription** → Gemini or Whisper.

---

## 3. Backend API surface (to build)

The dashboard already speaks to a thin async layer (`src/lib/cms/intent.ts`).
The backend should expose:

```
POST /api/cms/analyze      { text }                  -> ParsedCommand
POST /api/cms/plan         { commandId }             -> change plan (files, diff summary)
POST /api/cms/apply        { commandId }             -> creates branch, commits, returns branchName
POST /api/cms/preview      { commandId }             -> triggers Netlify preview, returns previewUrl
POST /api/cms/approve      { commandId }             -> merges PR -> triggers prod deploy
POST /api/cms/cancel       { commandId }             -> closes branch/PR
GET  /api/cms/commands     ?customerId               -> list with status
```

`ParsedCommand` is already defined in `src/lib/cms/intent.ts` and is the contract
between front-end and back-end — keep it stable.

---

## 4. Multi-tenant model (many customer sites)

Each customer site is its own GitHub repo + Netlify site, cloned from this
template. The agent backend is shared and routes by `customer_id`:

- `customers.github_repo` → which repo to branch/commit in.
- `customers.netlify_site_id` → which site to preview/deploy.
- All commands and logs are scoped by `customer_id`.

This template is deliberately structured so a new customer site is
"clone → set site.json/menu.json → deploy".

---

## 5. SEO note

The app is a client-rendered SPA, so `Seo.tsx` sets the title/meta tags at
runtime. That is fine for sharing and for JS-capable crawlers. For full
crawler-grade SEO, add a **prerender step** at build time (e.g. `vite-plugin-ssg`
or Netlify prerendering) so each route ships static HTML. This is a future
enhancement and intentionally not added yet to avoid over-engineering.

## 6. Advisor API on Netlify

`server.ts` exposes `POST /api/advisor` (Gemini) in dev. The static Netlify
deploy does not run Express, so to keep the AI advisor working in production,
port that handler to a **Netlify Function** (`netlify/functions/advisor.ts`) and
add a redirect `/api/advisor -> /.netlify/functions/advisor`. The same pattern
hosts the `/api/cms/*` routes above. Until then the chat fails gracefully.

---

## 7. Current state (what ships in this repo today)

✅ Content layer: `content/**` (JSON) + `src/config/{site,menu}.json` + loaders in
   `src/lib/content.ts`.
✅ News module: overview (`/nieuws`), detail (`/nieuws/:slug`), example article.
✅ Dashboard scaffold: `/beheer` — text + voice input, command history, status
   stepper, preview/approve/cancel buttons (pipeline simulated client-side).
✅ Intent parser mock: `src/lib/cms/intent.ts` (heuristic, async, LLM-swap ready).
✅ **Backend API (step 1):** `/api/cms/{analyze,plan,preview,approve,deploy,cancel}`
   + `GET /commands` on the Express server (`server/cms/`), backed by an
   in-memory store. Logic lives in a shared pure state machine
   (`src/lib/cms/machine.ts`) + planner (`src/lib/cms/planner.ts`) that the
   browser reuses for an offline fallback. The dashboard is wired to it.
✅ Guardrails: `AI_CMS_GUARDRAILS.md` (forbidden-path check enforced in the planner).
✅ DB proposal: `DATABASE_SCHEMA.md`.

⬜ Remaining: swap the in-memory store for Supabase; swap the mock planner for a
   real LLM (Claude) that produces actual file diffs; wire `applyAction`'s
   TransitionContext to the GitHub API (branch/commit/PR) and Netlify API
   (preview/deploy); uploads, auth, prerender SEO — all designed above.

### Step-1 API quick reference

```
POST /api/cms/analyze   { text, source }   -> { command }   status: analyzed
POST /api/cms/plan      { commandId }       -> { command }   status: planned
POST /api/cms/preview   { commandId }       -> { command }   status: preview_ready (mock branch + preview URL)
POST /api/cms/approve   { commandId }       -> { command }   status: approved
POST /api/cms/deploy    { commandId }       -> { command }   status: live
POST /api/cms/cancel    { commandId }       -> { command }   status: cancelled
GET  /api/cms/commands                      -> { commands }
```
Invalid transitions return HTTP 409; unknown ids return 404.
