# No Origins — Character

*Written 2026-09-09 from six photos in `Creatives/bhargav/photos`. Sits beside `Brand.md` and `Design-System.md`. This is the brief for Bhargav's illustrated avatar — the person behind the host blob. Everything visual derived from it is a proposal until picked in the Character Studio (§9).*

---

## 0. What this is for

The blob family already gives every **block** a face. What No Origins does not have yet is a face for the **person** — the one that goes on About, in the nav, on the 404, in the chat as "Bhargav is typing", on an OG image, in an email signature. A photo does part of that job; a drawn character does it in every size, both themes, and can move like the blobs do.

The goal, in Bhargav's words: *"Create a digital animated avatar using my images. First design a character using the images, then refine the character. Once we decide the illustration, create multiple illustrations of the same art and use them in no-origins."*

So the sequence is: **likeness → one construction → pick a rendering + framing → refine → variants → component.** This document covers the first two and sets up the pick.

## 1. What the photos say

Six photos, five settings: a riverbank in a windbreaker, a night street in a hoodie and scarf, a desk lit pink with a ukulele, a plaza in a sand shirt, a hillside in a grey jacket, a selfie in headphones. Reading them together, the signature features in order of how much they carry the likeness:

| # | Feature | What the photos show | What the drawing keeps |
|---|---|---|---|
| 1 | **Glasses** | Thin wire **navigator** frames in every single photo — large lenses, squared top edge, tapered bottom, a **brow bar over the nose bridge** (double bridge), temples straight to the ear. Gold-silver metal. | The anchor. Two big lenses + brow bar + nose bridge, thin stroke. Nothing else about the face needs to be exact if these are. |
| 2 | **Hair** | Very dark, dense, wavy-curly. Tall on top, swept up and back, shorter at the sides (a taper in the night photo). Sometimes slicked back after rain; usually fluffy. | One big soft mass, taller than the head, lifted at the front, curl bumps along the contour. Sides come down to meet the beard. |
| 3 | **Beard + moustache** | Short, full, dark. Moustache thick and connected to the beard around the mouth; beard follows the jaw and is fullest at the chin. Sideburns connect it to the hair. | Moustache as one rounded shape, beard as a band hugging the jaw, thicker at the chin. |
| 4 | **Face** | Round, full cheeks, soft jaw. Warm medium-brown skin. Thick, straight-ish dark eyebrows. | A wide rounded face — close to a pill already. Skin is a real warm brown, never a pastel. |
| 5 | **Expression** | A gentle closed-mouth smile, often looking down or aside. Eyes soft. Never a grin, never a pose. | The default expression is the shy smile. Eyes are two dark dots — the blob's eyes. |
| 6 | **Wardrobe** | Dark on top every time: black tee, charcoal windbreaker, grey jacket, navy hoodie. Sand-beige below: khaki trousers, a sand shirt once. Black sneakers. | Ink tee under an open charcoal jacket; sand trousers; black shoes. His palette is the Sketch palette — dark ink over warm sand. |
| 7 | **Pose** | Hands in pockets, weight easy, slight lean. Twice. | The full-body stance is hands-in-pockets. |
| 8 | **Props** | Over-ear headphones, a scarf, a ukulele on the desk, a monitor showing code. | Variant material (§7), not part of the base. |

What the photos say about **character** matches Brand.md §4 without adjustment: warm, quiet, curious, happy — a person who makes things (the desk, the instrument) and goes outside (four of six photos). Nothing in them is loud.

## 2. Who he is in the system

Design-System.md §4.1b already decides: **the host blob is Bhargav** — the one uncoloured, glass pill among seven colours. This character does not replace that. It is the same person at a different distance:

- **Far away** (canvas, nav, favicon): he is the host blob. Two eyes in glass.
- **Close up** (About, contact, 404, OG, chat): he is this drawing.

The link between the two is the **eyes**. The blob has two dark dots at `--eye`; so does the drawing — the same two dots, behind his glasses. Put differently: *the blob is what is left of Bhargav when you remove everything except the eyes.* That sentence is the whole design logic, and it is why the drawn eyes are dots, not eyes with whites.

One framing in §5 pushes this further and makes the pill itself his face. Whether that is charming or a step too far is his call.

## 3. The construction — one geometry

Everything is drawn once, on a **200 × 250 box (bust)**, head centred at x = 100. Scale, never redraw. Parts, in stacking order:

