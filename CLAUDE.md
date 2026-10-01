# no-origins

pnpm workspace. Apps live in `apps/*` — `portfolio` (hiddenstack.no-origins.com, :3000; bhargav.no-origins.com
redirects to it), `design` (design.no-origins.com, the showcase, :3001), `admin` (admin.no-origins.com, the control
surface, :3002), `engineering` (engineering.no-origins.com, the engineering publish library, :3003), `motion`
(motion.no-origins.com, the motion studio, :3004, since 2026-09-27) and `orbit` (orbit.no-origins.com, :3005, since
2026-09-30: the agents' appearance, Orbit.md), all Next.js 16; the shared design
system is `packages/ui` (`@no-origins/ui`, **2.0.0** since 2026-09-16), consumed from source. Each app has its own
CLAUDE.md / AGENTS.md; read them before editing app code.

**Orbit is what the agents are called together** (his, 2026-10-01, Orbit.md C21): each agent has its own name — Bali,
Kino, Zaza, Oru, Mira, Lola (Agents.md) — and Orbit is all of them, and the app where they are made. That app was the
character studio, `apps/character` on `character.no-origins.com`, until the same day. A *character* is still one
agent's look (the database's rows of kind `character`, `CharacterLook`).

`packages/docs` (`@no-origins/docs`) is the knowledge base — every document that decides something, grouped into
`brand/`, `system/`, `apps/` and `archive/`. It builds and exports nothing. `packages/docs/README.md` is the index
and says which documents are live and which describe the deleted 1.0 system. Documents cite each other by bare
filename (`Brand.md §1`, `Atomic.md D11`), never by path, and so do the ~50 source files that reference them —
keep it that way.

`services/agents` is the agents harness (Brand.md §1, §8): a Mix application on Jido, OTP app `:agents`,
supervised as `Agents.Jido`. It is not a pnpm package. `pnpm-workspace.yaml` matches `apps/*` and `packages/*`
only, and this directory has no `package.json`, so `pnpm build` does not compile it. Run it with
`cd services/agents && mix test`. The Next apps do not import it. A screen for the harness, when one exists,
is a block on the grid that talks to this runtime. Agent lifecycle stays on the BEAM. The swarm does not write
`packages/ui`, the portfolio, or the publish bucket.

`supabase/` is the admin's database — schema, RLS, the allowlist gate and both buckets. `supabase/README.md` says how
to run it and what has been verified. The portfolio and the showcase hold no database key for anything they render:
**the page is static, a component may be live** (Admin.md §0.6, 2026-09-18). A page's structure is baked at Publish
from the public `publish` bucket and served from the edge, never queried at visit; a component that needs live data
declares it, fetches with the anon key through a per-table RLS policy, and has a fallback state. The showcase and
engineering (Layer A) have no database anywhere near them, and that is deliberate.

`packages/auth` (`@no-origins/auth`) is **the one sign-in** (Admin.md §8.4, amended 2026-09-30, his: "the same auth
because it should be same across no origins"): the Supabase clients, the gate (`authGate`, called from each app's
`proxy.ts`), the callback, the sign-out, the login card and the sign-in screen, consumed from source. One session for
every app — the cookie is written for `.no-origins.com` — one allowlist, roles later. **The admin, the motion studio
and Orbit are behind it.** Without its two keys the gate refuses in production; the motion studio and Orbit alone
open on a development server that has none, so the review sweep and CI still see them.

## The design system

**Rebuilt on shadcn/ui, 2026-09-16.** Every component of the hand-written 1.0 system — the atoms, molecules,
organisms, templates, the registry, the blob, the patterns, the CSS layers — was deleted. What replaced it:

- **shadcn/ui**, style `radix-sera`, base `radix`, base colour `neutral`, RTL on, and **one radius, half the grid's
  cell** (`--radius`, `rounded-lg`; Grid.md D39 — it was `0` until 2026-09-26). 61 components in
  `packages/ui/src/components/*.tsx`, plus `theme-provider.tsx`, the agent (`agent.tsx`, 2026-09-30, his approval,
  drawn from `lib/sphere-motion`) and the colour picker (`colour-picker.tsx`, 2026-10-01, his ask: *"color pickers
  should always be like the paint"*), the two no registry has. **Every pick of a colour is a `ColourPicker`**:
  swatches, one a colour, never a select of names or a row of worded toggles.
- **The accents are lime and violet (2026-09-27, his, set in the portfolio's accent jig).** `--primary` is `--lime`
  and `--secondary` is `--violet`, each with its own ink; the grey of hover and of being active (`--muted`) is lime at
  14% mixed over the page, and a menu's highlighted item (`--accent`) lime at 4% over the popover — mixed, never
  translucent. The rest of the palette is still shadcn's neutral. `text-primary` is lime text, about 1.3 : 1 on white,
  so it is not for text on the light theme. The jig (`?jig` on the portfolio in development, `jig.tsx`) stays, to be
  showcased in experiments; its "Neutral" puts shadcn's greys back. **The agent has paints of its own** beside them (2026-09-30,
  Orbit.md C10): pink, red, orange, gold, green, teal and blue since 2026-10-01 (C20, his: peach, yellow and
  grey out, "high contrast"), the `--agent-*` tokens with their inks, which nothing but the agent paints with — the
  system's palette is still lime and violet, and widening it is his call. The new five are mid-tones that stand 3.3 : 1
  from the page and the nest in both themes. A paint that went is read as its replacement (`RENAMED_PAINTS`).
- **One stylesheet**, `packages/ui/src/styles/globals.css` — Tailwind, `tw-animate-css`, `shadcn/tailwind.css`, the
  `:root` / `.dark` tokens and the `@theme inline` map. Every app imports exactly this and nothing else.
- **`cn`** from the `cn` package, re-exported at `@no-origins/ui/lib/utils`.
- **`gsap`** for motion, since 2026-09-21 — his ask. It animates what is **inside** a box (`Progress`'s `animate`
  prop grows the fill; Portfolio.md P11) and plays the motion studio's loading; the grid's page turn keeps its own
  per-frame writer for the pager's arrow (Grid.md D27). See `packages/ui/CLAUDE.md` rule 7.
- **Motion is tokens (Motion.md, 2026-09-27).** Every number a component moves by is a `--motion-*` custom property
  in globals.css, one family a group — surface, panel, state, disclose, grow — and components read them, CSS through
  `motion-surface`/`motion-panel` and token-valued utilities, script through `@no-origins/ui/lib/motion`. The values
  are the old defaults (shadcn's, Tailwind's, tw-animate's); none is his yet. Motion is designed in **the motion
  studio**, `apps/motion`: a transparent stage at the centre of the grid, jigs as slots around it, and the CSS lines
  to commit handed back (M7). **Its bench holds only what he names** (M9). **The agents' are actions** (M24, 2026-10-01, his): its Agents page picks one
of those `@no-origins/ui/lib/agent-actions` declares, each with its own controls and as long as they make it, its draft
and `major.minor` versions in the database (kind `action`); Bounce, Jump and Dive are the three, and the motions of rows went. The first is movement, how one-cell
  elements move when one grows, whose model is `@no-origins/ui/lib/cell-motion`. **Movement is decided** (his
  settings, 2026-09-27, the `--motion-move-*` tokens), the first motion in the system that is his, and **the
  portfolio's tech column plays it** (a hovered or selected mark grows to spell its name), as does the numbered pager bar
  (the page grows to spell its title, Grid.md D47), through `useCellMotion`
  (`@no-origins/ui/hooks/use-cell-motion`), the same hook the studio's stage plays through. **Loading is decided too**
  (his settings, the same night, the `--motion-load-*` tokens, `@no-origins/ui/lib/load-motion`): a square of dashed
  lime rings on the centre, one a section, turning, each going to its section as movement's dot and opening. **No page
  loads with it since 2026-09-30** (Grid.md D49, his: "remove all the current loaders … let the components load
  quickly"): it plays on the studio's Loading page only. **Enter · exit** (M11, 2026-09-27), movement's first primitive (one
  cell's element coming in and going out), is on the bench and not decided. **Hyper focus** (M13, 2026-09-28, named so 2026-09-29; `@no-origins/ui/lib/focus-motion`, `useFocusMotion`), a card in focus and the page
  blurring round it, least at the card and rising in rings out from it, **is decided too** (his settings,
  2026-09-28, the `--motion-focus-*` tokens) — and since his note the same night **a cloth, not a ripple**: drawn out
  from under the card to every corner of its container, the card lifting over it, with focus mode (M14) beside it. **Both are off the portfolio since 2026-09-30**
  (Portfolio.md P21, his: "We can have it the motion studio but I did not like it in the portfolio"): they play on the
  studio's pages 5 and 6 only, and no page in any app blurs. **Both were picked again on
  2026-09-29** (his settings, hyper focus "C Unroll, tuned" and focus mode "A As described, tuned"): focus mode is
  decided too, its `--motion-mode-*` tokens in globals.css, and its cloth wears a 60% veil of the page's colour, his
  exception to the no-glass rule (in the studio). Never write a literal
  `duration-*` or `zoom-in-95` on a component again: name the token. The grid's own motion is not on the layer yet (Motion.md §5).

Import a component by its own path — `@no-origins/ui/components/button` — never from a package root; there is no
barrel and there should not be one. Add components with the CLI, from `packages/ui`, never by hand:

```bash
cd packages/ui && npx shadcn@latest add <name>
```

Fonts stay the host's job: each app declares `--font-sans`, `--font-heading` and `--font-mono`; the package only
reads them. Theme is `next-themes` on the `.dark` class — `d` toggles it in the browser, through the grid's flip (D28) when a
grid is on the page; never call `setTheme` for a toggle, call `useThemeToggle`.

**Build UI only from the design system.** Every visible element in every app is composed from `@no-origins/ui`
components — never a hand-rolled control, a raw styled element standing in for one, or a component copied in from
another library or the web. If the design system lacks a component you need, do not improvise one: add it with the
shadcn CLI (`cd packages/ui && npx shadcn@latest add <name>`) so it lands in the system, or **stop and ask first**
— either Bhargav asks for the exception, or you propose one and he approves it before you write it. An app may
still *compose* system components into an app-specific island (Admin.md §10: "an admin-only component is a fork of
the design system wearing a different folder name"); what it may not do is invent primitives outside the system.
Layout utilities (Tailwind flex/grid/spacing) are not components and are fine.

**The old design docs describe a system that no longer exists.** `packages/docs/system/` (Design-System.md,
Atomic.md, Patterns.md) and `packages/docs/archive/Scene-Schema.md` were written for 1.0 and have not been
rewritten. Do not follow them for component work — read them for the reasoning, not the API. Brand.md and
Character.md are upstream of components and still stand.

## The grid — the base layout

Built on `packages/ui/src/components/grid.tsx` (the field), `grid-pages.tsx` (pages, the turn, the pager),
`grid-pager.tsx` (the bar) and `packages/ui/src/lib/grid-layout.ts` (the model, pure). **The grid renders; nothing
edits it** (Grid-v2.md D30, 2026-09-23): the composer at `design.no-origins.com/composer`, the admin's compose
dashboard, `GridEditor` and `GridFrame` were removed together — his words, "remove the Composer feature completely and
all the dead code". A layout is written in code or arranged at runtime from spans. **Grid.md is the
document** — a pointer, because the grid document is versioned: **Grid-v2.md is current** (2026-09-21) and Grid-v1.md
is the record of the version before, with a table of what v2 did to each of its rules. Rule numbers run in one
sequence across versions, so `Grid.md D7` is v1's D7 wherever it is written. The code is on v2 since 2026-09-21. The
rules in short, each one his:

- **The cell is decided; the counts derive (D12).** A breakpoint is **two numbers, `cell · gap`** (D13, D15), living
  in `DEFAULT_GRID_CONFIG`. A field is as many whole cells as fit the box it is given, across and down,
  `floor((span − gap) / (cell + gap))`, **rounded down to an even number, never below two (D26, 2026-09-21)** — the
  field's centre is always a grid line, so a centred block is symmetric. **And never fewer than six across (D33,
  2026-09-25):** where the decided cell gives fewer — every phone — the count is held at six and the cell derives from
  the width (51px on a 390). Nobody decides cols or rows, and nothing in
  the config or the props names them. **The grid never scrolls and never overflows its box.**
- **The numbers in `DEFAULT_GRID_CONFIG` are decided (D13, 2026-09-21):** `base`/`sm`/`md` 72 · 12, `lg`/`xl`
  60 · 12, and since D29 (2026-09-23) a third per breakpoint — the pager bar's width in cells, 6 everywhere.
  Fingers get 72 because a 1×1 is the touch target; pointers get 60; the gutter is one number so the field has
  one texture. Grid-v2.md §5 has the six principles they were checked against — change a number only against those,
  and record it in D13 (or D29 for the bar).
- **Cells are square, always** (D9, 2026-09-18: "only square. No stretch"). Trivially now: the side is the decided
  number. There is no `fit` prop, no `GridFit` type and no toggle. Do not reintroduce one.
- **Every corner is one cell's circle (D39, 2026-09-26, his: "hundred percent border radius I mean like circular
  design").** `--radius` is half the cell — `Grid` writes its measured `--grid-cell` on its root; off the grid (a
  portal, an app with no grid) globals.css reckons it from the viewport with D13's and D33's numbers — and every box
  takes it as `rounded-lg`. The browser shrinks a corner to fit, so a 1×1 is a circle, a box a cell tall a pill, a
  bigger one a cell's curve at each corner. One radius: never a second one, never `rounded-none` on a box (his two exceptions, D39: a fill inside a box meeting a divider takes 4px there — the portfolio's work tabs; and a picture inset in a box takes the box's radius less its inset — the portfolio's project cards, 2026-09-28). **Lines stay
  straight** — separators, table rows, a turned-square arrow tip — and a `transparent` slot is not rounded (it has no
  edge; it would only cut what it holds). **A field is a box, not a line (D39 amended, 2026-09-29, his: "even inputs
  will have full rounded border")**: Input, Textarea, the Select triggers, InputGroup, Combobox, Command's search are
  outlined pills and InputOTP's slots circles, where they were underlines. **The slider is a bar (D39 amended,
  2026-09-30, his)**: 8px since his second tuning of the grip (16px at his pick, the cursor's ring, 24px, that morning), a pill with its head, a circle
  the bar's height, merged into the lime end; held, the head detaches into the cursor, which stays a ring, and the bar
  parts 2px round it (the grip, Motion.md M16). **The body is fluid** (his, the same night, after a segmented
  version was tried and taken out, M18): it follows the head on a spring, its ends stretching as they move, and the
  bar's height is a control (`--slider-height`). **The grip is decided** (his settings, the same night, "A As
  described, tuned", then "A Today, tuned"): its `--motion-grip-*` tokens and `--slider-height: 8px` are in globals.css
  — the head in the cursor at once, letting go over 240ms — and every `Slider` plays them. **A slider may have marks** (his, the same night, Motion.md M21): `marks`
  puts a dot over each step above the bar; a held head snaps under a mark whose zone its cursor is in, and the snap is
  a tick — the mark pops, the head kicks, a phone vibrates. On the studio's Steps page, version 1, not decided.
  **A cell is a circle (D40)**: the painter draws each
  cell's dashes as a ring and the pointer lights a cell only inside its circle. (The front cut a cell's disc first and
  the rest of its tile `LACE_MS` later — the lace — in the intro and the wash, until D48 took both out.) D9's cell is
  still a square box; the circle is drawn in it.
- **The remainder is centred margin (D14).** What is left after the count is split equally on both sides by the
  flex box; the gutter never widens to absorb it. **The box's padding is the gutter (D15)**: the field sits one gap
  from every edge, so the screen edge is one more grid line. There is no `pad` — not in the config, not as a prop.
- **The grid is always its box.** There is no `fill`: nothing holds a grid as a block in a page — "everything will
  always be on the grid once we are out of the grid editor" — so the grid is the viewport (`h-dvh`). A className may
  give it another height when there is chrome above; never a width.
- **The spacing scale is `GRID_SPACING`, `0 · 4 · 8 · 12 · 16`**, the grid's and not a general spacing system. The
  gap is a step of it and a slot's `inset` is typed from it (`SlotInset`); the cell is not on it.
- **A box on the grid is a `Slot`** (`slot.tsx`, **Slots.md**). It holds one component from the **registry**
  (`registry.tsx`, drawn by `Placed` — since the composer went it holds one entry, the pager's arrows) or sub-slots on
  its own cells, and has tokens: `fill` in
  four kinds (`transparent` · `background`, a mask over the grid lines · `muted` · `card`, Grid-v2.md D21), `inset`
  from the spacing scale, `alignX`/`alignY`. **No margin** — the gutter is the margin. Every slot fills its span and
  **clips**: nothing on the grid scrolls, so a component that is cut off is in a slot that is too small. A layout item
  carries `slot`, `component` and `children` (a `GridLayout` on the slot's cells), and `SlotContent` renders any of
  them with no custom `renderItem`. A Card in a slot gets `transparent`, inset 0, stretch, so its own border shows.
- **Boxes are placed by coordinate**, 1-based like CSS grid lines.
- **Overflow goes to another PAGE, never off the edge (D5).** A layout is pages. **The pager is a navbar on the bottom
  row (D27, 2026-09-21)**: 1×1 cells at the bottom centre of every field, on every page — by default four empty
  `card` slots then ↑ ↓ — a fixture drawn by `GridPages` (`grid-pager.tsx`), never a box on a page.
  Its cells are reserved in the model (`pagerCells`): nothing packs there, and a kept page is centred in the
  room above the row. **The bar is a slot and its cells are sub-slots (D29, 2026-09-23)**: its width is a number per
  breakpoint in the config beside `cell · gap`, even and never below two, and the ↑ ↓ pair is one registry molecule
  placed in the bar rather than hardwired to the last two cells — it takes the turn from context, not from props, and
  belongs in the bar only, because an ordinary slot is faded away by the turn. **The bar is the layout's, one per layout** (`layout.bar`), never a page's — it is drawn on
  every page, so contents that changed between pages would move the arrows under the hand. A bar may leave the arrows
  out and nothing stops it; the default keeps them in the last two cells. **The scroll turns the page, and scrolling UP is forward — the hand's up: fingers moving up
  the trackpad or the screen, a positive `deltaY`, never negated** (↑ is the next page, ↓ the one
  before): a turn is a progress from 0 to 1 that the wheel or a finger drives (a third of the field is one page), and
  **only the arrow follows the hand** — it fills by that share; let go short of half way and it settles back. **The
  boxes do not shrink (D37, 2026-09-25, his: "let's not shrink the cards")**: when the turn commits, the page **fades
  away** over `TURN_MS` (160ms), opacity only, and the next page is put on the field and **fades in** over the same
  (D49, below). Every `GridPages` turns this way. Until D48 the ripple washed the page away, every box cut cell by cell
  as its front crossed it (`washAway`, gone), and from D48 to D49 the loader brought a page with images in. Nothing in a box is ever squeezed, scaled or re-laid-out: D27's
  clip-by-height went for the wash, and scaling (in Y, then uniformly) was sent back on 2026-09-21 — do not
  reintroduce a transform or a shrink here. **A hand that goes on scrolling goes on turning (D35, 2026-09-25)**: only a fling's
  decaying tail is ignored after a turn, never the hand (`readWheel`), a notch glides rather than jumps, and the turn
  renders no card — the phase is `data-turn` on the tracks (`idle · drive · relax · wash · in`), the arrow's fill on
  the bar. The arrows, ← → and ↑ ↓ play the same turn — the ↓ key forward and ↑ back, pressing the arrow that wears
  that glyph (D42, 2026-09-26), a key a focused component took or a modified one left alone; the flip is gone.
  **Where a page opts in with `useReadingFocus` (D45, 2026-09-27 — the portfolio), Tab and the arrows move focus in
  reading order**, left to right and top to bottom as the boxes stand — **like a game controller's, the arrows never
  turn that page** (a `GridPages` that opts in takes `keyboard={false}`; the portfolio has no pages to turn since
  Portfolio.md P15). The field
  and the pager never move. What the bar's
  empty cells hold is now a layout question, not an open one (D29). **A bar may number its pages (D36, 2026-09-25)**:
  `numberedPagerBar` puts back (↑) on the first cell, forward (↓) on the last and a page number on every cell
  between, from the registry's `pager-arrow` and `pager-page`. **Since D46 and D47 (2026-09-27, his) the page on the field
  is grown to two cells showing its number and title** (a page's optional `title` on `GridPage`): on the bar's second
  and third cells for the first page, the middle two for a page with pages on both sides, and the fourth and fifth for
  the last. The pages between the arrows are one block (`pager-pages`) that **plays movement** as the page changes, and
  a number turns straight to its page. The motion studio draws it. The portfolio's bar was this one
  (Portfolio.md P14) until it became one page on a `Grid`, with no bar, on 2026-09-27 (P15); D27's is still the default.
- **The theme falls over the field as a sheet of paint (D28, 2026-09-22).** Toggling light/dark — `d`, or the
  showcase's button, both through `useThemeToggle` — is one beat on the outermost grid: one sheet in the NEW theme's
  colours, plain — no cells drawn on it — with a sharp, moving wave of two to five uneven crests for its bottom and
  top edge, falls
  from above until the box is covered, the theme commits underneath, and the sheet dissolves. `GridThemeFlip` in `grid.tsx`, GSAP, one transform; the light tokens sit on `.light` as well as `:root` so
  the sheet wears the theme before the page does. No grid on the page: the switch is instant.
- **No page loads behind a loader (D49, 2026-09-30, his: "I want to remove all the current uh, loaders that we have. I
  did not like it … just remove it and uh, let the components load quickly").** A page is on the field as soon as the
  grid has measured it; a turn fades it away and the next one in, 160ms each. There is no intro: no `intro` prop on
  `Grid` or `GridPages`, no `page` prop on `Grid`, no `data-loading` or `data-intro`, and nothing waits for page 1 before
  a turn. D48's loader (2026-09-27) — dashed lime rings on the field's centre, one a box (`data-load-section`,
  `data-load-box`), opening into the page after 2 s at the least — is gone from every page with `useGridLoad` and
  `GridLoader`. Loading itself, his motion (Motion.md M10), stays whole in `lib/load-motion` and `useLoadMotion`, its
  tokens in globals.css, and plays on the motion studio's Loading page only. Do not put a loader back on a page until
  he names one. **He named one the same day: the intro is the agent (D50)**, and **since 2026-10-01 it is the six
  playing his actions (version 3, Motion.md M22, his: "randomly some agents will dive and some agents will jump to
  their positions")**, and **since version 4 the same day each lands on the centre of its sections and they come in
  with its ripple** (his: "instead of uh, expanding these sections from top left they should render along with the uh,
  ripple"), and **since version 5 they stand in a row and only some bounce** (his: "place them in uh, row in a line …
  let's only make uh, Bali Kino and uh, Mira to bounce"), and **since version 6 every nest is a cell and the rest is
  seen**, and **since version 7 the ripple is small again and the page comes after it** (his: "once the ripple ends we
  can drop the agents and then render the components"), and **since version 8 they go home and stay** (his: "we'll
  bring them to the right the last most column vertically centered"). `intro`, `introAgents` and `introActions` on `Grid` are the
  portfolio's: its cast the six agents copied from their current versions (`apps/portfolio/src/content/agents.ts`),
  each with whether it `bounces` (`content/intro.ts`), and its moves Bounce, Jump and Dive copied from theirs
  (`content/actions.ts`). The six stand side by side in one row, a cell each, centred on the field's middle row (or the
  nearest an agent does not land in), in a random order, and Bali, Kino and Mira Bounce, each at its own random times,
  for 2s, the other three resting — breathing and blinking, each as if it had sat a while (version 6). Then each Jumps
  or Dives, at random, to the centre of the boxes it opens, which every box names with `data-intro-by` — the cell at
  the middle of the rectangle round them, always a cell of the field (version 6, his: "They should actually drop into
  the cells on the grid"). As each lands, version 3's small ripple lights the two rings of cells round its nest in
  violet: one pass of the field's painter an agent. Once it has spread, the agent Dives (his action) out of its nest
  to a cell of its own in the field's last column, the six one above the other and centred down it, Bali at the top
  (`introHome`, version 8); the boxes it opens fade in once it is gone, each by one Web Animations opacity fade (no
  `clip-path`: version 4's cell-by-cell cut stuttered). The agents stay in those cells, breathing and blinking, after
  the hand-over and on any field the grid is given later (`GridIntro` stays mounted, `settled`). `grid-intro.tsx`, which
  the grid loads only then, draws it. The `--motion-intro-*` values are INTRO_START's in `lib/intro-motion`, not yet in
  globals.css. Version 1 (one agent hopping in the avatar's ring, the whole field lit ring by ring), version 2 (the six
  gathered in his loader's square, leaping all at once), version 3's top-left opening and its random spots in the
  centre four by four are gone. Once per document load, never under reduced motion, where the agents are drawn in
  their cells once, still. The ripple went before it (D48): the grid drawing itself in, the ripple between pages (D32), its wash
  (D37) and the `ripple` prop. **The field is painted
  (D38, 2026-09-25)**: the overlay's dashes and the pointer's cell are canvases drawn by one painter
  (`lib/grid-field.ts`), in a worker where the browser can hand it a canvas, so the page's own loading on the main
  thread cannot stall it. They were ~1,300 elements. `gridFieldPainter` must stay self-contained — the worker runs it
  from its own source text. It lights the intro's ripples (passes, the youngest lighting showing where two cross) and
  still carries the intro's reveal, which nothing sends any more.
  **The turn's custom properties are written on the pager's bar, not the grid's root or tracks**: they inherit, and on
  the root they restyled every element in the grid every frame of a turn; on the tracks, every box (until D37).
- **The pointer is a violet ring, and the cell under it is lit (D34, 2026-09-25).** `cursor` on `Grid` or `GridPages`;
  the portfolio has it. A 24px ring with a violet line, filled violet while pressed (**D43, 2026-09-26**, his: "change the
  cursor color to violet"; it was lime), but a ring still while a slider's head is held, the head fitting into it
  (2026-09-30, his, Motion.md M16) — **the system's cursor drawn from an image**
  (globals.css), never a div moved on every pointer move: that cost a whole-page layerize a move and trailed the hand. The cell the pointer is on turns its **dashes** violet too (the default dashes, not a solid line — his, the same day; lime until D43)
  — its ring's since D40 — and fades back over 500ms when left;
  the gutter lights nothing, nor a square's corners outside its circle. Found from the field's numbers and sent to the field's painter (D38), never React state.
  Mouse and pen only; a phone keeps its own. **No glow round the pointer**: D41 had the cells round a moving pointer
  glow, and he withdrew it the same day (2026-09-26, "I did not like the glow effect") — do not bring it back. The
  intro's lines were the one blur kept, until they went with the drawing (D48): the system keeps none.
- **Nothing forces a breakpoint (D11).** `resolveField` takes a width and a height and nothing else; no grid
  component takes a `breakpoint` prop. To see another size, give the grid a box of that size — a browser window, a
  device in the review sweep. `GRID_REFERENCE_BOX` (`grid.tsx`) is each breakpoint's reference size, which a page
  assumes for its first frame before the grid has measured. A phone on its side is just a wide short box with more
  columns than rows; v1's transposition rule is gone.
- **`metrics.bp` is the breakpoint that supplied the cell**, walking down the config, not the field: two boxes in
  `lg` can have different fields. It keys the cell (D13) and, for now, the authored pages.
- **Derivation is mobile-first (Grid-v2.md D22).** A breakpoint with no layout of its own derives from the nearest
  authored breakpoint NARROWER than it, else the nearest wider — every other field packs each authored page in reading
  order; an authored page break is a hard break; overflow adds pages. Inside a slot nothing is reserved for a pager.
  **A page that FITS the target field is kept, coordinates verbatim, and centred (D25)**; only a page whose used block
  does not fit is packed. Because counts follow the box, **authored pages carry the shape they were written on**
  (`layout.shapes`, `LEGACY_SHAPES` for anything saved before v2) and are packed whenever the field's shape differs —
  including the same breakpoint at another width. Which field is authored on, and the packer itself, are the open
  questions; do not decide them in code. The one authored layout left is the admin home's, written in code.

**Organisms and templates do not exist yet.** They get designed on top of this layer, not ported from 1.0. **The
showcase itself is on the grid** since 2026-09-21 and **arranged the portfolio's way** since 2026-09-22
(`apps/design/CLAUDE.md`, Portfolio.md P2, P7, P8): every reading page is a `GridPages` of sections whose specimens
carry a span per breakpoint, packed into a centred band above the pager's row, the block centred in the room; no page
in the workspace scrolls. **A page is content data**: sections of items, each with a span per breakpoint and a render
function, arranged on the field it is shown on. To change a page, change its data. There is no design mode, no
composer and nothing is edited in place.
**Text is a `Text`** (`text.tsx`, Type.md): seven roles, tone, alignment — an app does not reach for `text-2xl`.

## What builds

**All six apps build** — `pnpm -r build` is green, and CI's **Build** job builds all six on every PR. The admin
builds with no Supabase keys, since its clients are made per request; it stays out of the **review sweep** because
every route is behind auth and needs a running Supabase, which `pnpm review` does not boot. The motion studio is
behind the same sign-in since 2026-09-30 and stays in the sweep: its dev server opens when it has no keys (CI, a fresh
clone). Orbit (2026-09-30) is behind it the same way and is in the sweep too. **On his machine both have
the local stack's keys** (their `.env.local`, his ask, 2026-09-30), so they ask for a sign-in as the admin does, and
`e2e/global-setup.ts` signs the test browser in first — by magic link through the local mail catcher, as the address in
`.private/e2e-email` (gitignored) — leaving the session in `e2e/.auth/state.json` for every spec and the sweep. **Quests are gone**
(Admin.md §0.7, 2026-09-23): the admin is sign-in, a home of three cards and `/settings`. **The portfolio was rebuilt on
the grid on 2026-09-21** (Portfolio.md, `apps/portfolio/CLAUDE.md`): one route, the first screen — and since 2026-09-27
one page, a `Grid` with no pager, the rest of the site in the room the first screen leaves (P15). Its 1.0 pages, parked
in `.legacy/`, were deleted on 2026-09-23 — git history keeps them.

## Deploying

Six Vercel projects under the `no-origins` team, one per app, each with its **Root Directory** set to `apps/<app>`:
`no-origins` → portfolio, `design`, `admin`, `engineering`, and since 2026-09-30 `motion` and `character` (Orbit's,
named before it was; since 2026-10-01 its root directory is `apps/orbit` and its domain `orbit.no-origins.com`, with
`character.no-origins.com` still attached and 308ing to it from `apps/orbit/next.config.ts`), made with
the CLI the night PR #14 merged (`vercel link` from the app's folder creates the project; `vercel project update
--root-directory`, because link leaves it at `.`; `vercel git connect`; `vercel domains add`; `vercel env add
--type config` for the two `NEXT_PUBLIC_SUPABASE_*` variables, copied from the admin's — without them production
answers 503). Production is `main`. The hosted Supabase carries the motion studio's and the character studio's domains among its redirect
URLs, pushed from `config.toml` (supabase/README.md); **`orbit.no-origins.com` is listed in `config.toml` and not yet
pushed** — his `npx supabase config push`. **Still to do in the dashboard: *Skip deployments for unaffected projects*
on the two new projects** — the CLI has no flag for it, and until then every push rebuilds the motion studio and Orbit.

**`apps/<app>/vercel.json` is the source of truth, not the dashboard.** A `vercel.json` in a project's root directory
**overrides** the dashboard's fields, so the commands live in the repo, travel through review, and cannot quietly
drift apart the way they did through 2026-09-22 (three projects, three different install commands). The dashboards
carry the same commands since 2026-09-23; if they drift again, the file still wins. All six files are byte-identical on purpose:

```json
{
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install --frozen-lockfile"
}
```

`pnpm run build` rather than `pnpm --filter <app> build` so no app name is embedded and renaming a package breaks
nothing. `--frozen-lockfile` so a stale lockfile fails the build loudly instead of resolving something else — the
failure that produced the engineering lockfile PRs.

**Which apps a push builds is Vercel's call, not a command's.** All four projects have *Skip deployments for
unaffected projects* on (`enableAffectedProjectsDeployments` in the project API): Vercel reads the pnpm workspace
graph and compares against the last deployed commit, so a change to `packages/ui` rebuilds all four and an
engineering-only change rebuilds engineering — PR #5 and PR #7 deployed engineering and nothing else. **There is no
`ignoreCommand`, and there should not be one.** One was written on 2026-09-23 (`git diff --quiet HEAD^ HEAD -- .
../../packages/ui ../../pnpm-lock.yaml`) and taken out the same day: it compared only a push's last commit, so a push
whose `packages/ui` commit was not the tip skipped every app it touched, and it rebuilt all four on any lockfile
change where the graph rebuilds only the apps whose dependencies moved.

**Two things the skip does not cover.** It only applies to Git-triggered deploys — a manual `vercel --prod` always
builds, whatever changed. And connecting a project does not backfill: the hooks fire on the next push, so a newly
connected project stays on its last manual deployment until something lands on `main`.

**CI is `.github/workflows/ci.yml`**, on every pull request and every push to `main`, and **branch protection on
`main` requires all four of its jobs**, admins included — nothing reaches production without them:

| Job | What it runs |
|---|---|
| **Typecheck and lint** | frozen install, `pnpm -r typecheck` (`packages/ui` on its own too), `pnpm -r lint` — `next build` stopped linting in Next 16 |
| **Build** | `pnpm -r build`, all five apps, with no env — the one build check a merge can require |
| **Visual review** | `pnpm review` (below); the screenshots and report are uploaded as the run's `review-screenshots` artifact |
| **Agents tests** | `mix test` in `services/agents`, which no Vercel project builds |

Warnings pass; errors fail. Vercel's own checks are not required and cannot be: it skips an app a change does not
touch, and a skipped app reports no status, so a required Vercel check would hold every such PR open. **Node is 24
everywhere**: `.nvmrc` for fnm and CI, `engines.node` (`24.x`) in the root and every app's `package.json` for Vercel,
which reads it from the project's root directory and prefers it to the dashboard.

A manual deploy, when one is wanted, runs from the repo root. The root `.vercel/project.json` is linked to
`no-origins`; every other project is selected with env vars, and that file is never rewritten. **The IDs are not in
the repo**, which is public: they are in `.private/vercel.env`, gitignored, with a README saying what else belongs
there. A fresh clone has no `.private/` — copy it across.

```bash
. .private/vercel.env                                           # the team ID and VERCEL_PROJECT_ID_<APP> for each
vercel --prod                                                   # portfolio
VERCEL_ORG_ID=$VERCEL_ORG_ID VERCEL_PROJECT_ID=$VERCEL_PROJECT_ID_DESIGN vercel --prod # design; _ADMIN, _ENGINEERING
```

`.vercelignore` at the repo root keeps `e2e/`, `supabase/`, `services/`, `.claude/` and `.private/` out of the upload; its repo-root entries are
anchored with a leading slash on purpose, because an unanchored `supabase` would also drop any app folder of that name
(the admin's `src/lib/supabase/` was one until the sign-in moved into `packages/auth`, 2026-09-30).

## Visual review loop (Playwright)

After any UI change, look at the result before reporting done.

1. `pnpm review` boots the portfolio on :3000, the showcase on :3001, engineering on :3003, the motion studio on
   :3004 and Orbit on :3005 (or reuses running ones), visits every route in `ROUTES`, `DESIGN_ROUTES`,
   `ENGINEERING_ROUTES`, `MOTION_ROUTES` and `ORBIT_ROUTES` in `e2e/review.spec.ts` on desktop
   (1440x900) and mobile (Pixel 7) in both themes, waits for a grid's intro (D50) to hand over, fails on a route that
   answers 400+ or throws, echoes
   `console.error` output, and writes full-page screenshots to `e2e/screenshots/<project>/<route>.png`. CI runs the
   same sweep and uploads the screenshots.
2. Open the relevant PNGs with the Read tool and inspect them. Narrow with `pnpm review --project=desktop` or
   `pnpm review -g "/atoms"`.
3. For interactive checks (hover, click, scroll, accessibility tree) use the `playwright` MCP server declared in
   `.mcp.json`. It drives headless Chromium; start `pnpm --filter design dev` first and point it at
   http://localhost:3001. Its screenshots land in `e2e/.mcp/`.

`probe12` and `growForTool` went with the `Bento` and the `Tool` they policed.

Add new routes to the app's list in `e2e/review.spec.ts` when you add pages. Screenshots, traces, and reports are
gitignored.

**The admin is not in the sweep.** Every one of its routes is behind auth and needs a running Supabase, which
`pnpm review` does not boot. Review it by signing in and looking — see `apps/admin/CLAUDE.md`.
