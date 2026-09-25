# No Origins — Type

*The typography roles of the 2.0 system. Opened 2026-09-21, when a `Text` slot was needed and there was nothing for
it to wear: the 1.0 type scale went with 1.0, and 2.0 had three font slots and whatever Tailwind size a page happened
to use. Bhargav: "there is no way I can add text and apply our typography tokens to it." Decided on the
recommendation, the same day.*

Companion documents: **Brand.md** (voice), **Slots.md** (a `Text` is a component in a slot), **Grid-v2.md** (the
cell sizes these are read against).

---

## 1. The roles

Every piece of text in an app is one of seven roles. The roles were **read off the showcase's pages** as they stood on
2026-09-21 — the sizes and weights already in use — rather than derived from a ratio, so adopting them changed nothing
that was on screen. Fonts are the three slots the host declares (`--font-heading`, `--font-sans`, `--font-mono`); the
package only reads them.

| Role | Font | Size · weight · tracking | For |
|---|---|---|---|
| `display` | heading | 4xl · bold · tight | a page's one big title |
| `title` | heading | 3xl · bold · tight | a section title |
| `heading` | heading | xl · semibold | a card or group title |
| `label` | heading | xs · bold · uppercase, widest | the small caps that name a thing |
| `body` | sans | sm · normal | paragraphs |
| `caption` | sans | xs · normal · muted by default | notes, secondary lines |
| `mono` | mono | xs | counts, ids, code |

Two more knobs, and only two: **tone** — `foreground`, `muted`, `faint` (T3) or `lime` (T4) — and **align** — start,
center, end. Anything else a
piece of text wants (a colour, a size between two roles, italics) is not a token; it is a new role, decided here, or
it is not done.

## 2. The rule

**T1 — Text is a `Text`.** `packages/ui/src/components/text.tsx`: `<Text role="body" tone="muted" align="center">`.
The seven roles are the whole scale; a page does not reach for `text-2xl` on its own. The showcase's pages are the
one exception for now — they were written before this and are documentation, not an app — and get moved over as they
are recomposed in the composer. *The composer went 2026-09-23 (Grid.md D30); they move over when their content files
are next rewritten.*

**T2 — In the composer, text is a slot holding `Text`** (Slots.md S1). The registry entry carries the text, the role,
the tone and the alignment as its props; where the text sits in its slot is the slot's `alignX`/`alignY`.
**Withdrawn in part 2026-09-23 (Slots.md S7).** The composer and the registry's `Text` entry are gone; text in a slot
is a `Text` written in code, and where it sits is still the slot's `alignX`/`alignY`.

**T3 — A third tone, `faint`, for text meant to be found rather than read.** *2026-09-25, for a quote on the
portfolio's first screen: "in a very subtle way … we can use some tokens that reduce the opacity or something like
that … with our bold text, the title font."* The token is `--faint-foreground` (`text-faint-foreground`): a step past
`muted` in each theme — `oklch(0.8 0 0)` on light, `0.42` on dark, where muted is `0.556` and `0.708`. **It is a flat
grey, not the foreground at an alpha**: nothing translucent goes over the grid (glass went on 2026-09-16), and a glyph
at an alpha lets the grid's lines show through it. It is a tone, so it goes with any role; the first use was `title`,
bold words in a quiet colour, which is what makes it subtle rather than small — moved the same day to `display` in
the portfolio's own display face (Portfolio.md P4), still faint.

**T4 — A fourth tone, `lime`, the system's first colour on text.** *2026-09-25: "@hiddenstack in lime colour with a
small text font."* It is `text-lime`, the `--lime` token his HEY! introduced, one value in both themes — so it is
**1.3 : 1 on the light background** and 15 : 1 on the dark. The first use is a `caption` that is also a thing to press
(Portfolio.md P4), which is the only use it should have until the light-theme contrast is decided.

## 3. Open

- **Line length.** A `body` in a wide slot runs the whole width; whether `Text` caps its measure (at ~65ch) or leaves
  that to the slot's span is undecided. It leaves it to the span for now — the cell is the unit.
- **A second body size.** `body` is `sm`; if a reading page ever wants `base`, that is an eighth role, here.
