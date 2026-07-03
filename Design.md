# No Origins — Visual Labs Design System

> **Status:** Authoritative. This document is the single source of truth for the Visual Labs
> visual identity, design tokens, component contracts, and styling rules. Every page and
> component MUST resolve its colors, spacing, type, and motion from the tokens defined here.
> Hardcoded hex, ad-hoc Tailwind color classes, and inline glass values are violations.

**Applies to:** `visual-labs/` (Next.js 16 · React 19 · Tailwind v4 · shadcn `radix-nova`)
**Token source file:** `visual-labs/src/index.css`
**Last revised:** 2026-06-29

---

## 0. How to read this document

The system is organized as **four token tiers**. A component should only ever touch Tier 1–3.
Tier 0 primitives are raw values that nobody references directly.

```
Tier 0  Primitives        raw palette / glass / hue families      (never used in components)
Tier 1  Section accent    --section-accent + derived shades       (swapped per route at runtime)
Tier 2  Semantic          shadcn vars wired to dark + accent       (--background, --card, --primary…)
Tier 3  Utilities         .glass, .text-accent, .glow-accent…      (what components actually apply)
```

The golden rule: **if you are typing a hex code or `emerald-`/`sky-`/`amber-` into a component,
you are doing it wrong.** Reach for a token.

---

## 1. Design Principles

1. **Dark-only, glass-first.** Visual Labs has exactly one mode: a deep near-black canvas with
   frosted glass panels floating over a reactive particle/WebGL field. There is no light theme.
   The shadcn light defaults are vestigial and are overridden in §3.
2. **One accent, many sections.** The interface has a *single* accent slot, `--section-accent`.
   Its value changes per route to give each area its identity (Labs = emerald, Society = sky, …),
   but components never know *which* color — they only read the slot. Add a section by adding a
   token block, not by editing components.
3. **Telemetry typography.** Monospace (`JetBrains Mono`) is the default UI voice — labels,
   controls, data. Sans (`Inter`) is reserved for long-form prose (Stories, editor body).
4. **Glass over decoration.** Card interiors stay pure translucent dark glass. Color lives on
   *edges* — borders, glows, sweeps — never as a fill cast inside a panel.
5. **Motion is reactive, not decorative.** Animation responds to the user (cursor proximity,
   route change, audio) on a consistent easing/duration vocabulary (§7). Idle animation is ambient
   and low-amplitude.
6. **Tokens compose with `color-mix`.** Alpha tints derive from the accent at use-site
   (`color-mix(in oklab, var(--section-accent) 15%, transparent)`), so a section recolor needs
   zero per-component opacity edits.

---

## 2. Tier 0 — Primitives

Raw values. Defined once in `:root`. **Do not reference these in pages/components.**

### 2.1 Canvas neutrals (the dark substrate)

| Token | Value | Role |
| :--- | :--- | :--- |
| `--ink-base` | `#09090b` | App background (zinc-950) |
| `--ink-raised` | `#120F17` | Raised solid surface (rare; glass preferred) |
| `--ink-overlay` | `rgba(0, 0, 0, 0.65)` | Card backdrop behind glass blur |

### 2.2 Glass

| Token | Value | Role |
| :--- | :--- | :--- |
| `--glass-bg` | `rgba(9, 9, 11, 0.4)` | Standard panel fill |
| `--glass-bg-strong` | `rgba(0, 0, 0, 0.65)` | Modal / heavy panel fill |
| `--glass-border` | `rgb(255 255 255 / 15%)` | Card edge |
| `--glass-border-subtle` | `rgb(255 255 255 / 8%)` | List-item / divider edge |
| `--glass-blur` | `16px` | Card blur radius |
| `--glass-blur-strong` | `24px` | Modal blur radius |

### 2.3 Text-on-glass ramp