| Layer | Shape | Note |
|---|---|---|
| jacket | two panels, shoulders at y ≈ 178, open at the front | charcoal |
| tee | the strip visible between the panels | ink-black, fixed (not the theme's `--ink`) |
| neck | 32 × 30 at (84, 158) | skin shade |
| ears | ellipses at (52, 120) and (148, 120) | behind the face |
| face | wide rounded shape, 96 wide × 112 tall, y 60 → 172 | warm brown |
| beard | band along the jaw, 4 u at the sideburns → 21 u at the chin | hair colour, slightly lifted |
| moustache | one rounded shape, y 124 → 138, soft dip at centre | hair colour |
| mouth | shallow smile stroke at y 142, inside the beard ring | |
| nose | one short curve peeking under the lenses, y 130 → 137 | skin shade |
| hair | mass from y 28 to the hairline at ≈ 80, curl bumps on both contours | near-black |
| brows | two thick rounded strokes, y 90 → 96 | hair colour |
| eyes | **`circle (78, 117) r 5.5` and `(122, 117) r 5.5`, fill `--eye`** | the blob's eyes |
| glasses | left lens 58 → 98, right lens 102 → 142, y 100 → 130; brow bar y ≈ 96; nose bridge; temples to the ears | thin wire, stroke 2 |

Proportions worth stating: eye distance 44 on a 96-wide face (0.46); lens height 30, nearly a third of the face; hair adds 50% again on top of the head. These three ratios are what make it him at 24 px.

### 3.1 Character tokens

New tokens, the subject's own. They do **not** change between themes except where noted — skin and hair are facts, not surfaces.

| Token | oklch | ≈ hex | Use |
|---|---|---|---|
| `--c-skin` | `oklch(0.60 0.085 52)` | `#9D6B47` | face, hands |
| `--c-skin-2` | `oklch(0.52 0.085 50)` | `#845738` | ears, neck, nose, shade |
| `--c-hair` | `oklch(0.22 0.015 50)` | `#2B2521` | hair, brows |
| `--c-beard` | `oklch(0.28 0.02 50)` | `#3A312B` | beard, moustache |
| `--c-wire` | `oklch(0.72 0.06 80)` | `#B8A078` | glasses (light) · `oklch(0.80 0.05 85)` dark |
| `--c-tee` | `oklch(0.24 0.01 60)` | `#2E2A27` | tee, sneakers |
| `--c-jacket` | `oklch(0.38 0.01 60)` | `#4E4945` | jacket · `oklch(0.46 0.01 60)` dark |
| `--c-sand` | `oklch(0.86 0.03 80)` | `#DCD1BC` | trousers |
| `--eye` | existing | `#474747` / `#000` | eyes — the same token as every blob |

Eight colours, all low-chroma, all in the warm 50–80° band the Sketch palette lives in. The character never uses a family fill for skin. The **duotone** rendering (§4) is the exception by design: there the whole figure is one hue's fill + deep pair.

## 4. Renderings — six ways to draw the same thing

Same paths, different paint. Candidates for the pick; one line each on what it says and where it would live.

| Key | Rendering | What it says | Where it would live |
|---|---|---|---|
| `flat` | **Flat** — fills only, no outlines, wire glasses | calm, systems, the blob's sibling | default everywhere |
| `line` | **Ink line** — ink strokes, hair/beard/eyes filled, no skin | the logotype version of him; print, mono | footer, README, favicon-scale, dark mode fallback |
| `outline` | **Outlined flat** — flat fills + ink contour | friendlier, more "character", risk of sticker | stickers, 404, empty states |
| `glass` | **Glass** — every shape is the blob material at 24–40% over the grid, one thin rim | made of the platform, like the host | canvas, hero over the grid |
| `paper` | **Paper cut** — flat layers with soft shadows between them | tactile, a made thing | About hero, OG image |
| `duo` | **Duotone** — one hue's fill + deep for the whole figure | the family's colours applied to a person; seven of him | per-block appearances, chips, loading |

Never: photoreal shading, gradients on skin, a hard specular highlight (the blob lab already killed it), Pixar eyes with whites, outlines *and* shadows together.

## 5. Framings — four distances

| Key | Framing | Box | What it is for |
|---|---|---|---|
| `blobface` | **Blob-face** — the 96 × 64 pill *is* his face: eyes at the blob's eye positions, glasses across the pill, hair on top, beard below, nothing clipped | ≈ 116 × 170 | canvas host, nav, anywhere a blob goes; the one that makes him literally part of the family |
| `window` | **Window** — his face clipped inside the pill, scaled so the eyes land on (30, 32) and (66, 32) | 96 × 64 | avatars in lists, comments, chat "typing"; a blob that turns out to be him |
| `bust` | **Bust** — head and shoulders, jacket open | 200 × 250 | About hero, contact, OG image |
| `full` | **Full** — chibi proportions, hands in pockets, sand trousers, sneakers | 200 × 360 | 404, empty states, the "about the platform" page, illustrations beside prose |

These are not exclusive — a shipped character will likely have `bust` + one small-size framing. The pick is which small one.

## 6. Where it lives in No Origins

| Place | Framing | Rendering | Motion |
|---|---|---|---|
| About hero (`/about`) | bust, `lg`-equivalent ≈ 220 px | the picked one | blink, look, breathe — same rules as blobs (§7 of Design-System) |
| Nav / list avatar | blob-face or window at 36 × 24 | flat or glass | blink only |
| Canvas home | host blob stays glass; on hover/speak it *may* become blob-face | glass | — |
| Contact | bust, waving variant | picked | pop-in |
| 404 / empty | full, looking down, hands in pockets | picked | breathe |
| OG image (1200 × 630) | bust on grid + wordmark | paper or flat | static |
| Favicon | stays the logotype blob | — | — |
| Chat persona ("Bhargav is typing") | window | flat | blink |
| Email signature, README | line | line | static |

## 7. Multiple illustrations of the same art

Once the base is agreed, variants are cheap because they are parameters on one construction, never new drawings:

- **Expressions:** smile (default) · looking down (the riverbank photo) · blink / asleep (rect eyes, like the blob's `sleep`) · brows up (curious) · laugh (open mouth arc).
- **Props:** over-ear headphones · scarf · ukulele · laptop · coffee. One prop at a time.
- **Poses (full only):** hands in pockets · wave · lean on a blob · sitting.
- **Colour:** the seven-hue duotone set; dark-theme variants of wire and jacket.
- **Motion states** mirror the blob exactly: `idle` breathe 6s, `blink` 140ms every 4–9s, `look` ±3 u toward the pointer, `sleep`. Reduced motion: blink only.

All of this ships as one component, `Avatar`, in `@no-origins/ui` — same conventions as `Blob` (plain-DOM behaviour, SVG scaled from one box, `--eye` for the eyes), with `framing`, `rendering`, `expression`, `prop`, `hue`, `state` props. Static SVG/PNG exports for OG and email come from the same source.

## 8. Rules

1. **The glasses are never dropped**, at any size. At favicon scale the character is not used — the logotype blob is.
2. **Eyes are `--eye`, two dots**, always. This is the family resemblance.
3. **Skin is skin.** A real warm brown, never a pastel; never tinted by theme or block — except in the duotone rendering, where *everything* is the hue.
4. **Lighter touch** (his words from the Blob Lab): thin wire, flat colour, faint shadow if any. Never thick outlines with shadows, never highlights on skin.
5. **Same box, scaled.** Nothing is redrawn per size; if it fails at 36 px, fix the construction, not the instance.
6. **Never photoreal, never a caricature.** Exaggerate only proportions the photos already have: hair height, lens size, roundness.

## 9. Open — decided in the Character Studio

Artifact: **Character Studio** (`packages/ui/design/character-studio.html`), writes to the artifact db at `decisions/character`:

```
{ style: flat|line|outline|glass|paper|duo, styleNotes,
  framing: blobface|window|bust|full, framingNotes,
  features: { hair, glasses, beard, smile, brows, jacket, sand, pockets: keep|more|less|drop },
  notes, complete, completedAt, updatedAt }
```

Questions the board asks, in order: *Is this you?* (likeness — the features table with keep / more / less / drop) → *Which paint?* (§4) → *Which distance for the small one?* (§5) → anything else.

Still open after the pick, non-blocking: whether the canvas host ever shows his face or stays clear glass; whether the About page shows a photo *and* the drawing or only the drawing.

## 10. After the pick

1. Fold the picks into this doc (§4/§5 become decisions) and Design-System.md §4 gets a "§4.5 The avatar" pointer.
2. Refine round: redraw only what the features table asked for; re-show as one board with before / after.
3. Variants (§7) drawn on the agreed base; a strip of all of them for a yes/no.
4. `packages/ui/src/avatar/Avatar.tsx` + `avatar.css` + fixture page `/fixtures/avatar`; then the placements in §6, About first.
