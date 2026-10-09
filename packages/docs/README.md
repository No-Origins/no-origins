# @no-origins/docs — the knowledge base

Every document that **decides** something about No Origins lives here: the brand, the design system, its
two libraries, the admin, and the records of what was tried and dropped. Nothing in this package builds,
exports or ships — it is a workspace package so the knowledge has one address instead of eight loose files
at the repo root.

**These are not notes.** Each one was written to settle a question, and where it is still current, code is
checked against it rather than the other way round. Fifty-odd source files cite them in comments
(`Design-System.md §3`, `Atomic.md D10`). Which are current and which are not is the next section — read it
before you act on anything in `system/`.

## Read this first

**The design system these documents describe was deleted on 2026-09-16.** `@no-origins/ui` was rebuilt on
shadcn/ui (style `radix-sera`, base `radix`) and is 2.0.0; the hand-written atoms, molecules, organisms,
templates, registry, blob, patterns and CSS layers of 1.0 are gone. Design-System.md, Atomic.md and
Patterns.md were written for that system and have **not** been rewritten — **do not follow them for
component work.** The root CLAUDE.md is the authority on the system as it stands today.

What survives the rebuild is everything upstream of components: what No Origins is and who it is for
(Brand.md), the avatar brief (Character.md), and what the admin is meant to do (Admin.md). **Grid.md**, **Slots.md** and **Type.md** are new since,
and are the `system/` documents written for the system as it stands — it is **versioned**: `Grid.md` is a pointer,
`Grid-v2.md` is current and `Grid-v1.md` is the record of the version before. Read those as live. Read the rest as the record of a system that was built, released and replaced — which is worth
keeping, because the next system inherits the decisions rather than the code.

**The composer and the admin's quests were removed on 2026-09-23** (Grid-v2.md D30, Slots.md S7, Admin.md §0.7). The
grid renders and nothing in the system edits it; a page is content data arranged on the live field. Wherever a live
document still describes the composer, a palette, an export or a quest, the rule it sits in is marked withdrawn.

## Reading order

New to the repo: **Brand.md** → the root **CLAUDE.md** → the CLAUDE.md of whatever app you are touching.
Reach for `system/` when you want to know *why* something was decided, never for *how it is built now*.

## The map

### `brand/` — what No Origins is

| Document | Decides | Status |
|---|---|---|
| **Brand.md** | What the platform is, the name, who it is for, voice, principles, the eleven brand decisions. Written 2026-09-09 from the brand interview; Bhargav's own words are quoted throughout. | **Live** · the source everything else is downstream of. §8–§9 (visual hypotheses, the v1 portfolio block) are 1.0-era |
| **Agents.md** | The six agents — Bali the Guide, Kino the Maker, Zaza the Scout, Oru the Keeper, Mira the Editor, Lola the Muse — each a paint, a shape, a material, a texture, a face and a temperament, as looks for Orbit (A2) and side by side (A3). Designed 2026-09-30, his ask; each is version 1 of its character. | **Live** · all six in Orbit at version 1; their textures being redone as materials |
| **Character.md** | The brief for Bhargav's illustrated avatar — likeness, one construction, the renderings and framings still to be picked. | **Live** · §9 open, awaiting the Character Studio pick |

### `system/` — the design system

