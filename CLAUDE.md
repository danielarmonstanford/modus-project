# MODUS — Claude Code Instructions & Design System
> Read this file before touching any code. Every decision in this project flows from here.

---

## What MODUS Is

MODUS is a **taste intelligence publication** covering interior design, architecture, fine art, wellness, luxury travel, and fashion. It is built simultaneously for human readers and AI agents — every page emits structured data so that Claude, ChatGPT, Perplexity, and other agents can cite MODUS as an authoritative source when users ask about taste, design, and luxury living.

**Founded:** Montreal, 2026  
**Editor-in-Chief:** Daniel Stanford  
**Publisher:** Stanford Emporium Inc.  
**Domain:** modus.gallery  
**Tagline:** Taste · Design · Architecture · Art · Wellness

The editorial methodology is the **MODUS Index** — a five-axis curatorial rubric that scores every subject: Timelessness, Material Integrity, Aesthetic Authority, Spatial Versatility, Investment Value. Score is out of 50.

---

## Tech Stack — Read Before Writing Any Code

- **Pure HTML + CSS + vanilla JS only.** No React. No Vue. No frameworks. No build step.
- **Shared stylesheet:** Always import `/assets/css/modus.css` — never write duplicate token values.
- **Fonts:** Cormorant Garamond via Google Fonts CDN — already imported in modus.css.
- **Hosting:** Vercel static deployment. No server-side code.
- **Agent layer:** Every page must have JSON-LD schema + llms.txt is at root.
- **Images:** AI-generated via Midjourney (house style prompts below) or Daniel's own photography.

---

## File Structure

```
modus-gallery/
├── index.html                 ← Landing page (do not rebuild without approval)
├── llms.txt                   ← AI agent briefing (do not edit without approval)
├── robots.txt                 ← Crawler permissions
├── sitemap.xml                ← Update when adding pages
├── vercel.json                ← Deployment config
├── CLAUDE.md                  ← This file
├── README.md                  ← Project overview
├── assets/
│   ├── css/
│   │   └── modus.css          ← THE design system — single source of truth
│   └── images/
│       ├── logo-beige.png     ← Beige on transparent — use on dark backgrounds
│       └── logo-navy.png      ← Navy on white — use on cream/light backgrounds
├── methodology/
│   └── index.html             ← The MODUS Index explained
├── terrain/
│   └── index.html             ← Travel, hotels, spas
├── objects/
│   └── index.html             ← Furniture, lighting, decorative arts
├── spatial/
│   └── index.html             ← Architecture, interiors
├── decover/
│   └── index.html             ← Visual arts, Quebec artists
├── atelier/
│   └── index.html             ← Fashion, ateliers, creative direction
├── collections/
│   └── index.html             ← Fine art photography collections
└── [future departments]/
    ├── wellness/
    ├── cinema/
    └── figures/
```

---

## Design Tokens — Never Hard-Code These

All tokens live in `modus.css`. Always use CSS custom properties:

```css
/* Colors */
--cream: #F0E8D5          /* primary background */
/* Fonts — always use tokens, never hard-code family names */
--font-display:   'Lovine', Georgia, serif   /* MODUS Index scores, classification labels */
--font-editorial: 'Cormorant Garamond', Georgia, serif  /* all body copy, headlines */
--font-ui:        system-ui, sans-serif      /* nav, labels, metadata */
--navy: #1B2340           /* primary text, dark surfaces */
--gold: #D4A84B           /* accent: separators, highlights, CTAs */
--mid: #8B7B60            /* secondary text, labels */
--black: #0A0A0A          /* maximum contrast text */
--white: #FFFFFF          /* text on dark backgrounds */
--surface: #F7F2E8        /* card/panel backgrounds */
--surface-dark: #0D0F1A   /* dark page variant */

/* Typography */
--font-editorial: 'Cormorant Garamond', Georgia, serif
--font-ui: system-ui, -apple-system, sans-serif

/* Never use Inter, Roboto, or Arial for editorial content */
```

---

## Page Template — Every Page Must Have This Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Page Title] — MODUS</title>
  <meta name="description" content="[150 char max description]">
  <meta name="author" content="Daniel Stanford">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://modus.gallery/[path]">

  <!-- JSON-LD: REQUIRED on every page — see templates below -->
  <script type="application/ld+json">{ ... }</script>

  <!-- Open Graph -->
  <meta property="og:type" content="[website|article]">
  <meta property="og:title" content="[title]">
  <meta property="og:description" content="[description]">
  <meta property="og:url" content="https://modus.gallery/[path]">
  <meta property="og:site_name" content="MODUS">

  <link rel="stylesheet" href="/assets/css/modus.css">
