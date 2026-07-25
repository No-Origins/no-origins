# Visual Labs Mobile — Design System

> **Status:** Draft for review. The React Native / Expo sibling of [Design.md](file:///Users/hiddenstack/Creatives/no-origins/Design.md). Where Design.md governs the web app, this governs the mobile companion. It re-expresses the same visual identity — dark-only, glass-first, one accent per section — in RN terms, and adds the mobile-only surfaces (Skia sphere, touch particle field, social feed, native tab bar).
>
> **Applies to:** the Expo app [visual-labs-mobile](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/) · Expo SDK 57 · NativeWind v4 · Reanimated · react-native-skia · expo-blur
> **Parent doc:** [Design.md](file:///Users/hiddenstack/Creatives/no-origins/Design.md) (web) · **Plan:** [Mobile App Plan](Wikis/no-origins/visual-labs-mobile/app_plan.md)
> **Last revised:** 2026-07-15

---

## 0. How to read this document

Same spirit as Design.md: components resolve color/space/type/motion from **tokens**, never from raw values. The token *tiers* are identical — what changes is the *mechanism*, because React Native is not the DOM:

| Web (Design.md) | Mobile (this doc) |
| :--- | :--- |
| CSS `:root` custom properties | NativeWind theme + a small set of CSS vars |
| `[data-section]` descendant-selector swap | `<SectionProvider>` context + `vars()` on a wrapper View |
| `color-mix(...)` at use-site | **precomputed alpha helper** (`withAlpha`) — no `color-mix` in RN |
| `backdrop-filter: blur()` | `expo-blur` `BlurView` |
| `::before` border + `mask-composite` | a **Skia-drawn** `<BorderGlow>` |
| GLSL / WebGL sphere + particles | **Skia SkSL** shader + `Atlas` |

The golden rule is unchanged: **if you are typing a hex value or an `emerald-`/`sky-` class into a component, you are doing it wrong. Reach for a token.**

---

## 1. Principles (mobile-adapted)

1. **Dark-only, glass-first.** One mode: near-black canvas, frosted glass panels. No light theme.
2. **One accent, many sections.** A single accent slot swapped per **tab/route**, never known by a component (§3). Same rule as web: *set the section once at a container.*
3. **Telemetry typography.** JetBrains Mono is the default UI voice; Inter is for long-form prose (post bodies, comments).
4. **Glass over decoration.** Color lives on **edges** (borders, glows), never as a fill inside a panel.
5. **Motion is reactive, and on the UI thread.** All continuous motion (sphere, particles, menu inertia) runs in **Reanimated worklets / Skia**, never driving React re-renders per frame.
6. **Touch, not cursor.** Web hover/proximity behaviors collapse to a single touch model (§6.6). No hover states; interactive affordances must be tappable (≥44pt targets).
7. **The doc leads.** New visual patterns are added here first, then built.

---

## 2. The section-accent mechanism in RN

There is no `data-section` cascade. Instead:

```tsx
// SectionProvider.tsx — sets the accent for a subtree.
const ACCENTS: Record<Section, AccentSet> = { core: EMERALD, feed: FUCHSIA, projects: EMERALD, profile: INDIGO };

export function SectionProvider({ section, children }: {section: Section; children: ReactNode}) {
  const a = ACCENTS[section];
  return (
    <SectionContext.Provider value={a}>
      {/* vars() injects CSS variables that NativeWind's `section` color reads (see §3) */}
      <View style={vars({
         '--section-accent': a.base,
         '--section-accent-soft': a.soft,
         '--section-accent-deep': a.deep,
      })} className="flex-1">
        {children}
      </View>
    </SectionContext.Provider>
  );
}
```

- **NativeWind side:** `className="text-section"`, `bg-section/10`, `border-section/30` resolve to the injected `--section-accent` (config in §3.2). This is the primary color API, same as web.
- **Imperative side (Skia / Reanimated):** components that can't use classNames read the raw values from `useSection()` (the context) — e.g. the sphere halo tint, a Skia border stroke color.
- **Set once:** each `(tabs)` screen wraps its content in `[SectionProvider.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/src/SectionProvider.tsx)` with `section="…"`. Nothing below re-specifies color. New section = new entry in `ACCENTS` + the hue table (§3.3). Zero component edits.

---

## 3. Tokens

### 3.1 Tier 0 — primitives (RN values)

| Token | Value | Role |
| :--- | :--- | :--- |
| `ink.base` | `#09090b` | App background |
| `ink.raised` | `#120F17` | Rare solid raised surface |
| `glass.bg` | `rgba(9,9,11,0.4)` | Standard panel fill (behind BlurView) |
| `glass.bgStrong` | `rgba(0,0,0,0.65)` | Modal / sheet fill |
| `glass.border` | `rgba(255,255,255,0.15)` | Card edge |
| `glass.borderSubtle` | `rgba(255,255,255,0.08)` | Divider / row edge |
| `glass.blur` | `16` (intensity) | Card blur (expo-blur `intensity`) |
| `glass.blurStrong` | `24` | Modal blur |
| `text.primary` | `rgba(255,255,255,0.92)` | Headings, key values |
| `text.secondary` | `rgba(255,255,255,0.55)` | Body / labels |
| `text.tertiary` | `rgba(255,255,255,0.35)` | Hints, disabled |
| `status.error` | `#f87171` | Errors, destructive |

> **Blur is an `intensity` number in expo-blur, not a px radius.** `16`/`24` are the intensities that read closest to the web's `16px`/`24px`. Android blur is weaker — see §9.

### 3.2 Tier 1 — the accent slot

Five values per section, read via `text-section` / `bg-section/α` (NativeWind) or `useSection()` (Skia):

| Slot | Source | Used for |
| :--- | :--- | :--- |
| `--section-accent` | hue `base` | Primary accent: text, borders, active states |
| `--section-accent-soft` | hue `soft` | Emphasis, pressed text |
| `--section-accent-deep` | hue `deep` | Strong fills |
| `accentHsl` (context only) | hue `hsl` | Alpha composition via `withAlpha` |
| `sectionGlow` | accent @ 40% | Skia glow, sweeps |

NativeWind config exposes the `section` color family in [tailwind.config.js](file:///Users/hiddenstack/Creatives/no-origins/visual-labs-mobile/tailwind.config.js):

```js
// tailwind.config — colors.section reads the injected CSS var
colors: {
  section:      'var(--section-accent)',
  'section-soft':'var(--section-accent-soft)',
  'section-deep':'var(--section-accent-deep)',
}
```

Opacity modifiers (`bg-section/10`) work through NativeWind's color pipeline. For values NativeWind can't express, use the helper (§3.4).

### 3.3 Section hue table (mobile v1 subset)

Reuses Design.md §2.4. Only the sections that exist in mobile v1:

| Section | Tab | `base` | `soft` | `deep` | `hsl` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **core** (Home) | Home | `#10b981` | `#34d399` | `#059669` | `140 80 50` |
| **feed** (social) | Feed | `#ec4899` | `#f472b6` | `#db2777` | `320 80 50` |
| **projects** | Projects | `#10b981` | `#34d399` | `#059669` | `140 80 50` |
| **profile** | Profile | `#6366f1` | `#818cf8` | `#4f46e5` | `239 84 67` |

**Feed = fuchsia** (the "Stories"/narrative hue) as the base social accent. Post **category chips** tint per-category from the full hue table — story = fuchsia, society = sky `#0ea5e9`, community = purple `#ac1ae6` — so a mixed feed still reads its categories (§6.8).

### 3.4 No `color-mix` → the alpha helper

RN has no `color-mix`. Alpha tints come from a helper over the hue triple:

```ts
// withAlpha('140 80 50', 0.15) → 'hsl(140 80% 50% / 0.15)'  (RN supports the hsl a-syntax)
export const withAlpha = (hsl: string, a: number) => `hsl(${hsl} / ${a})`;
```

Use `bg-section/15` where possible (NativeWind); reach for `withAlpha(accentHsl, 0.15)` only in Skia / inline style where the class pipeline isn't available. **Never hand-write a new `rgba()`.**

### 3.5 Tier 3 — utilities → components & helpers

The web `@layer utilities` becomes a small set of components + class recipes:

| Web utility | Mobile equivalent |
| :--- | :--- |
| `.glass` / `.glass-strong` | `<Glass>` / `<Glass strong>` (§6.1) |
| `.surface-list-item` | `<ListRow>` — border-subtle + pressed accent tint (no hover; uses `:active`/Pressable) |
| `.text-accent`, `.border-accent` | `text-section`, `border-section` classes |
| `.bg-accent-tint` | `bg-section/12` |
| `.glow-accent` | `<BorderGlow>` prop, or Skia shadow (§6.2) |

---

## 4. Typography

- **Load** via `expo-font`: `JetBrainsMono` (400/500), `Inter` (300/400/500/600).
- A shared `<Text>` wrapper defaults to **mono**; prose components (`<Prose>`) opt into Inter.

Scale in dp (line-height as multiplier), mapped from Design.md §6.2:

| Token | size / lh | Use |
| :--- | :--- | :--- |
| `type.micro` | 11 / 1.4 | Dense telemetry labels, tags |
| `type.caption` | 12 / 1.45 | Captions, metadata, timestamps |
| `type.body` | 13 / 1.5 | Default body |
| `type.base` | 14 / 1.5 | Comfortable body, post captions |
| `type.heading` | 16 / 1.4 | Card / row headings |
| `type.title` | 20 / 1.3 | Screen titles |

Exposed as `type-*` classes. **No ad-hoc font sizes.**

---

## 5. Spacing, radius, motion

- **Spacing:** Tailwind scale via NativeWind. Screen padding `px-4`; card interior `p-5`/`p-6`; stack rhythm `gap-6` (sections), `gap-3` (rows).
- **Radius:** `radius.base` 10, `radius.lg` 14 (cards), `radius.pill` 9999 (buttons/chips). **All action buttons are pills** (`rounded-full` / `borderRadius: 9999`) — never `rounded-xl` on CTAs. Cards/panels keep `radius.lg` / `rounded-2xl`. Inputs may use full or lg; prefer full when paired with a pill Save button.
- **Safe areas:** `react-native-safe-area-context`; the tab bar and headers respect insets.
- **Motion (Reanimated):**

| Token | Value | Use |
| :--- | :--- | :--- |
| `ease.enter` | `Easing.bezier(0.16, 1, 0.3, 1)` | Screen / element entrance |
| `dur.page` | 600ms | Route entrance |
| `dur.press` | 120ms | Press/scale feedback |
| `dur.sweep` | 1200ms | BorderGlow entrance sweep |

Route transitions use Expo Router's native stack animations; the branded entrance is a Reanimated fade+rise on the screen container keyed to focus.

---

## 6. Component contracts

### 6.1 `<Glass>` — the panel primitive
- Structure: `expo-blur` `BlurView` (`tint="dark"`, `intensity={glass.blur}`) + an overlay View at `glass.bg` + a `glass.borderSubtle` hairline border, `radius.lg`.
- `strong` variant → `bgStrong` + `blurStrong` + full `glass.border` (modals, bottom sheets).
- **Interior stays pure glass** — no accent fill inside. Color goes on the edge (§6.2).
- Android fallback: blur is weaker; compensate by raising the overlay alpha (see §9).

### 6.2 `<BorderGlow>` — signature card edge
- **Skia-drawn:** a rounded-rect **stroke** using `useSection()` accent, with a blurred copy behind it for the glow (Skia `Blur` on a stroked path). Replaces the web `::before` + `mask-composite`.
- Reads the accent slot; **no color props** on the caller. Optional `sweep` prop replays the 1200ms entrance sweep on mount.
- **Never nest.** List rows use `<ListRow>` (a cheap border-subtle Pressable with a pressed accent tint), not BorderGlow.
- Cheap fallback (if Skia cost is a concern on low-end Android): a `View` with `borderColor` = `section` + a single `shadow`/`elevation`. Documented as the degraded path.

### 6.3 Controls (no shadcn — RN primitives + NativeWind)
- `<Button>` — Pressable, pill radius, `bg-section` (primary) / `border-section` (outline) / transparent (ghost); pressed state scales to 0.97 (Reanimated) and shifts to `section-deep`.
- `<Input>` / `<TextArea>` — `<TextInput>` on `<Glass>`, `border-section/50` on focus, `ring` is a 1px `section` border (RN has no focus ring).
- `<Sheet>` — bottom sheet on `<Glass strong>` for compose, comments, confirmations.
- All theme from the section slot automatically; none take a color prop.

### 6.4 `<TabBar>` — everyday navigation
- Custom tab bar so it's `<Glass strong>` with a top hairline. Four tabs: **Home · Feed · Projects · Profile** + a center **`+` compose** affordance surfaced on Feed.
- Active tab uses the **destination's** section accent (Home→emerald, Feed→fuchsia, Profile→indigo); inactive = `text.tertiary`. Icons from `lucide-react-native`.

### 6.5 `<Sphere>` — the liquid-metal orb (Skia SkSL)
- A Skia `Canvas` with a **SkSL runtime shader** ported from the web `LiquidMetalSphere` GLSL (Design.md §8.3). Uniforms: `time`, `resolution`, `pointer` (all driven by Reanimated shared values on the UI thread), plus `materialColor`.
- **Sphere-material axis is preserved** (Design.md §13): the orb's color identity is its *material*, a separate axis from the section accent. The ambient halo may read `useSection()` accent; the body shader keeps its material palette.
- Fidelity bar: **"same general vibe"** — visually faithful, not pixel-matched (per [Mobile App Plan](Wikis/no-origins/visual-labs-mobile/app_plan.md) decision).

### 6.6 `<ParticleField>` — ambient dots (Skia `Atlas`)
- One batched Skia `Atlas` draw of N dots (neutral white, per Design.md §8.3 — **not** section-tinted).
- Ambient drift animated in a Reanimated worklet. **One** interaction: a `touchPoint` shared value (from gesture-handler) creates a flow/displacement of dots within a radius that follows the finger.
- **No** cursor-proximity ripples, no per-item states. This is deliberately simpler than web.
- Clamp N per device tier; free resources on blur/unmount.

### 6.7 `<InfiniteMenu>` — expressive entry point
- Simple gesture-driven pan + Reanimated inertia/snapping. Renders section tiles arranged around/through the sphere; each tile carries its section hue from the table (§3.3).
- Rendered in **Skia** (2D projection). **Escalates to expo-gl/three only if** true 3D is required — isolated to this component, behind the graphics spike.
- It is an *additional* way to reach destinations; the tab bar remains the reliable path.

### 6.8 Feed components

| Component | Contract |
| :--- | :--- |
| `<PostCard>` | `<Glass>` + `<BorderGlow>` (feed=fuchsia). Header: `<Avatar>` + author + timestamp (`type.caption`, `text.tertiary`). Body: caption (`<Prose>` Inter, `type.base`) + optional image + optional `<ProjectLinkCard>`. Footer: like / comment / (author menu). Category chip top-right. |
| `<PostDetail>` | The post + a `<CommentList>` + inline `<CommentComposer>`. |
| `<Composer>` | `<Sheet>` on `<Glass strong>`: caption `<TextArea>`, add-photo (camera/pick via expo-camera/-image-picker → upload to `media`), attach-project picker, category selector, Post button. This *is* the Capture flow. |
| `<LikeButton>` | Optimistic toggle → `post_likes`; filled `section` when liked; count in `type.caption`. |
| `<FollowButton>` | On user profiles; toggles `follows`; `bg-section` (Follow) ↔ outline (Following). |
| `<CategoryChip>` | Pill, tinted per-category hue (§3.3) via `withAlpha(hue, 0.15)` bg + solid text. |
| `<Avatar>` | Port of web `<UserAvatar>` (Design.md §8.4): image → email-initials → glyph. Caller sizes/colors the wrapper. |
| `<ProjectLinkCard>` | Compact card referencing a `projects` row: name + canvas thumbnail + "open" → project detail (which itself deep-links to web for view/edit). |
| `<PostMenu>` | Overflow (`⋯`) on posts/comments: **Report** (→ `reports`) and **Block user** (→ `blocks`) for others' content; **Delete** for own. Destructive items use `status.error`. This is the store-required moderation surface. |

- **Feed toggle:** an `Everyone / Following` segmented control at the top drives the two queries ([Mobile App Plan](Wikis/no-origins/visual-labs-mobile/app_plan.md) §5.5). Category filter is a secondary chip row.

### 6.9 Empty / offline / loading states
- Loading: glass skeleton rows (shimmer via Reanimated), not spinners, for lists.
- Offline: a hairline banner "Offline — showing saved content"; writes disabled with an inline hint rather than errors.
- Empty feed: a centered core-motif glyph + prompt to follow or post.

---

## 7. Navigation ↔ section map

| Route | Section (accent) | Notes |
| :--- | :--- | :--- |
| `(tabs)/index` (Home) | `core` (emerald) | Sphere + particles + InfiniteMenu. |
| `(tabs)/feed/*` | `feed` (fuchsia) | Category chips override per-item (§3.3). |
| `(tabs)/projects/*` | `projects` (emerald) | Read-only. |
| `(tabs)/profile/*` | `profile` (indigo) | Self + other users. |
| `compose` | inherits `feed` | Presented as a sheet over the feed. |
| `(auth)/*` | `core` (emerald) | Sign-in / MFA. |

Each screen wraps in `<SectionProvider>` once (§2). Adding a section later = one `ACCENTS` entry + one hue-table row.

---

## 8. Theming axes on mobile

Design.md §13 has three axes. On mobile:

| Axis | Status | Why |
| :--- | :--- | :--- |
| **Section accent** | ✅ kept | Ported via `<SectionProvider>` + `section` color (§2–3). |
| **Sphere material** | ✅ kept | The orb is back, so its material identity is in scope (§6.5). SkSL uniforms, separate from section accent. |
| **Workspace preset** | ❌ dropped | It themed the web HUD/nav chrome, which mobile doesn't have. |

Keeping section accent and sphere material **separate** is as important here as on web — do not collapse the orb's material color into the route accent.

---

## 9. Platform notes

- **Blur (Android):** `expo-blur` is materially weaker/cheaper on Android. Raise `glass.bg` overlay alpha on Android (`Platform.select`) so panels stay legible; treat blur as enhancement, not the only separation.
- **Skia + New Architecture:** all target libs (Skia, Reanimated, gesture-handler, MMKV, camera) are New-Arch compatible on **SDK 57**. The sphere/particles need a **dev build** (`expo run:ios`), not Expo Go. **Skia renders fine on the iOS Simulator for development** (final performance still wants a real device). The **expo-gl/three.js** path — only if the InfiniteMenu escalates to true 3D — does **not** work on simulators; keep it on real devices.
- **Skia on web (validation loop):** the same Skia code runs in-browser via CanvasKit/WASM — useful for verifying shaders/Atlas/gestures without a simulator. Two gotchas proven in the spike: (a) load the Skia-using screen lazily behind `WithSkiaWeb` (it calls `RuntimeEffect.Make` at import time, before CanvasKit is ready); (b) **`Skia.Surface.MakeOffscreen` snapshots are blank on web** — build Atlas sprite textures from an **encoded PNG** (`Skia.Data.fromBase64` + `Image.MakeImageFromEncoded`), which is cross-platform, rather than drawing into an offscreen surface.
- **SkSL port notes:** GLSL→SkSL for the sphere is direct — `vec2/3/4`→`float2/3/4`, `mat2`→a manual `rot2(float2,float)` helper (avoids column/row ambiguity), all literals explicitly float, entry is `half4 main(float2 fragCoord)`, and the raymarch `for` loop with `break` is allowed (bounded trip count). Uniforms: pass `u_resolution`/`u_time` via a Reanimated `useDerivedValue` object.
- **Safe areas & gestures:** the InfiniteMenu pan must not fight the system back-gesture edge; inset its active region.
- **Reduced motion:** honor `AccessibilityInfo.isReduceMotionEnabled` — drop the particle drift and sphere idle animation to near-static; keep interactions.

---

## 10. Rules & best practices

1. **No raw color in components.** No hex, no `rgba()`, no `emerald-`/`sky-` classes. Use `section` classes / `useSection()` / `status.*`.
2. **Set the section once** per screen via `<SectionProvider>` — never per element.
3. **Alpha via `bg-section/α` or `withAlpha`** from the hue — never a new hand-written `rgba`.
4. **Glass only via `<Glass>`.** No ad-hoc `BlurView` + border copies.
5. **Type via the §4 scale.** No inline font sizes.
6. **Do not nest `<BorderGlow>`.** Rows use `<ListRow>`.
7. **Continuous motion runs off-JS.** Sphere/particles/menu inertia in Skia + Reanimated worklets; never per-frame React state.
8. **Particle field stays neutral white.** It is ambient substrate, not accent chrome.
9. **Sphere material ≠ section accent.** Independent axes (§8).
10. **The doc leads.** New pattern → add here first, then build.