| Token | Value | Role |
| :--- | :--- | :--- |
| `--text-primary` | `rgb(255 255 255 / 92%)` | Headings, key values |
| `--text-secondary` | `rgb(255 255 255 / 55%)` | Body / labels |
| `--text-tertiary` | `rgb(255 255 255 / 35%)` | Hints, disabled |

### 2.4 Section hue families

Each section is one HSL hue triple. `base`/`soft`/`deep` are the three stops the BorderGlow and
state styles use. The `hsl` value is the bare `H S L` (no commas) used for alpha composition.

| Section | Tailwind name | `base` | `soft` | `deep` | `hsl` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Labs / Projects** | emerald | `#10b981` | `#34d399` | `#059669` | `140 80 50` |
| **Society** | sky | `#0ea5e9` | `#38bdf8` | `#0284c7` | `200 80 50` |
| **Hyperbase** | amber | `#f59e0b` | `#fbbf24` | `#d97706` | `40 80 50` |
| **Stories** | fuchsia | `#ec4899` | `#f472b6` | `#db2777` | `320 80 50` |
| **Spotify** | spotify-green | `#1db954` | `#1ed760` | `#1aa34a` | `145 63 42` |
| **Credits** | violet | `#8b5cf6` | `#a78bfa` | `#7c3aed` | `260 80 50` |
| **Profile** | indigo | `#6366f1` | `#818cf8` | `#4f46e5` | `239 84 67` |
| **Community** | purple | `#ac1ae6` | `#c55eed` | `#8914b8` | `283 80 50` |
| **Core / Home** | neutral | `#10b981` | `#34d399` | `#059669` | `140 80 50` |

> Core/Home falls back to emerald so unscoped surfaces are never colorless. Stories is
> **fuchsia, not pink** — the `text-pink-400` currently on the Stories heading is a bug (§9).

### 2.5 Status colors (section-independent)

| Token | Value | Role |
| :--- | :--- | :--- |
| `--status-error` | `#f87171` | Errors, destructive |
| `--status-error-bg` | `rgba(127, 29, 29, 0.45)` | Error alert fill |
| `--status-success` | `var(--section-accent)` | Success ties to active accent |

---

## 3. Tier 1 — Section accent (runtime slot)

There is **one** accent slot. Components read these five tokens and nothing else for color identity:

| Token | Derives from | Used for |
| :--- | :--- | :--- |
| `--section-accent` | hue `base` | Primary accent: text, borders, active states |
| `--section-accent-soft` | hue `soft` | Hover text, light emphasis |
| `--section-accent-deep` | hue `deep` | Pressed / strong fills |
| `--section-accent-hsl` | hue `hsl` | Alpha composition (`hsl(var(--section-accent-hsl) / 0.15)`) |
| `--section-glow` | accent @ 40% | Glow box-shadows, sweeps |

### 3.1 The per-route swap mechanism

The accent is swapped by a `data-section` attribute, resolved by selectors in `index.css`.
The `(cards)` layout (or each page) sets `data-section` on its root container:

```css
/* index.css — the swap table */
:root, [data-section="core"]      { --section-accent: #10b981; --section-accent-hsl: 140 80 50; /* …soft/deep/glow */ }
[data-section="society"]          { --section-accent: #0ea5e9; --section-accent-hsl: 200 80 50; … }
[data-section="hyperbase"]        { --section-accent: #f59e0b; --section-accent-hsl: 40 80 50;  … }
[data-section="stories"]          { --section-accent: #ec4899; --section-accent-hsl: 320 80 50; … }
[data-section="spotify"]          { --section-accent: #1db954; --section-accent-hsl: 145 63 42; … }
[data-section="credits"]          { --section-accent: #8b5cf6; --section-accent-hsl: 260 80 50; … }
[data-section="profile"]          { --section-accent: #6366f1; --section-accent-hsl: 239 84 67; … }
[data-section="community"]        { --section-accent: #ac1ae6; --section-accent-hsl: 283 80 50; … }
```

