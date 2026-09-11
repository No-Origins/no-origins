# Illustrations — a living document

*How No Origins draws pictures. Started 2026-09-10. Every illustration on the platform is code; this is the document that code is checked against, and the library at the end grows every time one is added.*

Companion to Brand.md (why), Design-System.md (the tokens and the surfaces these sit on) and Character.md (the avatar, which is a different job).

---

## 0. The rule that makes the rest possible

**An illustration is a function.** It takes a hue, a size, a few parameters and a seed, and returns SVG. It never takes a bitmap. It never calls `Math.random()` at render — a seed gives the same picture on the server and the client. Adding an illustration to No Origins means writing a small piece of code against the grammar in §6 and a row in the library — never generating an image and dropping it in.

Why: the platform has one design system across every block (Brand principle 5), the same picture has to render at 96px in a bento cell and at 600px on a page, in both themes, in seven hues, and a fine-tuned model will one day live on the canvas and want to *draw* — none of which is possible with pictures, all of which is trivial with functions.

## 1. What an illustration is here — and isn't

**Is:** a **fine line drawing** in one hue — arcs, capsules, waves, circles and one long spiral — lit from the top-left, filling most of the cell it sits in and cropped by its edge. It suggests a quantity or a quality (four things, many things, one thing opening) without axes, legends or captions. It is drawn on a card that carries the colour and the texture; the drawing itself is only line.

**Isn't:** a photograph or a render of a real thing (no devices, no people, no stock — the brand decided against real images 2026-09-10); an emoji; a generated image; anything with two hues in it; anything with a sharp corner; **anything filled**.

> **2026-09-10, the correction that set the style.** The first draft was soft filled masses — a four-tone ramp per object, no outlines, depth by stacking. Bhargav's four conditions replaced it the same day: *fine lines, no fill, textured gradient cards, no colliding lines in the pattern.* The consequence is bigger than a restyle and worth stating plainly: **the material moved from the object to the ground.** The card is now what carries colour, gradient and grain; the illustration is what is drawn on it. Principles 2, 3 and 6 below are those conditions, and each has a measurement behind it.

## 2. The reference, and what we take from it

`Creatives/Inspirations/Illustations.png` — the purple "nue" bento. Three things in it are illustration in our sense, and we take one lesson from each:

| In the reference | What it is | What we take |
|---|---|---|
| The seven-lobed asterisk | Lobes radiating from a centre, one hue, filling its tall cell | **Form from repetition**: one primitive, repeated with a rule, becomes an object |
| The stacked waves behind "MRR" | Bands of the same hue, overlapping, bleeding off the edge | **Depth from repetition and fade**, and the bleed — it makes the cell feel like a window onto something larger |
| The ring behind "+23%" | An arc with a gap, round ends, the number on the diagonal | **A chart's shape without a chart's claim** (see principle 8), and **the diagonal** (§5) |

What we leave: the phone (a device render), the person (a photograph), the avatars (emoji) — and the fills. Warmth here comes from line, colour and the texture under it, not from faces.

## 3. Principles — ten, and every illustration is checked against them

