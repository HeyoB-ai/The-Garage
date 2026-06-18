# The Garage Jávea — AI-CMS template

A premium automotive website (maintenance, import/export, sales) that doubles as
the **base template for a voice-controlled, AI-driven CMS**. Customers will be
able to manage their own site by speaking or typing instructions; the AI plans
the change, edits content/code on a branch, builds a Netlify preview, and only
goes live after approval.

Originally generated with Google AI Studio.
App reference: https://ai.studio/apps/216322c8-de3f-414b-b288-5cb2df83f058

## Stack

React 19 · Vite 6 · Tailwind CSS v4 · React Router 7 · Express (`server.ts`) ·
Gemini (`@google/genai`) for the on-site advisor.

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies: `npm install`
2. (Optional) set `GEMINI_API_KEY` in `.env.local` to enable the AI advisor chat.
3. Start the dev server: `npm run dev` → http://localhost:3000

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start Express + Vite dev server on :3000 |
| `npm run build` | Production build (Vite → `dist/`, server → `dist/server.cjs`) |
| `npm start` | Run the production build |
| `npm run typecheck` / `npm run lint` | TypeScript check (`tsc --noEmit`) |

## Routes

| Path | Page |
| --- | --- |
| `/` | Landing page (unchanged original) |
| `/nieuws` | News overview |
| `/nieuws/:slug` | News article detail |
| `/beheer` | AI-CMS dashboard (scaffold) |

## Where things live (AI-CMS structure)

```
content/
  news/*.json        ← one file per news article (add a file = publish)
  faq/faq.json       ← FAQ entries
  pages/             ← page content model (example/template)
public/images/news/  ← news images
src/
  config/site.json   ← site-wide settings (name, contact, SEO, hours)
  config/menu.json   ← navigation menu
  lib/content.ts     ← content access layer (UI reads from here)
  lib/markdown.tsx   ← tiny markdown renderer (no dependency)
  lib/cms/intent.ts  ← command → intent parser (mock, LLM-swap ready)
  components/news/    ← news UI components
  components/layout/  ← shared page chrome
  pages/              ← routed pages (news, dashboard)
```

## Adding a news article (today)

Drop a JSON file in `content/news/` (see `2026-06-12-open-day-summer.json` for
the shape) with `"published": true`. It appears automatically on `/nieuws`.
Images go in `public/images/news/` (or use a remote URL).

## Deployment (Netlify)

`netlify.toml` builds the static front-end (`npm run build`, publish `dist`) with
an SPA fallback so client routes work. Push to GitHub → Netlify auto-deploys;
branch pushes get Deploy Previews. The `/api/advisor` (Gemini) endpoint needs to
be ported to a Netlify Function for production — see `AI_AGENT_ARCHITECTURE.md`.

## Key documents

- **`AI_CMS_GUARDRAILS.md`** — what the AI may/may not change.
- **`AI_AGENT_ARCHITECTURE.md`** — the full voice → preview → approve → live pipeline.
- **`DATABASE_SCHEMA.md`** — proposed Supabase schema for multi-tenant CMS.
