# Hypertron — Design Reference

Visual language for the new frontend. Grounded in `legacy/` marketing + dashboard dark ambience, tightened into a **dark bluish + yellow** system. Use this file before inventing new colors or type.

---

## Brand

| | |
|---|---|
| **Name** | Hypertron |
| **One-liner** | One programmable operating layer for B2B payments & operations on Stellar. |
| **Voice** | Direct, operational, calm. Prefer verbs over slogans. |
| **Splash triad** | Onboard · Settle · Scale |

Hypertron must read as a **hero-level** brand signal on the first viewport — not only nav text.

---

## Direction

**Atmosphere:** night operations console — deep navy-black stage, cool blue light, sharp yellow signal.

**Not this:** purple-on-black SaaS glow, cream/serif/terracotta, flat single-color black with no depth, card grids in the hero.

**Yes this:** blue radial washes, thin yellow accent line / CTA underline, glass hairlines, Inter body + Aeonik wordmark + Instrument Serif italics for emphasis words.

---

## Color

Named tokens. Prefer CSS variables over raw hex in components.

| Token | Hex | Role |
|---|---|---|
| `void` | `#000000` | Base canvas |
| `ink` | `#030712` | Deep blue-black (gradient end / footer) |
| `navy` | `#070b14` | Elevated surface |
| `navy-mid` | `#0c1222` | Panels, nav glass underlay |
| `fog` | `#ffffff` | Primary text |
| `mist` | `rgba(255,255,255,0.65)` | Body / supporting |
| `haze` | `rgba(255,255,255,0.45)` | Captions, meta |
| `line` | `rgba(255,255,255,0.12)` | Borders, dividers |
| `glass` | `rgba(255,255,255,0.04)` | Glass fill |
| `blue` | `#3b82f6` | Primary brand blue |
| `blue-deep` | `#2563eb` | Hover / pressed blue |
| `cyan` | `#06b6d4` | Cool secondary (sparingly) |
| `yellow` | `#FFF971` | Signal yellow (loader, accents, highlights) |
| `gold` | `#facc15` | Ambience / spectrum gold |
| `amber` | `#f59e0b` | Warning / secondary warm UI |

### Atmosphere recipes (from legacy)

```css
/* Page wash */
background:
  radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.22), transparent 55%),
  radial-gradient(ellipse 40% 40% at 85% 10%, rgba(250, 204, 21, 0.08), transparent 50%),
  linear-gradient(180deg, #000000 0%, #030712 100%);

/* Soft product glow under a preview / focal plane */
box-shadow / background:
  radial-gradient(ellipse at center, rgba(59, 130, 246, 0.35), transparent 70%);

/* Spectrum accent line (footer / section break) */
linear-gradient(90deg,
  transparent,
  rgba(250, 204, 21, 0.55),
  rgba(59, 130, 246, 0.5),
  rgba(34, 211, 238, 0.45),
  transparent);
```

### CTA pairing

| Type | Surface | Label |
|---|---|---|
| Primary | `#ffffff` | `#000000` |
| Secondary | transparent + `line` border | `#ffffff` |
| Signal (rare) | `#FFF971` | `#000000` |

White primary CTA stays the default (legacy marketing). Yellow is for **signal**, not every button.

---

## Typography

| Role | Family | Source | Usage |
|---|---|---|---|
| **Brand / display** | Aeonik Pro | `public/fonts/AeonikPro-*.woff2` | Logo wordmark, large numerals, splash |
| **UI / body** | Inter | `next/font/google` | Nav, body, buttons, forms |
| **Emphasis** | Instrument Serif (italic) | `next/font/google` | Single words inside headlines (*programmable*, *privacy*, *settlement*) |

### Scale (landing)

| Step | Size | Weight | Notes |
|---|---|---|---|
| Brand | clamp(2.5rem, 8vw, 5.5rem) | Aeonik 500–700 | First-viewport hero brand |
| H1 | clamp(1.75rem, 4.5vw, 3rem) | Inter 500–600 | One line under brand |
| Lead | 1.125–1.25rem | Inter 400 | One supporting sentence |
| Nav / UI | 0.875–1rem | Inter 500 | |
| Caption | 0.75–0.8125rem | Inter 400 · `haze` | |

Tracking: slightly tight on brand (−0.03em to −0.04em). Body normal.

---

## Layout

### First viewport (hero budget)

Only:

