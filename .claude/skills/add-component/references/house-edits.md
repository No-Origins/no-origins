# The house edits

What the CLI writes, what this system has instead, and when the rule does not apply. The numbers match
`scripts/house-check.sh`'s tags. Each rule cites where it was decided, so read that when a case is not covered here.

A good way to see all of them at once is to diff an installed component against upstream — its `-` lines are this
house's edits:

```bash
cd packages/ui && npx shadcn@latest add popover --diff
```

---

## 1. Radius — `[radius]` (Grid.md D39)

**One radius, half the grid's cell**: `--radius`, written as `rounded-lg`. The browser shrinks a corner to fit, so a
box a cell tall or less becomes a pill and a 1×1 a circle, and a bigger box gets a cell's curve at each corner.
radix-sera ships `rounded-none`.

| sera | here |
|---|---|
| `rounded-none` on a box (anything with a border, ring, fill or shadow of its own) | `rounded-lg` |
| `rounded`, `rounded-sm`, `rounded-md`, `rounded-xl`, `rounded-2xl` | `rounded-lg` — never a second radius |

Stays as it is:

- **Lines stay straight**: separators, table rows, dividers, a turned-square arrow tip (`tooltip.tsx`'s arrow keeps
  `rounded-none`).
- **An element with no edge of its own**: a header inside a card, a bubble's content made transparent — rounding it
  only cuts what it holds at the corners (`card.tsx`, `bubble.tsx`). Same reason a `transparent` slot is not rounded.
- **Joined items in a group with no gap**: `rounded-s-none` / `rounded-e-none` / `rounded-t-none` / `rounded-b-none`
  on the inner corners (`button-group.tsx`, `toggle-group.tsx` at `spacing=0`).
- **Things that are circles by nature**: a radio's dot, an avatar, a status dot — `rounded-full` is fine; on a box
  that is merely small, `rounded-lg` already makes the circle.