```tsx
// (cards)/layout.tsx derives the section from the route once, sets it on the scroll container.
const section = SECTION_BY_PATH[useSelectedLayoutSegment() ?? "core"];
return <div data-section={section} className="…">{children}</div>;
```

Everything below the container — text, borders, glows, BorderGlow defaults, shadcn `--primary`,
the sphere accent, the editor — inherits the swap with **no per-page color code**.

> **Why a slot, not props:** passing `colors={["#10b981",…]}` to every BorderGlow is what created
> the fragmentation. The slot means adding "Society = teal next quarter" is a one-line token edit.

---

## 4. Tier 2 — Semantic tokens (shadcn, wired dark)

The stock shadcn vars are repointed so the whole shadcn ecosystem (Button, Input, Dialog, Command)
themes itself from our system automatically. **Dark is the only mode** — these live on `:root`.

| shadcn token | Wired to | Effect |
| :--- | :--- | :--- |
| `--background` | `var(--ink-base)` | Near-black app bg |
| `--foreground` | `var(--text-primary)` | Default text |
| `--card`, `--popover` | `var(--glass-bg)` | Panels are glass |
| `--card-foreground`, `--popover-foreground` | `var(--text-primary)` | |
| `--primary` | `var(--section-accent)` | **Buttons/links theme per section automatically** |
| `--primary-foreground` | `var(--ink-base)` | Text on accent fills |
| `--secondary` | `hsl(var(--section-accent-hsl)/0.10)` | Subtle accent surface |
| `--muted-foreground` | `var(--text-secondary)` | |
| `--border` | `var(--glass-border-subtle)` | |
| `--input` | `var(--glass-border)` | |
| `--ring` | `var(--section-accent)` | Focus ring matches section |
| `--destructive` | `var(--status-error)` | |
| `--radius` | `0.625rem` | Base radius (existing) |
| `--radius-button` | `9999px` | Pills (existing) |

Because `button.tsx` already uses `bg-primary` / `ring-ring`, wiring `--primary` to the accent
means **buttons recolor per section for free** — no button edits needed.

---

## 5. Tier 3 — Utilities (what components apply)

Defined in `@layer utilities`. These replace the scattered inline glass/color patterns.

### 5.1 Surfaces

| Utility | Expands to |
| :--- | :--- |
| `.glass` | `background: var(--glass-bg); backdrop-filter: blur(var(--glass-blur)); border: 1px solid var(--glass-border-subtle)` |
| `.glass-strong` | `var(--glass-bg-strong)` + `blur(var(--glass-blur-strong))` + `var(--glass-border)` |
| `.surface-list-item` | `background: hsl(var(--section-accent-hsl)/0); border: 1px solid var(--glass-border-subtle)` with accent hover (see 5.4) |

### 5.2 Accent color — the `section` Tailwind color is canonical

The accent is exposed as a **Tailwind color named `section`** (`--color-section` →
`var(--section-accent)`, plus `section-soft`/`section-deep`). This is the primary accent API
because it supports opacity modifiers *and* variants out of the box:

| Pattern | Example | Notes |
| :--- | :--- | :--- |
| Text | `text-section`, `text-section-soft` | |
| Background tint | `bg-section/10`, `bg-section/20` | opacity → `color-mix` |
| Border | `border-section/30`, `hover:border-section/40` | variants work |
| Solid fill | `bg-section`, `hover:bg-section-soft` | buttons |
| Focus ring | `focus:border-section/50`, `ring-section` | |
| Range input | `accent-section` | |
| Accent shadow | `shadow-[0_0_12px_color-mix(in_oklab,var(--color-section)_15%,transparent)]` | derive alpha via `color-mix` |

Composite utilities for the cases Tailwind can't express inline:

| Utility | Expands to |
| :--- | :--- |
| `.text-accent` / `.border-accent` | no-variant accent shortcuts |
| `.bg-accent-tint` / `.bg-accent-tint-strong` | `color-mix(... 12%/18% ...)` |