| Document | Decides | Status |
|---|---|---|
| **Grid.md** | Nothing — it is the **pointer** to the current grid document, and says how a `Grid.md Dn` citation resolves across versions. Cite `Grid.md`, read the version it names. | **Live** · repointed whenever the direction changes |
| **Grid-v2.md** | The base layout of 2.0, second direction: **the cell is decided, the counts derive** (D12, 2026-09-21). Per breakpoint two numbers, `cell · gap` (D13, D15); the remainder is centred margin (D14); what each of v1's D1–D11 becomes; the spacing scale; four kinds of box (D21), mobile-first derivation (D22, D25), even counts (D26), the pager and the turn (D27, D29), the theme's sheet (D28), the intro that draws the grid in and is the loader (D31, 2026-09-24) and the same ripple between pages (D32, 2026-09-25), both on the portfolio, the pointer as a ring over a lit cell (D34, 2026-09-25), violet since D43 (2026-09-26), the turn that washes the page away with the ripple rather than shrinking the boxes (D37, 2026-09-25), the field painted by one painter in a worker rather than built from ~1,300 animated cells (D38, 2026-09-25), **one radius, half the cell, on every box** — circles, pills and a cell's curve at the corners, where it was 0 (D39, 2026-09-26) — the cell drawn as a circle, cut by the front as a disc and then its tile (D40, 2026-09-26), the cells round a moving pointer glowing (D41, withdrawn the same day), ↑ ↓ on the keyboard pressing the arrows that wear them (D42), and the front's edge the tip of a circle where it was a cone (D44, 2026-09-27); then the loader loading every page in place of the ripple (D48, 2026-09-27), and no loader on any page (D49, 2026-09-30). §8 also records the **composer** (D16–D20: Compose on every page, palette, inspector, two-block export), **removed 2026-09-23 by D30** — the grid only renders. | **Live · current** · field, numbers and the six principles (§5) decided 2026-09-21; the composer withdrawn 2026-09-23 (D30); the code is on it |
| **Grid-v1.md** | The first direction, 2026-09-18 → 2026-09-21: the square cell, the field **per breakpoint**, pages, derivation, the frame, D1–D11, and the table of counts that was never filled. A one-page summary sits in front of the full unedited text. | **Superseded 2026-09-21** by Grid-v2.md · the code moved the same day; a `Grid.md D1`–`D11` citation anywhere names its rules |
| **Slots.md** | The layer between the grid and the components: a **slot** holds one component or sub-slots on the same cells; tokens fill · inset · alignX · alignY, no margin (S3); the component registry in the package (S6), now one entry, the pager's arrows; how the composer placed and entered slots (§4), withdrawn with it (S7, 2026-09-23). Opened 2026-09-21. | **Live** · S1–S7; S7 withdraws S4, §4 and the palette halves of S1 and S6; organisms = slots with sub-slots, named ones are the next document |
| **Type.md** | The seven typography roles — display · title · heading · label · body · caption · mono — with tone and alignment as the only other knobs, read off the showcase's pages rather than a ratio; `Text` is the component. Opened 2026-09-21. | **Live** · T1–T2 decided; line length and a second body size open |
| **Motion.md** | How the system moves, and the motion studio (`apps/motion`, motion.no-origins.com) where it is decided: the inventory of every motion and whose numbers they are, motion as `--motion-*` tokens in globals.css (M3), five families — surface · panel · state · disclose · grow (M4) — the studio on the grid with the output in a centre section and the jigs as slots (M5), what a jig is (M6), a pick becoming the default (M7), portals that take a container (M8), the bench holding only what he names — first, movement: how one-cell elements move when one grows (M9) — and round 1's presets. Opened 2026-09-27. | **Live** · the component families on tokens, none his yet, off the bench; **movement decided 2026-09-27**, his settings in globals.css, the work menu's adoption waiting for his word; the grid's motion not on the layer (§5) |
| **Design-System.md** | The values: the Sketch palette, the one flat surface, the blob, type, space, motion, layout, theming axes, the package. Was the spec 1.0 implemented. | **Historical** · describes the deleted system; §8 was already superseded before that |
| **Atomic.md** | The same system organised by Atomic Design, every token and component given a verdict, and the thirteen rules (D1–D13) that turned it into a release. | **Historical** · D1–D13 are the best record of *why*; the components they govern no longer exist |
| **Patterns.md** | How No Origins drew pictures — a pattern is a function returning SVG, never a bitmap. Ten principles, the generator grammar, the library of eighteen. | **Historical** · the generator went with 1.0; the ten principles outlive it. Renamed from *Illustrations.md* 2026-09-14 |

### `apps/` — the applications

