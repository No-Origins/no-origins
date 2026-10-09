# No Origins — Type

The typography of the design system: the roles every piece of text wears, and the few knobs beside them.

Current as of 2026-10-08. Earlier versions and what they decided are in git history.

Companion documents: **Brand.md** (voice), **Slots.md** (a `Text` is a component in a slot), **Grid.md** (the cell
sizes these are read against).

---

## 1. The roles

Every piece of text in an app is one of eight roles. Fonts are the three slots the host declares (`--font-heading`,
`--font-sans`, `--font-mono`); the package only reads them.

| Role | Font | Size · weight · tracking | Element | For |
|---|---|---|---|---|
| `hero` | heading | 5xl · bold · tight | `h1` | the one name a screen is called by, over its title (T5) |
| `display` | heading | 4xl · bold · tight | `h1` | a page's one big title |
| `title` | heading | 3xl · bold · tight | `h2` | a section title |
| `heading` | heading | xl · semibold | `h3` | a card or group title |
| `label` | heading | xs · bold · uppercase, widest | `p` | the small caps that name a thing |
| `body` | sans | sm · normal | `p` | paragraphs |
| `caption` | sans | xs · normal · muted by default | `p` | notes, secondary lines |
| `mono` | mono | xs | `p` | counts, ids, code |

Beside the role, `Text` takes:

- **`tone`** — `foreground`, `muted`, `faint` (T3) or `lime` (T4). Each role has its default (`muted` for `caption`,
  `foreground` for the rest).
- **`align`** — `start`, `center`, `end`.
- **`weight`** — `default`, or `heavy` (`font-black`, 900) for a screen's closing or opening `hero`: Home's thank-you
  at its end is the one use. A role's own weight is otherwise its weight.
- **`as`** — the element, where the role's default is the wrong one (a `span` in a line, a `button`). It changes the
  tag, not the look.

Anything else a piece of text wants — a colour, a size between two roles, italics — is not a token: it is a new role
or tone, decided here, or it is not done.

## 2. The rules

**T1 — Text is a `Text`.** `packages/ui/src/components/text.tsx`: `<Text role="body" tone="muted" align="center">`.
The eight roles are the whole scale; an app does not reach for `text-2xl` on its own. The showcase's specimens are the
one exception for now: they move over as their content files are rewritten.

**T2 — In a slot, text is a `Text` written in code.** Where it sits in its slot is the slot's `alignX`/`alignY`
(Slots.md S3).

**T3 — A third tone, `faint`, for text meant to be found rather than read.** `--faint-foreground`
(`text-faint-foreground`): a step past `muted` in each theme — `oklch(0.8 0 0)` on light and `0.42` on dark, where the
muted foreground is `0.556` and `0.708`. **It is a flat grey, not the foreground at an alpha**: nothing translucent goes
over the grid, and a glyph at an alpha lets the grid's lines show through it. It is a tone, so it goes with any role;
bold words in a quiet colour are what make it subtle rather than small.

**T4 — A fourth tone, `lime`, the system's colour on text.** `text-lime`, the `--lime` token, one value in both themes:
15 : 1 on the dark background and **1.3 : 1 on the light**. It is for a word that is also a thing to press, and for the
places he has put it: the portfolio's "— @hiddenstack" (a `caption` that is a button) and its role line (a `label`,
Portfolio.md P4), and the motion studio's ring numbers on its focus and mode stages (a `mono`). Open: the light-theme
contrast, his to decide.

**T5 — An eighth role, `hero`, for the name a screen is called by.** 5xl, bold, tight, in the heading font: the one
piece of text on a screen that stands over its title, a role rather than a size on the page because T1 leaves the page
no size to reach for. Home's name under the model (Home.md H9) and the status page's name are its uses. The step above
`display`, and the name, are his to change.

## 3. Open

- **Line length.** A `body` in a wide slot runs the whole width; whether `Text` caps its measure (at ~65ch) or leaves
  that to the slot's span is undecided. It leaves it to the span for now — the cell is the unit.
- **A second body size.** `body` is `sm`; if a reading page ever wants `base`, that is a ninth role, here.