- `rounded-[inherit]` (a viewport taking its box's corners, `scroll-area.tsx`).
- Two exceptions that are Bhargav's and live in apps, not the package: a fill inside a box meeting a divider takes 4px
  there, and a picture inset in a box takes the box's radius less its inset. Do not generalise them into components.

The radius edit is in nearly every file and **needs no comment** (packages/ui rule 6).

## 2. Fields are outlined pills — `[field]` (Grid.md D39)

Every field is a box rounded to a pill with a 1px border, never sera's underline. Input, Textarea, InputGroup, the Select triggers, NativeSelect, the Combobox's chips,
Command's search and the Questionnaire's answer are all pills, and InputOTP's slots are circles.

Upstream `input.tsx` (the underline):

```
h-10 w-full min-w-0 border border-transparent border-b-input bg-transparent px-0 py-1 text-base
transition-[color,border-color] outline-none … focus-visible:border-b-ring … aria-invalid:border-b-destructive
md:text-sm dark:aria-invalid:border-b-destructive/50
```

Ours (the pill):

```
h-10 w-full min-w-0 rounded-lg border border-border bg-transparent px-4 py-1 text-base
transition-[color,border-color,box-shadow] outline-none … focus-visible:border-ring focus-visible:ring-2
focus-visible:ring-ring/30 … aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20
md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40
```

So: `rounded-lg`, a full `border border-border`, the text a step inside the ends (`px-4`), focus and invalid **ring**
the outline instead of recolouring the bottom edge. A field is typed into, not pressed, so it has **no hover tint**;
a trigger that is pressed (a select) takes the muted tint on hover and open, as an outline `Button` does. Copy the
classes from the nearest installed field rather than retyping them — `input.tsx` for a text field, `select.tsx`'s
`SelectTrigger` for a pressed one — and write the divergence comment (rule 8). `input.tsx` also drops a number
field's spin buttons; do the same for any `type="number"`.

## 3. Motion by token — `[motion]` (Motion.md M3, M4; packages/ui rule 8)

Every number a component moves by is a `--motion-*` token in `globals.css`, in a **family named for what the motion
is for**. A new component joins a family; it never gets its own numbers.

| Family | For | CSS |
|---|---|---|
| **surface** | arrives over the page and leaves: dialog, alert dialog, popover, menus, menubar, tooltip, hover card, select, combobox | `motion-surface` · `zoom-in-(--motion-surface-scale)` / `zoom-out-(--motion-surface-scale)` · `slide-in-from-top-(length:--motion-surface-shift)` (and bottom, left, right) |
| **panel** | slides in from an edge: sheet, the drawer's scrim | `motion-panel` · `slide-in-from-right-(length:--motion-panel-shift)` / `slide-out-to-right-(length:--motion-panel-shift)` (and the other sides) |
| **state** | a control changes in place: hover, press, checked, selected | any `transition-*` **with no duration class** — Tailwind's default duration and easing are remapped to `--motion-state` in `@theme inline` |
| **disclose** | content opens in place: accordion, collapsible | `animate-accordion-down/up`, `animate-collapsible-down/up` — already remapped to `--motion-disclose` |
| **grow** | a value grows into place: `Progress` | script: `motionMs(el, "--motion-grow")`, `motionEase(el, "--motion-grow-ease")` from `@no-origins/ui/lib/motion`, read off the element **when the motion starts**, never at import |

The swap, from upstream `popover.tsx`:

```diff
- … outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 … data-open:zoom-in-95 … data-closed:zoom-out-95
+ … outline-hidden motion-surface data-[side=bottom]:slide-in-from-top-(length:--motion-surface-shift) … data-open:zoom-in-(--motion-surface-scale) … data-closed:zoom-out-(--motion-surface-scale)
```

- `duration-150` on a plain `transition-colors` → delete it; the state default is the token.
- `ease-linear`, `ease-in-out` literals → drop them where the family has an ease; leave `ease-linear` on something
  that runs continuously (a spinner, a caret blink) — that is not a family's motion.
- A motion that fits **no** family is a design decision, not a token you invent. Leave shadcn's value with a
  `// TODO(Motion.md M4): no family yet — <what it is>` comment and name it in the report as open.
- The families' **values** are nobody's pick yet except where Motion.md says so (`move`, `load`, `focus`, `mode` and
  `grip` are Bhargav's). Never edit a token's value in `globals.css` as part of adding a component.
- If the component moves, add it to its family's row in Motion.md M4's table.
- GSAP in a component (packages/ui rule 7): pin `x: 0` when tweening `xPercent` over an inline transform, drop any CSS
  `transition` on a property GSAP writes, check reduced motion in the component and `gsap.set` to the end state.

## 4. Portals — `[portal]` (Motion.md M8)

Every portalling component portals into the nearest `PortalContainer` — the motion studio's stage — else the body.
So a dialog opens over the stage and not the viewport.

```tsx
import { usePortalContainer } from "@no-origins/ui/components/portal"

    // Motion.md M8: into the nearest PortalContainer (the motion studio's stage), else the body.
    <PopoverPrimitive.Portal container={usePortalContainer()}>
```

Where a component exposes its own `XPortal` wrapper, put it there and let a caller's prop win:

```tsx
  // Motion.md M8: into the nearest PortalContainer (the motion studio's stage), else the body; a `container` prop wins.
  return <DialogPrimitive.Portal data-slot="dialog-portal" container={usePortalContainer()} {...props} />
```

Installed components that do this today: alert-dialog, combobox, context-menu, dialog, drawer, dropdown-menu,
hover-card, menubar, popover, select, sheet, tooltip. A `createPortal(` in a component needs the same container.

## 5. No glass, no gradients — `[glass]`, `[gradient]`

The system has no glass and no gradients: no `backdrop-blur-*`, no frosted or translucent surface, no refraction or
rim light; no `bg-gradient-*`, `bg-linear-*`, no `from-* via-* to-*`, no sweep, streak or film. Flat washes only.

- `supports-backdrop-filter:backdrop-blur-sm` on an overlay → remove it; no installed overlay keeps one.
- Bhargav's exceptions are the motion studio's Hyper focus and Focus mode pages (the cloth's blur, focus mode's 60%
  veil; Motion.md M13, M14), not components. Do not add a blur to a component because those exist.

## 6. Colour — `[colour]`

- **`--primary` is lime and `--secondary` violet**, each with its own ink. `text-primary` is lime text, about 1.3 : 1
  on white — never text on the light theme. Use `text-foreground`, or put lime text only on a dark surface.
- **The hover and active grey is `--muted`**, lime at 14% mixed over the page, and a menu's highlighted item
  `--accent`, lime at 4% over the popover — **mixed, never translucent**. So `hover:bg-muted`, not
  `dark:hover:bg-muted/50` or `bg-input/30`: a translucent tint over a coloured surface left a button all but
  see-through (the long comment in `button.tsx`).
- A colour the component needs goes in `globals.css` (packages/ui rule 2), never in the component or an app.

## 7. Blending — `[blend]` (`avatar.tsx`)

A `mix-blend-*` inside a component makes Chrome isolate the nearest stacking context to blend it. Where that box also
holds a cloth of `backdrop-filter` layers (focus, focus mode, Motion.md M13, M14), it becomes their backdrop root and
the grid under the cloth stays sharp. Put `isolate` on the component's root, and comment why (`avatar.tsx`).

## 8. Comment every divergence — `[comment]` (packages/ui rule 6)

A shadcn file here is a copy, and `shadcn add --overwrite` throws away every edit in it. So each edit says what
diverged and why, citing the rule it follows, at the top of the file or above the part it changed:

```tsx
// Diverged from sera: the same outlined pill as `SelectTrigger` — a box rounded to a pill (Grid.md D39), the text
// inside its ends — not sera's underline field. Focus and invalid ring it as the trigger does; a field is typed into,
// not pressed, so no hover tint.
```

The radius needs no comment (it is in nearly every file). The portal gets its one-line `// Motion.md M8:` comment. The
motion token swap needs none when it is the family's standard classes; a judgment call (a family chosen for an
unusual component, a TODO) gets one.

## Also checked by hand

- **Imports**: `cn` from `"cn"`; other package files by their own path, `@no-origins/ui/components/<name>`; never a
  barrel. The CLI writes these from `components.json`'s aliases — check it did.
- **Where a file goes**: pure logic in `src/lib/*.ts`, hooks in `src/hooks/*.ts`; a `.ts` in `src/components/` is
  unreachable from the apps (rule 5).
- **Fonts**: the package ships none and reads `--font-sans`, `--font-heading`, `--font-mono`. A component with a
  `font-[…]` literal or an imported font is wrong.
- **Theme**: a component that toggles the theme calls `useThemeToggle`, never `setTheme`.
- **RTL is on**: the CLI writes logical classes (`ps-*`, `ms-*`, `start-*`); keep them logical when editing.
