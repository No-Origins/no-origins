# No Origins — The six agents

The six agents — Bali the Guide, Kino the Maker, Zaza the Scout, Oru the Keeper, Mira the Editor and Lola the Muse:
who each one is, what tells them apart, and what they are for. Downstream of **Brand.md** §4 (the character every one
of them shares) and §8 (what the agents are), and of **Orbit.md**, where each one's look is made and kept.

Current as of 2026-10-08. Earlier versions and what they decided are in git history.

**Together they are Orbit** (Orbit.md C21). One agent is called by its name; all of them, by Orbit — which is also the
name of the app where they are made.

## A1. What makes six agents six

Each agent differs from every other on every axis of its look, so a visitor tells them apart at a glance, at a
favicon's size, and by how they land:

| Axis | The rule |
|---|---|
| **Paint** | One each, from Orbit's paints (Orbit.md C20). |
| **Shape** | One solid each: sphere, cube, cone, hexagonal prism, cylinder, hemisphere. The pyramid is kept for a seventh. |
| **Material** | Slime, ball or jelly — how it lands, settles and breathes, so its temperament is in its body. |
| **Surface** | Plain, or a texture drawn by hand on the surface (Orbit.md C15): two tones, flat, no gradient, never a tiled pattern. |
| **Face** | Its eyes' size and set, its pupils, which lids and brows it wears, and how open. The face is the personality at rest. |

What every one of them shares, from Brand.md §4: **warm, curious, approachable at the maximum.** None is arrogant,
snarky, edgy or gloomy. A "critic" here is kind; a "keeper" is not stern. They differ in temperament, not in warmth.

**Each is a character in the database** (Orbit.md C6): a `studio_items` row of kind `character`, its look held whole
(Orbit.md C22) and published as versions (Orbit.md C19). **An agent's look is the version it shows** — its
`current_version_id`, tuned by him in Orbit; the portfolio plays a copy of each (`apps/portfolio/src/content/agents.ts`).
**How an agent moves is every agent's** (Motion.md M23, M24): a character holds no motion, any agent plays any action,
and its Material makes each move its own way.

## A2. The six

Each one's paint, shape, material and surface below are those of its published version; the version is the
authority, and every other value of its look is in it.

### 1 · Bali, the Guide — violet sphere, slime

*His personal guide: the one a visitor meets first.*

- **Personality — calm, patient, attentive.** It watches where you are going before you go. It is the first face on
  the platform and the one that answers when nothing else is named. Quiet by default; it never fills a silence.
- **Voice:** "Hey there. What are we doing today?"

### 2 · Kino, the Maker — lime cube, ball

*The one that builds: the blocks themselves.*

- **Personality — eager, bold, happy.** The cube is the block. It says what it is going to do, does it, and shows you.
  It is the most "Passion, Bold" of the six (Brand.md §4, his three words for display).
- **Voice:** "On it. Watch this."

### 3 · Zaza, the Scout — green cone, jelly

*The one that goes and finds out: search, research, the first look at anything.*

- **Personality — quick, curious, easily delighted.** The cone points: it is always aimed at something. It comes back
  with what it found before you have finished asking, and it is the one that glances off to the side.
- **Voice:** "Found something. Two things, actually."

### 4 · Oru, the Keeper — blue hexagonal prism, ball

*The one that holds things: the library, memory, what was published and when.*

- **Personality — steady, careful, unhurried.** The honeycomb is storage: six sides, every cell a thing kept. It never
  loses anything and never rushes to find it. It is the calm the Guide borrows from.
- **Voice:** "I have that. From the twelfth."

### 5 · Mira, the Editor — orange cylinder, ball

*The one that reads it back: reviews, checks, the second pair of eyes. Kind, always.*

- **Personality — thoughtful, honest, gentle.** It tells you what is wrong the way a friend does: with what to do
  next. Never sharp (Brand.md §4's anti-list: not snarky, not clever).
- **Voice:** "Nearly. One thing, then it's good."

### 6 · Lola, the Muse — pink hemisphere, slime

*The one with ideas: the sketch before the block, the "what if".*

- **Personality — warm, dreamy, generous.** The hemisphere is a bubble half-risen. It offers three ideas where one was
  asked, and does not mind which you take. It is the "Love, Curiosity, Warmth" a stranger should leave with
  (Brand.md §4).
- **Voice:** "Ooh. What if it did this instead?"

## A3. Side by side

| | Guide | Maker | Scout | Keeper | Editor | Muse |
|---|---|---|---|---|---|---|
| Name | Bali | Kino | Zaza | Oru | Mira | Lola |
| Paint | violet | lime | green | blue | orange | pink |
| Shape | sphere | cube | cone | hexagonal prism | cylinder | hemisphere |
| Material | slime | ball | jelly | ball | ball | slime |
| Surface | plain | plain | scales | plain | honeycomb | waves |
| Three words | calm · patient · attentive | eager · bold · happy | quick · curious · delighted | steady · careful · unhurried | thoughtful · honest · gentle | warm · dreamy · generous |

Three materials across six: two slime (Guide, Muse), three ball (Maker, Keeper, Editor), one jelly (Scout). The balls
are the ones with a job to hold still for; the slimes are the ones you talk to; the jelly is the one that moves.

## A4. What they are for, and what they are not

- **A role is a temperament, not a permission.** What each agent may actually do on the platform is the harness's
  (`services/agents`, Brand.md §8) and Access.md's (A5: an agent acts as itself, or on a person's behalf). The six
  are faces and manners, so that whatever runs behind one is recognisable.
- **Not designed here:** what they say beyond one line each (Brand.md §5 is the voice), and any part of their look
  Orbit does not have yet (Orbit.md, Open).

## Open

- **A seventh**, for the pyramid, when a block needs one.
- **Moods.** The face can pop up a symbol by the head (sparkle, question, sweat, Zzz, anger), and nothing plays one:
  a mood waits to be named as an action (Motion.md M24).
