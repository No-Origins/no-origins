---
"@no-origins/ui": minor
---

The agents turn the page (Grid.md D50, Motion.md M22, version 9).

- **`introFocus` and `onIntroFocus` on `Grid`**: the agent whose section is the page's boxes. The intro ends with that
  agent in the cell below its section, at its centre (`introBeside`), and the rest at home. A new `introFocus` turns
  the page: the section fades away (`--motion-intro-out`, 160ms) while its agent Dives home, `onIntroFocus` asks the
  page for the next section, and its agent Dives in below it, ripples, and the section fades in. The root carries
  `data-intro-turn` while it does, and globals.css holds back any box not yet shown. Without `introFocus` the intro is
  version 8's.
- **`intro-motion`**: `introPlan` takes `focus` (and `under`, for the held-behind-the-page way); `introBeside`,
  `introNest`, `introGoIn`, `introGoHome`, `introComeHome`, `introRestsAt`, `introHeld`, `introHomeSide`; `IntroPart`
  has `hold` and `ripple`; `introResting` takes `out` and `outAt`; `IntroMotion` has `out`.
- **`introFocusAt` on `Grid`** (`focusAt` on `GridIntro`): where the agent in focus stands, a cell, 1-based, the page's
  to say — read as the intro plans and as each page comes in. Without it, the cell below the section.
- **`introAct` on `Grid`** (`act` on `GridIntro`): `{ agent, action, key }`, an action played where the agent rests
  each time `key` changes — not in the air, under the page or while a page turns (`introActHere`, `introAway`).
- **Home is the bottom row on a field taller than it is wide** (`introHome`): a phone's.
- **`GridIntro`** draws each agent on a clock of its own, so one turns while the rest rest, and measures the page's
  boxes when resting, to stand the one in focus below them.
