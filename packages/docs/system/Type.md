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

Two more knobs, and only two: **tone** — `foreground` or `muted` — and **align** — start, center, end. Anything else a
piece of text wants (a colour, a size between two roles, italics) is not a token; it is a new role, decided here, or
it is not done.

## 2. The rule

**T1 — Text is a `Text`.** `packages/ui/src/components/text.tsx`: `<Text role="body" tone="muted" align="center">`.
The seven roles are the whole scale; a page does not reach for `text-2xl` on its own. The showcase's pages are the
one exception for now — they were written before this and are documentation, not an app — and get moved over as they
are recomposed in the composer.

**T2 — In the composer, text is a slot holding `Text`** (Slots.md S1). The registry entry carries the text, the role,
the tone and the alignment as its props; where the text sits in its slot is the slot's `alignX`/`alignY`.

## 3. Open

- **Line length.** A `body` in a wide slot runs the whole width; whether `Text` caps its measure (at ~65ch) or leaves
  that to the slot's span is undecided. It leaves it to the span for now — the cell is the unit.
- **A second body size.** `body` is `sm`; if a reading page ever wants `base`, that is an eighth role, here.
