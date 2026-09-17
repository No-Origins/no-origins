# No Origins — Design System

*Written 2026-09-09 from Brand.md and the decision boards. Every value here is decided, not proposed, unless marked **open**. This is the spec for the `@no-origins/ui` package inside the portfolio repo; the portfolio is its first consumer.*

---

## 0. What this system implements

| Decision | Value |
|---|---|
| Mark | **The blob** — a pill with two eyes. Outlined = logotype; filled = character. From Bhargav's sketch. |
| Colour | **Sketch** — pastels on warm grey; ink does the pointing. |
| Material | **One flat surface** — `--surface`, a `--rule` hairline, an elevation. Nothing is seen through anything; glass was removed 2026-09-16 (§3, Atomic.md D10). |
| Type | **Bowlby One** (display, h2 and up, wordmark) · **Hanken Grotesk** (body, UI, h3/h4) · **JetBrains Mono** (labels, code) |
| Home concept | A canvas of blobs that talk, one chat input, the wordmark bottom-right. **Retired 2026-09-16** with React Flow (Atomic.md D11): the portfolio is pages, and a different approach to the canvas comes later. §8 is the record of what was built. |
| Character | Warm, playful, expressive, approachable — and *passion, bold, curious*. |
| Scope | Portfolio first: About · Work · Roadmap · Contact. The system is `packages/ui` in the No Origins monorepo; the portfolio is `apps/portfolio`, its first consumer. |

**The one tension, resolved:** the palette is the softest of the eight offered, and the brief says *bold* and *passion*. So boldness is never saturation here. It comes from **scale** (big type, big blobs), **shape** (fully-round pills, generous radii), **material** (one opaque surface with a warm shadow under it) and **character** (things that look at you and speak). Quiet means uncluttered, not muted.

## 1. Principles → rules

| Principle (Brand.md §6) | What the system does about it |
|---|---|
| Blocks, not pages | Every surface is a component with tokens in; no page-specific CSS. A new block imports the package and is native. |
| Warm by default | Light theme is primary. Ground is warm grey, ink is warm near-black. Dark theme exists, is cared for, and swaps tokens only. |
| Play without noise | Expression goes into blobs, colour tints and motion. Layout stays single-column-calm with generous space. |
| Make the making visible | Roadmap is a first-class component. Unfinished things get a sleeping blob, not a "coming soon." |
| One system, every block | One token file, one component set, one motion vocabulary. A block picks a **hue**; nothing else changes. |

## 2. Colour — the Sketch palette

All values are `oklch()`; hex is the sRGB fallback. Tailwind 4 consumes these through `@theme` (§11).

### 2.1 Roles — light

| Token | oklch | hex | Use |
|---|---|---|---|
| `--ground` | `oklch(0.95 0.004 90)` | `#EFEEEB` | Page background. The dot grid sits on this. |
| `--ground-2` | `oklch(0.92 0.005 90)` | `#E6E4E1` | Wells, inset areas, code blocks. |
| `--surface` | `oklch(0.985 0.003 90)` | `#FBFAF8` | The one material (§3): cards, bars, menus, dialogs — opaque, at one of three elevations. |
| `--ink` | `oklch(0.30 0.012 60)` | `#322C28` | Text, icons, primary buttons, outlined blob. |
| `--ink-2` | `oklch(0.42 0.012 60)` | `#524C47` | Secondary text. |
| `--muted` | `oklch(0.55 0.01 60)` | `#76706C` | Captions, placeholders, disabled. |
| `--rule` | `oklch(0.86 0.006 90)` | `#D2D1CD` | Hairlines, dividers. |
| `--eye` | `#474747` light · `#000000` dark | — | Blob eyes. Pure black in dark mode (his note, 2026-09-09). |

Contrast: ink on ground ≈ 8:1. Muted on ground ≈ 4.6:1 — fine for captions, never for body.

### 2.2 The family — seven blobs

Each hue has a **fill** (the blob, tints, chips) and a **deep** tier (text, icons, strokes — passes 4.5:1 on ground). Body text is never set in a fill.

| Hue | Fill oklch | Fill hex | Deep oklch | Deep hex | Proposed owner |
|---|---|---|---|---|---|
| `pink` | `oklch(0.82 0.10 20)` | `#FEAAA9` | `oklch(0.45 0.16 20)` | `#9A1C2E` | unassigned |
| `green` | `oklch(0.91 0.10 130)` | `#CBEFA8` | `oklch(0.45 0.12 140)` | `#2B641D` | Writing — and the greeter ("Hey there!!") |
| `grey` | `oklch(0.93 0.006 90)` | `#E9E8E3` | `oklch(0.45 0.01 90)` | `#57554F` | unassigned — the host is `--surface` with a hairline (§4.1b), not grey |
| `lavender` | `oklch(0.85 0.08 300)` | `#D5C2FB` | `oklch(0.45 0.14 300)` | `#623E96` | Editor |
| `peach` | `oklch(0.87 0.07 50)` | `#FBC8AC` | `oklch(0.45 0.120 50)` | `#883C00` | **Portfolio** — this block's accent |
| `yellow` | `oklch(0.92 0.11 100)` | `#F5E78F` | `oklch(0.45 0.090 90)` | `#695205` | Tools |
| `blue` | `oklch(0.80 0.09 260)` | `#9CBFF8` | `oklch(0.45 0.13 260)` | `#26529C` | Agents harness |

Owners are proposals. What's fixed: fill and deep move together, and a block gets exactly one hue.

**How the pastel actually happens — the tint tier.** Bhargav's Figma fill is **`#8268FF` at 23%** — a saturated violet, nearly transparent, over the grey ground. The pastel is the *result*, not the paint. So every hue carries a third value, the **tint**: the saturated colour the blob is filled with at 24% opacity (tuned from Figma's 23%). Fill (the pastel it reads as) is what chips, bubbles and tints use; deep is for text; tint is for glass.

| Hue | Tint (the saturated source) | Reads as |
|---|---|---|
| `--pink-tint` | `oklch(0.62 0.22 20)` | `--pink` |
| `--green-tint` | `oklch(0.72 0.22 135)` | `--green` |
| `--lavender-tint` | `oklch(0.60 0.21 285)` ≈ `#8268FF` | `--lavender` |
| `--peach-tint` | `oklch(0.70 0.19 45)` | `--peach` |
| `--yellow-tint` | `oklch(0.85 0.19 95)` | `--yellow` |
| `--blue-tint` | `oklch(0.62 0.19 260)` | `--blue` |

Each block also gets `--accent-tint` alongside `--accent` / `--accent-deep`.

**What the tints are for, since 2026-09-16.** They were the paint behind the glass, and there is no glass (§3). They stay because two other things read them: a pattern's line is a mix of `--hue-tint` with `currentColor` (Patterns.md §4), and the `Placeholder` tag is drawn on one. Grey gained a tint on 2026-09-11 for exactly that reason — it had none while it was only the host's non-fill.

**Tints.** Never hand-pick a lighter version. Derive: `color-mix(in oklch, var(--hue) 45%, var(--surface))` for bubble tints and chip backgrounds; `22%` for large areas.

### 2.3 Block accent

Each block sets two variables at its root and nothing else:

```css
/* portfolio/src/app/layout.tsx → <html data-block="portfolio"> */
[data-block="portfolio"] { --accent: var(--peach); --accent-deep: var(--peach-deep); }
[data-block="editor"]    { --accent: var(--lavender); --accent-deep: var(--lavender-deep); }
```

Focus rings, active tabs, the chat-input send button, link underlines and the block's own blob all read `--accent` / `--accent-deep`. Everything else reads ink.

### 2.4 Semantic

| Token | oklch | hex | Note |
|---|---|---|---|
| `--good` | = `--green-deep` | `#2B641D` | |
| `--warn` | `oklch(0.50 0.105 75)` | `#865901` | |
| `--bad` | `oklch(0.50 0.18 25)` | `#B32228` | |
| `--info` | = `--blue-deep` | `#26529C` | |

Semantic colour is separate from the accent and never used decoratively.

### 2.5 Dark theme

Swap tokens; touch nothing else. Blobs get darker and slightly less chromatic so they sit in the room rather than glow; deep tiers flip light for text on dark.

| Token | oklch | hex |
|---|---|---|
| `--ground` | `oklch(0.20 0.006 60)` | `#181513` |
| `--ground-2` | `oklch(0.17 0.006 60)` | `#110F0D` |
| `--surface` | `oklch(0.25 0.007 60)` | `#24211E` |
| `--ink` | `oklch(0.93 0.005 90)` | `#E9E8E4` |
| `--ink-2` | `oklch(0.80 0.006 90)` | `#BFBEB9` |
| `--muted` | `oklch(0.66 0.008 60)` | `#96918D` |
| `--rule` | `oklch(0.32 0.006 60)` | `#353230` |
| `--eye` | `#000000` — pure black | `#000000` |
| `--shade` | `oklch(0 0 0)` — shadows turn black; in the light they are `--ink` | `#000000` |
| `color-scheme` | `dark` — form controls and scrollbars follow (light sets `light`) | — |
| `--pink` / deep | `oklch(0.72 0.11 20)` / `oklch(0.80 0.10 20)` | `#E18888` / `#F8A4A3` |
| `--green` / deep | `oklch(0.78 0.11 130)` / `oklch(0.82 0.12 140)` | `#A0C679` / `#9AD78C` |
| `--grey` / deep | `oklch(0.78 0.006 90)` / `oklch(0.82 0.01 90)` | `#B9B7B3` / `#C6C4BD` |
| `--lavender` / deep | `oklch(0.74 0.09 300)` / `oklch(0.80 0.10 300)` | `#B39EDC` / `#C7AFF5` |
| `--peach` / deep | `oklch(0.76 0.09 50)` / `oklch(0.82 0.10 50)` | `#E0A07D` / `#F9B189` |
| `--yellow` / deep | `oklch(0.80 0.12 100)` / `oklch(0.86 0.12 90)` | `#D0BF5E` / `#EFCE6F` |
| `--blue` / deep | `oklch(0.70 0.10 260)` / `oklch(0.78 0.10 260)` | `#7A9FDD` / `#92B9F8` |
| `--warn` / `--bad` | `oklch(0.78 0.13 75)` / `oklch(0.72 0.16 25)` | `#E8AA4E` / `#F97770` |

Theme wiring (three states — system, explicit light, explicit dark):

```css
:root { /* light tokens */ }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { /* dark tokens */ } }
:root[data-theme="dark"] { /* dark tokens */ }
```


**Ink on a tile (added 2026-09-10).** The `-deep` tiers flip in dark — `--peach-deep` is L 0.45 in light and L 0.82 in dark — because their job is *this hue as text on the ground*. A pastel tile is light in both themes, so text on it needs a different token: **`--{hue}-ink`**, the light deep value, defined once in `:root` and never redefined. Found when the bento's loud cells lost their figures in dark. Anything that paints a hue as a surface and writes on it uses `-ink`, not `-deep`.

## 3. Material — one flat surface

One material, three elevations. A surface is the `--surface` fill, a `--rule` hairline and a shadow; nothing shows through it, so nothing is asked of whatever is behind it. In the package it is the `Surface` atom (`level` 1 | 2 | 3, `radius` xs…pill, `as`); on a host without React it is the class.

```css
.noo-surface    { background: var(--surface); border: 1px solid var(--rule); box-shadow: var(--e1); }
.noo-surface--2 { box-shadow: var(--e2); }
.noo-surface--3 { box-shadow: var(--e4); }
```

| Level | Shadow | Used for |
|---|---|---|
| 1 | `--e1` | Cards, the Field box, Bubble, the secondary Button, Segmented and ThemeSwitch, the Tool sidebar and inspector — a thing resting on the ground |
| 2 | `--e2` | NavBar, Menu, the Tool bar, ChatInput, Toast — a thing sitting over a screen's content |
| 3 | `--e4` | Dialog and Sheet, and nothing else. Nothing floats this high but a thing that has taken the whole screen's attention |

