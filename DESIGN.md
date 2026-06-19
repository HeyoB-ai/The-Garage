# DESIGN.md — The Garage Jávea

> The visual direction and the **design-system proposal**. Pairs with
> `PRODUCT.md`. Grounded in UI/UX Pro Max (typography + palette signals) and
> brand judgment. **This is a proposal awaiting approval — not yet built.**

## 1. Direction (the frame)

**Quiet editorial premium.** Big confident typography, generous whitespace,
full-bleed photography, a single restrained accent. The feel of a well-made
catalogue or a marque's heritage book — *showroom polish + workshop precision* —
not a SaaS landing page.

- Rejected from the skill's first pass: **Liquid Glass / glass / chrome** (the
  skill itself flags poor contrast + performance, and it reads "flashy" — an
  explicit anti-goal).
- Borrowed instead: **editorial minimalism** (excellent performance, WCAG AA,
  oversized display type, deliberate negative space, one accent) — but *warmed*
  with material color and real photography, not loud black-and-white.

## 2. Color — tokens (single source of truth)  ✅ CHOSEN: Limestone + Mediterranean blue

All values are **design tokens** (CSS variables + Tailwind theme), so "make it
warmer / change the accent" is one edit. Costa Blanca, literally: **stone**
(limestone) + **sea** (Mediterranean blue) + **light**.

### Light "Limestone + Sea"
| Token | Value | Use |
|---|---|---|
| `--bg` | `#F5F2EC` | page — warm limestone |
| `--surface` | `#FBFAF6` | cards / raised |
| `--ink` | `#1A1E24` | headings / primary text (cool charcoal) |
| `--ink-soft` | `#4A515B` | body / secondary |
| `--line` | `#E4DED2` | hairline borders |
| `--accent` | `#154A6B` | deep Mediterranean blue — primary (CTA, links) |
| `--accent-hover` | `#1C5C84` | hover/active |
| `--accent-ink` | `#F5F2EC` | text on accent |
| `--sand` | `#B98C56` | warm sand/bronze — fine detail, used *sparingly* for warmth |

### Dark variant (token-swappable; the brief allows dark)
`--bg #11151A` (deep blue-charcoal) · `--surface #1A1F26` · `--ink #EDEBE4` ·
`--ink-soft #AEB4BD` · `--line #2A313A` · `--accent #3E86B5` (brightened sea) ·
`--sand #C99A63`.

Rationale: limestone + charcoal = Costa Blanca stone; deep Mediterranean blue =
the sea, understated and coastal (not Ferrari-red dealer); a hint of warm sand
keeps it from going cold (*precision + warmth*). Accent used sparingly — the
photography carries the color.

## 3. Typography — character, real hierarchy, no Inter

A **three-voice** system that encodes *showroom + workshop*:  ✅ CHOSEN display: Bodoni Moda

| Role | Font | Why |
|---|---|---|
| **Display** (hero, section titles) | **Bodoni Moda** | High-contrast hairline serif — sharp, fashion-luxe, precise. The cold precision of fine machinery; editorial, distinctly *not* generic. |
| **Body / UI** | **Hanken Grotesk** | Clean, highly readable grotesque — European, mechanical-calm, explicitly **not Inter** (provides the warmth Bodoni lacks). |
| **Mono / technical labels** | **JetBrains Mono** | The "workshop" voice: specs, registration plates, dates, opening-hours figures, eyebrow labels — uppercase, tracked. |

- Type scale (rem): `0.75 · 0.875 · 1 · 1.125 · 1.375 · 1.75 · 2.5 · 3.5 · 5 · 7`
  via `clamp()` for fluid display sizes.
- Bodoni is delicate: use weights **500–700** at **large** sizes only, tight
  tracking, `leading-[1.05]`; never tiny. Body Hanken `1.6` line-height, 60–72ch.
- Tabular figures (mono) for prices, hours, mileage.

## 4. Style & effects (restraint)

- Sharp, quiet surfaces: 1px hairline borders (`--line`), radius small (`6–10px`),
  **no** heavy shadows — at most a soft, low shadow on raised cards.
