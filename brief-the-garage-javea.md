# Brief — nieuwe basissite The Garage Jávea

> **Voor Claude Code.** Lees deze brief volledig. Stel eerst verhelderende vragen, lever dan een design-systeem-voorstel, en bouw pas daarna. Gebruik de geïnstalleerde design-skills: **UI/UX Pro Max** (design-systeem), **frontend-design** (onderscheidende look, weg van de generieke AI-stijl) en **impeccable** (bewaakt dat dit een merksite is, geen admin-tool).
>
> **Bouw fris.** Niet de bestaande AI-Studio-site verbouwen — die zit vol hardgecodeerde content en werkt ons tegen.

---

## 1. Het merk & de opdracht

- **The Garage Jávea** — premium auto-onderhoud, import en verkoop aan de Costa Blanca (Jávea, Spanje).
- **Publiek:** internationaal en vermogend — Nederlandse, Duitse en Britse expats / tweede-huisbezitters, plus Spaanse klanten. Vandaar vier talen: NL, EN, DE, ES.
- **Positionering:** vertrouwd, discreet vakmanschap. Géén schreeuwerige dealer. Europese, ingetogen luxe — niet glimmend-Amerikaans.
- **Gevoel:** je laat je auto én je vertrouwen achter bij een specialist die het snapt.

## 2. Visuele richting — kaders, geen kant-en-klaar ontwerp

Hier staat **bewust geen exact palet of font.** Dat is jullie werk: UI/UX Pro Max stelt palet, typografie en stijl voor; frontend-design houdt het weg van de generieke look; impeccable bewaakt het merk-oordeel.

Kaders waarbinnen je dat doet:

- Premium automotive, **ingetogen**. Donker mág (sluit aan bij het bestaande dark/amber-thema) maar is niet verplicht — kies wat het merk het sterkst maakt.
- Ruimte, rust, materiaal. Het mag voelen als **showroom + werkplaats**: precisie én warmte.
- De Costa Blanca als sfeer (licht, zee, steen) — niet als cliché.
- **Anti-doelen** (de generieke look die we niet willen): standaard Inter + paars gradient + vier kaartjes in een grid + zwakke hover. Niets dat "vibe-coded" oogt.
- Typografie met karakter (display + goed leesbare body), met échte hiërarchie.
- Foto's dragen de site: auto's, detail, vakmanschap. Ontwerp met plek voor **echte beelden**, geen stockclichés.

**Lever eerst een design-systeem-voorstel** (palet, typografie, stijl, spacing, kerncomponenten) vóór je pagina's bouwt. Ik wil het zien voor je doorgaat.

## 3. Stack

- **React + Vite + Tailwind** (zelfde stack als nu — de CMS-pijplijn draait erop).
- De site moet passen in: build → PR → Netlify-preview → goedkeuring → deploy.

## 4. Bewerkbaarheid — de belangrijkste eis

Deze site wordt aangestuurd door een AI-CMS dat **echte code** aanpast op commando van een niet-technische eigenaar. Daarom moet álles bewerkbaar zijn vanuit een schone contentlaag, niet hardgecodeerd in componenten.

1. **Eén contentlaag.** Alle bewerkbare tekst, beelden en data leven in `content/`, nooit inline in JSX. Componenten lezen uit de contentlaag via een stabiele sleutel. *(Dit lost precies de bug op die ons eerder beet: openingstijden stonden hardgecodeerd in `App.tsx`.)*
2. **Stabiele, menselijke sleutels.** Elk bewerkbaar stuk heeft een sleutel als `home.hero.headline`, `contact.openingHours`, `services.maintenance.title`. Zo koppelt de agent "pas de openingstijden aan" aan één plek.
3. **Eén bron van waarheid.** Een feit (openingstijden, adres, telefoon, e-mail) staat één keer en wordt overal aangeroepen. Nergens dupliceren.
4. **Design-tokens.** Alle thema-waarden (kleuren, spacing, fonts, radii) in een tokenlaag (CSS-variabelen / Tailwind-theme). "Maak het warmer" of "ander accent" = één plek wijzigen.
5. **Kleine, benoemde componenten.** Eén verantwoordelijkheid per component, herkenbare namen (`Hero`, `ServiceCard`, `CarCard`, `NewsItem`, `OpeningHours`, `ContactBlock`). De agent moet "de hero" of "het contactblok" betrouwbaar terugvinden.
6. **Collecties als getypte records.** Auto-aanbod, nieuws en portfolio zijn arrays van records met een stabiel `id`, in de contentlaag. Beelden horen bij het record.
7. **Een content-manifest.** Een machine-leesbaar bestand (`content/manifest.json` of een getypte index) dat beschrijft wélke content bestaat en waar — zodat de agent (en de "site voorbereiden"-onboarding van het pakket) de bewerkbare oppervlakken kan ontdekken. Dit is de conventie die het pakket op méér sites laat plakken.

## 5. Meertalig — NL / EN / DE / ES

Vier talen, vanaf de basis ingebouwd — niet later erbovenop.

1. **Content per taal, identieke sleutelstructuur.** Dezelfde sleutels in elke taal, zodat de agent talen op elkaar kan leggen en kan zien wanneer ze uit de pas lopen. Vorm: `content/{locale}/…` óf per sleutel `{ nl, en, de, es }` — kies één en blijf consequent.
2. **Brontaal per stuk.** Leg per contentstuk vast in welke taal het geschreven is (`sourceLocale`). Daar vertaalt het systeem vanaf.
3. **Bewerk-flow (dit is een verkoopargument).** Een commando wijzigt de actieve taal; daarna biedt het systeem aan de andere drie via AI-vertaling bij te werken; de eigenaar keurt **per taal** goed vóór publicatie. Eén keer schrijven, vier talen in lijn.
4. **Drift-detectie.** Verandert de bron en zijn de vertalingen niet bijgewerkt → markeer ze als "verouderd / nakijken".
5. **Taal-onafhankelijke feiten niet 4× dupliceren.** Tijden (`08:30–18:00`), prijzen, telefoon, e-mail zijn taal-onafhankelijk: sla die één keer op en hergebruik. Alleen het omringende label ("Maandag" / "Monday") is per taal. Scheid dus **data** van **prose**.
6. **Routing.** `/nl`, `/en`, `/de`, `/es` met een zichtbare taalwisselaar; standaardtaal detecteren maar overschrijfbaar.

## 6. Secties (eerste versie)

Hero · Diensten (onderhoud / import / verkoop) · Auto-aanbod (stock) · Over / vakmanschap · Nieuws · Openingstijden · Contact (adres, telefoon, e-mail, kaart) · Taalwisselaar.

Houd het strak: liever weinig sterke secties dan veel zwakke.

## 7. Werkwijze die ik wil

1. **Stel eerst verhelderende vragen** (publiek, voorkeuren, beeldmateriaal, wat behouden moet blijven).
2. **Lever een design-systeem-voorstel.** Wacht op akkoord.
3. **Bouw dan de basissite** met de contentlaag, de meertalige structuur en de tokens zoals hierboven.
4. **Toon een preview.** Itereer.

> Bouw nog niets vóór stap 1–2.