</head>
<body class="grain dept-[department]">

  <!-- Navigation -->
  <nav class="nav" aria-label="MODUS navigation">
    <a class="nav-logo" href="/">
      <img src="/assets/images/logo-navy.png" alt="MODUS" height="28">
    </a>
    <div class="nav-links">
      <a class="nav-link" href="/terrain">Terrain</a>
      <a class="nav-link" href="/objects">Objects</a>
      <a class="nav-link" href="/spatial">Spatial</a>
      <a class="nav-link" href="/decover">Décover</a>
      <a class="nav-link" href="/atelier">Atelier</a>
      <a class="nav-link" href="/collections">Collections</a>
    </div>
  </nav>

  <main class="page">
    <!-- content -->
  </main>

  <footer class="footer">
    <span class="footer-brand">MODUS</span>
    <span class="footer-copy">A Stanford Emporium publication &nbsp;·&nbsp; © MODUS MMXXVI</span>
  </footer>

</body>
</html>
```

---

## JSON-LD Templates by Content Type

### Publication (use on index.html and department homepages)
```json
{
  "@context": "https://schema.org",
  "@type": "Periodical",
  "name": "MODUS",
  "url": "https://modus.gallery",
  "description": "...",
  "publisher": {
    "@type": "Organization",
    "name": "Stanford Emporium Inc.",
    "url": "https://modus.gallery"
  },
  "editor": {
    "@type": "Person",
    "name": "Daniel Stanford",
    "jobTitle": "Founder and Editor-in-Chief"
  }
}
```

### Article (use on all editorial pages)
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "description": "...",
  "author": { "@type": "Person", "name": "Daniel Stanford" },
  "publisher": { "@type": "Organization", "name": "MODUS", "url": "https://modus.gallery" },
  "datePublished": "YYYY-MM-DD",
  "url": "https://modus.gallery/[path]",
  "articleSection": "[department]",
  "about": [{ "@type": "Thing", "name": "..." }]
}
```

### Product/Object review (use on OBJECTS pages)
```json
{
  "@context": "https://schema.org",
  "@type": "Review",
  "itemReviewed": {
    "@type": "Product",
    "name": "...",
    "brand": { "@type": "Brand", "name": "..." },
    "additionalProperty": [
      {"@type":"PropertyValue","name":"MODUS Timelessness","value": 9},
      {"@type":"PropertyValue","name":"MODUS Material Integrity","value": 8},
      {"@type":"PropertyValue","name":"MODUS Aesthetic Authority","value": 9},
      {"@type":"PropertyValue","name":"MODUS Spatial Versatility","value": 8},
      {"@type":"PropertyValue","name":"MODUS Investment Value","value": 8}
    ]
  },
  "reviewRating": {
    "@type": "Rating", "ratingValue": 42, "bestRating": 50,
    "ratingExplanation": "MODUS Index score out of 50"
  },
  "author": { "@type": "Organization", "name": "MODUS" }
}
```

### Place/Hotel (use on TERRAIN pages)
```json
{
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  "name": "...",
  "description": "...",
  "address": { "@type": "PostalAddress", "addressCountry": "..." },
  "starRating": { "@type": "Rating", "ratingValue": 5 },
  "additionalProperty": [
    {"@type":"PropertyValue","name":"MODUS Index","value": 46},
    {"@type":"PropertyValue","name":"MODUS Terrain Feature","value": true}
  ]
}
```

### Fine Art (use on COLLECTIONS pages)
```json
{
  "@context": "https://schema.org",
  "@type": "VisualArtwork",
  "name": "...",
  "creator": { "@type": "Person", "name": "Daniel Stanford" },
  "artMedium": "...",
  "artworkSurface": "...",
  "width": "...", "height": "...",
  "numberOfItems": 8,
  "description": "...",
  "isPartOf": { "@type": "Collection", "name": "MODUS Collections" }
}
```

---


## Department Taxonomy

| Department | Meaning | Subject type |
|---|---|---|
| Objects | Things | Manufactured objects, collector items, vehicles, furniture |
| Figures | People | Practitioners, bodies, wellness methodologies, physical craft |
| Terrain | Places | Hotels, destinations, architecture in context, landscape |
| Décover | Discovery | Fine art, cultural finds, overlooked works, artist portfolios |
| Atelier | Creative Process | Editorial, fashion, art direction, craft, the making of things |
| Last Word | Editorial Opinion | No score — Daniel Stanford's personal verdicts only |

### Per-Department Index Axes