> The legacy `.text-theme-accent`, `.bg-theme-glass`, `.border-theme-*` utilities are **NOT**
> aliases of the section slot — they belong to the workspace-preset axis (§13). With no preset
> active they default to the section system (emerald core).

### 5.3 Glow

| Utility | Expands to |
| :--- | :--- |
| `.glow-accent` | `box-shadow: 0 0 15px var(--section-glow)` |
| `.glow-accent-sm` | `box-shadow: 0 0 8px var(--section-glow)` |
| `.glow-inset` | `box-shadow: inset 0 0 12px var(--section-glow)` |

### 5.4 Interactive list item (the canonical "record row")

Replaces the per-page `hover:border-emerald-500/30 hover:shadow-[…]` copies:

```css
.surface-list-item {
  background: hsl(var(--section-accent-hsl) / 0);
  border: 1px solid var(--glass-border-subtle);
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.surface-list-item:hover {
  border-color: hsl(var(--section-accent-hsl) / 0.35);
  box-shadow: 0 0 12px hsl(var(--section-accent-hsl) / 0.15);
}
```

### 5.5 Scrollbar

`.custom-scrollbar` stays as-is (neutral white thumb) — it is section-independent chrome.

---

## 6. Typography

### 6.1 Families

| Token | Stack | Use |
| :--- | :--- | :--- |
| `--font-mono` | `"JetBrains Mono", ui-monospace, …` | **Default UI** — labels, controls, data, nav |
| `--font-sans` | `"Inter", ui-sans-serif, …` | Long-form prose only (Stories body, editor) |

`html` defaults to mono in this system (telemetry voice). Apply `.font-sans` explicitly for prose.

### 6.2 Type scale — replaces the `text-[7px]` hack

The current code uses sub-pixel sizes (`text-[7px]`…`text-[12px]`) **silently rewritten +3px** by
overrides in `index.css`. This is brittle and confusing. Use the named scale instead:

| Token | Size / line | Replaces | Use |
| :--- | :--- | :--- | :--- |
| `--text-micro` | `11px / 1.4` | `text-[7px]`, `text-[8px]` | Dense telemetry labels, tags |
| `--text-caption` | `12px / 1.45` | `text-[9px]` | Captions, metadata |
| `--text-body` | `13px / 1.5` | `text-[10px]`, `text-[11px]` | Default body |
| `--text-base` | `14px / 1.5` | `text-xs`/`text-[12px]` | Comfortable body |
| `--text-heading` | `16px / 1.4` | `text-sm`/`text-[14px]` | Card headings |
| `--text-title` | `20px / 1.3` | `text-[18px]` | Page titles |

Exposed as `.type-micro` … `.type-title` utilities. The px-override block is **deprecated** —
new code uses the scale; the override stays only until existing `text-[Npx]` usages are migrated.

### 6.3 Weights

Mono: 400 (body), 500 (emphasis/active). Sans: 300–400 (prose), 500–600 (headings).

---

## 7. Spacing, Radius, Motion

### 7.1 Spacing
Tailwind scale only. Card interior padding: `p-8` (desktop cards), `p-6` (dense panels).
Stack rhythm: `space-y-6` (sections), `space-y-3` (list items), `gap-2`/`gap-3` (inline controls).

### 7.2 Radius
`--radius` 0.625rem base; `--radius-sm/md/lg/xl/2xl/3xl/4xl` already derived. **Buttons are pills**
(`--radius-button: 9999px`, enforced on `button` in base layer). Cards use `12px` (BorderGlow
`borderRadius={12}`). List items `--radius-lg`.

### 7.3 Motion

| Token | Value | Use |
| :--- | :--- | :--- |
| `--ease-enter` | `cubic-bezier(0.16, 1, 0.3, 1)` | Page/element entrances |
| `--dur-page` | `0.6s` | `page-enter` animation |
| `--dur-hover` | `0.2s` | Hover/border transitions |
| `--dur-sweep` | `1.2s` | BorderGlow entrance sweep (355°) |