1. **One hue, one line.** An illustration uses one of the seven hues and draws in one colour: `--ill-line` (§4). Never a second hue. Emphasis is weight and fade, never a different colour.
2. **Fine lines, never fill — one weight, one colour.** Every shape is `fill: none` and a stroke of `--ill-w` (2.6 units, ≈2px where a widget's loud cell renders it). There is no second weight and no second tone: every line in a picture is drawn exactly like every other (Bhargav, 2026-09-11). Nothing is ever filled — a shape that needs to read as solid is the wrong shape. **Under test since 2026-09-11:** a *ramp* between every two lines, which is a fill and is the one thing this principle forbids. It is off everywhere by default and lives behind a control in the panel (§8b) until it is chosen or dropped. And the weight itself came down that day — 2.6 → **1.7**, with the hue mix 64% → **46%** — because *“instead of dark and thick lines that take up more attention, let's try to reduce the attention these lines grab”*. The drawing is the ground the words sit on, not a thing competing with them.
3. **No two lines touch — and they are not parallel either.** Inside one illustration no line crosses, meets or grazes another, and no line touches itself. Since round 1 the second half matters as much: equal spacing makes a picture mechanical, so the lines must vary *and* stay apart. There are only two honest ways to have both, and every family we draw uses one:
   - **Ordered.** The curves are an ordered family over a shared parameter — each strictly clear of the next at every value of it. They may bend completely differently and still keep their order. The parameter has to be the right one: a fan of curves is ordered over *radius from its origin*, not over its own arc length, and getting that wrong is how round 2's fan crossed itself. In its strongest form the parameter *is* radius and the argument needs nothing else: two circles of different radius about one centre cannot meet, which is what `curl` rests on.
   - **Level sets.** The curves are the contours of one smooth field. Two contours cannot cross, because a point cannot hold two values. This is a proof rather than a construction, so the field can be as irregular as we like — the spacing breathes on its own and nothing has to be checked.

   **The generator uses the first, and round 9 is why.** Level sets look like the stronger guarantee and they are, but they buy it by making every line in the picture the *same curve*: the contours of one field are one shape drawn again and again. That is exactly what *“all curves are parallel”* named, and no parameter could have fixed it. Ordering is the weaker promise and therefore the freer one — each line may be its own curve, at its own distance from the last, and they still cannot meet. It is also the promise that can be **measured** rather than only asserted: ∂Φ/∂s > 0 is a local condition, and the sampling that checks it returns the true gap between every neighbouring pair, so the generator settles its own clearance (§6.0) instead of hoping. Either way it is a property of the geometry, not of the drawing: each primitive in §6 states how it keeps the promise, and `e2e/.mcp/probe11.mjs` measures the closest approach of every pair of lines on the rendered SVG in screen pixels, minus their own stroke widths, and takes a path against itself too (skipping a good fraction of its own length, because a smooth curve is always about one stroke from the sample next to it — the question is whether it *comes back*). Across the library the tightest gap is 6.2px and the loosest 29.3px; the studio's candidates are held to the same rule.
4. **Soft geometry.** Circles, capsules, arcs, smooth waves. Round caps, round joins. Nothing has a corner radius under a tenth of its shortest side. Straight edges may exist; sharp corners may not.
5. **The card is lit; the drawing is not.** The −45° light is the blob's light (Design-System.md §4.1b) and it lives in the card's gradient and grain (§4b). The lines take no part in it: a stroke gradient fading toward the bottom-right was tried and retired on 2026-09-11 with principle 2, because a line that fades is a second colour. What this costs is worth naming — **fading was how everything got pushed back**, so depth, emphasis and absence now have to be said with geometry: where a line goes, how much room it has, how many there are.
6. **The card is textured; the drawing is not.** Colour, gradient and grain live on the surface underneath (§4b). The illustration adds nothing but line. Glass is the exception: it has its own material and takes neither.
7. **A field, not an object on a card — and the words choose the levels.** A cell holds one illustration. It crosses the whole cell and leaves through its edges, so it reads as something continuing past the frame rather than a motif placed inside it (Bhargav, rounds 1 and 3). No quiet corner: a field that keeps out of a third of the cell is not a field.

   The text is not exempted, and the way it is handled is the best thing the studio has produced so far. **A contour at height *v* cannot enter a region whose values never reach *v*.** So sample the field over each block of text, forbid those value ranges, and space the levels through what is left (`clearLevels`). No line can touch a word — by construction, not by care — and nothing is bent out of shape to manage it: the lines run above, below and between the words at their own natural spacing, and the count comes out exact.

   **The flow is chosen against the words, and it is measured, not preferred** (rounds 9 and 11). What the text removes is not a line but a *band of the family*, and how wide that band is depends entirely on whether the lines cross the type or run along it. `node e2e/.mcp/flow.mjs` prints the blocked fraction for every angle, per cell, and the numbers settle the argument: **Work** loses 28% at 90° and 67% at 0°, so its direction is nearly forced. **Case studies** loses **61% at every angle there is** — “case studies” and “worth telling” together cover most of the cell — and what survives is one contiguous strip in a corner, which is the quiet corner round 3 rejected. **Projects** loses 55%, best at 90°. Two consequences, both uncomfortable: `flow` is a constraint rather than a differentiator, and it is often the *same* constraint for two sections; and a cell whose caption is long cannot carry a field at all under the current rule. The generator lays its levels through what is *left* rather than across the whole card, so the hole is the size of the words and not the size of the band — but no level-laying can help when only a corner is free. Round 11 puts the alternative up for decision (see §10).

   Two wrong turns are worth keeping, because both look right on paper. A **summit** under the text has to be tall enough to lift it clear of every level, which makes its skirt steep enough to pile the contours against it — measured at lines overlapping by 1.7px. A flat **plain** held between two levels fixes the height but not the edge: wherever the field is forced away from the terrain it has to come back, and coming back crosses levels in a narrow band. *Any region that departs from the ground makes its own gradient.* Leave the ground alone; move the levels. `probe10` measures the result as a distance: no line within 8px of a glyph.
8. **Honest counts.** If a form has a countable number of parts and stands for a countable thing, the number is true: four capsules for four roles, three waves for three case studies. Where nothing is countable yet, the illustration says *absence* rather than inventing a number — Projects is a field of empty outlines, not three fake projects.
9. **Code, deterministic, portable.** A pure function of `(hue, size, params, seed)` → SVG. Unique `id`s via React's `useId` (the blob's pattern). No `Math.random()` at render; a seeded PRNG (mulberry32) when scatter is wanted. Renders on the server. Colours are set through `style`, because SVG presentation *attributes* do not accept `var()`.
10. **Works everywhere it will be put, and holds still.** On the loud tile and on the quiet one, in light and in dark, at a 148-unit cell and at a full-view hero, reviewed at 1× and at the 0.27 overview before it enters the library. Motion is ambient, optional and off by default: an illustration may breathe or turn on the blob's ambient clock (`--d-ambient`, 6s) when it is the only moving thing in view; never inside a bento with others; never under `prefers-reduced-motion`.

## 4. The line colour — one declaration

```css
.noo-ill { --ill-hue: var(--accent-tint); }                      /* the block's hue unless data-hue says otherwise */
.noo-ill[data-hue="peach"] { --ill-hue: var(--peach-tint); }     /* … one line per hue */
.noo-ill {
  --ill-line: color-mix(in oklch, var(--ill-hue) 64%, currentColor);
  --ill-w: 2.6;
}
```

Two values, and every line in every picture uses both of them.

Two choices are doing the work.

**The base is the hue's `-tint` token** (the saturated mid — `--peach-tint` is oklch 0.70 0.19 45), because it is the one tier that is *not* redefined in dark, so the hue reads the same on both grounds.

**The rest is `currentColor`** — the text colour of whatever the illustration is sitting on. A quiet cell inherits `--ink`, so the line goes dark in light theme and light in dark theme. A loud tile sets `--{hue}-ink` (dark in both themes, because the tile is pastel in both), so the line stays dark on it in either theme. An inverted cell sets `--ground`, and the line flips again. One declaration covers every ground we have and every ground we invent later, with no theme block and no per-surface override. 74% was tried first and left yellow and green too pale on a light card; 64% is the setting.

There is no depth ramp. An earlier version had three — two weights and three opacities — and it went out with principle 5 on 2026-09-11.

### 4b. The textured gradient card

The card carries what the drawing gave up.