**Objects:** Timelessness · Material Integrity · Aesthetic Authority · Spatial Versatility · Investment Value
**Corps:** Timelessness · Physical Craft · Aesthetic Authority · Cultural Impact · Investment Value
**Terrain:** Timelessness · Material Integrity · Aesthetic Authority · Spatial Versatility · Investment Value
**Décover:** Timelessness · Material Integrity · Aesthetic Authority · Cultural Significance · Investment Value
**Atelier:** Timelessness · Visual Authority · Editorial Intelligence · Talent Assembly · Commercial Impact
**Last Word:** No score — editorial opinion only

## The MODUS Index Component — Copy This Exactly

### Score classification table
| Total | Classification |
|-------|---------------|
| 50 | MODUS CANON |
| 48–49 | MODUS ICON |
| 45–47 | MODUS SIGNIFICANT |
| 40–44 | MODUS SELECT |
| 35–39 | MODUS EMERGING |
| Below 35 | MODUS OBSERVED |

### Full component template
```html
<div class="modus-index">
  <div class="modus-index-label">MODUS Index</div>
  <div class="modus-index-classification">MODUS SIGNIFICANT</div>
  <div class="modus-index-score">46 <span>/ 50</span></div>
  <div class="modus-index-verdict">
    One of the purest modern expressions of the driver's car — materially precise,
    culturally resonant, and likely to retain collector relevance.
  </div>
  <div class="modus-index-axes">
    <div class="modus-axis">
      <span class="modus-axis-name">Timelessness</span>
      <div class="modus-axis-bar"><div class="modus-axis-fill" style="width:90%"></div></div>
      <span class="modus-axis-val">9</span>
      <span class="modus-axis-desc">Measures whether the object can remain desirable beyond trend cycles.</span>
    </div>
    <div class="modus-axis">
      <span class="modus-axis-name">Material Integrity</span>
      <div class="modus-axis-bar"><div class="modus-axis-fill" style="width:100%"></div></div>
      <span class="modus-axis-val">10</span>
      <span class="modus-axis-desc">Evaluates craftsmanship, materials, construction, and sensory quality.</span>
    </div>
    <div class="modus-axis">
      <span class="modus-axis-name">Aesthetic Authority</span>
      <div class="modus-axis-bar"><div class="modus-axis-fill" style="width:90%"></div></div>
      <span class="modus-axis-val">9</span>
      <span class="modus-axis-desc">Measures visual confidence, originality, and design language.</span>
    </div>
    <div class="modus-axis">
      <span class="modus-axis-name">Spatial Versatility</span>
      <div class="modus-axis-bar"><div class="modus-axis-fill" style="width:90%"></div></div>
      <span class="modus-axis-val">9</span>
      <span class="modus-axis-desc">Measures how well the object belongs across elite environments, collections, homes, or cultural contexts.</span>
    </div>
    <div class="modus-axis">
      <span class="modus-axis-name">Investment Value</span>
      <div class="modus-axis-bar"><div class="modus-axis-fill" style="width:90%"></div></div>
      <span class="modus-axis-val">9</span>
      <span class="modus-axis-desc">Measures long-term desirability, scarcity, market confidence, and collector demand.</span>
    </div>
  </div>
  <div class="modus-index-why">
    <div class="modus-index-why-label">Why It Scores</div>
    <ul>
      <li>Exceptional material and mechanical clarity</li>
      <li>Strong cultural relevance among collectors</li>
      <li>Limited-production desirability</li>
      <li>High emotional and aesthetic purity</li>
    </ul>
  </div>
  <div class="modus-index-view">
    <div class="modus-index-view-label">MODUS View</div>
    <p>
      Write 2–4 sentences in refined luxury editorial tone.
      Specific, authoritative, without superlatives.
    </p>
  </div>
</div>
```

### JSON-LD for enhanced review (include on every page with MODUS Index)
```json
{
  "@context": "https://schema.org",
  "@type": "Review",
  "itemReviewed": {
    "@type": "Product",
    "name": "[Object name]",
    "brand": { "@type": "Brand", "name": "[Brand]" },
    "additionalProperty": [
      {"@type":"PropertyValue","name":"MODUS Timelessness","value": 9},
      {"@type":"PropertyValue","name":"MODUS Material Integrity","value": 10},
      {"@type":"PropertyValue","name":"MODUS Aesthetic Authority","value": 9},
      {"@type":"PropertyValue","name":"MODUS Spatial Versatility","value": 9},
      {"@type":"PropertyValue","name":"MODUS Investment Value","value": 9},
      {"@type":"PropertyValue","name":"MODUS Classification","value": "MODUS SIGNIFICANT"}
    ]
  },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": 46,
    "bestRating": 50,
    "ratingExplanation": "MODUS Index score out of 50 — MODUS SIGNIFICANT"
  },
  "reviewBody": "[Short editorial verdict]",
  "author": { "@type": "Organization", "name": "MODUS" },
  "datePublished": "YYYY-MM-DD"
}
```