`animate-page-enter` (existing keyframe) is the standard route-entry animation, keyed on pathname.

---

## 8. Component Contracts

### 8.1 `<BorderGlow>` — primary card wrapper
- **Reads the accent slot.** Default `glowColor`/`colors` derive from `--section-accent*`
  (via CSS vars), **not** hardcoded purple/gold defaults and **not** per-page hex props.
- Pages should mount `<BorderGlow>` with no color props; it inherits the section.
- Interior stays pure glass: no inner mesh fill, `mask-composite: exclude` clips border bleed,
  `.edge-light` at `z-index:-2` behind `::before` border at `z-index:-1`. (Unchanged.)
- **Never nest** BorderGlow (pointer-event capture + FPS). List rows use `.surface-list-item`.

### 8.2 shadcn UI (`button`, `input`, `textarea`, `dialog`, `command`, `input-group`)
- Already token-based — leave structure intact. They inherit §4 automatically.
- **`resizable.tsx` is the exception:** it hardcodes `emerald-500`. Repoint to `--section-accent`
  / `ring-ring`.

### 8.3 Sphere stack
- **`SphereNavBar`** — already uses `text-theme-accent`/`border-theme-style` (good). Keep, alias to new utils.
- **`SphereChatInput`** — defaults core color to `#E01577` (pink) and uses a stray `text-emerald-500/70`.
  Default core to `var(--section-accent)`; replace the stray emerald.
- **`InteractiveHUD`** — mixes `emerald-400/500` with `theme-accent`. Consolidate **all** to accent utils.
- **`InnerCore`** — keeps its per-theme palette (it maps to *sphere* material themes, a separate
  axis from section accent). Its `coreColor="theme"` path should fall back to `--section-accent`.
- **`LiquidMetalSphere`** — GLSL theme colors are **sphere material identity**, intentionally
  distinct from section accent. The one stray `bg-emerald-500` halo (line ~617) → accent. Shader
  themes stay; expose accent as a uniform only where the ambient halo reads it.
- **`DotField` / `BackdropField`** — particle field is **neutral white** by design (ambient
  substrate, not section chrome). Keep white; document as an intentional non-accent surface.
- **`BackgroundVisualizer`** — `menuItems[].glowColor` and the active-state emerald → accent slot
  / per-item section hue from the hue table.

### 8.4 `<UserAvatar>` — presentational avatar
- Shared presentational component (`components/UserAvatar.tsx`): renders the `user_metadata` image
  when present, else email-derived initials (`initialsFromEmail`), else a glyph. The **caller**
  styles the wrapper (size / bg / border / text) via `className`; the component only sets structural
  classes. Used in two places:
  - **Home control cluster** (`(base)/page.tsx`, signed-in): wrapped in a `Link` to `/profile` — it
    is the **account entry** and replaced the old "Sign Out" button. As global chrome it uses
    neutral glass (`bg-zinc-950/60`, `border-white/15`) to match the sibling nav pills.
  - **Profile card header** (`/profile`): identity only. Inside `data-section="profile"` so it uses
    the **section accent** (indigo): `border-section/40`, `bg-section/10`, `text-section`.
- **Sign out lives on the Profile card** — a regular labelled button in the card footer
  (`LogOut` icon + "Sign out"), next to "Back to Core". The home cluster no longer has one.

### 8.5 Projects canvas
- **`TipTapSplitEditor.css`** — every `#10b981`/`#34d399`/`rgba(16,185,129,…)` → `var(--section-accent)`
  / `var(--section-accent-soft)` / `hsl(var(--section-accent-hsl)/α)`.
- **`TldrawCustom.css`** — repoint `--tl-color-primary/hover/selected/accent/selection-stroke` and
  scrollbar to the accent tokens. Tldraw then themes to whatever section hosts the canvas (emerald
  for Projects).