**Rules.**
- **A surface is opaque.** No `backdrop-filter`, no translucent fill, no `color-mix` with `transparent`. Two surfaces that stack simply stack; the top one is on top.
- **Nothing is asked of the ground.** A surface reads the same on the grid, on `--ground-2` and on a photograph, so no component has to know where it was placed. The old "glass only over something worth seeing through" rule has nothing left to govern.
- **Hover lifts one level and one pixel** — `.noo-lift`, `--e1` → `--e2` over `--d-fast`. That is the only motion a surface makes (§7).
- **A level changes the shadow and nothing else.** Not the fill, not the hairline, not the radius; radius is the component's own (§6).
- Forced colours (Windows high contrast): the hairline becomes `CanvasText`, as it always did.

**Removed 2026-09-16 — what glass was, and why it went.** Bhargav, asking for the v1 revamp: *"No more glass effects."* Gone from the package: the `Glass` atom, `glass.css` and its export, every `--glass-*` token and every `.noo-glass*` class, `Card`'s `surface` prop, `BentoCell`'s `glass` tone, and the blob's `refraction` prop with `GroundProvider`, `useGround` and `measureGround`. The recipe is worth stating once more, because it is what the numbers further down were tuned against: a `--surface` fill at 58 / 66 / 74%, `backdrop-filter: blur(14 / 18 / 22px) saturate(1.35)`, a hairline of ink at 8%, a lit top edge, a settled bottom edge, and `--e1` / `--e2` / `--e4` beneath — three levels used at exactly the places the three surface levels are used now, which is why the swap was one edit per component rather than a redesign. It had already lost its specular sweep earlier the same day, under the no-gradients rule, which left it thinner than it was ever designed to be. The cost of the removal is recorded in Atomic.md D10: the platform is no longer visible through its own UI, and `prefers-reduced-transparency` stops being a theming axis (§10).

**Blob material — flat since 2026-09-16.** A character *is* its colour: the body is filled with the hue itself, opaque, no tint tier and no frost. The host is `--surface` with a **1.5** hairline in ink at 16% — that hairline is now the whole of how you tell the host from a character. The drop shadow beneath is kept, `0 5px 14px ink/10%`, because it is what puts the pill in the room; it is an elevation, not a material.

*Kept as history — the Blob Lab numbers* (2026-09-09, `decisions/blob`), tuned by Bhargav against the dot grid. Four cues, in his numbers. **Transparency:** the hue's tint at 24% (host: white at 5%), the grid always visible through the body. **Frost 2:** `blur(2px) saturate(0.6)` on the wrapper — glass here *desaturated* what was behind it rather than enriching it, and that was most of why the pill read as calm. **Light −45°, thin and nearly continuous:** one rim stroke 0.8 wide (host 0.95) along the light axis, white 90% at the top-left easing to 17% at 40% of the way and back to 40% on the far side, and **no inner shadow** — depth was tuned to zero, so the pill was a flat sheet of glass and not a thick lens. **Refraction, faint and wide:** the grid redrawn inside the pill, magnified 6% about the centre, masked to a band from 32% of the radius outward (full at 92%) at 32% opacity, phase-aligned to the real grid from the node's position. Nothing else: a highlight ellipse, a radial glow and a shadow band were each tried and each read as a sticker or a lens; dispersion waited for a shader and never got one. Two of the four cues needed a canvas to supply the phase and the viewport, so they would have gone with React Flow in any case (Atomic.md D11).

## 4. The blob

### 4.1 Geometry — from Bhargav's Figma component

Everything is defined on a **96 × 64** box (3 : 2), exactly the Figma frame. Scale, never redraw.

| Part | Value | As a ratio / Figma |
|---|---|---|
| Body | `rect 0 0 96 64, rx 32` | radius = 50% height — a true pill (Figma corner radius 100) |
| Eyes | `circle (30, 32) r 10` and `circle (66, 32) r 10` | 20px eyes · gap 16 · padding 20 horizontal, 22 vertical. **Tuned in the Blob Lab** — wider and larger than the Figma auto-layout (24 / 10); his call. |
| Eye colour | `--eye` = `#474747` light, `#000000` dark | His selection colour; pure black in dark mode |
| Outline (logotype) | `rect 2.75 2.75 90.5 58.5, rx 29.25, stroke 5.5, fill none` | stroke = 8.6% of height, inset by half the stroke |
| Material (colour character) | **Flat since 2026-09-16:** the body is the hue itself, opaque; no rim, no frost, no refraction. The drop shadow beneath stays | See §3. The Blob Lab numbers — tint 24%, frost 2, rim 0.8 — are kept there as history |

```svg
<!-- colour character: the hue, opaque. The host adds a 1.5 hairline in ink at 16% (§4.1b) -->
<svg viewBox="0 0 96 64" width="72" role="img" aria-label="Portfolio blob">
  <rect class="noo-blob__body" width="96" height="64" rx="32" fill="var(--hue)"/>
  <circle cx="30" cy="32" r="10" fill="var(--eye)"/><circle cx="66" cy="32" r="10" fill="var(--eye)"/>
</svg>
<!-- logotype -->
<svg viewBox="0 0 96 64" aria-hidden="true">
  <rect x="2.75" y="2.75" width="90.5" height="58.5" rx="29.25" fill="none" stroke="currentColor" stroke-width="5.5"/>
  <circle cx="30" cy="32" r="10" fill="currentColor"/><circle cx="66" cy="32" r="10" fill="currentColor"/>
</svg>
```

### 4.1b The host — Bhargav's blob has no colour

Every other blob is a colour. **The host has no colour of its own**: it is `--surface` with a **1.5** hairline in ink at 16%, the same material as a card, so it reads as a pill standing on the ground rather than a hole cut in it. That is how you tell which one is him without a label.

**Amended 2026-09-16 (Atomic.md D10).** It was the glass material itself, refracting the dot grid behind it, and the sentence it carried was the better one — *you're made of the platform*. Flat, the host says only *uncoloured*, and a hairline does the work refraction used to do. That is the plainest thing removing glass cost, and it belongs here rather than in a footnote.

*The record, kept.* Figma effect, as Bhargav set it on every blob: *Glass · light −45° @ 80% · refraction 80 · depth 20 · dispersion 50 · frost 2 · splay 0*; fill a saturated hue at 23%, or nothing for the host. As built in 0.1.0: the same cues as every character with **no tint** — `rect.body` white at 5% purely for presence, the rim 0.95 rather than 0.8, frost and rim refraction identical. He tuned the lab looking at the host, so those numbers were the host's first, and over the grid it read as the light frosted pill in the sketch: transparent, not milky, not outlined. A **v2** was planned and never built — real refraction through an SVG `feDisplacementMap` or a Skia/WebGL shader, which is where dispersion (the faint colour fringe at the rim) would have become possible. If the different approach D11 leaves room for brings a canvas back, that is where to start reading.

Rules: the host is the **only** uncoloured blob. Its eyes are `--eye` like everyone else's, and where it speaks it speaks first ("What are we doing today?").

### 4.2 Sizes

All 3 : 2. Eye radius scales with the box (r = 12.5% of height).

| Name | Width × Height | Where |
|---|---|---|
| `favicon` | 30 × 20, centred in 32 × 32 | Browser tab; eyes r 2.5 — still two dots |
| `inline` | 1.5em × 1em | In running text, in the wordmark |
| `nav` | 36 × 24 | Nav bar, list avatars |
| `sm` | 48 × 32 | Chips, block cards |
| `md` | 72 × 48 | Canvas characters — the sketch size |
| `lg` | 96 × 64 | **The Figma frame.** Hero, About |
| `hero` | 168 × 112 | The one big one |

### 4.3 States (motion in §7)

| State | Eyes | Body | When |
|---|---|---|---|
| `idle` | open | breathe: scale 1 → 1.03 → 1, 6s, sine | default |
| `blink` | scaleY 1 → 0.1 → 1 over 140ms | — | every 4–9s, random per blob; never in sync |
| `look` | translate up to ±3 units toward pointer, 240ms | — | pointer within 240px |
| `speak` | open | bubble anchored top-right, 8px gap, pops in | has a message |
| `sleep` | `rect 20×4.5, rx 2.25` at x 20 and 56, y 29.75, in place of each circle | breathe slower, 9s | roadmap items, disabled blocks |
| `hover` | look | scale 1.04, 140ms | interactive blob |