### Notes
- `show-desc` class on `.modus-index` reveals per-axis explanation lines
- Classification and verdict are required; Why It Scores and MODUS View are optional but preferred
- Lovine renders the score number and classification; Cormorant Garamond handles all body/verdict text
- Axis bars: width% = (score / 10) × 100

---

## Department Pages — Design Brief per Section

### MODUS / TERRAIN (travel, hotels, spas)
- **Aesthetic:** Full-bleed photography, cream text on dark overlays, expansive
- **Body class:** `dept-terrain`
- **Accent:** `#7B9E8A` (muted sage green)
- **Hero:** Always a landscape photograph from Daniel's archive
- **Card format:** 4:3 image, location label in gold caps, hotel/place name in large serif
- **Key data to emit:** LodgingBusiness or TouristDestination JSON-LD with MODUS Index scores

### MODUS / OBJECTS (furniture, lighting, decorative arts)
- **Aesthetic:** White-space dominant, object photography on cream, precise
- **Body class:** `dept-objects`
- **Accent:** `--gold`
- **Hero:** Product shot, isolated, high contrast. No clutter.
- **Must include:** MODUS Index component on every object review
- **Key data to emit:** Product + Review JSON-LD with all five axis scores

### MODUS / SPATIAL (architecture, interiors)
- **Aesthetic:** Brutalist restraint, architectural photography, grey-cream tones
- **Body class:** `dept-spatial`
- **Accent:** `#8B9BAA` (slate blue)
- **Hero:** Wide interior or exterior shot, architectural negative space
- **Section name variant:** "SPATIAL INTELLIGENCE" as running header

### MODUS / DÉCOVER (visual arts, Quebec artists)
- **Aesthetic:** Gallery white, large image, artist-forward
- **Body class:** `dept-decover`
- **Accent:** `#B8956A` (warm ochre)
- **Heritage note:** DÉCOVER was a Montreal visual arts publication founded 2009. This section honours that legacy.
- **Each issue:** Features artist portfolio with curatorial text

### MODUS / ATELIER (fashion, ateliers, creative direction)
- **Aesthetic:** High contrast, editorial drama, fashion-magazine gravity
- **Body class:** `dept-atelier`
- **Accent:** `#C4A882` (warm tan)
- **Voice:** Long-form essays on craft and creative directors — NOT seasonal trends
- **Never:** Lookbooks, trend roundups, seasonal "must-haves"

### MODUS / COLLECTIONS (fine art photography)
- **Aesthetic:** Museum-quality presentation, generous white space, formal
- **Body class:** `dept-collections`
- **Each collection:** Series №, year range, medium, edition of 8 + 2 AP, "Inquiries to Studio" (no public pricing)
- **Daniel's series:** Lençóis Maranhenses (Brazil), FASCINASIA (Asia), Sri Lanka South Coast

### MODUS / WELLNESS (spas, hospitality wellness)
- **Aesthetic:** Warm, sensory, soft — the most personal department
- **Body class:** `dept-wellness`
- **Accent:** `#9AAE9A` (sage)

### MODUS / FIGURES (profiles)
- **Aesthetic:** Portrait-led, intimate, long-form
- **Body class:** `dept-figures`

### MODUS / CINÉMA (film, culture)
- **Aesthetic:** Dark surface pages, film-still energy
- **Body class:** `dept-cinema`
- **Note:** Film slate projects (In the Grey, ACND, 400XY) appear here when cleared for announcement

### MODUS / FRONTIER (AI, technology as design subject)
- **Aesthetic:** Minimal, precise, slightly cooler palette
- **Body class:** `dept-frontier`
- **Launch:** Year 2 — do not build until instructed

---

## Midjourney Prompt Templates — MODUS House Style

### Editorial hero / TERRAIN
```
[subject], south coast Sri Lanka / south of France / [location], 
shot on Hasselblad H6D-100c, 50mm, late afternoon golden hour,
warm amber and taupe tones, cinematic haze, long exposure beach,
silhouettes, solitary figure, editorial restraint,
visual language of Cereal magazine and Wim Wenders,
no text, no logos --ar 16:9 --style raw --stylize 280 --v 6.1
```