- **Canvas fonts — chrome only, never shapes.** Console monospace is enforced on the Tldraw UI
  chrome via `[class*="tlui-"], [class*="tlui-"] *` (toolbar, menus, style panel, dialogs). It must
  **NOT** be applied to `.tl-container *` / `.tl-canvas` / shape text — doing so overrides the
  per-shape font-style picker (draw / sans / serif / mono) and the selection silently does nothing.
  Canvas shapes are never descendants of `tlui-` elements, so this scoping keeps both working.

---

## 9. Known violations to fix (migration checklist)

| # | File | Issue | Fix |
| :-- | :--- | :--- | :--- |
| 1 | `stories/page.tsx` | `text-pink-400` ≠ fuchsia accent | `.text-accent` (fuchsia via slot) |
| 2 | `projects/page.tsx` | Discovery/Fork/Publish use hardcoded `sky-*` inside an emerald section | Decide: either a documented "discovery = sky" sub-accent, or `.text-accent`. Default: accent slot |
| 3 | `admin/page.tsx` | Mixes `.text-theme-accent` with hardcoded `emerald-*` | All → accent utils |
| 4 | all `(cards)` pages | Hardcoded BorderGlow `colors`/`glowColor` hex + `text-emerald/sky/...-400` | Drop color props; use `.text-accent`; set `data-section` |
| 5 | `index.css` | `text-[Npx]` silent +3px override | Migrate to §6.2 scale; deprecate block |
| 6 | `resizable.tsx` | `emerald-500` hardcoded | `--section-accent` / `ring-ring` |
| 7 | `SphereChatInput.tsx` | `#E01577` default + stray `emerald-500/70` | accent slot |
| 8 | `InteractiveHUD.tsx` | mixed emerald vs token | all accent utils |
| 9 | `BackgroundVisualizer.tsx` | hardcoded emerald (`#10b981`, active state) | accent slot / hue table |
| 10 | `TipTapSplitEditor.css`, `TldrawCustom.css` | fully hardcoded emerald | accent tokens |
| 11 | `login/page.tsx`, `base/page.tsx`, home | hardcoded emerald, no section context | `core` section (emerald) via slot |

---

## 10. Rules & Best Practices

1. **No raw color in components.** No hex, no `rgb()`, no `emerald-`/`sky-`/`amber-`/`pink-`/
   `violet-` Tailwind classes. Use accent utilities or semantic shadcn classes (`bg-primary`,
   `text-foreground`, `border-border`). Status colors use `--status-*`.
2. **Set the section once.** Section identity is declared via `data-section` at a container, never
   re-specified per element. New section = new token block in §2.4 + §3.1, zero component edits.
3. **Alpha via `color-mix`/`hsl(... / α)`** from the accent — never a new hardcoded `rgba`.
4. **Glass only via `.glass`/`.glass-strong`.** No ad-hoc `bg-black/40 backdrop-blur-*` inline.
5. **Type via the scale (§6.2).** No new `text-[Npx]` literals.
6. **Do not nest `<BorderGlow>`.** List rows use `.surface-list-item`.
7. **WebGL discipline.** Clamp particle ranges; `cancelAnimationFrame` + free GL buffers on unmount.
8. **Particle field stays neutral.** `DotField`/`BackdropField` are ambient substrate, not accent.
9. **Sphere material ≠ section accent.** They are independent axes; don't collapse them.
10. **The doc leads.** Any new visual pattern is added here *first*, then implemented.

---

## 11. Layout reference (unchanged structure)

Split viewport: Sphere/WebGL column (left desktop / bottom mobile) + independent-scroll subpage
column (right / top). `(cards)` route group enforces `max-w-[450px]`, `key={pathname}` replays
`animate-page-enter`. `BackdropField` particle grid renders behind everything. See
`wiki/visual-labs/navigation_ui.md` for the WebGL `InfiniteMenu` and route-sync details.

---

## 12. Adding a new section (worked example)