```css
--grain: url("data:image/svg+xml,… feTurbulence fractalNoise baseFrequency='0.9' numOctaves='3' seed='7' …");
--grain-strength: 0.075;
```

- **Gradient.** Every bento cell has one, at 135° — the same −45° light as the drawing on it. A quiet cell runs a 34% wash of its hue at the top-left into `--surface`; a loud cell runs its hue lightened 58% into the flat hue; an inverted cell runs `--ink` with a trace of the hue.
- **Grain.** A `::after` filling the cell, painted in `currentColor` and *masked* by the noise, at 7.5% opacity. Painting it in the card's own ink means it darkens a light card and lightens a dark one — the same trick as the line colour, and the reason there is no dark-theme grain rule.
- **No bitmap is shipped.** The grain is a `feTurbulence` filter with a fixed seed that the browser runs; it is code, like a gradient, and it obeys §0.
- Glass cells take neither (principle 6). Forced-colors mode drops the grain and the line becomes `CanvasText`.

### 4c. How much attention a drawing is allowed (Bhargav, 2026-09-11)

> *“Instead of dark and thick lines that take up more attention, let's try to reduce the attention these lines grab. Add some texture and noise to the card. I also want to try blurring the lines and creating gradient with single color and gradual increase or decrease of intensity between every two lines.”*

Four changes, and the first three are settled. **The stroke came down** — `--ill-w` 2.6 → **1.7**, and the hue mix in `--ill-line` 64% → **46%**. **The card came up** — `--grain-strength` 0.075 → **0.13**, with `--grain-scale` added so the grain's coarseness is a variable rather than a constant baked into the data URI. Together those invert the relationship the drawing had with the words: it is the ground they sit on, not a second thing on the card asking to be read.

The fourth is under test rather than adopted, because it costs a principle. **Blur** (`feGaussianBlur` on the stroke group) is free — it changes nothing about the geometry, so no amount of it can make two lines touch. **The ramp between every two lines is not free**: it is a *fill* between neighbouring curves, with its opacity climbing across the family and a blur of `breath / 2.5` smoothing the steps into a gradient, and a fill is the first thing principle 2 forbids. It is off everywhere by default and lives behind a control in the panel (§8b). The ramp is only drawn between neighbours closer than `1.9 × breath`, so where a level was dropped for a word the ramp is dropped too — otherwise the fill would flood the space the words cleared.

**Angles.** *“Everything feels like they are drawn in vertical direction only.”* True, and it is not a habit — it is principle 7's cost showing up as a look. The angle is not free and the panel now prices it: a strip under the `flow` control shows what every angle from 0° to 180° costs this cell, and the readout says it in words. Angles are affordable; they are paid for with `breath`. The panel's *angled* preset is 45° at breath 19 — a genuine diagonal, bought by standing closer.

## 5. Composition in a bento cell (Design-System.md §9 Bento)

Two placements, and round 1 moved the default from the first to the second:

- **The corner** — `.noo-bento__ill`: absolutely placed, `width` 62% of the cell, bleeding 7–8% off two edges. An object in the top-right.
- **The field** — `.noo-bento__ill--field`: `inset: 0`, the drawing crossing the whole cell and leaving through every edge. What Bhargav asked for in round 1 and confirmed in round 3, and what the six in §6 will be rebuilt as. The words are kept clear by the level choice, not by a hole in the field (principle 7).
- **The diagonal.** Label top-left, figure or word bottom-left, illustration **top-right** — the reference's ring cell. One placement for every loud cell, so the two never overlap and the illustration is always at full strength; no washing it out to make text legible. (`--bottom` exists for the rare cell whose text sits at the top.) A first draft placed it bottom-right with the figure, and the figure's *label* — "worth telling", "shipped yet" — ran straight into it; `e2e/.mcp/probe10.mjs` now measures glyph rectangles against every illustration so that cannot come back quietly.
- **Where a line may leave the frame.** For a corner illustration, only through the top and the right — the two edges the diagonal puts outside the cell; anywhere else the cut lands where the reader can see it. A field has no such limit: every edge is a crop, and that is the point of it. Either way a line that stops *inside* the frame stops with a round cap, on purpose.
- A cell with no text may hold the illustration alone, centred, at 80%.
- Illustrations use the cell's hue. On a loud cell that means the drawing is the same hue as its tile, one mix apart — deliberately.

## 6. The generator, and the library it draws

### 6.0 One function (Bhargav, 2026-09-11)

> *“I think we can try going towards a direction where we can define a formula or function that takes certain parameters and generates an illustration, hence helping us to attain consistency in the design of illustrations.”*

This is the answer to a problem the grammar could not solve. Six primitives freely composed give six ways to be inconsistent; **one function with parameters cannot be inconsistent, because there is only one of it.** Consistency stops being something a person maintains and becomes a property of the code. Round 9 is the current shape of it.

```ts
illo({ seed, flow, scale, swing, breath, waves, drift, spread, taper, curl, tempo, pinch, words })
```

**A picture is a family, not a curve repeated.** Rounds 5–8 drew contours, and contours are the level sets of *one* field — so every line in the picture was the same curve, offset (`even` 1) or shifted (`even` 0). Copies. Copies laid at one spacing are a ruled grid, which is what *“all curves are parallel”* and *“equal space all the time makes it look mechanical and cheap”* named between them (Bhargav, 2026-09-11). There was no setting that could have fixed it: being a copy *was* the mechanism.

So each line is now its own member of a family — its own amplitude, its own phase, its own distance from the one before. Every line is a graph over the same coordinate `u` (the card rotated to `flow`, with `v` across it):

> **Φ(u, s) = (s − mid)·M(u) + mid + A(s)·Σ rₖ sin(wₖu + pₖ + φ(s))**

