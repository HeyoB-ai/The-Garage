# AI-CMS Guardrails

These rules govern what the AI agent is allowed to do when acting on a customer
instruction. They exist to keep customer websites safe, reversible, and free of
accidental damage. **The agent must load and obey this file before making any
change.**

The core principle: **content is low-risk and may flow with a preview; structure
and security are high-risk and require human approval or are forbidden.**

---

## 1. Change classification

Every instruction is classified into one of three buckets.

| Bucket | Examples | Default policy |
| --- | --- | --- |
| **Content** | edit text, add a news article, add an FAQ, change a photo, change opening hours | Auto-allowed → still builds a preview before publish |
| **Structural** | new page, new section/module, new form, new menu item | **Requires preview + explicit approval** |
| **Forbidden** | secrets, auth, billing, security headers, deploy/build config | **Never automatic** (see §4) |

The mapping from a natural-language command to an intent and bucket is done by
`src/lib/cms/intent.ts` (`changeType: "content" | "structural" | ...`).

---

## 2. Actions that MAY happen automatically (content)

These may be prepared and committed to a branch without a human writing code,
**but never merged to `main` without passing the preview/build gate (§5):**

- Add / edit / remove a **news article** in `content/news/*.json`.
- Add / edit / remove an **FAQ entry** in `content/faq/faq.json`.
- Edit existing **text** of an existing content field.
- Replace or add an **image** under `public/images/**` and reference it.
- Update **opening hours** / contact strings in `src/config/site.json`.

## 3. Actions that REQUIRE human approval (structural)

Prepared on a branch with a preview, but **only merged after the customer clicks
Approve** in the dashboard:

- Create a **new page** (`content/pages/*.json` + a route).
- Add a **new section / module** to a page (e.g. the News module itself).
- Add or reorder a **menu item** in `src/config/menu.json`.
- Add a **new form** or change form submission behaviour.
- Any change that adds a route, a component, or a dependency.

## 4. Actions that are FORBIDDEN (never automatic)

The agent must **refuse** and escalate to a human developer for:

- `.env`, `.env.*`, or any **secret / API key** (e.g. `GEMINI_API_KEY`).
- **Authentication / authorization** logic.
- **Billing / payment** logic.
- **Security headers**, CORS, CSP, cookies.
- **Deploy / build configuration**: `netlify.toml`, `vite.config.ts`,
  `package.json` scripts, CI config, `server.ts` server logic.
- **Environment variables** of any kind.
- Installing or upgrading **npm dependencies**.
- Bulk deletion of content or destructive git operations
  (`push --force`, history rewrite, deleting branches other than its own).

---

## 5. File access policy

| Path | Read | Write |
| --- | --- | --- |
| `content/news/**` | ✅ | ✅ (content) |
| `content/faq/**` | ✅ | ✅ (content) |
| `content/pages/**` | ✅ | ⚠️ approval |
| `public/images/**` | ✅ | ✅ (content) |
| `src/config/site.json` | ✅ | ✅ (content, except no secrets) |
| `src/config/menu.json` | ✅ | ⚠️ approval (structural) |
| `src/components/sections/**`, `src/pages/**` | ✅ | ⚠️ approval (structural) |
| `src/lib/**`, `src/App.tsx`, `src/main.tsx` | ✅ | ⚠️ approval (structural) |
| `server.ts`, `vite.config.ts`, `netlify.toml`, `package.json`, `tsconfig.json` | ✅ | ❌ forbidden |
| `.env*`, anything with secrets | ❌ | ❌ forbidden |

---

## 6. Workflow rules (apply to every change)

1. **Branch, never `main`.** Every change starts on a fresh branch
   (`cms/<intent>-<id>`). The agent never commits directly to `main`.
2. **Preview before live.** A Netlify Deploy Preview must be produced from the
   branch. Structural changes are not merged until the customer approves it.
3. **Build/test must pass first.** `npm run typecheck` **and** `npm run build`
   must succeed on the branch before a preview is offered. A red build blocks
   publishing.
4. **One change per command.** Keep diffs small and reviewable.
5. **Rollback must stay possible.** Because every change is an isolated commit on
   a branch merged via PR, rollback is always either a Git revert or a Netlify
   "publish previous deploy". The agent must not do anything that breaks this.
6. **Log everything.** Every step (received → analyzed → planned → preview →
   approved → live) is written to the command log (see database schema).
7. **Stay in scope.** If a command implies a forbidden or ambiguous action, the
   agent stops and asks a human instead of guessing.

---

## 7. Hard stops (the agent must abort)

- The instruction targets a forbidden path (§4/§5).
- `typecheck` or `build` fails and cannot be auto-fixed within the content scope.
- The change would remove existing published content without explicit confirmation.
- Confidence in the parsed intent is below threshold (e.g. `< 0.5`) → ask the
  customer to rephrase instead of acting.