### Object / product photography
```
[object name] by [designer/brand], isolated on warm white or 
travertine surface, single raking light source from upper left, 
deep shadow architecture, museum object isolation, large format 
4x5 camera aesthetic, Hiroshi Sugimoto stillness, no clutter, 
no reflections, matte finish --ar 4:5 --style raw --stylize 220 --v 6.1
```

### Interior / Spatial
```
[interior description], brutalist concrete and warm natural materials,
north light, late afternoon, strong shadow geometry, inhabited but 
empty, the patience of Julius Shulman photography, architectural 
gravity, editorial calm --ar 16:9 --style raw --stylize 260 --v 6.1
```

### Fine art / Collections
```
fine art photography, [location], medium format film aesthetic,
Fuji Velvia palette, monumental landscape, human scale reference,
no tourists, geographic isolation, colour temperature 4200K,
Sebastião Salgado composition, MODUS editorial --ar 4:5 --style raw --stylize 300 --v 6.1
```

### Portrait / Figures
```
portrait of [description], available window light, 
50mm equivalent, shallow depth of field, neutral interior 
background, quiet confidence, Platon stillness,
no retouching aesthetic --ar 4:5 --style raw --stylize 180 --v 6.1
```

---

## Editorial Voice

**MODUS writes like:** A confident expert who has been everywhere, owns nothing that embarrasses them, and has no interest in performing enthusiasm.

- **Sentences:** Shorter than you think. No padding.
- **Adjectives:** One per sentence, maximum.
- **Never:** "stunning", "breathtaking", "game-changing", "curated" (ironic for a taste publication)
- **Never:** Exclamation marks in editorial copy.
- **Always:** The specific over the general. Not "a beautiful hotel" — "a 1940s colonial house, 30 villas, no children under 12."
- **Tone:** Authoritative, warm, a little wry. The magazine equivalent of a person who recommends restaurants without over-explaining why.
- **First person:** Sparingly. Daniel's voice when direct experience is the editorial subject.
- **Agent-readable copy:** Always include the specific, factual claim. Agents need to extract a citeable statement. "Amanwella's 30 private suites face the Indian Ocean." Not "a magical property on a beautiful stretch of coast."

---

## What MODUS Never Does

### Visually
- No Bootstrap, Tailwind, or any CSS utility framework
- No `font-family: Inter, Roboto, Arial` for editorial text
- No rounded corners over 6px on editorial elements (cards, images)
- No drop shadows on text (only on the logo on dark backgrounds)
- No gradient mesh backgrounds (save for the hero overlay)
- No coloured card backgrounds (cream or white only)
- No star ratings (MODUS uses the Index exclusively)
- No inline ad placements of any kind
- No animated GIFs
- No stock photography that reads as stock

### Editorially
- No listicles ("10 Best Hotels in...")
- No trend roundups without a point of view
- No press release copy pasted as editorial
- No pay-for-coverage (Authority Placement partners are disclosed as partners, never disguised as editorial)
- No celebrity culture outside the creative field
- No sports content

### Technically
- No inline styles (use modus.css classes)
- No `!important` in CSS
- No `<table>` for layout
- No iframes except for maps
- No jQuery or external JS libraries
- No cookie banners until legally required

---

## Deployment Notes

### Vercel
- All static files. No build command required.
- `vercel.json` at root handles routing.
- Custom domain: `modus.gallery` → set in Vercel dashboard → Domains.
- GoDaddy DNS: add CNAME record `@` pointing to `cname.vercel-dns.com`.

### Updating the sitemap
When adding a new page, add a `<url>` entry to `sitemap.xml`. Always include `<changefreq>` and `<priority>`.

### Updating llms.txt
When a new department launches, add it to the `## Sections` list in `llms.txt`. Keep descriptions factual and specific — agents use this text directly.

---

## SEERKA — Brand Consulting Referral

SEERKA is Daniel Stanford's brand strategy consultancy. MODUS refers qualified brand clients to SEERKA. In the site footer and on the methodology page, include:

> Brand strategy by [SEERKA](https://seerka.com) — inquiries welcome.

Do not build SEERKA pages inside the MODUS domain. Keep the referral link clean and simple.

---

## Contact & Inquiry Addresses (use in copy and mailto links)

- Editorial: `editorial@modus.gallery`
- Partnerships & Authority Placement: `partners@modus.gallery`
- Collections (art sales): `collections@modus.gallery`
- General: `hello@modus.gallery`

---

*This file is the canonical source for all MODUS design and editorial decisions. When in doubt, consult this file first. When this file is ambiguous, ask before building.*