and if **∂Φ/∂s > 0** everywhere then line *s* sits strictly below line *s′* > *s* at every point along the flow, so no two can meet however differently they bend. That is principle 3's *ordered* guarantee, and it is the weaker of the two on purpose. Being weaker is what buys the freedom, and being local is what makes it **measurable**: the same sampling that checks the condition returns the true perpendicular gap between each neighbouring pair, so the generator settles its own clearance rather than asserting it — if the tightest pair is closer than 9 units it eases `drift` and `spread` together and measures again, deterministically.

| Parameter | What it is | Where it came from |
|---|---|---|
| `seed` | Which picture. The only parameter that is not a design decision | — |
| `flow` | Degrees; the direction the family travels. **Not a free choice** — it decides how much of the card the words cost (principle 7) | — |
| `scale` | How close — the wavelength of the shared curve; 1 is about one bend across the card. This, not `waves`, is what puts more undulations on a line | *“Far away in all of them”* (round 4) |
| `swing` | Degrees. The greatest angle the middle line departs from its flow — **the openness of the bend**, set directly rather than guessed at through an amplitude | *“Increasing the angles at bends”* (round 7) |
| `breath` | Units **between** lines. The line count is an outcome of this, not an input | *“Breathing space”* (round 5) |
| `waves` | How many sine components make the shared curve — how *varied* each undulation is | *“More waves or curves”* (round 6) |
| `drift` | 0–1. How much each line's curve differs from its neighbour's: amplitude and phase advance across the family, so crests migrate and no two undulations sit above one another | *“All curves are parallel”* (round 8) |
| `spread` | 0–1. How unequal the gaps are: a slow swell along the family plus a seeded jitter, never two tight gaps together | *“Equal space all the time makes it look mechanical and cheap”* (round 8) |
| `taper` | 0–1. The whole family fans — gaps scale by `M(u)` along the flow, so the lines open out one way and gather the other | *“A little randomness”* (round 5) |
| `curl` | 0–1. The family's travel bends into an arc about a centre far off the frame, so the lines **sweep** instead of crossing straight | *“More creative”* (round 9) |
| `tempo` | 0–1. The **wavelength** differs from line to line — one edge of the family long and calm, the other short and quick. The lines agree in the middle of their travel and disagree more the further out they go | *“More creative”* (round 9) |
| `pinch` | −1–1. The spacing bows: the family squeezes through a narrow in the middle of its travel and flares at both ends (−), or the reverse (+) | *“More creative”* (round 9) |
| `words` | The text boxes to keep clear (principle 7) | — |

**Three dials, because the three look different.** `drift` is non-parallel *from line to line*, `taper` is non-parallel *along each line*, and `spread` leaves the curves alone and varies only the rhythm. At all three set to zero this is round 8 at `even` 0 exactly, so **the new generator contains the accepted one** and adds the ways out of it. It also drops a constraint: graphs are never offsets, so there is no cusp limit any more and the bend angle no longer has to be paid for.

**Three devices, and each one had to be argued before it was drawn** (round 10). `drift`, `spread` and `taper` all vary *the same picture* — a bundle travelling straight across the card. These three change what kind of family it is, and each is a single parameter on the same function rather than a second mechanism.

- **`curl` — the spine is an arc.** The offsets stop being distances across a straight line and become *radii* about a centre far off the frame. This is the strongest guarantee in the whole document: two circles of different radius about one centre cannot meet, whatever else they are doing. As the radius grows the arc straightens back into the line, so `curl` 0 reproduces the straight family **exactly**, not nearly.
- **`tempo` — the wavelength drifts.** The dangerous one. A frequency that changes with the family turns ∂Φ/∂s into something that grows with distance from the middle of the travel, so ordering is no longer free and the generator has to measure and ease back — at high `tempo` it will. It is worth the trouble because it is the only dial that makes the family change *character* across itself rather than only shape.
- **`pinch` — the gaps bow.** Safe by construction: like `taper` it only ever multiplies the spacing, and `M(u) > 0` is the entire condition. What it buys is a composition device nothing else here has — a place for the eye to go without an object being put there.

**Unequal has to mean rhythm, not noise.** Gaps are `breath × (1 + spread × (0.34·sin(0.85i + ψ) + 0.21·jitterᵢ))` — a slow swell along the family with a seeded wobble on top. The swell is what keeps two tight gaps from landing together, which is the failure mode that would read as carelessness rather than as breathing.

**Levels are laid through what is left, not across the whole card.** The words forbid a *band* of heights, so the generator finds the band by scanning, then lays the rhythm through each free interval from its own edge. Deleting instead leaves a hole the size of the band; filling leaves a hole the size of the words.

**What each retired version taught, kept in the studio so its round still draws what it showed.** `warpField` (round 5) bent the space to make the lines turn, and turning was all it gave — a warped plane has no reason to space its contours evenly, so density and calm were fighting the mechanism. `waveField` (rounds 6–7) rebuilt it from the spacing outwards as the distance from one curve, which bought even spacing at the price of the bend limit. `offsetField` (round 8) made evenness a dial and the bend angle a parameter; both survive here, and what did not survive is the thing they shared — every line being the same curve.

Smoothness is also a resolution question: the polyline is sampled at 200 points along the flow and kept raw, because smoothing can overshoot and an overshoot could cross the next line.

### 6.0a Version 1 — frozen 2026-09-11

> *“I like these illustrations. Let's treat them as our first version now.”*

Eleven rounds, four of them rejected outright, and the vocabulary below is what survived. **Freezing it means one thing in practice: every parameter set recorded anywhere in this document is now a promise.** Adding a parameter is additive and cheap. Changing what an existing one *means*, or what it does at its default, re-draws every picture on the site and every candidate in the log, so it is a version-2 decision and not a tidy-up.

```ts
illo({ seed, flow, scale, swing, breath, waves, drift, spread, taper, curl, tempo, pinch, words })
```