- Hover = intent: subtle (underline grow, 4px lift, image brightness/scale ≤1.02,
  accent reveal) — 180–240ms `ease-out`. Never the "weak default hover".
- Full-bleed image blocks with a gentle dark scrim only where text overlays.
- One accent line motif (a thin rule / corner tick) as a recurring "workshop"
  detail instead of decoration.

## 5. Spacing & layout

- 4/8px base; section rhythm tiers `16 · 24 · 32 · 48 · 64 · 96 · 128`.
- Container `max-w-7xl`, wide gutters; asymmetric editorial grids (not 4 equal
  cards) — e.g. one big + two supporting, or image-left / copy-right.
- Mobile-first; breakpoints `375 / 768 / 1024 / 1440`.

## 6. Core components (small, named, content-driven)

Each reads from the content layer by a stable key; none hardcodes copy.

- **Nav** — sticky, minimal: wordmark · in-page links · **LanguageSwitcher** ·
  one CTA ("Book / Inquiry"). Active state, no clutter.
- **Hero** — full-bleed photo, oversized Fraunces headline, one line of body,
  one primary + one quiet secondary CTA. (`home.hero.*`)
- **ServiceCard** ×3 (maintenance / import / sales) — editorial, photo + mono
  eyebrow + serif title + 1–2 lines; asymmetric, not a 4-up grid.
- **CarCard** — large image, make/model (serif), price (mono, tabular), status
  chip; opens detail. Records with stable `id` + image.
- **NewsItem** — date (mono) · title (serif) · excerpt; list/feature layouts.
- **OpeningHours** — data table, mono tabular figures, **today highlighted**;
  reads hours as language-independent data + per-locale day labels.
- **ContactBlock** — address / phone / email / map from a **single source of
  truth** (`contact.*`), reused everywhere.
- **LanguageSwitcher** — NL · EN · DE · ES; sets `/nl /en /de /es`.
- **SectionHeading**, **Eyebrow**, **Button** (primary/ghost) — shared tokens.

**Kept from the current site (re-skinned to the new tokens):**
- **AdvisorChat** — the floating AI advisor (calls the existing `/api/advisor`,
  untouched backend); restyled to the limestone/blue tokens, calmer/quieter.
- **ImportCalculator** — the Spanish import-tax tool, as its own section within
  *Services › Import*; logic kept, presentation rebuilt editorially.

**Imagery:** ✅ reuse the **current site's images** (the Unsplash URLs already in
`src/data.ts`) as the starting photography, referenced from the content layer per
record; the owner swaps in real photos later via the CMS.

**Sections (first version):** Hero · Services (maintenance / import / sales) ·
Import calculator · Stock · About / craftsmanship · News · Opening hours ·
Contact · (floating AdvisorChat). Language switcher in the nav.

## 7. Editability (the #1 requirement — architectural)

- **One content layer** under `content/`; components read by stable key
  (`home.hero.headline`, `contact.openingHours`). Nothing inline in JSX.
- **Per-locale, identical key structure** (`content/{nl,en,de,es}/…`) +
  `sourceLocale` per item; **data separated from prose** (hours/price/phone once).
- **Design tokens** for all theme values (this file's §2–§5).
- **Typed collections** (cars/news/portfolio) as records with `id` + image.
- **`content/manifest.json`** describing what content exists and where, so the
  AI-CMS can discover editable surfaces. *(Wires into the existing CMS snapshot.)*

## 8. Accessibility & motion (non-negotiable)

- Contrast ≥ 4.5:1 (verify green/bronze on limestone and the dark variant
  independently); visible focus rings; full keyboard nav; semantic headings.
- Motion 150–300ms, `transform`/`opacity` only; respect `prefers-reduced-motion`.
- SVG icons (Lucide) — never emoji.

## 9. Out of scope (do not touch)

`server/`, `netlify/`, `server.ts`, `netlify.toml` — the CMS + deploy pipeline
stay exactly as they are. We replace only the front-end (`src/`) and the
structure of `content/`.
