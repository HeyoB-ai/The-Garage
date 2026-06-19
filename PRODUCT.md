# PRODUCT.md — The Garage Jávea

> Shared source of truth for the design skills (UI/UX Pro Max + brand judgment).
> Derived from `brief-the-garage-javea.md`. This file defines *who* and *why*;
> `DESIGN.md` defines *how it looks*.

## 1. What it is

A premium automotive brand site for **The Garage Jávea** — high-end car
**maintenance**, turnkey **import/export**, and curated **sales** on the Costa
Blanca (Jávea, Alicante, Spain). It is a **brand site, not an admin tool**: it
must feel like a place you'd trust with a car you love.

It is also the first reference build of a reusable, **AI-CMS-editable** base: a
non-technical owner edits the real site by voice/text, so every word, image and
fact lives in a clean content layer (see `DESIGN.md` §Editability).

## 2. Users

| Segment | Who | What they need | Implication |
|---|---|---|---|
| **NL / DE / UK expats & second-home owners** | Affluent, 45–70, own a premium/classic car in Spain or want to import one | Reassurance that bureaucracy, transport and servicing are handled flawlessly, in their language | Multilingual (NL/EN/DE/ES); calm, competent tone; proof of craft |
| **Spanish locals (premium)** | Owners of sports/luxury cars in the Marina Alta | Dealer-level service without the dealership | Spanish first-class, not an afterthought |
| **Prospective buyers** | Looking to source or buy an exclusive vehicle | Trust the provenance and the people | Stock + portfolio shown like a gallery, with real detail |
| **The owner (operator)** | Non-technical; edits the site via the AI-CMS | Change text/photos/hours/cars in plain language, safely | Clean content layer, stable keys, preview-before-live |

**Primary job-to-be-done:** *"I want to leave my car — and my trust — with a
specialist who clearly gets it."*

## 3. Brand

- **Positioning:** trusted, discreet craftsmanship. The quiet expert, not the
  loud dealer.
- **Personality:** precise, calm, warm, European, understated. Confident enough
  to use space and silence.
- **Promise:** worry-free. They handle the machine *and* the paperwork.
- **Metaphor:** **showroom + workshop** — the polish of the showroom and the
  precision of the bench, together.
- **Place:** Costa Blanca as *atmosphere* — light, sea, limestone — never as a
  postcard cliché.

## 4. Tone of voice

- Plain, exact, unhurried. Short confident sentences.
- Specific over superlative: *"Spanish matriculación in 6 days, ITV passed first
  time"* beats *"the best service ever."*
- Multilingual parity: the same calm authority in NL, EN, DE, ES — translated,
  never machine-dumped.
- Never: hype, exclamation-stacking, "supercar" shouting, emoji.

## 5. Anti-references (what we are NOT)

- The generic **"vibe-coded" AI look**: default Inter, purple/blue gradient,
  four equal cards in a grid, weak hover, centered everything.
- Glassmorphism / glossy translucency / chrome — flashy, American-dealer energy.
- Stock-photo clichés (handshakes, generic cityscapes, fake smiles).
- A site that reads like a **dashboard or template**. This is a *brand*.

## 6. Strategic principles

1. **Restraint is the luxury.** Few strong sections beat many weak ones. Earn
   attention with space, type and real photography — not effects.
2. **Photography carries the site.** Design *around* real images of cars,
   detail and craft; leave generous, deliberate room for them.
3. **Proof over promises.** Concrete outcomes, real numbers, named services.
4. **Trust signals, quietly.** Accreditations, languages, location — present,
   never shouted.
5. **Everything is editable.** No fact or sentence is hardcoded in a component;
   it lives in the content layer under a stable, human key.
6. **Four languages are first-class**, built in from the base, with data
   (hours/prices/contact) separated from prose.
7. **It must survive the pipeline:** build → PR → Netlify preview → approval →
   deploy, with the existing CMS untouched.