**The defaults are part of the freeze**, because a call that omits a parameter is relying on them: `waves 2 · drift 0.5 · spread 0.5 · taper 0 · curl 0 · tempo 0 · pinch 0`. The look values are frozen with them: `--ill-w 1.7`, `--ill-line` at a 46% hue mix, `--grain-strength 0.13`.

**What v1 is.** An ordered family of graphs that never cross, each line its own curve at its own distance from the last, laid through whatever the words leave free, with three devices (`curl`, `tempo`, `pinch`) that change the kind of family and three dials (`drift`, `spread`, `taper`) that change its degree. One function, so consistency is a property of the code rather than of anyone's care.

**What v1 is not, and none of these are oversights.** It does not break a line at a word — that was built, measured and rejected (§10). It does not fill anything — the ramp between lines exists behind a control and is not part of v1 until principle 2 is rewritten or it is dropped. It does not draw the six library pictures yet: **v1 lives in the studio, and nothing a visitor sees uses it.** That is the whole of the next step.

### 6.1 The old grammar

The primitives below drew the first six illustrations and are still what `Illustration.tsx` uses. They are superseded in direction, not yet in code: the library gets rebuilt on the generator once its parameters settle in the studio. Note that `bands` keeps itself clear by drawing *the same curve translated*, which is exactly what round 8 rejected — when these are rebuilt as families that guarantee goes with them. Sizes are designed on a 240 × 240 viewBox.

**Primitives** (the grammar — add one only when two illustrations need it). Every one owes principle 3 and says how it pays:

| Primitive | Draws | Parameters | How it stays clear of itself |
|---|---|---|---|
| `rosette` | *n* capsule outlines radiating from a centre — the asterisk | `n`, `r0`, `r1`, `thickness`, `rotate` | they stop at `r0` instead of meeting; clear while `2π·r0 / n > thickness` (`rosetteClearance`) |
| `bands` | *k* open waves, one behind the other | `k`, `amplitude`, `frequency`, `rise`, `top`, `seed` | every wave is the *same* curve translated down by `rise`, so they are parallel by construction |
| `ring` | round-capped arcs with gaps | `segments[]` (fractions), `radius`, `rotate`, `gap` | one radius per run, `gap` between caps; concentric runs need radii a stroke apart |
| `stack` | *n* capsule outlines climbing away | `n`, `x`, `y`, `width`, `height`, `dx`, `dy` | the step `|dy|` is larger than `height` |
| `pebbles` | a seeded scatter of circle outlines | `count`, `rMin`, `rMax`, `seed`, `clearance` | a candidate is kept only when its edge is `clearance` clear of every disc placed |
| `spiral` | one line unwinding from a point | `r0`, `r1`, `turns`, `rotate` | the pitch `(r1 − r0) / turns` stays well above a stroke (`spiralPitch`) |

`mulberry32(seed)` and `polar(cx, cy, r, deg)` are utilities, not grammar.

**Illustrations** (the living part):

| Name | Stands for | Built from | Honest count? | Added |
|---|---|---|---|---|
| `status` | Looking, open — a ring left open at the top-right, an arc echoing it inside, one mark already outside | `ring` [0.72] + `ring` [0.42] + a disc | — | 2026-09-10 |
| `work` | Four roles, four capsules climbing away | `stack` n = 4 | yes, 4 | 2026-09-10 |
| `cases` | Three pieces of work, one behind the other | `bands` k = 3 | yes, 3 | 2026-09-10 |
| `projects` | Nothing shipped yet — the outlines of things not here | `pebbles` × 6, thin, at back depth | says absence | 2026-09-10 |
| `interests` | Curiosity radiating — many things | `rosette` n = 7 | — | 2026-09-10 |
| `philosophy` | A way of thinking unwinding from a point | `spiral` 2.5 turns + a dot at the origin | — | 2026-09-10 |

Me has no illustration: the blob is the illustration of Bhargav.

## 7. How to add one

1. Say what it stands for in one line, and whether it has an honest count.
2. Choose primitives from §6. If the picture needs a new one, that is a grammar change — add it to the table with its parameters **and its non-collision guarantee**, and say why the picture could not be drawn with what was there.
3. Write the composition in `Illustration.tsx`: a case in the switch, a few lines, no magic numbers without a comment. `fill: none` and a `--ill-w` stroke, always.
4. Put it on `/fixtures/bento` (or the fixture for wherever it goes) and run `pnpm review`. Look at it at 1× and 0.27, light and dark, on a loud tile and on a quiet one.
5. Run `node e2e/.mcp/probe11.mjs` (no lines touch — pass `/fixtures/studio` to check candidates) and `probe10.mjs` (nothing under text). Both must be clean.
   Two more tools exist because guessing at either of these has already cost a round: `words.mjs <round>` measures a cell's real text ink boxes, and `flow.mjs` prints how much of the family each angle costs. Neither number is ever to be estimated by eye. `shot.mjs <round>` crops one batch in both themes.
6. Check it against the ten principles. Then add its row here, with the date.
7. It is never a bitmap, and it never calls `Math.random()`.

## 8. The studio — how the library grows

`/fixtures/studio` is where illustrations are argued over before they are adopted. It exists because the six in §6 were drawn by one person guessing what the other would like, twice, and the second guess was wrong in a way the first one hid.

**A round.** One question, one subject, five candidates. Every candidate says what it is *testing* — symbol, repetition, journey, count, emphasis — and how it could be wrong, so choosing between them is a judgement about the question rather than a preference between five pictures. Bhargav picks one by its number and adds notes; the notes outrank anything the round recommended.

**What a pick buys.** The pick is not "this drawing is approved" — it is an answer to the round's question, and the answer becomes a rule in §9 that every later batch inherits. That is the whole point of asking one question at a time.

**Two working rules.**