1. Nav (logo + few links + CTA)
2. **Hypertron** (brand)
3. One headline
4. One short supporting sentence
5. One CTA group
6. One dominant atmospheric plane (gradient / grid — not a card collage)

No stats strips, schedule blocks, feature card grids, or floating badges on the hero media.

### Simple landing sections (v1)

```
┌─────────────────────────────────────┐
│  nav                                │
│                                     │
│  HYPERTRON                          │
│  headline with *italic* word        │
│  supporting sentence                │
│  [Book a Demo]  [Launch]            │
│         (blue + gold atmosphere)    │
├─────────────────────────────────────┤
│  Onboard · Settle · Scale           │  ← triad strip, not cards
├─────────────────────────────────────┤
│  Closing CTA                        │
│  footer + spectrum line             │
└─────────────────────────────────────┘
```

### Spacing

- Page horizontal pad: `1.25rem` → `2rem` → `3rem` (sm / md / lg)
- Section vertical: `5rem`–`7rem`
- Max content width: `72rem` (nav/footer), hero copy `40rem`

### Radius & chrome

- Pills / CTAs: `9999px` (`rounded-full`)
- Surfaces (when needed): `0.75rem`–`1rem`
- Borders: 1px `line` — prefer hairlines over heavy strokes
- Glass: `glass` fill + `backdrop-blur-xl` + `line` border

---

## Motion

Ship a few intentional moves; skip noise.

1. **Hero enter** — brand → headline → lead → CTAs, staggered fade/rise (~400–600ms, ease-out).
2. **Atmosphere** — slow drift or opacity pulse on yellow/blue radials (subtle, infinite, pause under `prefers-reduced-motion`).
3. **CTA hover** — scale 1.02 or brightness shift; focus ring uses `blue`.

Respect `prefers-reduced-motion: reduce` (instant opacity, no ambient loop).

---

## Do / Don't

| Do | Don't |
|---|---|
| Lead with **Hypertron** | Let a generic H1 overpower the brand |
| Blue wash + yellow signal | Purple primary or neon green accent |
| Glass + hairline borders | Soft gray card stacks in the hero |
| Instrument Serif on *one* emphasis word | Italicize whole paragraphs |
| White primary CTA | Yellow every button |
| Full-bleed atmosphere | Inset hero image in a rounded media card |

---

## CSS variable map (implement in `globals.css`)

```css
:root {
  --void: #000000;
  --ink: #030712;
  --navy: #070b14;
  --navy-mid: #0c1222;
  --fog: #ffffff;
  --mist: rgba(255, 255, 255, 0.65);
  --haze: rgba(255, 255, 255, 0.45);
  --line: rgba(255, 255, 255, 0.12);
  --glass: rgba(255, 255, 255, 0.04);
  --blue: #3b82f6;
  --blue-deep: #2563eb;
  --cyan: #06b6d4;
  --yellow: #fff971;
  --gold: #facc15;
  --amber: #f59e0b;
}
```

---

## Copy seeds (landing v1)

- **Brand:** Hypertron
- **Headline:** One *programmable* layer for B2B payments & operations.
- **Lead:** Onboard teams, run compliance, and settle on Stellar — with privacy you can program.
- **Primary CTA:** Book a Demo → `https://calendly.com/kararsweta/30min`
- **Secondary CTA:** View docs (placeholder `#` until docs route exists)
- **Triad labels:** Onboard / Settle / Scale
- **Footer:** © Hypertron Labs · Built on Stellar

---

## File ownership

| Artifact | Path |
|---|---|
| This reference | `design.md` |
| Tokens + atmosphere | `src/app/globals.css` |
| Fonts | `src/app/layout.tsx` + `public/fonts/` |
| Landing | `src/app/page.tsx` (+ small components under `src/components/landing/` if needed) |
| UI kit | shadcn/ui in `src/components/ui/` (`components.json`) |

### shadcn conventions

- Prefer `@/components/ui/*` for interactive primitives (Button, Dialog, Input, etc.).
- Dark chrome uses root tokens (`primary` = blue `#2563eb`).
- White hub panel: wrap with `.surface-light`.
- Extra button variants: `fog` (white CTA), `signal` (yellow CTA), `glass` (outline on dark).

When in doubt: open `legacy/src/styles/globals.css` and the marketing mono components — then map choices back to the tokens above (blue + yellow only; no purple).
