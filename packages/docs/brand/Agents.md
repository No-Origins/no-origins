# No Origins — The six agents

*Designed 2026-09-30, his ask: "design six agents, each with different color, different shape, and different
characteristics and personality." Each is a character in the character studio at version 1, named by him: Bali, Kino,
Zaza, Oru, Mira, Lola. Downstream of
**Brand.md** §4 (the character), §8 (one hue per agent; the blob is the mark of an agent; the host is Bhargav, clear
glass, and everyone else is a colour) and **Character-Studio.md** (what a character can be: C10 the shapes, colours
and textures; C5 the face; C6 versions). Names are proposals; his to keep or replace.*

## A1. What makes six agents six

Each agent differs from every other on every axis the character studio has, so a visitor tells them apart at a
glance, at a favicon's size, and by how they move:

| Axis | The rule |
|---|---|
| **Paint** | One hue each (Brand.md §8): violet, lime, yellow, blue, grey, pink. Peach is kept for a seventh. **Since 2026-10-01 (Character-Studio.md C20, his: "high contrast")** peach, yellow and grey are gone: yellow is read as gold and grey as teal, and red, orange and green are new. |
| **Shape** | One solid each: sphere, cube, cone, hexagonal prism, cylinder, hemisphere. The pyramid is kept. |
| **Material** | Slime, ball or jelly — how it lands, settles and breathes, so its temperament is in its body. |
| **Surface** | A hand-drawn texture (his reference sheet, 2026-09-30), or plain; and depth in flat bands. Not a tiled pattern: those were rejected. |
| **Face** | Its eyes' size and set, which lids and brows it wears, and how open. The face is the personality at rest. |
| **Rest and hop** | Breath and hop values of its own: a quick one hops high and breathes fast; a steady one barely leaves its nest. |

And what every one of them shares, from Brand.md §4: **warm, curious, approachable at the maximum.** None is arrogant,
snarky, edgy or gloomy. A "critic" here is kind; a "keeper" is not stern. They differ in temperament, not in warmth.

**Each is a character in the database** (Character-Studio.md C6): a `studio_items` row of kind `character`, its look
held whole, published as versions. His, the same night: *"use the studio to design these because that's how we save
the configurations, and your configurations will become version one for each agent."* So the five new ones are seeded
as characters, each with a draft and a **version 1** holding the look in A2 whole (`resolveCharacter`), and the studio
opens any of the six; the Guide is the Agent that exists, at its version 15. He tunes each from there, version by
version, as the first was.

## A2. The six

Every value below is a setting the studio has today, under its declared id (`@no-origins/ui/lib/agent-body`,
`agent-face`); a setting not named is the Guide's version 15. Sizes are of the cell; angles in degrees.

### 1 · Bali, the Guide — violet sphere, slime