Reduced motion: no breathe, no look; blink stays (it's the only thing that makes them alive) but at 8–14s.

**As built (step 2).** Blink is a per-blob timer toggling `is-blinking` on the eye group (CSS `noo-blink`, `transform-box: fill-box`); look is one shared `pointermove` listener per page, flushed on `requestAnimationFrame`, writing a `translate` on the eye group that CSS transitions over 240ms; breathe animates the `scale` property with a phase derived from the component id, so hover's `transform: scale(1.04)` composes with it and server and client agree. Refraction went with the glass on 2026-09-16 (§3): the body is the hue, and nothing has to be measured against the ground any more — which also removed the one piece of blob behaviour that could not server-render.

### 4.4 Wordmark

**N [blob] RIGINS** — caps, **Bowlby One** (its one weight), tracking `+0.01em`. The blob is the logotype variant at **height 0.82em**, width auto, gap `0.06em` each side, `currentColor`. Never letterspace the caps wider to "fit" the blob; the blob fits the caps. Bowlby's heavy strokes match the blob's 5.5 outline almost exactly — that is why it works.

In running text the name is set lowercase, **no origins**, Hanken Grotesk 600 — never mixed with the caps lockup in one line.

## 5. Typography

Loaded with `next/font/google`, `display: swap`, latin subset, exposed as `--font-display`, `--font-sans`, `--font-mono`.

**Display: Bowlby One** — decided 2026-09-09 on the type board (`decisions/type`), after Bricolage Grotesque was rejected. Bhargav's own direction was Phosphate Solid — macOS-only, licence required — and Bowlby One is its closest free relative with more bite: poster-heavy, slightly narrow, retro without the softness. **One weight.** That sets the rule below.

**Body and UI: Hanken Grotesk.** **Labels and code: JetBrains Mono.**

**The Bowlby rule.** A single-weight poster face cannot make hierarchy by weight and shouts at small sizes. So Bowlby One appears **only at h2 (34px) and above, and in the wordmark**. h3, h4 and everything smaller are Hanken Grotesk 600. Never request any weight but 400 from Bowlby — browsers synthesize a faux bold, and it looks like one.

| Token | Size / line | Face · weight | Tracking | Use |
|---|---|---|---|---|
| `display-1` | 72 / 1.00 | Bowlby One 400 | 0 | One per page, if any |
| `display-2` | 56 / 1.00 | Bowlby One 400 | 0 | Page hero |
| `h1` | 44 / 1.02 | Bowlby One 400 | −0.005em | |
| `h2` | 34 / 1.05 | Bowlby One 400 | −0.005em | Section titles — the smallest Bowlby |
| `h3` | 26 / 1.15 | Hanken 600 | −0.010em | Block titles |
| `h4` | 21 / 1.25 | Hanken 600 | −0.005em | Card titles |
| `lead` | 19 / 1.50 | Hanken 400 | 0 | Intro paragraphs |
| `body` | 16 / 1.55 | Hanken 400 | 0 | |
| `body-sm` | 14.5 / 1.50 | Hanken 400 | 0 | |
| `bubble` | 15 / 1.40 | Hanken 500 | 0 | Speech bubbles |
| `caption` | 13 / 1.45 | Hanken 500 | 0 | |
| `label` | 12 / 1.30 | JetBrains Mono 500 | +0.10em, uppercase | Eyebrows, meta |
| `code` | 14 / 1.55 | JetBrains Mono 400 | 0 | |

Shipped as classes — `.noo-display-1`, `.noo-display-2`, `.noo-h1` … `.noo-h4`, `.noo-lead`, `.noo-body`, `.noo-body-sm`, `.noo-bubble-text`, `.noo-caption`, `.noo-label`, `.noo-code`, `.noo-nums` — in `typography.css` (step 3), so a host without Tailwind has the same voice; the mobile step-down is inside them.

Rules: measure 60–70ch for running text; `text-wrap: balance` on headings, `pretty` on paragraphs; `font-variant-numeric: tabular-nums` wherever digits align. Mobile: display sizes step down one row; h2 may drop to 30px but never below — under that it becomes Hanken.

## 6. Space, radius, elevation

**Space** — 4px base. `1`=4 `2`=8 `3`=12 `4`=16 `5`=20 `6`=24 `8`=32 `10`=40 `12`=48 `16`=64 `20`=80 `24`=96. Section rhythm: 96 desktop / 64 mobile. Card padding: 20–24. Bubble padding: 10 × 16.

**Radius** — round is the brand.

| Token | px | Use |
|---|---|---|
| `--r-xs` | 6 | Swatches, tiny tiles |
| `--r-sm` | 10 | Code blocks, inputs inside cards |
| `--r-md` | 14 | Small cards, fields |
| `--r-lg` | 20 | Cards, panels |
| `--r-xl` | 28 | Sheets, the Menu, hero panels |
| `--r-2xl` | 48 | **Large-format media** — anything where the picture is the whole surface. Added 2026-09-11: at 420px wide, 28 reads as a rounded rectangle and 48 reads as an object. **`ProfileCard` is the one exception on the platform**: it uses a *proportional* radius (15%) because the same card renders at 280 in a row and 420 at the front of a deck, and a fixed radius changes shape between the two. A square whose whole content is one photograph is the only case where that is worth an exception. A `corner-shape: squircle` version was tried and removed: Chromium clips composited descendants — a masked overlay is one — with a circular arc whatever `corner-shape` says, so the card's corner and its overlay's corner disagreed |
| `--r-pill` | 999 | Blobs, buttons, chips, bubbles, the chat input |

**Elevation** — warm shadows, never grey. All use `--shade` at low alpha: `--ink` in the light theme, black in the dark one (a light ink would glow, not shade). The blob's drop shadow and the glass bottom edge use it too.

| Token | Value |
|---|---|
| `--e1` | `0 1px 2px ink/6%, 0 2px 6px ink/5%` |
| `--e2` | `0 4px 12px ink/8%, 0 1px 2px ink/5%` |
| `--e3` | `0 8px 24px ink/10%, 0 2px 6px ink/6%` |
| `--e4` | `0 24px 64px ink/16%, 0 4px 12px ink/8%` |

Hover lifts one level (`--e1` → `--e2`) and one pixel. Nothing floats above `--e3` except sheets.

## 7. Motion

| Token | Value |
|---|---|
| `--d-fast` | 140ms |
| `--d-base` | 220ms |
| `--d-slow` | 380ms |
| `--d-ambient` | 6000ms |
| `--ease` | `cubic-bezier(0.2, 0.7, 0.2, 1)` |
| `--ease-enter` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |

**Five named patterns**, and there are only five. Four of them are a class in `motion.css` and an `effect` on the `Motion` atom; blink is the blob's own, because only `Blob` can time it. All five have a line in `motionNotes`, so a pattern is described once and read wherever it is shown.

| Pattern | Class | Spec |
|---|---|---|
| **rise** | `.noo-rise` | opacity 0.35→1, translateY 8→0, `--d-slow` `--ease-enter`; siblings stagger 40ms; **from a visible state** — never park content at opacity 0 waiting for an observer |
| **pop** | `.noo-pop` | scale 0.92→1, opacity 0→1, `--d-base` `--ease-spring`; origin bottom-left (toward the blob that is speaking) |
| **breathe** | `.noo-breathe` | scale 1→1.03→1, `--d-ambient`, sine, infinite; each blob offset by a phase derived from its id, so none breathe in step |
| **lift** | `.noo-lift` | translateY −1px, `--e1`→`--e2`, `--d-fast`. The only motion a surface makes (§3) |
| **blink** | — (the blob's own) | scaleY on the eye group, `--d-fast`, every 4–9s randomised. It has no class because only `Blob` can time it |
| **page** | — | one orchestrated arrival per page: nav, then hero, then blocks. No scroll-jacking, no parallax. *As built:* every `Section` carries `rise` (siblings stagger 40ms) unless `arrive={false}`; the nav is static; off under reduced motion. A composition rule, not a sixth pattern |

`prefers-reduced-motion: reduce` → ambient animations off, transitions reduced to opacity only, blink slowed to 8–14s. Motion is a brand asset (Brand.md §8), which is exactly why it is rationed.

**Motion is a layer of the system (2026-09-16, Atomic.md D12).** Bhargav: *"Motion should also be part of the design system."* It was already tokens and four keyframes; what it was not was something a person could find, name or show. Now:

| Export | From | What |
|---|---|---|
| `durations` | `@no-origins/ui` (`tokens/motion.ts`) | `{ fast: 140, base: 220, slow: 380, ambient: 6000 }` — the same numbers as `--d-*`, in milliseconds |
| `easings` | same | `{ standard, enter, spring }` as `cubic-bezier(…)` strings — the same curves as `--ease*` |
| `motionPatterns` | same | `["rise", "pop", "breathe", "lift", "blink"]`, and the `MotionPattern` type |
| `motionNotes` | same | per pattern: its duration, its easing and one line saying what it is for — what the showcase renders |
| `prefersReducedMotion()` | same | a plain function, safe on the server (false there) |
| `Motion` | `@no-origins/ui` (`atoms/Motion.tsx`) | the atom: `effect: rise \| pop \| breathe \| lift`, `delay` in ms for a stagger `:nth-child` cannot see, `as` |
| `useReducedMotion()` | same | the preference, live, through `useSyncExternalStore` — for a script that has to ask before it moves anything |

The `Motion` atom exists so a pattern is a **thing** — something the registry can hold (it and `Surface` are the `motion` group), the catalogue can show and a document could once have named — rather than a class an app is expected to remember. `/tokens/motion` on the showcase is the screen: it reads `durations`, `easings` and `motionNotes` out of the package and plays each pattern, so the page cannot describe motion the system does not have.

**The one duplication, stated.** The numbers live twice: as custom properties in `tokens.css`, which is what every stylesheet animates against, and as values in `tokens/motion.ts`, which is what a script reads. **They must agree, and nothing enforces it** — a `var()` cannot be read without a live element, and generating one file from the other would buy a build step for seven numbers. So the rule is written in three places instead: here, at the top of `motion.ts`, and on the showcase screen. Change one, change the other.

## 8. Layout

> **Superseded 2026-09-16: React Flow and the canvas were removed from the system** (Atomic.md D11). The portfolio renders as **pages** — `Page` · `NavBar` · `Footer`, one route per section, and the six widgets on the home, which introduces him and leads into them. A different approach to the canvas comes later; Bhargav's words were *"I want to take a different approach later."* The text below is the record of what was built and why: the grid and the bento (§8, still live — they are the layout, not the canvas), and then §8.1–§8.7, which describe a renderer that is no longer in the package. Read those as history. What survives of them in code is the registry's contract (Scene-Schema.md §2–§3), the box grid, and every measurement taken on the way.

**Ground — the grid** (revised 2026-09-10, evening; it was a dot grid). Large lines, boxes of **160** in canvas units, and **every bento cell sits in a box with 8 of padding** — so a cell is 144, the gutter between cells is 16 (two paddings meeting), a cell spanning *n* boxes is `n · 160 − 16`, and a 4 × 3 widget is exactly 640 × 480. The layout and the ground are the same grid, which is why widgets look *placed* rather than floated.

```css
:root { --grid-box: 160px; --grid-pad: 8px; --grid-line: color-mix(in oklch, var(--ink) 9%, var(--ground)); }
:root { --grain: url("data:image/svg+xml,… feTurbulence …"); --grain-strength: 0.075; }   /* the card's texture: a filter the browser runs, never a bitmap */
.noo-graph { background-image: linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px); background-size: var(--grid-box) var(--grid-box); }
.noo-bento { --bento-cell: calc(var(--grid-box) - 2 * var(--grid-pad)); --bento-gap: calc(2 * var(--grid-pad)); padding: var(--grid-pad); }
```

The bento derives from the grid tokens by construction, so the two cannot drift. Scene coordinates are authored in **boxes** (§8.3). What the change costs: the blob's refraction was tuned to *dots* (§3 cue 4, §4.1b) — see §13 for the two ways forward.

**The canvas is the base layout of No Origins** (decided 2026-09-09). Every block's own surface is an infinite canvas: the portfolio at `bhargav.no-origins.com`, the agents harness at `no-origins.com`. The portfolio has no pages — all of it lives on the canvas, organised as a map (§8.3). Page mode does not leave the system; it is what **documents** wear, which is what the editor block publishes. Nothing on the portfolio uses it.

| | Canvas | Page |
|---|---|---|
| For | Every block's surface: the portfolio (all of it), the agents harness | Documents — the editor block's articles, anything read start to finish |
| Layout | Full viewport; nodes hand-placed in canvas space; **chat input** fixed bottom-centre, `min(640px, 92vw)`; menu bottom-left; **wordmark** bottom-right; theme switch and "Reset view" top-right | `max-width 1120`; gutters 24 (mobile) / 48 (≥ md); 12 columns, gap 24; single reading column ≤ 68ch |
| Nav | None — moving the viewport *is* the nav (§8.5) | `NavBar` (glass-2), sticky |
| Blobs | Characters at `md` on the grid, speaking; the glass host among them; the ones inside `BlockCard` / `RoadmapItem` at `sm` | Avatars (`sm`, `nav`) and the glass host at `lg` |

Breakpoints: `sm` 640 · `md` 900 · `lg` 1200.

**Page mode sizing rule.** `body` is `min-height: 100%`, never `height: 100%`: a flex column of fixed height shrinks its children, and a glass header (`overflow: hidden`) shrinks to its border. `Page`'s children are `flex-shrink: 0`. Found in the first visual review, when the NavBar had collapsed to 1px on every page.

### 8.1 Canvas mode is React Flow

The dot grid is not a background image — it is the `<Background variant="dots" gap={32} size={4} />` of an infinite `@xyflow/react` canvas (`size` is the dot's *diameter*; `.dots` draws a 2px radius, so 4 keeps the two grids identical). The mapping:

| Design element | React Flow |
|---|---|
| Grid lines | `<Background variant="lines" gap={160} lineWidth={1} />`, stroked `--grid-line` in CSS — pans and scales with the viewport, and every widget sits in its boxes. `CanvasShell` reads `--grid-box` off its container so the flow's grid, `.noo-ground` and `.noo-graph` never drift. Landed 2026-09-11 with step 12. |
| Blob · panel · region | Three custom node types (§8.2). The glass host is the `blob` type with `variant: 'glass'` |
| Speech bubble | `<NodeToolbar>` on the speaking node — anchored, follows the node, hides below zoom 0.5 |
| Chat input | `<Panel position="bottom-center">` — fixed to the viewport, not the canvas |
| Menu · wordmark · theme + reset | `<Panel position="bottom-left">` · `<Panel position="bottom-right">` · `<Panel position="top-right">` |
| Pan / zoom | Travel is diagonal now the map is a ring, so the wheel has to pan in both axes. **`panOnScroll` on**: the wheel *pans*, and zoom is pinch or ⌘/ctrl-wheel (`zoomOnScroll` off). Step 6 had it the other way round, when there was nothing to scroll to; a 1700-unit column is unreadable if the wheel zooms. Drag on empty canvas also pans. `minZoom 0.15` (the ring fits at ≈ 0.185 — §8.3), `maxZoom 2.5`. On load the viewport lands on the requested view (§8.5) — never a fit of the whole map |
| Edges | The through-line, drawn: dotted 1.5px in `--rule`, no arrows, no interaction, beneath the panels. Three of them — `host → about`, `Hashnode → the editor block`, `Dataflix → the agents harness`. A fourth (`portfolio → work`) was dropped: it crossed the about column and read as spaghetti. **Not React Flow edges** — those need handles on their nodes and blobs have none, so they are paths in a `ViewportPortal` computed from the scene's own coordinates (`Threads`). Consequence: portals do not server-render, so the threads are client-only. They are decorative and `aria-hidden`, so that is a fair trade |
| Chrome | `<MiniMap>` **on** — glass-1, **top-left**, under the attribution. It sat bottom-left until the switcher went vertical and the two fought for the corner; top-left also decouples it from however tall the switcher gets. Blob nodes draw in their own hue, panels as plates, region labels `transparent` (a 560-wide label would be a slab). Default `<Controls>` off; a glass "Reset view" joins the theme switch in **one** top-right panel — two panels at the same `Panel position` sit on top of each other |
| Selection | `selectionOnDrag` off; `nodesConnectable` off; blobs open or pan; panels are read, and their own links and buttons take the clicks (`nodrag`) |
| Text selection | `.react-flow__node` sets `user-select: none` in `base.css` — verified in 12.11.6. Content panels set `user-select: text`, and win because the host imports `base.css` into `layer(base)` (§11.2 rule 3). Without it not one word of the portfolio can be copied |

### 8.2 Node types

| Node type | Renders | Rules |
|---|---|---|
| `blob` | A blob at `md`, its bubble a `NodeToolbar` | Draggable, focusable, `role="button"` when it has a destination; bubbles hide below zoom 0.5 |
| `panel` | A surface holding one card — `Card`, `BlockCard`, `RoadmapItem`, or bare prose with `surface: none` | **Not draggable**: dragging what you are reading is hostile. Declares `width` and `height` in canvas units; content that overruns scrolls inside with `nowheel`; interactive children carry `nodrag`; `user-select: text` |
| `region` | The column's map label: a display-face word at **96px in canvas units** — because it is the one heading that has to read at the ring's 0.185 overview — over a dotted `--rule` hairline the width of the column | A short plate (560 × 130) sitting above the column at y −180, **not** a column-height box: a view anchors on it (§8.5), and a tall one landed half-cut off the top of the screen. `zIndex` 0, `pointer-events: none`, and `aria-hidden` — the section's real `<h2>` is in its intro panel |

### 8.3 The portfolio map

**A ring of widgets** (revised 2026-09-10, evening). Me at the centre, always full; the other six sections around it as **widgets** — bento grids that preview a section from a distance — each with a **full view** that snaps to the viewport when you get close (§8.4). Work on the right half, the person on the left, so a recruiter pans one way and someone curious about him pans the other.

```
        Status ▦                 ▦ Work            ellipse rx 1600 · ry 920
                                                    widget 640 × 476 (4 × 3 cells of 148, gutter 16)
     Interests ▦     ◍  M E      ▦ Cases            Me 800 × 600, always full
                                                    full views 1200 wide, hidden until open
      Philosophy ▦               ▦ Projects         overview ≈ 0.29
```

| Section | Where on the ring | Top-left box (col, row) · size in boxes | Hue |
|---|---|---|---|
| **Me** | centre | (−3, −1) · 6 × 4 — 960 × 640; the blob above it on the origin crosshair, centred at (0, −280) | — (the host is glass) |
| Current Status | upper left | (−8, −6) · 4 × 3 | blue |
| Interests | left | (−13, −1) · 4 × 3 | yellow |
| Philosophy | lower left | (−8, 3) · 4 × 3 | pink |
| Work Experience | upper right | (4, −6) · 4 × 3 | peach |
| Case Studies | right | (9, −1) · 4 × 3 | lavender |
| Projects | lower right | (4, 3) · 4 × 3 | green |

A box is 160; a widget at box (4, −6) has its top-left at 640, −960 and, being 4 × 3 boxes, runs to 1280, −480. Every neighbour is at least one empty box away.

**Why it is no longer a circle.** The circle was sized so that full columns never collided — radius 2600 for a 1700-unit Work column. Once only one full view is ever open they may overlap freely, so the ring only has to hold six 640 × 480 widgets — and since every widget snaps to the box grid, the ring is really an ellipse quantised to boxes, shaped to a 16:9 viewport. Extent 4160 × 1920, which fits 1440 × 900 at **≈ 0.27** — the old ring fitted at 0.17. That is the difference between a diagram and a map you can read: a 96px figure renders at 26px there, a section word at 15.

**Why a widget is set twice as large.** A widget is read from about twice as far away as a document, so its type is roughly double: figure 96, word 56–64, cell title 24, body 20, label 20. The figure survives to the overview; everything reads from about 0.5; nothing in a widget is ever smaller than 20 in canvas units.

Section hues are a proposal, not a rule from §2.3 (which gives hues to *blocks*): they make the six widgets tellable apart from the overview, and each section's one loud cell (§9 Bento) is where the hue lives.

Full views **left canvas space on 2026-09-11** (§8.4): they are pages now, 10 columns wide, and they have no anchors, no coordinates and no measured heights. What stays on the ring is the six widgets and the blob — seven things in canvas space, down from twenty-seven. Reading order stays declared — Me → Status → Work → Cases → Projects → Interests → Philosophy — and drives tab order, screen readers, document mode and ← / →, because a ring has none of its own. Nearest-view stays two-dimensional (Work and Projects share an x). **Widget coordinates are still hand-authored** in `scene.tsx` and still land on box corners.

**One blob.** The centre holds Bhargav's glass blob and nothing else does (Brand.md §9): it is the body of the browser-side model that will later travel the canvas, call tools and answer questions. Cards carry their hue as a dot; widgets carry theirs in one loud cell.

### 8.4 Widget and full — a tile on the canvas, a page when it opens

*Revised 2026-09-11 (Bhargav). Supersedes "one snap", which framed a full view inside canvas space at reading zoom. A full view is no longer on the canvas at all.*

**A section is one bento at two sizes.** Same grid, same cells, same components; only the column count and the scroll behaviour differ.

| | Widget | Full view |
|---|---|---|
| Grid | **4 × 3**, fixed — 640 × 480 | **10 columns**, rows `minmax(144px, auto)` — max width 1600 |
| Lives in | Canvas space, on the ring | A **page**. No canvas coordinates |
| Scroll | Never. It is a summary you click | Vertically, when it overflows. Horizontally, never |
| Heights | Fixed by the 4 × 3 | **Grown by content.** Nothing is measured, nothing clips |
| Reads at | The 0.27 overview | Reading size, always |

**Rows are `minmax(144px, auto)`, and this is the trade to know.** A cell is at least one box tall and grows with what is in it. Strict 144 rows would reinstate exactly the clipping that forced every height in `scene.tsx` to be hand-measured. The cost is that a tall cell pushes its row off the 160 rhythm: **the grid stays true horizontally and becomes approximate vertically.** Accepted, because a clipped paragraph is a bug and an off-rhythm row is not.

**Opening is a transition, not a viewport move.**

- **Click or Enter on a widget opens it** — the primary path, and the keyboard one. The view switcher opens too.
- **Esc** and a visible "back to the map" control both return. The URL per section is unchanged (§8.5).
- Zoom no longer opens anything. The zoom-driven snap — open at 0.85, release at 0.55, hysteresis, gesture-end detection — **is retired**, and with it the three canvas states. There are two: the map, and an open section.
- `prefers-reduced-motion`: the transition is instant.
- Document mode (§8.6) and no-JS (§8.7): unchanged in effect, and now trivially so — a full view was already a stacked page there. Desktop and phone run the same layout at a different column count, which is one behaviour instead of two.

**What this costs.** A full view is no longer in the canvas DOM, so it is not server-rendered *as part of the scene* — it is rendered by its own route, which serves the same purpose better (§8.5: every region is a real URL). And "nothing is ever unmounted" no longer holds for full views; the accessibility guarantee moves from "everything is always in the tree" to "each route renders its own section whole", which is the ordinary way a page works.

**What it removes.** Nineteen panels with hand-measured heights, the two-column flow that placed them, the opacity/focus fade, the snap hysteresis, and the whole class of bug where a panel clips its own text.

### 8.5 Views — navigation is a viewport move

`CanvasShell` takes `views: { id, label, nodeIds, frame?, href? }[]` and renders the switcher itself, bottom-left, with `aria-current` on the view the viewport is nearest. ← / → walk the ring in the declared reading order (§8.3), not by angle, and the guided chat pans instead of routing. `menuLayout="column"` stacks the switcher — past about five views a row collides with the centred chat input, and seven sections read better as a legend down the left edge anyway.

Nearest-view is measured in **both axes**. On the spine, comparing x was enough; on a ring Work and Projects share an x exactly, as do Current Status and Philosophy, and the switcher marked the wrong one until it compared real distance. That is the second place the ring's missing natural order had to be answered explicitly — reading order was the first. The top margin is **70**, not 40, because the blob's speech bubble overhangs its node box and anchoring on the box alone left the bubble 13px from the top of the screen. Content inside a panel reaches the same navigation through `useCanvasNav()`, so About's "the work is on Work" moves the viewport instead of reloading the document.

**Opening a section replaces landing on it.** `goTo(id)` on a section now runs the snap: it frames the full view at reading zoom and enters focus mode. The route's `initialView` opens that section on load, so `/work` is the open Work view. What follows is how a view *frames*, which the snap reuses. **`frame: "top"` (the default) beats fitting.** Fitting a whole column lands at 0.3 — below reading size — and fitting only its head leaves the content under the fold. So a region view anchors on its label plate and *aligns its top-left* near the top of the screen at a fixed **reading zoom of 0.9**, horizontally centred, leaving the column to be scrolled. Every region therefore lands identically whatever its length. `frame: "fit"` is for a cluster; the origin view uses it, at `padding 0.3, maxZoom 1.2`.

**Two React Flow constraints, both found by looking:** `setViewport` is a silent no-op until the pan-zoom instance exists, so the initial landing waits on `panZoom` **and** a measured container width — one `requestAnimationFrame` after mount is too early, and the symptom is every route quietly showing the home view. And `initialFitViewOptions.nodes` is ignored in 12.11.6, so the provider can only fit *everything*: at 0.23 that is the map with its panels faded blank, which is a poor first paint and a worse crawler snapshot. The server therefore renders at the identity transform — the origin cluster, life size, top left — and the client lands the requested view.

**Every region is still a real URL.** `/`, `/about`, `/work`, `/roadmap`, `/contact` all render the same canvas; the route only chooses `initialView` and carries its own `title` and `description`. So sections stay linkable, shareable and crawlable with their own metadata, and none of them is a page. Moving inside the canvas updates the address with `history.replaceState` — no navigation, no remount. A hash-only scheme was rejected for losing per-section metadata.

### 8.6 Narrow screens — a tall canvas the page scrolls

Below `md` (900) the canvas keeps its nodes and stops being infinite. **The layout is a media query, not a class**, so the server gets it right too and nothing shifts on hydration: React Flow's renderer, pane, viewport and node container all go `position: static`, the node container becomes a wrapping flex column, panels take a full row and blobs half of one, and the browser scrolls the document the way it always did. Pan and zoom are off in JS (`preventScrolling={false}`), bubbles render inline instead of as node toolbars — a toolbar is positioned against a transform, and there isn't one — and the wordmark panel is hidden, because it and the theme switch were both pinned top-right. The breakpoint is exported as `NARROW_QUERY` so the stylesheet and the script cannot drift; there is no `stackBelow` prop.

Two overrides need `!important`, and nothing else will do: React Flow sets each node's `transform`, `width` and `height` inline, and sets `height: 100%` with `overflow: hidden` inline on `.react-flow` — which would clip the whole document to one screen.

One renderer, one set of components, one copy of the content; the canvas is still the only surface. Decided 2026-09-09 over a separate linear renderer for phones: two renderers drift. The honest cost is that React Flow is doing layout on the platform where it is weakest, so the phone screenshots are the ones to trust least until reviewed.

### 8.7 Without JavaScript

React Flow server-renders the seeded scene, so every word is in the HTML and crawlers read it whole. With JS off those nodes keep their desktop transforms and pile up 4580px wide. One `<noscript><style>` in the app's `<head>` fixes it with no second renderer: the same declarations document mode uses, applied at every width, plus the viewport panels hidden (a fixed chat input that cannot be typed into is worse than none). That is why the scene lists nodes region by region — **DOM order is reading order and tab order** (§12).

Motion applies to nodes as to any blob: breathe, blink, look. `prefers-reduced-motion` disables `zoomOnDoubleClick` and sets every `goTo` duration to 0.


## 9. Components — v1

Anatomy in one line each; variants where they exist. Every component reads only tokens.

| Component | Anatomy · variants |
|---|---|
| **Blob** | §4. `variant: character \| logotype \| host` (**`glass` → `host`, 2026-09-16**: the host is `--surface` with a hairline, §4.1b; `hue="grey"` renders it too) · `size` (§4.2 name or a px width) · `state: idle \| sleep` · `hue` (defaults to the block accent; ignored for the host) · `label` (none → `aria-hidden`) · `blink` `look` `breathe` — on by default for idle characters, all off for the logotype; **`refraction` went with the glass** · `interactive` (hover 1.04; defaults on with `onClick`; wrap in a `<button>` for keyboard) · every other prop reaches the outer `<span>` |
| **Wordmark** | §4.4. `as: lockup \| text` · sizes with `font-size` on the element (`className="text-[34px]"`) · the lockup is one `role="img"` named "No Origins"; the text form is a plain span |
| ~~**Glass**~~ | **Struck 2026-09-16 → `Surface`** (Atomic.md D10). It was the translucent primitive: three levels of fill, blur and lit edge. |
| **Surface** | The one material (§3), added 2026-09-16. `level: 1 \| 2 \| 3` (default 1 — `--e1` / `--e2` / `--e4`) · `radius: xs \| sm \| md \| lg \| xl \| pill` (default lg) · `as` any element. Renders `.noo-surface .noo-surface--N .noo-r-*`. Everything that was glass is built on it |
| **Motion** | The named patterns as a component (§7), added 2026-09-16. `effect: rise \| pop \| breathe \| lift` · `delay` ms · `as`. Renders the pattern's class; `useReducedMotion()` is beside it for a script that moves things itself |
| ~~**DotGridProvider**~~ | **Struck 2026-09-16** (D10, D11). It published the on-screen grid so every blob could phase-align its refraction band; a flat blob measures nothing. `GroundProvider`, `useGround` and `measureGround` went with it. |
| **Bubble** | A level-1 surface, pill, of real text (a `<p>`), `bubble` type, padding 10 × 16, max 38ch. `tint?: hue` (pastel at 45% over surface) · `pop` plays bubble-pop on mount. Anchoring is the layout's job: top-right of the blob, 8px gap (Page); a NodeToolbar (Canvas) |
| **ChatInput** | A level-2 surface, pill, 56px tall; placeholder *"Hey! What's on your mind today?"*; send = 36px circle in `--accent`, the blob's two eyes inside. `suggestions: {label, value, hue?}[]` render as chips above it — the guided menu until the harness answers for itself; `onSend(text)`, `onSuggestion(s)`. Built step 6 |
| ~~**CanvasShell**~~ (`@no-origins/ui/canvas`) | **Struck 2026-09-16 with React Flow** (D11) — the subpath is gone, and what follows is the record. §8 — the base layout of every block, renamed from step 6's `Canvas`. `scene: SceneNode[]`, a discriminated union of `blob` · `panel` · `region` nodes, hand-placed and **in reading order** (§8.3) · `views` / `initialView` / `onViewChange` (§8.5) · `threads` (§8.1) · `onOpen(href, node)` (the host routes; click or Enter) · `chat` / `menu` / `brand` / `trailing` panel slots · `minimap` · `heading` (the hidden `h1`) · a skip link to the chat · "Reset view" after the first move (positions restored too). A blob's `view` pans, its `href` opens. Server-renders the whole scene — the provider is seeded with nodes, their declared dimensions and a 1280 × 800 viewport — at the identity transform (§8.5). Host imports `@xyflow/react/dist/base.css` into `layer(base)` |
| ~~**PanelNode**~~ | **Struck 2026-09-16** (D11). §8.2. A surface in canvas space holding one card. `surface: glass \| solid \| none` (default glass; `none` is bare type on the grid, for region intros) · `width` / `height` in canvas units; overrun scrolls inside (`nowheel`); `nodrag` on everything interactive; `user-select: text` over React Flow's `none`; the body cross-fades by zoom tier and is never unmounted |
| ~~**RegionNode**~~ | **Struck 2026-09-16** (D11). §8.2. A column's map label: an 80px display-face word over a dotted `--rule` hairline, on a short plate above the column. `pointer-events: none`, `aria-hidden` — decorative by design, because the meaningful `<h2>` belongs in the intro panel |
| ~~**useCanvasNav**~~ | **Struck 2026-09-16** (D11). §8.5. `{ goTo, current }` from inside the canvas, so a link in a panel's prose can move the viewport. `null` outside a `CanvasShell` |
| **Bento** | §8.3–8.4. **The one grid, at two sizes** (2026-09-11). A CSS grid of `cols × rows` cells. A cell is a grid box minus its padding — `--grid-box` 160 − 2 · `--grid-pad` 8 = 144 — and the gutter is two paddings, 16, so a 4 × 3 widget is exactly 640 × 480 and snaps into four boxes by three. `hue` sets `--bento-hue` / `--bento-hue-deep`; `label` names the group for assistive tech. **`page`** switches to a full view: `cols` 10, fluid columns to a 1600 max, `grid-auto-rows: minmax(144px, auto)`, and the block scrolls in the document rather than sitting in canvas space. Widget and page are the same component and the same cells |
| **BentoCell** | `span: [cols, rows]` (default `[1, 1]`) · `tone: quiet` (`--surface`, e1 — default) \| `fill` (the widget's hue as the tile, text in **`--{hue}-ink`** — the loud one) \| `ink` (ink on ground, for later). Every tone is a **textured card** (Patterns.md §4b; the `glass` tone was struck 2026-09-16 and there is no exception left to state): a flat wash of the cell's hue (a gradient until 2026-09-16) under a `--grain` mask painted in `currentColor` at `--grain-strength`, which darkens a light card and lightens a dark one. Radius lg, padding 20, `overflow: hidden` so an illustration can bleed off its edge. Every cell does one job: a figure, a word, an illustration, a list, chips, media |
| ~~**SectionWidget**~~ | **Retired 2026-09-11 (Bhargav): total freedom over guard rails.** It was `Bento` plus a fixed 2 × 2 loud cell, enforcing the three widget rules — one loud cell, the diagonal, a field illustration. Those are now **conventions, not constraints**: a widget is a plain `Bento` with cells placed by hand. The rules still hold for the six on the ring, because the ring only reads as one family if they are built alike — but nothing in the code enforces it. So it becomes a **probe** rather than a prop: `probe12` counts `--fill` cells per widget and fails on anything but one. It lives in `e2e/review.spec.ts`, so `pnpm review` runs it on every route — unlike `probe10` and `probe11`, which sit in the gitignored `e2e/.mcp/` and are enforced by memory (Admin.md §6.3). The rule is a *widget's*: six of them are compared side by side across the overview and must read as a family, while a full view (§8.4) is read alone and carries no such constraint. A rule worth keeping is worth checking; a rule worth checking does not need a component to hold it. `illustration` moves to `BentoCell`; the six parameter sets stay in `content/sections.tsx`, still measured, never estimated |
| **BentoFigure** | A number or a short word as image: `value` in the display face (`size: lg` 96 \| `md` 56) with a mono `label` under it — `4` roles, `0` shipped yet. Honest about empty sections because it states the count |
| **Illustration** | **Patterns.md** — the living document; this row is a pointer. A named picture drawn by code from six primitives (rosette, bands, ring, stack, pebbles, spiral): **fine lines in one hue, never filled**, all at one weight and one colour (`--ill-w`, `--ill-line`), no two lines touching and none of them parallel, deterministic (seeded scatter). The −45° light is the card's now, not the drawing's. The line is `color-mix(hue-tint 64%, currentColor)`, so it takes the right contrast from whatever card it is on, in either theme. `name`, `hue`, `title`. In a `BentoCell` as `.noo-bento__ill` — **top-right**, the diagonal from the bottom-left figure or word; `--field` (`inset: 0`) for a drawing that crosses the whole cell and runs off every edge, which is the direction round 1 of the studio set; `--alone` in an empty cell. Never under text: a corner illustration must not overlap a glyph, a field must stay 8px clear of one (probe10 measures both). Six exist; Me has none, its illustration is the blob |
| **ProfileCard** | §9. Large-format media: the picture is the whole card. **Flat since 2026-09-16** (D10): a scrim in `--shade` fading upward under the words, the grain over it, the words on top — no frost, no bloom, no plate. `crop: fill \| cutout`; a cutout, and a card with no media, gets the hue's wash with the grain over it. The three corrections below are the record of how it got there, and the reason the row is long. *Was:* **the bottom of the picture turned to frosted glass** — blurred, brightened, slightly more saturated, masked so it has no edge anywhere — with the words standing on it in white. Added 2026-09-11 and corrected three times the same day, which is why the row is long. (1) A full-bleed photo under a gradient scrim: wore none of §3's material. (2) A `glass-2` plate under the words: read as ours, but "there is background behind the text". (3) No plate at all: "still don't have the glossy design". Both complaints are true, and the reference resolves them — its shine is neither a panel nor a highlight but the photograph's own surface going to glass, and **a boundary is the entire difference** between the two rejections. Implemented by blurring a third copy of the media, not by `backdrop-filter`: Chromium clips a filtered backdrop to the border box and ignores the mask, so the fade comes out as a hard line (seen, not assumed). On top of that the card carries all four §3 cues — hairline, lit top edge, 118° sweep, grain at 0.7 — and every layer over the picture is clipped to the *same* corner, which is why the corner is a plain arc and not a squircle (see §6). `crop: fill \| cutout`; a cutout, and a card with no media at all, had no photograph to frost and got a `--shade` scrim instead — which is what every card wears now. `bloom` rendered the media again beneath the card, the light it cast on the surface without extracting a colour; the prop is gone |
| **Deck** | §9. A stack of cards with one forward, and **still a scroll container** — scroll-snap gives the trackpad, the swipe, arrow keys and a screen reader's own scrolling; the script only publishes each card's distance from centre as `--d` and lets CSS do the depth. `visible: 0 \| 1 \| 2` cards either side, and the card width is *derived* from it in container units so the two cannot disagree. `start: number \| "middle"`. Reduced motion drops the transforms and it is a plain snapping row |
| **Placeholder** | Brand.md §9. A section that is on the map but has no copy: dashed `--rule` box, `title` for what will be there, children for why it isn't. `draft` adds a visible tag and an accent border — scaffolding, so nobody mistakes it for finished writing. Without `draft` it *is* the honest empty state. Never "coming soon" |
| ~~**CanvasMap**~~ | **Struck 2026-09-16** (D11). `MiniMap` dressed as glass-1: node dots in their own hue, the viewport rectangle in `--accent`. Off in v1 stopped being right the moment the canvas grew wider than a screen |
| ~~**useZoomTier**~~ | **Struck 2026-09-16** (D11). §8.4. `map \| titles \| full`, from the flow's transform; always `full` in document mode. **Nothing uses it to fade any more** — the three tiers were retired in step 12, because a widget is a design and fading a document's words to nothing was a trick standing in for one. Kept for anything that wants to know the zoom band |
| **Button** | pill, 44px min (`size: sm` = 36). `variant: primary` = ink fill, ground text, e1 → e2 · `secondary` = a level-1 surface with its hairline (glass until 2026-09-16) · `ghost` = text, underline on hover. `leading` / `trailing` icon slots · `href` → `<a>` · `as={Link}` for a router (§11.2 rule 1) · `disabled` = 50% |
| **Chip** | pill, 28px. `hue` (pastel at 45% over surface) + ink text; deep tier for the leading dot (`dot={false}` or a `leading` icon instead). `onClick` → `<button>`, `href` → `<a>`; `pressed` = selected filter (deep fill, ground text) |
| **Card** | A level-1 surface; `--r-lg`; **`surface` was removed 2026-09-16** — there is one material, so there was nothing left to choose between; `padding: md` 24 / `sm` 20; `interactive` = e1 → e2 + 1px lift on hover; `as` / `href` for the element you mean |
| **BlockCard** | Card + `meta` eyebrow + h4 `title` + one `line` + optional `details` list + `chips: {label, hue?}[]` (default the card's hue). `blob` (default **false** since 2026-09-10 — the blob means *agent*, and a job is not an agent) puts a `Blob sm` in `hue` back; without it the hue is a leading rule on the card. `href` makes the whole card a link (chips stay labels). `state="sleep"` for a block that isn't here. The Work item |
| **RoadmapItem** | Card + h4 `title` (`blob` re-adds the sleeping `Blob sm` in `hue`, default false) + `description` ("Not here yet. Here's what it'll do…") + optional `progress` in the mono label voice. Principle 4 as a component |
| **NavBar** | A level-2 surface, 60px, sticky (`z-index` 30). Wordmark left (links home); `links: {href, label}[]` right; `currentHref` marks the current one (`aria-current`, `--accent-deep`, 2px underline; exact or nested match) · `linkComponent` = the router's link, default `<a>` · `trailing` slot · a skip link to `skipTo` (`#main`) is the first thing in the bar. Below `md` the links render as a fixed bottom sheet — `Menu form="sheet"` since the 0.1.0 release — a sibling and not a child, so nothing clips it; `Page` pads for it via `:has()` |
| ~~**Rail**~~ | **Struck 2026-09-14 into `Menu`'s column, and the column's rail form struck 2026-09-16** (D13): one navigation, one width. What follows is the record. Page mode's `NavBar` as a column, for a surface with seven-plus destinations — a row collides there the way the canvas view switcher did at five (§8.5), and the answer was a column both times. Added 2026-09-11 for the admin (Admin.md §4, §10). `groups: {label?, hue?, items}[]` · an item may carry one level of `items`, shown only when that branch is current · `currentHref` · `linkComponent` · `brand` · `trailing` (pinned to the bottom) · a skip link first, as in the bar. **The current marker is the one translated detail**: an underline in a stack reads as a divider between two items rather than a mark on one, so it is the same 2px `--accent-deep` on the leading edge. A group's `hue` is structural, not decoration — it is how the navigation states which layer a destination belongs to. Below 900 the column becomes a strip across the top that scrolls sideways, groups intact. `Page` takes a `rail` and becomes two columns; `rail` and `nav` are alternatives, because two primary navigations on one screen is two answers to "where am I" |
| **SectionHeader** | `label` eyebrow (mono) · `title` · optional `lead` (60ch) · `level: 2` (Bowlby 34) or `3` (Hanken 26, inside a block) · `titleId` for `aria-labelledby`. 32px below; 64px above when it follows something (`:not(:first-child)`) |
| **Field** | `label` above in `caption`; a level-1 surface box, `--r-md`, 48px, holding the control; `hint` or `error` below (error = `--bad` ring, `role="alert"`, `aria-describedby`); focus = 1.5px `--accent-deep` inside + 3px `--accent` @ 25% outside; `leading` / `trailing` adornments; `multiline` → textarea (min 96px). `className` styles the wrapper; every other prop reaches the control |
| **Toggle** | `<button role="switch">`, 44 × 26 pill; on = ink track, ground knob; off = ink 18% over ground, surface knob; hit area padded to 44px tall. `checked` + `onChange` or `defaultChecked`; `label` wraps it in a clickable `<label>` row, else pass `aria-label` |
| **Footer** | On the ground, hairline above, 64px margin-top. `Wordmark as="text"` · `meta` (the domain) · `links` via `linkComponent` · `trailing` slot for the `ThemeSwitch` · stacks under `sm` |
| **ThemeSwitch** | light · system · dark in a level-1 surface pill; reads and writes `<html data-theme>` + `localStorage.theme` through `readTheme` / `applyTheme` / `subscribeTheme`; the host inlines `themeBootScript` in `<head>` (all exported, no React in `theme.ts`) |
| **Page · Container · Section** | Page mode (§8), for documents: `Page` = `nav` slot + `<main id="main" tabIndex=-1>` + `footer` slot, fills the viewport · `Container` = 1120 measure, 24 / 48 gutters · `Section` = Container + rhythm (96 desktop / 64 mobile between sections) · `.noo-document` = 68ch (`.noo-prose` was its alias until 1.0) · **`rail` was removed 2026-09-16** (D13) |

~~Not in v1: Dialog/Sheet (glass-3), Toast, Tabs, Table, Editor surfaces.~~ **Built in the 2026-09-14 release** (Atomic.md §6 steps 3–5): Dialog and Sheet on a native `<dialog>`, Toast, Tabs, Table, Tree, Menu, Segmented, Select, Checkbox, Radio, Tooltip, Speaker, and the `Tool` and `Document` templates. The inventory of what exists, by layer, is Atomic.md §1–§3 and the registry itself; this section is the anatomy record of v1 and is not updated for later components. A detail sheet was considered for the canvas and rejected: it would re-introduce pages through the back door, and a 560 × 520 panel holds a role with five bullets comfortably.

**Retired from the portfolio, kept in the system (2026-09-09).** `Page`, `Container`, `Section`, `NavBar`, `Footer` and `SectionHeader` are page mode, and the portfolio has no pages (§8). They stay specified, built and exercised by the fixtures, because the editor block's articles are documents. Their content moved into panels; `SiteNav` became the canvas menu and `SiteFooter`'s theme switch became a canvas panel.

**On shadcn (asked 2026-09-09).** Not a dependency, now or later: its utilities-in-components model breaks §11.2 rule 3, it brings a second token vocabulary, and its defaults are the look this brand is not. When the overlays arrive (the editor block first), take the headless layer directly — Radix or Base UI as optional peers, like `@xyflow/react` — and style it with our classes; shadcn's source is a fine structural reference to copy from, nothing more.

## 10. Theming axes

Three independent switches; the system multiplies them without new CSS.

1. **Theme** — light / dark, via `data-theme` and `prefers-color-scheme` (§2.5).
2. **Block accent** — one hue per block via `data-block` (§2.3).
3. **Motion** — `prefers-reduced-motion` removes ambient motion (§7).

*There were four until 2026-09-16.* **Transparency** — `prefers-reduced-transparency` flattening glass to `--surface` — stopped being an axis when the material did (§3, Atomic.md D10): every surface is already what that preference used to fall back to. Nothing is lost for the person who asks for it; the system simply has one fewer thing to be honest about.

## 11. The package — `@no-origins/ui` in the No Origins monorepo

**Decision 2026-09-09 (option B; supersedes "inside the portfolio repo").** The whole platform is one pnpm workspace at `no-origins/`. Apps are blocks; `packages/ui` is the system; every block consumes it as `workspace:*`, so drift is impossible — Principle 5 as repo structure. Anything *outside* the monorepo consumes the same package from npm.

```
no-origins/
├─ pnpm-workspace.yaml          packages: ['apps/*', 'packages/*']
├─ package.json                 private · scripts fan out with pnpm -r
├─ .changeset/                  release config from day one — publishing later is one command, not a project
├─ Brand.md · Design-System.md  platform documents
├─ packages/ui/                 @no-origins/ui
│  ├─ package.json              exports below · peerDependencies: react, react-dom ≥ 18 · @phosphor-icons/react (optional peer, icons only)
│  ├─ design/                   the boards and the lab — where the decisions were made
│  ├─ tsup.config.ts · tsconfig.json
│  └─ src/
│     └─ …                      by Atomic layer since the 2026-09-14 release — tokens/ atoms/ molecules/ organisms/
│                               templates/ registry/ icons/, and css/ split the same way. The tree is Atomic.md §5.
└─ apps/portfolio/              the first block — Next.js · imports @no-origins/ui via workspace:*
   ├─ next.config.ts            transpilePackages: ["@no-origins/ui"] — consumed from source in the workspace
   ├─ src/app/layout.tsx        next/font ×3 → --ff-display / --ff-sans / --ff-mono · <html data-block="portfolio"> · theme script
   └─ src/app/globals.css       @import "tailwindcss"; @import "@no-origins/ui/tailwind.css"; @import "@no-origins/ui/index.css";
```

### 11.1 Exports

| Export | What | Needs React | Needs Tailwind |
|---|---|---|---|
| `@no-origins/ui/tokens.css` | The tokens, both themes, fallback font stacks | no | no |
| `@no-origins/ui/css` (alias `/index.css`) | tokens + typography + motion + every component's classes; `/tokens.css`, `/typography.css`, `/motion.css`, `/components.css` and one file per layer (`/atoms.css`, `/molecules.css`, `/organisms.css`, `/templates.css`) are also exported individually. `/glass.css` went with the material on 2026-09-16 | no | no |
| `@no-origins/ui/tailwind.css` | `@theme inline` layer: `bg-ground`, `text-peach-deep`, `bg-accent-tint`, `rounded-pill` (999), `rounded-lg` (20), `shadow-e2`, `font-display`, `ease-noo-enter` … Utilities read the live variable, so they follow theme and block accent. Import after `tailwindcss`. | no | v4 |
| `@no-origins/ui` | React components — ESM, typed | ≥ 18 | no |
| `@no-origins/ui/registry` | `entries`, `layers`, `layerNotes`, `layerBySlug`, `byLayer`, `groups`, `registryHash`, `Catalogue`, `ContrastReport` — what a component is and where it may go, rendered the same way by the showcase and the admin | ≥ 18 | no |
| `@no-origins/ui/icons` | `Icon` and the curated `glyphs.ts` (D8) — Phosphor regular through `@phosphor-icons/react`, an optional peer | ≥ 18 + `@phosphor-icons/react` | no |

**Gone 2026-09-16** (Atomic.md D10, D11): `@no-origins/ui/canvas`, `/editor` and `/document`, and `/glass.css`. The canvas subpath exported `CanvasShell`, the three node types, `CanvasMap`, `Threads`, `useZoomTier`, `useCanvasNav`, `sceneToNodes` / `sceneBoxes` / `viewCentres`, `NARROW_QUERY`, `BUBBLE_MIN_ZOOM` and the scene types, and asked its host to import `@xyflow/react/dist/base.css` into `layer(base)`. No host does that any more, and `@xyflow/react` is not a peer dependency of anything.

### 11.2 Portability rules — what keeps it usable outside Next.js

Written so that an Elixir + React project, a Vite SPA, or a LiveView app can use it without forking.

1. **The package imports React and its own CSS. Nothing else.** No `next/*`, no router, no image component. `NavBar` takes a `linkComponent` prop (default `<a>`); images are `<img>`.
2. **Fonts are the host's job.** The host sets `--ff-display`, `--ff-sans`, `--ff-mono` (Next: `next/font` with `variable: "--ff-display"` etc.; Phoenix: a `<link>` to Google Fonts or self-hosted `@font-face` plus three declarations). The package never loads a font. `tokens.css` ships fallback stacks for the three in a cascade layer, so a host that forgets still renders and any host declaration wins. *Why `--ff-*` and not `--font-*`:* Tailwind 4's `@theme` owns the `--font-*` namespace to generate `font-display` and friends; a runtime token with the same name would make the theme variable reference itself. The same applies to every Tailwind theme namespace — a runtime token named `--shadow` was silently replaced by Tailwind's default `--shadow` value at build time (caught in step 7; renamed `--shade`). Runtime tokens stay clear of `--color-*`, `--font-*`, `--shadow-*` (including bare `--shadow`), `--radius-*`, `--ease-*`, `--text-*`, `--spacing*`, `--blur-*`, `--animate-*`.
3. **Components are styled by the package's own CSS classes, never by Tailwind utilities.** A host without Tailwind gets the full look from `@no-origins/ui/css`. A Tailwind 4 host additionally gets the utilities from the `@theme` layer. No host ever has to `@source`-scan the package. **The component CSS lives in the `components` cascade layer** (`index.css` imports each file with `layer(components)`): on a Tailwind host that is Tailwind's own components layer, ordered before `utilities`, so a host utility (`className="absolute"`, `"flex"`) always beats a package rule; on any other host an unlayered host stylesheet wins the same way. Found in the first visual review: unlayered package CSS silently overrode every utility the app added. Third-party CSS a host adds should be imported into `layer(base)` so the package can style over it — that rule was learned from React Flow's `base.css`, which no host imports any more (D11), and it holds for whatever the next one is. Tokens stay unlayered.
4. **Behaviour is plain DOM.** Blink, look and refraction alignment run on `requestAnimationFrame` and `getBoundingClientRect` — no framework hooks beyond React's own. The blob's markup is documented SVG (§3–§4), so a non-React surface (a HEEx function component, a LiveView hook) renders the same blob with the same CSS.
5. **`'use client'`** sits on stateful components for Next's RSC; every other bundler ignores the string.
6. **Build:** `tsup` → ESM + `.d.ts`, **unbundled** — one output file per source file, so each component keeps its own `"use client"` directive (a bundled entry would hoist or drop it); CSS copied as files; `"sideEffects": ["*.css"]`; Node ≥ 20. Inside the workspace, `exports` point at `src/` and Next transpiles the package; `publishConfig.exports` swap to `dist/` at publish time, so consumers of the npm package get built ESM and types. Versioned with changesets; published to npm under the public `@no-origins` scope (GitHub Packages if it should stay private).

### 11.3 Consuming from an Elixir + React project

`cd assets && npm i @no-origins/ui`. Phoenix's default esbuild bundles TSX and CSS imports. Mount components through whichever React host the project uses — Inertia, LiveView React islands, or a separate SPA on a Phoenix API — identically. Plain LiveView surfaces use `@no-origins/ui/css` and the documented blob SVG. Tailwind is optional: Phoenix's `tailwind` package on v4 can import the `@theme` layer; on v3, `tokens.css` alone.

### 11.4 Hosting

Vercel: one project per app, framework Next.js, `pnpm install` at the repo root (the workspace is detected). Turborepo when there is a second app, not before.

**Scope, set 2026-09-10.** Two domains, and only two: `bhargav.no-origins.com` → `apps/portfolio`, and `design.no-origins.com` → a design-system showcase, its own app and its own Vercel project. The third goal is not a domain: a fine-tuned small model running in the visitor's browser to help them navigate the portfolio and ask about Bhargav — the blob at the centre of the map is its body (§8.3). **`no-origins.com` and every other subdomain are out of scope**; the agents-harness hub that used to be step 11 is dropped, and the main domain gets whatever project comes later.

**Fonts.** In `apps/portfolio/src/app/layout.tsx`: `Bowlby_One({ weight: "400", variable: "--ff-display" })`, `Hanken_Grotesk({ variable: "--ff-sans" })`, `JetBrains_Mono({ variable: "--ff-mono" })`, all `display: "swap"`, latin subset. Geist removed.

**Theme script.** A 6-line inline script in `<head>` reads `localStorage.theme` and stamps `data-theme` before paint; absent → system.

## 12. Accessibility & performance

- Contrast: `--ink` on `--ground` ≈ 8:1; all `*-deep` tiers ≥ 4.5:1 on `--ground`; fills are never text backgrounds for anything under 18px/700.
- Focus visible everywhere: 2px `--accent-deep` ring, 2px offset. One low-specificity rule does it for every `a`, `button`, `summary` and `[tabindex]` (`:where(…):focus-visible`), so nothing has to opt in. Never `outline: none` without a replacement: the field and chat inputs hand the ring to their glass box via `:focus-within`.
- Hit targets ≥ 44px. Controls drawn smaller (small buttons 36, chips 28, theme switch 28, nav and footer links) reach 44 through an absolutely positioned `::before` that extends the hit area without changing the look. Blobs that do something are buttons with labels (canvas nodes: `role="button"`, Enter opens); decorative blobs are `aria-hidden`.
- One `h1` per page: the first `SectionHeader` is `level={1}` (Bowlby 44); the canvas has a visually hidden one (`.noo-sr-only`). Landmarks: header, primary nav, `main#main` (the skip target), footer nav.
- `::selection` is the block's tint; `<meta name="theme-color">` follows the ground in both schemes; `color-scheme` is declared so native controls match.
- Forced colours (Windows high contrast): surfaces, cards, chips, bubbles and fields get a `CanvasText` border; the toggle's state is drawn with system colours; blob eyes and bodies keep their outline.
- Bubbles are real text, read in order.
- ~~Canvas nodes are absolutely positioned, so **DOM order is reading order and tab order**: the scene lists nodes region by region. Level of detail (§8.4) cross-fades opacity and never unmounts or `hidden`s text — a screen reader has no zoom level.~~ ~~Canvas panels re-enable `user-select: text` over React Flow's `user-select: none`, and every link or button inside a node carries `nodrag`.~~ **Struck 2026-09-16** with the canvas (D11). Both were hard-won and both are worth re-reading before anything is placed in free space again.
- One `h1` per surface: the first `SectionHeader` is `level={1}`; section titles are `h2`, card titles `h3`.
- LCP: the hero is type and inline SVG blobs, no images; nothing above the fold waits on a script. Every surface is opaque, so nothing above the fold is blurred either.
- Blob animations are `transform`/`opacity` only — compositor-friendly. The glass budget (≤ 6 translucent elements, blur ≤ 22px) is gone with the material it rationed: an opaque surface costs nothing to composite, which is the one performance thing v1 simply bought.
- Fonts: three families, latin subset, `swap`, fallbacks with close metrics (`Helvetica Neue` / `system-ui`).

## 13. Open

- **Name reading** — the one-sentence *why* behind the words "No Origins", for the About copy and the meta description. Answer by completing "I called it No Origins because ___", or skip it and let the work define it. Everything else builds either way.
- **Photos for About** — six provided 2026-09-09 (`Creatives/bhargav/photos`). An illustrated avatar is being designed from them: brief, construction and candidates in `Character.md`, picked in the Character Studio (db `decisions/character`). Until then About renders the glass host at `lg`. Slot: `site.aboutPhoto` in `apps/portfolio/src/content/site.ts` — filling it makes the `about-story` panel much taller, so re-measure the column (§8.3).
- **Dark-theme blobs** — with the light-tuned tints at 36% over the dark ground, the characters read as flat dark paint (brown, olive, maroon) and the glass host almost disappears. The Blob Lab was tuned in the light theme only. Tune the dark numbers (tint opacity, or a dark tint tier, host presence) in the lab with the theme switched, then record them in §2.5 / §3.
- **Contact destinations and the résumé** — a personal email for the site, GitHub, LinkedIn, X, and the résumé PDF were never given. Slots: `site.contact.*` and `site.resumeHref`; every button that needs one renders only once it exists, so the pages ship either way.

- ~~**The blob's refraction on a line grid**~~ **Done 2026-09-11: the crosshair, as recommended.** The ground is now grid lines at `--grid-box` everywhere — `.dots` became `.noo-ground`, `DotGrid` became `Ground` (`gap`/`dot` → `box`/`line`), and the blob's refraction pattern is a crossing of two thin rects instead of a circle, still magnified 6% about the centre. Two grounds at two scales was one too many: the canvas is a grid of 160 boxes and every bento cell sits in one, so a second grid at 32 was saying something the first already said. The honest cost is that the effect only appears where a line actually passes through a blob, which at 160 is not everywhere — hence the one glass blob sitting on the canvas origin with both axes through it. React Flow's `Background` paints a `<path>`, and `stroke` is a presentation attribute that cannot take a `var()`, so the colour is set in CSS rather than passed in.
- **Illustrations, first six** (2026-09-10, late) — line drawings in one hue, drawn by code; the grammar, the ten principles and the growing library are in **Patterns.md**. Bhargav set four conditions after seeing the first filled draft — fine lines, no fill, textured gradient cards, no colliding lines — and the consequence is a design-system fact, not just a style: **the material moved from the object to the card.** Bento cells now carry a −45° gradient and a masked `feTurbulence` grain (`--grain`, `--grain-strength`, both in tokens.css); glass cells take neither. Six drafts stand on `/fixtures/bento`, and `/fixtures/studio` is where they get argued over: five candidates a round, each stating what it tests and how it could fail, one pick, and the rule that pick produces written into Patterns.md §9 for the next batch to inherit. `IllustrationCanvas` (the viewBox, the light and the one line style) is exported so a candidate is drawn by the real component before it is adopted. ~~No real images anywhere on the platform~~ — **reversed 2026-09-11 (Bhargav): photographs are allowed.** The old rule was two rules wearing one sentence, and only one of them is gone. **Photographs are in**: portraits, case-study screenshots, anything genuinely photographic, through a new `Image` (§9). **Illustrations are still code**: the generator, the six families and the one-line grammar are untouched, and nothing here makes a drawn picture shippable as a raster. Two consequences to pick up: §12's LCP paragraph assumed there were no images at all and now needs an above-the-fold rule, and every `Image` requires `alt` and a reserved box, because a photograph that arrives late moves the layout under the reader.
- **Section hues** (2026-09-10) — status blue · work peach · cases lavender · projects green · interests yellow · philosophy pink, so the six widgets are tellable apart from the overview. Proposed on the fixture; §2.3 gives hues to blocks, so this is the first time a hue means a *section*.
- **Five of the seven sections have no copy** (2026-09-10) — and this blocks the ring, not the other way round. Written: Work Experience. Partly written: Me, which has the three interview paragraphs but no location. Nothing at all: Current Status, Case Studies, Projects, Interests, Philosophy. The nearest material is adjacent, not usable — Brand.md §6's five principles are *No Origins'*, not Bhargav's, and "curious / creative / happy" are how he comes across, not what he is interested in. **None of it can be inferred without inventing facts.** Case Studies has raw material inside the four roles (Neptune, Project Vault, GenIQ) but problem → approach → outcome is his to tell.

  Of those five, Case Studies and Projects ship as honest empty states by decision, and Me's missing location is a slot that simply renders nothing. So **three actually block the ring: Current Status, Interests, Philosophy** — a section that says "I don't know what I'm looking for" is not an honest empty state, it is an unfinished portfolio.

Resolved 2026-09-09: the host blob is clear glass (§4.1b); the canvas home ships in v1 (§8); About gets a photo; **the canvas is the base layout of No Origins and the portfolio lives entirely on it, with every region keeping a real URL (§8)**; phones get the same canvas as a tall scrolling column, not a second renderer (§8.6).

## 14. Build order

1. ✅ **Done 2026-09-09.** Monorepo: `pnpm-workspace.yaml` at the root, `portfolio/` → `apps/portfolio/`, `packages/ui` scaffold with changesets · `tokens.css` (light, dark, block accents) + `tailwind.css` (`@theme inline`) + `glass.css` + `motion.css` + `components.css` (`.dots`) · fonts in `layout.tsx` via `--ff-*` · theme script · dot grid on `body` · fixture page. Both packages typecheck and build; the served CSS was verified to carry every token.
2. ✅ **Done 2026-09-09.** `Blob` (`character | logotype | glass` · seven sizes · `idle | sleep` · blink, look, breathe, refraction · `DotGridProvider` for the canvas) and `Wordmark` (`lockup | text`) in `packages/ui/src/blob` and `src/wordmark`; classes in `components.css` (`.noo-blob*`, `.noo-wordmark*`), keyframes in `motion.css`; fixture at `/fixtures/blob` with a theme toggle; `icon.svg` favicon. Typecheck, package build (unbundled ESM, per-file `"use client"`) and app build pass; the server-rendered markup was verified blob by blob.
3. ✅ **Done 2026-09-09.** `Glass`, `Button`, `Chip`, `Card`, `Bubble`, `Field`, `Toggle` in `packages/ui/src/primitives/`; classes in `components.css`; the type scale as classes in `typography.css` (new export); `.glass` now isolates its stacking context so the sweep sits under content. Fixture at `/fixtures/primitives`; index of fixtures at `/fixtures`. Typecheck, lint, both builds pass; the served markup was verified control by control.
4. ✅ **Done 2026-09-09.** `NavBar` (sticky glass-2, skip link, mobile bottom sheet), `SectionHeader`, `Footer`, `ThemeSwitch` + `theme.ts` (`themeBootScript`, moved out of the app), `Page` / `Container` / `Section` in `packages/ui/src/layout/`. The app gained a `(page)` route group whose layout is `Page` + `SiteNav` (Next `Link` + `usePathname`) + `SiteFooter`; `/about` `/work` `/roadmap` `/contact` exist as placeholders for step 5; fixtures moved under the group so they wear the real chrome; `/` stays bare for the canvas. Fixture at `/fixtures/layout`. Typecheck, lint, both builds pass; served markup verified (`aria-current`, skip link, sheet, boot script, no nav on `/`).
5. ✅ **Done 2026-09-09.** `BlockCard` + `RoadmapItem` in `packages/ui/src/blocks/`. App content layer `apps/portfolio/src/content/{site,work,roadmap}.ts` — copy from Brand.md §9 and the interview, first person, no invented dates. About (glass host at `lg` speaking first, the through-line, the family row), Work (four roles as BlockCards, chips on the through-line, résumé button), Roadmap (editor · harness, asleep), Contact (four paths, glass cards, no single CTA). Slots that had no source — email, GitHub, LinkedIn, X, résumé PDF, About photo — live in `content/site.ts` and render only when filled (§13). Typecheck, lint, both builds pass; served pages verified.
6. ✅ **Done 2026-09-09.** `@no-origins/ui/canvas`: `Canvas` (ReactFlow + dots Background + `DotGridProvider` from the viewport, so refraction stays phase-aligned while panning) and `BlobNode` (bubble as NodeToolbar, hidden below zoom 0.5) · `ChatInput` in the main entry. `apps/portfolio`: `/` is `HomeCanvas` — seven blobs (host glass + portfolio awake, five asleep), two speaking, guided chat (four suggestions; free text routed by keyword, else the host says it can't chat yet), menu bottom-left, wordmark bottom-right; `@xyflow/react` added as a dependency and its `base.css` imported in `globals.css`. Typecheck, lint, both builds pass; the served home carries all seven nodes with a fitted viewport.
7. ✅ **Done 2026-09-09.** Dark: `--shade` token (ink → black) behind every elevation, the blob drop shadow and the glass bottom edge; `color-scheme` per theme; `theme-color` meta. Motion: every transition and animation is in a reduced-motion block (chat, canvas reset duration included); `Section` arrival added and covered. Transparency: glass, blob frost and refraction band fall back (already in place, re-verified). Keyboard: one global `:focus-visible` rule, 44px hit areas via `::before`, one `h1` per page (`SectionHeader level={1}`, hidden `h1` on the canvas), `::selection`, forced-colours rules. Verified in the served build: one `h1` on all nine routes, arrival classes on sections, both `theme-color` metas, the new rules in the CSS. Not eyeballed — no browser here.
8. ✅ **Done 2026-09-09.** First visual review, on the Playwright loop (`pnpm review`: nine routes × desktop/mobile × light/dark, screenshots in `e2e/screenshots/`). Found and fixed: package CSS overriding host utilities (now in the `components` layer), the NavBar collapsing to 1px (body height), missing list bullets, canvas over-zoom, colliding mobile bubbles. Open from it: the dark-theme blobs (§13).
9. ✅ **Done 2026-09-09. The canvas portfolio** (§8). Package: `CanvasShell` (out of step 6's `Canvas`), `PanelNode`, `RegionNode`, `CanvasMap`, `Threads`, `useZoomTier`, `useCanvasNav`, `scene.ts` types + helpers; `BlobNode` gained `view` and an inline bubble for document mode. App: `components/scene.tsx` is the map — four regions, fourteen panels, seven blobs, three threads, every coordinate and height authored; `portfolio-canvas.tsx` wires the guided chat and the URL; `/`, `/about`, `/work`, `/roadmap`, `/contact` all render it at a different `initialView` with their own metadata; page-mode chrome left the portfolio (kept for the editor block). Fixture at `/fixtures/canvas` shows the node types and all three tiers side by side. Verified: typecheck, lint, both builds, 25 nodes server-rendered on every route, all five landings probed, panel heights measured to 17–44 units of slack with none clipped, and `pnpm review` green across desktop / mobile × light / dark plus a settled map-zoom capture.
10. ✅ **Standing, on placeholders. 2026-09-10. The seven sections, on a ring** (§8.3). Me at the centre with the one blob; Current Status (Contact folded in), Work Experience, Case Studies, Projects, Interests, Philosophy around it at radius 2600. Retired Roadmap and the platform family panel. `blob={false}` on `BlockCard` / `RoadmapItem` with a hue **dot** in its place (a left rail was the plan; a dot echoes the chip's and survives the map tier the same way). New `Placeholder`, `menuLayout`, 2-D nearest-view; `minZoom` 0.15, labels 96px, top margin 70. Routes: `/`, `/status`, `/work`, `/case-studies`, `/projects`, `/interests`, `/philosophy`, with `/about`, `/contact`, `/roadmap` redirecting. Verified: typecheck, lint, both builds, 27 nodes server-rendered, all seven landings probed, every panel measured with 9–78 units of slack and none clipped, `pnpm review` green over 12 routes × desktop/mobile × light/dark, plus a settled map-zoom capture. **Blob count on the canvas: 18 → 1.**

    *Still standing on scaffolding.* Five sections are `Placeholder draft` (§13). Work Experience is the only fully written one; Me is written but has no location. Nothing ships with invented facts — the drafts say what is missing and why.
11. **Bento widgets and illustrations, on a fixture** (§8.3–8.4, Patterns.md; 2026-09-10). `Bento`, `BentoCell`, `BentoFigure`, `Illustration` (+ `primitives.ts`, the grammar) in the package; six widgets built from real content and draft placeholders on `/fixtures/bento`, shown at full size, at the 0.27 overview, in both themes, on the box grid — the review surface Bhargav chose. Six outline glyphs were drawn and retired the same day in favour of illustrations, and the illustrations were redrawn the same day again as fine lines on textured gradient cards (Bhargav's four conditions). `probe10` proves nothing sits under text; `probe11` proves no two lines in a picture touch. Nothing goes on the canvas until the widgets are approved there.
12. ✅ **Done 2026-09-11. The ring rebuilt on widgets, with the snap.** **Done:** the ellipse quantised to boxes (§8.3) — six widgets on their box anchors, Me always full at the centre with the blob on the origin crosshair. New `SectionWidget` (§9) and a new `widget` node type; `section` tags every node a section owns and `full` marks the panels of its full view, which is the whole of how focus mode works. The snap per §8.4: `onMoveEnd` only, open at 0.85, release at 0.55, click or Enter opens, Esc and a visible **Back to the map** both release. **The three-tier fade is retired** — a full view is simply not visible until it is open, so nothing fades by zoom any more, and the Me column stopped going blank on the map. Six section illustrations, drawn by the v1 generator, `probe11` and `probe10` clean on the live canvas.

    Three things were found the hard way and are worth not rediscovering. React Flow does **not** route clicks to a node that is not draggable, and a widget must never be draggable — so the widget carries its own pointer handler through the nav context, while Enter still arrives through the shell. React Flow writes `pointer-events` as an **inline** style on every node wrapper, so an invisible full view stacked above the ring swallowed every click until the rule was made `!important`. And a self-driven viewport move fires `onMoveEnd` too, so opening on a click at map zoom immediately re-closed itself — every programmatic move now marks itself, and releasing lands at 0.45, below the release threshold, or Esc re-opens what it just closed.

    **Full views are 8 boxes wide**, and they spend that on **two 560 columns** with a box-and-a-half between them rather than on a wider measure — 560 is a reading width and 1280 is not, so widening the panels would have made every one of them worse. Because the panels keep their width, every height measured for the old single column is still correct and nothing had to be re-measured. Panels flow into whichever column is shorter, in DOM order, so reading order and tab order are untouched. A full view is centred but never behind the view switcher, and the minimap hides while one is open, because it sits exactly where the heading goes.

    **Document mode and no-JS** (§8.6–8.7) get the other half of the rule: **widgets are not rendered at all** — a widget is a preview of something you can open, and on a phone you simply read the thing — and the full views stop being hidden and become the content, stacked in reading order. Verified on a Pixel 7 and with JavaScript disabled: no widgets, all nineteen panels readable.

    **Not done:** `RegionNode` is unused by the portfolio now but still exported and exercised by `/fixtures/canvas`.
13. Deploy to Vercel → `bhargav.no-origins.com`.
14. ✅ **Done 2026-09-11, reorganised 2026-09-16. `design.no-origins.com` — the showcase.** `apps/design`, a second Next app: an overview, **Tokens** (the family, the type scale, space, radius, elevation, motion, and the contrast report — a screen each) and **Components** (the whole registry, rendered by `Catalogue` from the package so the showcase and the admin cannot drift — a screen per Atomic layer).

    It shipped in **page mode** — the first thing on the platform to wear `Page`, `NavBar`, `Footer` and `SectionHeader` since the portfolio retired them in step 9, on the grounds that a catalogue is a document. Block accent blue, so it never reads as part of the portfolio (peach) or the admin (lavender).

    **✅ Reorganised 2026-09-16 — it is a Tool now, and it has eleven screens.** Three routes was two long scrolls: every token on one page, all 48 components on another, and no way to compare two radii without remembering what the hues looked like eight screens up. Tokens became a screen each for colour, contrast, type, space, radius, elevation and motion; Components became a screen per **Atomic layer** — by layer and not by group, because the layer is what a component IS, and the reading order is the build order. Eleven destinations is the exact case §4 of Admin.md settles: a row collides at seven-plus and the answer is a column. So the showcase wears the admin's shell — `Tool`, the `Menu` (D9) and a `ToolScreen` per route — and the `NavBar` and `Footer` go with page mode. (It had a hand collapse, remembered per browser, until the rail went on 2026-09-16: D13.) Page mode does not lose its consumer: the portfolio's `(page)` group still wears `Page`, `NavBar` and `Footer` across the fixtures.

    Three things carry the no-drift rule through the split. `Catalogue` gained a **`layer` prop** rather than the app learning to filter the registry — the admin renders the same component whole (Admin.md §5.1), and a second rendering is the drift the registry exists to prevent. `layerNotes` moved out of `Catalogue` into the registry index, so the screen that names a layer in its header and the catalogue that describes it read one declaration. And `/components/[layer]` is a **dynamic route with `generateStaticParams`**, so a fourth layer added to `layers` adds its screen instead of waiting for someone to remember.

    **The nav names the two halves and nothing else.** The admin puts a labelled group over each destination because each of its groups holds several; here a group would hold one item of the same name, and the column would read "TOKENS · All tokens · Colour" — the same word three times before it says anything. Unlabelled groups also mean no group hue, since a group's hue is drawn on its label's dot and nowhere else. The items are **Tokens** and **Components**, not "All tokens" and "All components", and that is what makes the small forms work: the Menu falls back to a label's first letter where the label does not fit, so two items beginning "All" are two identical glyphs in the phone's sheet (and, until 2026-09-16, in the rail). Found by looking at the mobile screenshot, which is the only place it is visible.

    **The contrast report earned its place immediately**, by finding three pairs below §12's floors on the day it was built: `--muted` on `--ground` at 4.20:1, `pink-ink` on `pink` at 4.47:1 and `blue-ink` on `blue` at 4.05:1, against a floor of 4.5. Under R3 the showcase cannot refuse a token — tokens are code — so making a broken floor impossible to miss is the whole of its job, and it did that before anyone asked it to.

    It measures rather than computes, and the reason is worth keeping: `getComputedStyle` resolves a `var()` but keeps the colour in the space it was authored in, so every `oklch()` token came back as `oklch(...)`. Reading three numbers out of that as R, G and B made every ratio about 1:1 — the wrong answer in the most convincing possible form. The resolved colour is painted into a 1×1 canvas and the pixel read back instead. Caught by looking at the page, not by a passing test.
15. The browser-side model — a fine-tuned small model that helps a visitor navigate the map and ask about Bhargav, wearing the centre blob (§8.3). Needs the portfolio's copy to exist first: it is the training material.
16. ✅ **v1 — 2026-09-16.** The complete revamp Bhargav asked for in one message, released as **`@no-origins/ui` 1.0.0** and recorded as Atomic.md D10–D13. **No more glass:** one flat surface at three elevations, everywhere the system used to be translucent (§3), with the blob flat and `ProfileCard` on a scrim. **No more React Flow:** the canvas, the editor and the document layer left the package with `@xyflow/react` and `zod`, and the portfolio became **pages** — a home that introduces him and carries the six widgets, one route per section — while the admin stopped authoring anything. Bhargav: *"I want to take a different approach later,"* so the registry's contract is kept and §8 above is kept, as the record. **Motion is a layer:** `durations`, `easings`, `motionPatterns`, `motionNotes`, `prefersReducedMotion`, the `Motion` atom, `useReducedMotion`, and a `/tokens/motion` screen on the showcase that reads them (§7). **One navigation:** no `Rail`, no rail form, no collapse — `Menu` is column, two columns, or sheet (D13). Every deprecated alias from the 0.1.0 release went at the same time, which is what makes this a major. Verified the way everything here is verified: the package's lint and build, all three apps' typechecks, `pnpm review` over the portfolio and the showcase in both themes on desktop and mobile, and the admin by signing in and looking.