- *Candidates may improvise; only winners become grammar.* A candidate can draw with an inline path if that is the fastest way to test an idea. If it wins, its geometry is promoted into `primitives.ts` with a name, parameters and a stated non-collision guarantee (§6). Nothing enters the grammar on speculation.
- *A candidate is drawn by the real thing.* `IllustrationCanvas` — the viewBox, the light and the one line style, split out of `Illustration` for exactly this — draws every candidate, on real tokens, on the surfaces it would actually live on: the loud tile, a quiet tile, and the cropped top-right corner at the 0.27 overview. What is picked is what ships.

### 8b. The panel — `/fixtures/controls`

> *“With all the conditions we arrived on, can we create a layout with all the controls where we can customise and control the variables in the function/formulas?”* — Bhargav, 2026-09-11

Every variable the generator takes, on one screen, against the real thing. It is deliberately **not** a second copy of the generator: it imports the same `illoLines` the studio's batches draw with, so a setting found in the panel is a setting that ships, and there is still only one function (§6.0). It is also not a preview of a *picture* — it previews a **cell**, with the real text on top, the real gradient and grain underneath, at the three sizes an illustration has to survive.

The controls split in two and the split is the point. **Geometry** is what the function takes. **Look** is what the card and the stroke do with the result — weight, contrast, blur, bands, grain — and nothing under Look can make two lines touch, which is why it can be given away freely.

What it shows back, using the same measures as the probes so that what passes here passes there: the line count, the tightest gap centre-to-centre and between edges (what `probe11` reports), what the words cost at this angle, the strip of what *every* angle would cost, and the `illo({ … })` call that reproduces what is on screen. Presets are the batches that were liked, so a session starts from a known-good picture rather than from nothing.

## 9. The log — one row per decided round

*Empty until round 1 is decided. Each row records what was chosen, what was said about it, and the rule the next batch inherited — the reasons, not just the outcome.*

| Round | Subject | Chose | The note | The rules it produced |
|---|---|---|---|---|
| 1 | Current Status | **1D, four paths** (honest count) | *“Instead of parallel lines and just looking like some icon on the card, I'd prefer lines reaching the edges of the cards and not literally parallel. I just don't want lines to cross each other. They can be similar in the type of curve but not really parallel.”* | An illustration is a **field**, not an object: it crosses the cell and runs off the edges (principle 7 rewritten, `--field`). **Non-parallel is required** — shared kind of curve, unequal spacing (principle 3 extended). **Non-crossing stays absolute**, which with the other two is now the hard part — hence the two guarantees in principle 3. The honest count survives: four paths are four lines. |
| 2 | Current Status, as a field | **2D the landscape**, then 2A, then 2B | *“I like 2D, 2A and 2B in that order.”* — and, alongside it, *“I'd also like if all the lines have same thickness and colour.”* | The field is a **terrain**: his order runs from most irregular to most regular, so a field that sweeps evenly reads as a mechanism and the variation is what makes it a picture. **Level sets over constructions** — both top choices are contours, and the two with a visible origin to radiate from came last, so the field should have no centre the eye can find (inferred; 3C tests it by putting one back). Irregularity was preferred *even at the cost of the count*, so the count has to be found in a good field rather than imposed on a poor one — round 3. And separately: **one weight, one colour** (principles 2 and 5 rewritten). |
| 3 | Where four lives in a terrain | **3C the parting**, then 3A, then 3B | *“I liked 3C, 3A and 3B in that order.”* | **No quiet corner** — 3C was the only candidate that actually crossed the whole cell, and the four that kept a corner empty all ranked below it. **Derived beats composed** again: the grown terrain (3A) over the four hand-placed features (3B). **The round-2 inference was wrong and is withdrawn** — 3C has an obvious focus where its lines converge, and it won; what lost in round 2 was a shape radiating from a point *inside* the frame, not convergence itself. And the count was chosen against for the second round running, which is what round 4 asks about directly. |
| 4 | What tells one section's field from another's | **none of them** | *“1. Far away in all of them. 2. Too less lines are visible on the card. 3. Too less angles in the curve or sometimes very less smoothness.”* | **Closer** — the card holds a detail of something larger, not a whole small thing. **More lines** — three or four is not a field, and whatever was left of the count argument lost to density. **More angles, and smoother** — the curves must turn, and be smooth where they turn. And the direction that replaced the mechanism: **one generator** (§6.0), so consistency is a property of the code. |
| 5 | One function, five settings | **none of them** | *“Too many lines. Too close to each other. Too chaotic. Too congested.”* — wanted instead: more smoothness, consistency, a little randomness, breathing space | **Breathing space is a parameter**, not a consequence: set the gap between lines in the picture's own units and let the count be what fits. **Smoothness means one slow shape per line**, not a smooth rendering of a fast one — round 5's second octave was the chaos. **Consistency means one family** — offsets of a single curve, not independent wanderers sharing a field. (Round 8 later split this in two: one *kind* of curve is the consistency, one *copy* of a curve is the mechanical read.) **A little** randomness: it belongs in the curve's two components and the seed, not in every line separately. |
| 6 | Breathing space as the parameter | **all five** | *“Now I like all of them. Let's try more waves or curves on them.”* | **The mechanism is settled** — contours of the distance from one smooth curve: consistent, evenly spaced and smooth by construction. The first batch where nothing was rejected. **`breath` as an input and the line count as an outcome** was the move that did it: ask for air, not for a number. |
| 7 | How much curve a line can carry | **7D, and only just** | *“7D feels just okay. Not great. Remaining all have very sharp curves rather than smooth curves. We can also try increasing the angles at bends.”* | The sharpness and the small angles had **one cause**: holding the lines exactly equidistant (see `even` above). The bend angle became a parameter in its own right — at a given `swing`, a longer wavelength is the same angle taken more gently, which is what smoothness *is*. |
| 8 | Wider angles, longer radius | **all five, with two reservations** | *“I like them. Things I did not like: 1. All curves are parallel. 2. Equal space all the time makes it look mechanical and cheap.”* | Both notes are **one fact about the mechanism**. A contour family is the level sets of one field, so every line in the picture is the same curve — offset at `even` 1, shifted at `even` 0. Copies, and copies at one spacing are a ruled grid. No setting could have fixed it: being a copy *was* the mechanism. So a picture became a **family** (§6.0) — each line its own amplitude, its own phase, its own distance from the last — and the guarantee moved from level sets to **ordered**, the weaker promise and therefore the freer one. Ordered is also the promise that can be **measured**, so the generator now settles its own clearance instead of asserting it. And **unequal spacing became something we ask for** (`spread`) rather than a price paid for something else — as a rhythm, never as noise. |
| 9 | Different curves, unequal gaps | **all five** | *“I like all of them. Can we try more variations on the same principles but more creative?”* | The family construction is **settled** — ordered over a shared parameter, each line its own curve, gaps a rhythm rather than a measure. Nothing was rejected, including 9E with every dial at the top, so *how much of each dial* has stopped being the useful question. What replaced it: **what else a family can be**. The three dials all vary the same picture; the next ones have to vary the *kind* of picture, and each has to earn its place with an ordering argument rather than by looking good. |
| 10 | Sweep, tempo, waist | **10A, 10C and 10D** | *“I love A, C and D.”* | **A device is not a dial.** 9E had every dial at the top and won; 10E had every device near the top and lost. Dials are degrees of the same picture and they stack; devices change what the picture *is*, and two of them arguing is not a third thing. The working limit is **one device carried alone, or two at about half** — 10A and 10C are one device alone, 10D is two at half, and those are the three that landed. **`tempo` is a supporting device, not a leading one**: it is in 10D, which won, and in 10B, which did not, and the difference is that 10D gave it a sweep to sit under. **`curl` and `pinch` can each lead a picture alone.** |
| 11 | Seven sections, one mechanism | **A, B, C and D — not E** | *“I liked A, B, C, D only.”* — with four conditions alongside: everything reads vertical and wants angles; the lines grab too much attention; the card wants texture and noise; and try blurring the lines with a single-colour ramp between every two of them. | **A line leaves through the edges of the frame.** Principle 7 stands: interrupting was built, measured and shown, and it lost. Line ends inside the cell are not acceptable *even when they buy back a third of the picture* — the clearest thing the studio has been told about what an illustration **is** rather than how it looks. So the cost of the words is a cost we pay, which makes **caption length a design variable**: shortening “worth telling” would buy back more picture than any parameter can. **All four strategies are legitimate and can be mixed** — device, direction, distance and temperament are four budgets to spend per section, not four rival answers, with the caveats that direction is mostly spent for us and distance is the only one that survives 0.27. And the four conditions became §4c and §8b: the drawing is **ground, not figure** (weight 1.7, contrast 46%, grain 0.13), angles are **available at a measurable price**, and blur and the ramp are under test behind a control. |