| Document | Decides | Status |
|---|---|---|
| **Portfolio.md** | `hiddenstack.no-origins.com` — the portfolio on the grid: the host and the redirect from `bhargav` (P1), a page as an arrangement on the live field (P2), the empty top row (P3), the profile card and its spans (P4–P5), the content in his voice (P6). Opened 2026-09-21. | **Live** · the first screen is built; the rest of the résumé is §4 |
| **portfolio/Brainstorming.md** | UX design, user personas, journey progression, and brainstorming questions for the portfolio. Accompanied by the live canvas `Brainstorming.tldraw`. Opened 2026-09-24. | **Live** · active UX foundation |
| **Orbit.md** | `orbit.no-origins.com` — Orbit, what the agents are called together and the app where they are made (C21, 2026-10-01; the character studio until then): the agents' appearance, where the motion studio is their motion (C1); the stage, one cell of the field grown to a radius of three on its centre (C2); the sphere of Motion.md M17 sitting in it, still, as the first agent (C3). Not Character.md §9's 1.0 artifact, which had its first name. Opened 2026-09-30. | **Live** · the cell and the agent built; what stands round it, and the appearance properties, his to name |
| **Home.md** | `home.no-origins.com` — **home**, his name:  the 3D model of the house he is building, made before construction from his dimensions and ideas, and the realistic pictures image models make from it. Covers what it is for (H1), three.js with the house written as code (H2), where it lives (H3), keeping the house out of the public repo (H4), an exact model with realism left to the image models (H5), what the description holds (H6), and the home tour (H9) — the plan itself and its versions (H7, H8) being the house's, in its private `Home-plan.md`: fixed cameras, a walk between them at Play, the realistic pictures hanging in the rooms they were made from. Opened 2026-10-02. | **Live** · the app since 2026-10-02, the tour since 2026-10-03 (H9); **the house is not in the repository** (H4, built 2026-10-06): its description, pictures and record (`Home-plan.md`, H7–H8) live in `apps/home/src/content`, gitignored, and in a private Vercel Blob store the site reads behind the sign-in; north his to give |
| **Cinema.md** | The **Cinema Studio**: he directs, and a cast and a crew of agents build 3D sets in three.js and shoot films in them, exported as video and stills, the worlds kept live to explore later. Covers what it is for (F1), Brand.md not binding it while the studio's own screen follows the system (F2), Orbit's agents recreated in 3D as cast (F3), the libraries, every entity with controls of its own and built from his description (F4), presets, shots, scenes and workflows (F5), the crew in departments (F6), where it lives (F7), how he directs through Claude (F8), what an agent is made of, its memory in tiers and every session recorded to train small models later (F9), and the factory that makes characters from roles and departments (F10). Opened 2026-10-09. | **Live** · signed off 2026-10-09, no code yet; its ideas, worlds, shots and agents are kept out of git (F8); the sound's source and the cast in 3D open |
| **Cinema-Agents.md** | How the Cinema Studio's agents work while they are Claude Code agents (Cinema.md F8): the procedure public as a skill and the agents private (R1), an agent as a folder in the tiers of Cinema.md F9 (R2), the factory making one that he names (R3), the brief that starts it (R4), everything going through Claude, direction's plan and the departments' own tracks (R5), the session record, partly written by the commands (R6), the day's review (R7), and what has to be built first (R8). Opened 2026-10-09. | **Live** · signed off 2026-10-09, no code yet; nothing open |
| **Status.md** | `status.no-origins.com` — **status**, his name: where every app of No Origins stands, one public page — a row an app with its name and host, its state and a cell of liquid as full as it is far along (Motion.md M25), 40% and in progress today, every one; the way in is the portfolio's pill (Portfolio.md P25). Covers what it is for (S1), the apps and their states as data (S2), the page (S3), where it lives — public, no key, no database, on the Vercel project `status` (S4) — and what is open (S5). Opened 2026-10-03. | **Live** · built and deployed 2026-10-03; what "done" means his |
| **Admin.md** | `admin.no-origins.com` — **§0.5 is the reset** (the schema cut to identity, the grid-of-cards home) and, as the record, **Quests** (the `quests` table, the compose dashboard); **§0.6 is Publishing** (the subdomain pipeline, the portfolio as quest host, and the rule *the page is static, a component may be live*); **§0.7 removed quests, 2026-09-23** — the routes, the table (`…_drop_quests.sql`), the seed — leaving identity, Settings and a home of three cards. Everything below is the superseded three-layer model, kept as the record. | **§0.7 live** · §0.5's reset and home stand, its quests withdrawn · §0.6's rule stands, its pipeline withdrawn with quests (never built) · the drop is applied locally, not to the hosted project · §1/§4/§6–§9 superseded (they described the deleted editor) · **§8.4 one login host, `auth.no-origins.com`, proposed 2026-10-06**, his to approve |
| **Access.md** | Who may do what across No Origins, people and agents alike: the four pieces — principal, permission, role, assignment (A2); the permissions the apps declare, finer from the start (A3); the Owner, the default Member and the roles he makes in the admin (A4); agents acting as themselves and on a person's behalf, never more than both may (A5); the gate, the server and the database each checking (A6); the admin's people, roles, invitations and audit pages (A7); the append-only audit log (A8); room for single items (A9); the tables (A10) and the order from today's three fixed roles (A11). Opened 2026-10-06. | **Proposed** · his answers in; nothing built until he approves it |

### `archive/` — kept as the record

| Document | Was | Why it is here |
|---|---|---|
| **Scene-Schema.md** | The document format the admin editor wrote and every project read. | **Superseded 2026-09-16** with React Flow (Atomic.md D11). The registry contract in §2–§3 survives in the package; the rest is the account of the first attempt. |
| **Handoff.md** | The state of things at the end of the v1 session, 2026-09-16. | A session record, true as of its date, not a standing decision. Its "How he works" section is still worth reading. |

## Two rules for using these

**Where two documents disagree, the newer one wins, and it says so.** Atomic.md supersedes Design-System.md
§9's flat component table; Atomic.md D10–D13 supersede what §3 and §8 said about glass, the canvas and the
rail. The root CLAUDE.md supersedes all of `system/` on anything to do with components. Every reversal is
recorded inside the decision that reversed it rather than by deleting the old text — which is why a
document being historical is not a reason to delete it.

**Cross-references are bare filenames, never paths** — `Brand.md §1`, `Atomic.md D11`. That is deliberate:
it is how the documents cited each other before this package existed and how fifty source files still cite
them, so the grouping above costs nothing and moving a file again breaks nothing. Keep it that way.

## Adding one

A new document belongs here if it **decides** something durable. Working notes, session summaries and
run-this-here instructions do not — those stay next to what they describe. On adding one: put it in the
folder that matches its subject, add a row to the table above, and name the documents it is a companion to
in its own opening italics, the way every document here already does.

## What deliberately stayed put

- **`CLAUDE.md` and `AGENTS.md`** at the repo root and in each app — the harness loads these by directory,
  so they only work where they are.
- **`supabase/README.md`** and **`apps/portfolio/README.md`** — how to run that thing, read in that folder.
- **`packages/ui/CHANGELOG.md`** — owned by changesets.
