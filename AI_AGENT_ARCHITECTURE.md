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

## 6. Serverless backend on Netlify (implemented)

The backend runs as **Netlify Functions** in production (`netlify/functions/`):
`cms.ts` serves `/api/cms/*` and `advisor.ts` serves `/api/advisor`, wired via
redirects in `netlify.toml` (before the SPA fallback). In dev the same logic is
served by Express (`server.ts`); both call the shared stateless service
(`server/cms/service.ts`).

Because Functions are stateless, the command flow is **client-authoritative**:
the dashboard holds each command and sends the full object back with every
transition (no server-side store needed). Local filesystem writes are disabled
on the Function (read-only runtime) — real changes happen through the GitHub
provider when credentials are set; otherwise the pipeline runs simulated.

**To make the live CMS create real content**, set these as environment variables
on the Netlify site (Site settings → Environment variables) — never in the repo:
`GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_DEFAULT_BRANCH`, `NETLIFY_SITE_NAME`
(= `voicecms`), and `GEMINI_API_KEY` for the advisor. With those set, `preview`
commits the generated content to a branch + opens a PR, Netlify builds the
Deploy Preview, `deploy` merges it live, `cancel` closes it.

---

## 7. Current state (what ships in this repo today)

✅ Content layer: `content/**` (JSON) + `src/config/{site,menu}.json` + loaders in
   `src/lib/content.ts`.
✅ News module: overview (`/nieuws`), detail (`/nieuws/:slug`), example article.
✅ Dashboard scaffold: `/beheer` — text + voice input, command history, status
   stepper, preview/approve/cancel buttons (pipeline simulated client-side).
✅ **LLM planner with site context:** `planCommand` (server) builds a compact
   `buildSiteSnapshot()` (news, stock, FAQ, sections, pages, opening hours, theme)
   and sends `{instruction, snapshot}` to the LLM, which returns validated
   operations (`server/cms/operations.ts`) mapped to the existing intents/
   executors, plus `clarify` / `unsupported` steering. Falls back to the keyword
   classifier (`src/lib/cms/intent.ts`) when no LLM key is set.
✅ **Backend API (step 1):** `/api/cms/{analyze,plan,preview,approve,deploy,cancel}`
   + `GET /commands` on the Express server (`server/cms/`), backed by an
   in-memory store. Logic lives in a shared pure state machine
   (`src/lib/cms/machine.ts`) + planner (`src/lib/cms/planner.ts`) that the
   browser reuses for an offline fallback. The dashboard is wired to it.
✅ Guardrails: `AI_CMS_GUARDRAILS.md` (forbidden-path check enforced in the planner).
✅ DB proposal: `DATABASE_SCHEMA.md`.

✅ **Content executor (step 2):** the `add_news` intent now generates a real,
   valid article file (`src/lib/cms/executors/news.ts`) and the server writes it
   to disk on `preview` (`server/cms/executor.ts`), guardrailed to `content/` and
   `public/images/` only. The generated content is shown in the dashboard plan.

✅ **GitHub + Netlify providers (step 3):** `server/cms/providers/` — a real
   `GitHubProvider` (commits via the REST Contents API: branch → commit → PR →
   merge) and a `NetlifyProvider` (deterministic Deploy-Preview URLs), behind a
   `GitProvider`/`DeployProvider` seam with an env-gated factory. When
   `GITHUB_TOKEN`+`GITHUB_REPO` (and `NETLIFY_SITE_NAME`) are set, `preview`
   commits to a branch and opens a PR, `deploy` merges it, `cancel` closes it.
   With no credentials it falls back to the local executor + simulated preview —
   nothing outward-facing happens without explicit configuration.

✅ **More content generators (step 4):** `add_faq` (`executors/faq.ts`) and
   `update_opening_hours` (`executors/openingHours.ts`). These are *updates*, so
   the executor is now mutation-driven (`createFile` / `appendFaq` /
   `updateOpeningHours`) with read-modify-write; `resolvePlanFiles` produces the
   final content used by both the local write and the GitHub commit. The parser
   extracts the FAQ question and opening-hour times from the instruction.

✅ **Supabase persistence (step 5):** `server/cms/stores/` — a `CommandStore`
   seam with `MemoryStore` and `SupabaseStore`, env-gated (`SUPABASE_URL` +
   `SUPABASE_SERVICE_ROLE_KEY`). Commands persist to `ai_commands` (typed columns
   + full-command jsonb) and logs mirror to `command_logs`; the dashboard loads
   durable history on mount via `GET /api/cms/commands`. Migration:
   `supabase/migrations/0001_ai_cms.sql`. No creds ⇒ in-memory (unchanged).

✅ **LLM copy (Gemini):** `server/cms/llm.ts` drafts the real news excerpt/body
   and FAQ answers at plan time (env-gated on `GEMINI_API_KEY`, retries transient
   errors, `GEMINI_MODEL` overridable, placeholder fallback).
✅ **Image uploads:** the dashboard uploads a photo for a news article; the
   backend commits it to `public/images/news/<slug>.<ext>` (binary via the GitHub
   Contents API / local write) alongside the article and patches the article's
   `image` field. No upload ⇒ a default image (never broken). SWAP TARGET:
   route bytes to Supabase Storage + record `media_assets` instead of the repo.

⬜ Remaining: generators for structural intents (sections, pages, menu items —
   require approval); customer/user auth; prerender SEO.

### Activating real GitHub/Netlify (operator setup)

Set in `.env.local` (never commit secrets — see guardrails):
```
GITHUB_TOKEN=ghp_...          # token with repo contents + pull_requests scope
GITHUB_REPO=HeyoB-ai/The-Garage
GITHUB_DEFAULT_BRANCH=main
NETLIFY_SITE_NAME=the-garage  # the Netlify subdomain
```
Then `preview` creates `cms/<intent>-<id>` with the generated content committed,
opens a PR, and returns the Netlify deploy-preview URL; `deploy` squash-merges
the PR (Netlify auto-deploys production); `cancel` closes the PR. Rollback =
Git revert of the squash commit or Netlify "publish previous deploy".

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