Round 3 also moved the field's low ground from the bottom-left corner to off the **left edge**: the label sits top-left and the figure bottom-left, so the left strip is the region that has to stay quiet, and a corner origin puts the label in the middle of the sweep where no level can clear it.

Round 2's geometry (`contours` by marching squares, `sheaf`, `fan`, `rings`) lives in the studio, not the grammar, until one of them wins — §8's rule. `fan` was the one that had to be argued into correctness: parameterised over its own length, its curves overtook each other; over *radius from the shared origin*, with a monotone bend and a wobble capped at 0.3 of the angular gap, they cannot.

## 10. What happens next

Ordered, with the reason for the order. Everything above the line has to happen before the site shows any of this work; everything below it is a real question that does not block.

### 10.1 ✅ Promote the generator into the library — *done 2026-09-11*

**No new package.** Illustrations already live inside `@no-origins/ui`, and a second package would need its own version kept in step while depending on the same tokens, the same hue and the same `IllustrationCanvas` — reintroducing exactly the seam §6.0 exists to close.

The generator is now `packages/ui/src/illustrations/generator.ts`, exported as `illo`, `illoLines`, `poly` and the `Family` / `Drawn` / `Pt` types. `SIZE`, `mulberry32` and `polar` were already in `primitives.ts` and are imported from there rather than redeclared, so there is one definition of each. `Family` was flattened on the way in: it used to be built by `Omit`-ing fields off two older interfaces, which was scaffolding from rounds 6 to 8 and no way to state a frozen vocabulary.

**Everything retired stayed in the studio** — `warpField`, `waveField`, `offsetField`, `contours`, `clearLevels`, `parting`, `sheaf`, `fan`, `rings`, and `interrupt` with them. `field.ts` now re-exports the promoted `illo` and holds only the history, under a line that says so. A record that redraws itself with today's generator is not a record.

`/fixtures/controls` imports from the package too, so no app file reaches into another route's folder for the generator any more.

Verified behaviour-preserving: every candidate in rounds 9, 10 and 11 draws the same number of lines it drew before the move, both probes pass on all three routes, both packages build, 60 screenshots green.

**Still to come with 10.2:** the old drawing grammar (§6.1 — `rosette`, `bands`, `ring`, `stack`, `pebbles`, `spiral`) is dead the moment the six pictures are rebuilt as fields. Delete it then, not before, and retire `/fixtures/primitives` with it.

### 10.2 ◐ Rebuild the six pictures — *the widgets are done 2026-09-11; the full views are not*

The six section **widgets** now draw with v1: `SectionWidget` in the package, six parameter sets in
`apps/portfolio/src/content/sections.tsx`, on `/fixtures/bento` — the review surface, because nothing goes on the
canvas until the widgets are approved there (§8, build order 11).