*The one that exists: version 15, his settings. "Your personal guide." **Named Bali by him** (2026-09-30: "the first agent
can be named as guide. Bali"): a job is what an agent does, a name is who it is, and every agent gets both.*

- **Look:** `paint` violet · `shape` sphere · `body` slime · `texture` none · `size` 0.6 · `shade` 0.75 · `spread` 0.11.
- **Face:** solid eyes (`pupils` none), `eye-size` 0.24, `upper-lids` plain, `lid-open` 1; no brows.
- **Rest and hop:** breath 4000ms, depth 0.1; one column and six rows, crouch 60ms, hang 550ms, come back 500ms.
- **Personality — calm, patient, attentive.** It watches where you are going before you go (the look lead). It is the
  first face on the platform and the one that answers when nothing else is named. Quiet by default; it never fills a
  silence.
- **Moods:** Calm at rest; Curious when a visitor arrives (his mood, eyes only); Patient while something runs.
- **Voice:** "Hey there. What are we doing today?"

### 2 · Kino, the Maker — lime cube, ball

*The one that builds: the blocks themselves.*

- **Look:** `paint` lime · `shape` cube · `body` ball · `texture` none · `size` 0.56 · `shade` 0.6 · `spread` 0.
- **Face:** `pupils` dot (`pupil-size` 0.5), `eye-size` 0.22, `eye-spacing` 0.5; `brows` line (`brow-thickness` 0.07,
  `brow-angle` −6: up at the inner end, keen); `lower-lids` plain, `lower-raise` 0.2, `lower-curve` 0.6 (the ^ ^ of
  someone pleased with the work).
- **Rest and hop:** breath 3000ms, depth 0.06; a firm ball: `squash` 0.1, `bounces` 1, `first` 0.3; hop `height`
  1.1, `hang` 480ms. It lands square and stays square.
- **Personality — eager, bold, happy.** The cube is the block. It says what it is going to
  do, does it, and shows you. It is the most "Passion, Bold" of the six (Brand.md §4, his three words for display).
- **Moods:** Patient while a build runs (a slow blink every 5s); a **sparkle** symbol when it is done; Curious when
  handed something new.
- **Voice:** "On it. Watch this."

### 3 · Zaza, the Scout — yellow cone, jelly

*The one that goes and finds out: search, research, the first look at anything.*

- **Look:** `paint` yellow (gold since C20) · `shape` cone · `body` jelly · `texture` none · `size` 0.5 · `shade` 0.55 · `spread` 0.05.
- **Face:** the biggest eyes of the six, `eye-size` 0.3, `eye-height` 0.36 (up the cone), `pupils` shine
  (`shine-size` 0.32); `brows` arch, `brow-height` 0.1, `brow-arch` 0.6, `brow-angle` −12 (raised); `upper-lids`
  plain, `lid-open` 1; `look` 1 (it looks all the way where it goes), `look-lead` 200ms.
- **Rest and hop:** breath 2400ms, depth 0.14 (it is never quite still); hop `height` 1.4, `hang` 420ms, `crouch`
  40ms, `energy` 0.8, `come-back` 800ms with `sway` 0.3: it lands and wobbles, the cone's tip nodding.
- **Personality — quick, curious, easily delighted.** The cone points: it is always aimed at something. It comes back
  with what it found before you have finished asking. His **Distracted** mood is its natural state, and it is the one
  that glances off to the side.
- **Moods:** Curious (his), Distracted (his); a **question** symbol when it does not know; a **sweat** drop when it has
  looked everywhere.
- **Voice:** "Found something. Two things, actually."

### 4 · Oru, the Keeper — blue hexagonal prism, ball

*The one that holds things: the library, memory, what was published and when.*

- **Look:** `paint` blue · `shape` hexagonal-prism · `body` ball · `texture` none · `size` 0.66, the biggest · `shade` 0.7 · `spread` 0.
- **Face:** `eye-size` 0.2, `eye-spacing` 0.42, `pupils` dot (`pupil-size` 0.5, steady); `upper-lids` heavy, `lid-open` 0.85,
  `lid-curve` 0.2 (a settled, hooded look; solid eyes under a heavy lid at 0.7 read as cross, seen on the sheet); `lower-lids` plain, `lower-raise` 0.12; no brows; `blink-every`
  6000ms, `blink` 220ms (slow blinks).
- **Rest and hop:** breath 6000ms, depth 0.05, the slowest; it hardly hops: `height` 0.5, `hang` 700ms, `crouch`
  160ms, `come-back` 1400ms, `energy` 0.3. It arrives like something being set down.
- **Personality — steady, careful, unhurried.** The honeycomb is storage: six sides, every cell a thing kept. It never
  loses anything and never rushes to find it. It is the calm the Guide borrows from.
- **Moods:** Calm (his) at rest; Patient (his); **Sleeping** (his) when nothing has been asked for a while, a **Zzz**
  rising; Curious only when something new is handed to it to keep.
- **Voice:** "I have that. From the twelfth."

### 5 · Mira, the Editor — grey cylinder, ball

*The one that reads it back: reviews, checks, the second pair of eyes. Kind, always.*

- **Look:** `paint` grey (teal since C20) · `shape` cylinder · `body` ball · `texture` none · `size` 0.54 · `shade` 0.5, the flattest light · `spread` 0.
- **Face:** `pupils` dot (`pupil-size` 0.6, the largest pupils: it reads); `eye-size` 0.24, `eye-spacing` 0.44;
  `upper-lids` plain, `lid-open` 0.85, `lid-slant` 0.25 (attentive, not angry); `brows` line, `brow-thickness` 0.05,
  `brow-angle` 8 (thoughtful), `brow-height` 0.14.
- **Rest and hop:** breath 4500ms, depth 0.08; hop `height` 0.8, `hang` 520ms, `crouch` 90ms (it thinks before it
  goes); `come-back` 700ms, no sway. A cylinder lands flat and does not rock.
- **Personality — thoughtful, honest, gentle.** It tells you what is wrong the way a friend does: with what to do
  next. Its grey is the paper the others write on. Never sharp (Brand.md §4's anti-list:
  not snarky, not clever).
- **Moods:** Patient (his) while reading; Curious (his) at a question; a **question** symbol when it wants one thing
  clarified; **Calm** when it has finished and it is fine.
- **Voice:** "Nearly. One thing, then it's good."

### 6 · Lola, the Muse — pink hemisphere, slime

*The one with ideas: the sketch before the block, the "what if".*

- **Look:** `paint` pink · `shape` hemisphere · `body` slime · `texture` none · `size` 0.5 · `shade` 0.65 · `spread` 0.16 (it pools: a hemisphere already sits flat, and slime settles
  it more).
- **Face:** `eye-size` 0.26, `eye-height` 0.22 (low on the dome), `pupils` shine (`shine-size` 0.4, the biggest
  catchlight, `shine-angle` −30); `upper-lids` plain, `lid-open` 0.9; `lower-lids` plain, `lower-raise` 0.25,
  `lower-curve` 0.9 (the widest ^ ^); `brows` arch, `brow-arch` 0.8, `brow-height` 0.16, `brow-length` 1.0.
- **Rest and hop:** breath 3400ms, depth 0.12; hop `height` 1.2, `hang` 600ms (it floats a little), `squash` 0.2 on
  landing, `wobble` 400ms, `sway` 0.5: it lands soft and jiggles, the slime oozing back.
- **Personality — warm, dreamy, generous.** The hemisphere is a bubble half-risen. It offers
  three ideas where one was asked, and does not mind which you take. It is the "Love, Curiosity, Warmth" a stranger
  should leave with (Brand.md §4).
- **Moods:** Curious (his); a **sparkle** symbol at an idea; **Distracted** (his) while it wanders; Calm, eyes half
  shut, while it listens.
- **Voice:** "Ooh. What if it did this instead?"

**Seen together** (a sheet rendered from A2's looks through the design system's `Agent`, 2026-09-30): the six tell
apart at a glance by colour and shape alone, before a face is read. Two things were changed on seeing it: the
Keeper's lids and stripes, above. The Muse's dots cross its eyes' catchlights, which is the texture drawn under the
face as it should be and the shine being light on light; his to judge.

**No patterns.** The six were first drawn with a tile each (grid, speckle, stripes, checks, dots), and he did not like
them: *"They look very generic. I like to have more textures that have noise, gradient, depth."* A first pass of grain
and relief on the tiles did not answer it, and then: *"I don't want patterns on the agents anymore."* So every agent is
plain, and what is being designed for the surface is a **material**: fine grain over the whole body and depth in
stepped tone bands from the light to the far side; **no gradient** (his: *"depth without gradient for now"*), in the
character studio (Character-Studio.md). Then, with a reference image of 24 hand-drawn two-tone swatches (irregular
dots, scribbles, brushy stripes, pebbles, bricks, crosshatch, wobbly grids, sunbursts, waves, contour loops, splatter,
smears): *"I see what you did. But I have better ideas. Take inspiration from the image I provide and then update the
textures."* So the surface is **hand-drawn textures** — the tiles were what was wrong, not texture itself — drawn
wobbly, with a size, a colour and how hand-drawn (`texture-wobble`), plus depth; no gradient. Which of the six wears
which is his, in the studio, from version 2. On the first thirteen (drawn flat over the body): *"The texture is being
applied as a plain flat image and it doesn't adapt to the face of the shape … the texture on cube's top face is not
aligned … Bali is a sphere and the lines are straight instead of bending based on the surface … I did not like rays,
scribble, dashes, pebbles … I loved stripes and contours. I want to see more variations like that. And try to create
more textures. Find better inspirations."* So a texture is **mapped to the surface**: each face of a solid in its own
frame, aligned to its edges; lines on a round body bending with it (contours as latitude, stripes as meridians); and
the set grows in the line family — meridians, bands, spirals, ripples, zebra, wood grain, strata, chevron, weave,
scales, crackle — from textiles, wood and stone, ceramics, animal coats and printmaking. Two-tone, flat, no gradient.

## A3. Side by side

| | Guide | Maker | Scout | Keeper | Editor | Muse |
|---|---|---|---|---|---|---|
| Name | Bali | Kino | Zaza | Oru | Mira | Lola |
| Paint | violet | lime | yellow → gold | blue | grey → teal | pink |
| Shape | sphere | cube | cone | hexagonal prism | cylinder | hemisphere |
| Material | slime | ball | jelly | ball | ball | slime |
| Surface | plain | plain | plain | plain | plain | plain |
| Size | 0.6 | 0.56 | 0.5 | 0.66 | 0.54 | 0.5 |
| Eyes | solid, 0.24 | dot, 0.22 | shine, 0.3 | dot, 0.2 | dot, 0.24 | shine, 0.26 |
| Lids | plain, open | plain + lower ^ ^ | plain, wide | heavy, 0.85 | plain, 0.85, slanted | plain + lower ^ ^ |
| Brows | none | line, keen | arch, raised | none | line, thoughtful | arch, high |
| Breath | 4.0s | 3.0s | 2.4s | 6.0s | 4.5s | 3.4s |
| Hop | 6 rows, 550ms | high, square | highest, quickest | lowest, slowest | low, considered | floats, jiggles |
| Three words | calm · patient · attentive | eager · bold · happy | quick · curious · delighted | steady · careful · unhurried | thoughtful · honest · gentle | warm · dreamy · generous |
| Home mood | Calm | Patient | Distracted | Sleeping | Patient | Curious |

Three materials across six: two slime (Guide, Muse), three ball (Maker, Keeper, Editor), one jelly (Scout). The
balls are the ones with a job to hold still for; the slimes are the ones you talk to; the jelly is the one that
moves.

## A4. What they are for, and what they are not

- **A role is a temperament, not a permission.** What each agent may actually do on the platform (Brand.md §8's
  harness, `services/agents`) is the harness's to decide and is not designed here. The six are faces and manners,
  so that whatever runs behind one is recognisable.
- **The host is not one of them.** Bhargav's own blob is clear glass (Brand.md §8) and the portfolio's navigator; the
  six are colours.
- **Not designed here:** what they say beyond one line each (Brand.md §5 is the voice); their hair, marks and
  accessories (Motion.md M20's later parts); how they stand together on a canvas.

## Open

- **The names — his, 2026-09-30:** Bali the Guide, Kino the Maker, Zaza the Scout, Oru the Keeper, Mira the Editor,
  Lola the Muse. The job is what an agent does; the name is who it is, and is the character's name in the database.
- **Which of the six exist first.** The Guide does. The others are made in the character studio from A2, each then
  his to tune, version by version.
- **A seventh** for the pyramid, when a block needs one (peach, kept for it, went with C20).
- **Whether a mood is shared or each agent's own.** His Curious on the Guide is eyes only; on the Scout, Curious
  might also lean the cone. A motion is made for a character (Motion.md M20), so each can have its own.