To add **"Archive" = teal**:
1. Add a row to §2.4 (hue family: base/soft/deep/hsl).
2. Add `[data-section="archive"]` block to the §3.1 swap table in `index.css`.
3. Map the route in `SECTION_BY_PATH` in `(cards)/layout.tsx`.
4. Build the page with `.text-accent`, `.glass`, `<BorderGlow>` (no color props).

No component touches color. That is the whole point of the system.

---

## 13. The three theming axes (don't conflate them)

Visual Labs has **three independent color axes**. Keeping them separate is essential:

| Axis | Driven by | Scope | Tokens |
| :--- | :--- | :--- | :--- |
| **Section accent** | route (`data-section`) | subpage card content | `--section-accent*`, `section` color, `.glass`, `.glow-accent` |
| **Workspace preset** | user choice (`VisualizerContext`) | global chrome (sphere nav, HUD, admin, InfiniteMenu) | `--primary-accent`, `--bg-glass`, `--glow-color`, `--border-*` + `.text-theme-accent`, `.bg-theme-glass`, `.border-theme-*` |
| **Sphere material** | sphere theme index 0–4 | the WebGL orb + its labels | GLSL uniforms, `InnerCore` glow map, `InteractiveHUD` theme swatches |

- **Workspace presets** (`cosmic-obsidian`, `liquid-gold`, …) are defined in
  `context/VisualizerContext.tsx` and written to `:root` inline at runtime
  (`root.style.setProperty('--primary-accent', …)`). They override the legacy `theme-*` tokens,
  which otherwise default to the section system. This is why global chrome uses `.text-theme-accent`
  (preset axis), while a card heading uses `text-section` (route axis).
- **Sphere material** colors (`LiquidMetalSphere` GLSL, `InnerCore` `getGlowColor`,
  `InteractiveHUD` `THEMES` + theme labels) are deliberately NOT tokenized to the section accent —
  they identify the orb's physical material, a separate concept.
- The **InfiniteMenu hue data** (`BackgroundVisualizer.menuItems[].glowColor`) hardcodes each
  section's `base` hue from §2.4 — it is the menu's per-item identity source and must stay in
  sync with the §2.4 table. The menu also carries the non-section **Interactive Sandbox** entry
  (`/base`, symbol `⚙`, core emerald `#10b981`) — it is the nav entry for the sandbox and replaced
  the former "Interactive Sandbox" button in the home control cluster.

---

## 14. Implementation status (2026-06-29)

Fully rolled out and verified against the running app (all `[data-section]` blocks compile, the
`section` utilities generate, `color-mix` resolves, routes serve 200, `data-section` present in SSR):

- ✅ Token foundation in `src/index.css` (4 tiers + swap table + `section` color + utilities + type scale).
- ✅ Route→accent swap on `(cards)/layout.tsx`; `<BorderGlow>` inherits the slot (no color props).
- ✅ All 7 card pages tokenized; Stories pink→fuchsia fixed; Projects sky-mixing folded into the slot.
- ✅ Profile section added (indigo `#6366f1`): `/profile` self-profile card reads `public.profiles` via RLS
  (`auth.uid() = id`). Token block + swap-table + `SECTION_BY_SEGMENT` route map in place. The
  card has an identity avatar + a Sign Out button (§8.4); the home control cluster's avatar links here.
- ✅ Components: HUD toggles, SphereChatInput, BackgroundVisualizer chrome, resizable, Sphere nav.
- ✅ `TipTapSplitEditor.css` + `TldrawCustom.css` fully tokenized.
- ⚠️ **Intentional exceptions:** sphere-material colors (§13), InfiniteMenu hue data (§13), the
  amber "unsaved" status dot in the editor, and `admin/page.tsx` JS preset config (core console).
- ⏳ **Deferred:** migrating existing `text-[Npx]` literals to the `.type-*` scale (§6.2) — the
  deprecated px-overrides still cover them; no new `text-[Npx]` should be added.