The four budgets from round 11 were spent one per section: `curl` for Status, `taper` for Work, `pinch` for Cases,
nothing at all for Projects, `curl` + `tempo` at half for Interests, and temperament for Philosophy. Distance
carries the rest, since it is the only difference that survives the overview.

**Five different angles came out of the measurement, not out of a preference** — 0°, 58°, 68°, 90° and 105°. That
is the answer to *“everything feels like they are drawn in vertical direction only”*: the words sit differently in
every cell, so the cheapest direction genuinely differs, and `breath` then pays back what the words took so each
widget still carries a comparable field.

**And two words beat every parameter in the file.** Status's caption was “ways to reach me”, which cost 65% of the
family at its *best* angle. “Ways in” costs 37%. That is caption length behaving as composition, exactly as §10
predicted, and it is the strongest argument yet for revisiting the other long captions.

Still to do here: the **full views** (the other half of §8.4), and then the old grammar (§6.1) and
`/fixtures/primitives` get deleted, which is what makes this row green.

### 10.2b Seven parameter sets, judged as a map

Round 11 said device, direction, distance and temperament are four **budgets**, not four rival answers. They now have to be *spent*: one concrete set per section, chosen with `flow.mjs` per cell, and judged **as a map rather than as cards** — the whole ring at 0.27, which is the size it is actually read at. This is the last studio round before the library is rebuilt, and it is the round that decides whether one mechanism across every section stays scannable. Three answers are needed before it can be drawn, and they are 10.3, 10.4 and 10.5.

### 10.3 Principle 8 has to be rewritten or dropped

The count has been chosen against in rounds 2, 3, 4 and 11, and the principle has never been changed to say so. A field does not have a countable number of parts, and pretending otherwise is the only rule in this document that the pictures keep quietly failing. The honest version is probably: **the figure carries the number, the illustration carries the character** — the cell already says “4 roles” in type, so the drawing does not have to say four as well. Decide it before 10.2, because it changes what Projects is for.

### 10.4 How `projects` says absence, with geometry

It used to say it by being fainter and thinner, and one weight and one colour took both away. Under v1 the vocabulary for absence is `breath` and nothing else: the emptiest legal field, most of the cell as ground. Round 11's candidate E showed roughly what that looks like at breath 54. It needs deciding as part of 10.2 rather than after it.

### 10.5 The ramp between lines: adopt or drop

It is a **fill** (§4c), which is the first thing principle 2 forbids, and it is currently half-in — implemented, off by default, behind a control in the panel. Either principle 2 is rewritten to allow a soft ramp but never a solid shape, or the ramp comes out of the panel. **Do not carry it into the library undecided.**

### 10.6 Then the site work resumes

Step 12 (the ring on widgets, full views, and the snap), then 13 deploy, 14 `design.no-origins.com`, 15 the browser model. The illustrations stop being the critical path the moment 10.1 and 10.2 land.

---

### Still open, not blocking

- ~~**Should a line break at the words?**~~ **Answered: no** (round 11, 2026-09-11). It was built, measured and shown rather than argued, and it lost. What follows is below under *caption length*. The implementation stays in `field.ts` behind `interrupt` so the round still draws what it showed. The original reasoning: A line is a graph across the whole card, so a height that puts it under the type is dropped entirely — which is why one cell in three cannot carry a field (principle 7). The alternative is cartography's answer: draw the line up to the type and resume after it. Two rules were needed to make it a fair test rather than a straw man. The break runs **13 units along the line**, so it reads as a label gap and not as a nick — stopping at the padded box left two halves of one line 1.6px apart, which probe11 caught. And a height has to survive **at least 55% intact** or it is dropped as before, because a line that is mostly gap is a handful of stubs and a card of stubs is hatching, not a field: the first attempt drew every height and the cards came out as diagonal scratches. What it costs is line **ends inside the frame**, which is the one thing principle 7 says a field does not have. It was not adopted. Principle 7 stands unchanged, and line ends inside the cell are out even at the price of a third of the picture.
- **The word boxes could be three, not two.** Each cell's forbidden region is currently the *union* of the figure and its caption, which also forbids the empty space beside a short value — for Projects that is the whole strip to the right of the “0”. `node e2e/.mcp/words.mjs <round>` measures the real ink boxes (never guess them; guessing twice in round 3 put lines through the figure twice), and passing the three separately would give a few percent of the card back. Not done yet, because changing them would also change what rounds 6–10 draw, and the studio's record should keep showing what each round showed.
- **Caption length is a design variable.** Round 11 measured it: Case studies loses **61%** of its family at every angle, and no parameter can win that back — but two shorter words would. The captions were written as copy; they are now also composition, and the ones that cost the most picture should be revisited when the copy is finalised.
- **Motion.** Principle 10 allows ambient motion; nothing uses it yet. The line style makes one candidate obvious: a stroke that *draws itself* on entry (`stroke-dasharray`), which the filled version could not do. First use: a full view, not a widget.
- **A hero size.** Full views (Design-System.md §8.4) will want illustrations at 3 × 2 boxes. The geometry scales, but the stroke does not: v1 took `--ill-w` down to **1.7**, which is right on a 148-unit cell and will be invisible at 3 × 2 boxes. So `--ill-w` needs a step per size, and `breath` probably does too — a hero at the same breath is the same picture enlarged, not a picture with more in it. Decide when the first full view is built (step 12).
- **The blob draws.** When the model in the blob can call tools, "draw me a …" against this grammar is a tool it can have. That is the real reason §0 exists — and **one function with twelve numbers is a far smaller thing to hand a small model than six primitives were**, because there is nothing to compose wrongly: every setting is a legal picture by construction, and the ones that would put two lines together are settled by the generator rather than by the caller.
