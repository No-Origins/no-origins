# @no-origins/docs — the knowledge base

Every document that **decides** something about No Origins: the brand, the design system and the apps. Nothing in
this package builds, exports or ships; it is a workspace package so the knowledge has one address.

Current as of 2026-10-08. Earlier versions and what they decided are in git history.

## The rules

**Every document says only what is in force today.** When a decision changes, the document is rewritten; git keeps
what it said before. A document holds no record of what was tried, withdrawn or replaced, and no stubs for rules that
went.

**A rule keeps its ID for as long as it stands, and IDs are never renumbered** — `Grid.md D39`, `Motion.md M24`,
`Orbit.md C22`. Source comments cite them, so a gap in a document's numbering is a rule that went.

**Cross-references are bare filenames, never paths** — `Brand.md §1`, `Access.md A11`. That is how the documents cite
each other and how the source files cite them, so moving a file breaks nothing. Keep it that way.

**The documents say what he decided; the code says what exists.** Where the two disagree, the document is the
decision and the code the thing to fix — unless the decision changed, in which case the document is rewritten. The
root CLAUDE.md is the authority on how the design system is built and used.

## Reading order

New to the repo: **Brand.md** → the root **CLAUDE.md** → the CLAUDE.md of the app you are touching → that app's
document below.

## The map

Each document marks what is still open inside it with **Open:**; the open items below are the main ones.

### `brand/` — what No Origins is

| Document | Decides | Status |
|---|---|---|
| **Brand.md** | What No Origins is, its name, who it is for, its character and voice, the five principles every block is checked against, and the brand's decisions: the mark, the material (no glass, no gradients), the agents' name. | **Live** · Open: what the name means; the fonts, never decided in a document; whether the brand is still light-first |
| **Agents.md** | The six agents — Bali the Guide, Kino the Maker, Zaza the Scout, Oru the Keeper, Mira the Editor, Lola the Muse: who each is, what tells them apart, what they are for. Each one's look is its published version in Orbit. | **Live** · Open: a seventh, for the pyramid; moods |

### `system/` — the design system

| Document | Decides | Status |
|---|---|---|
| **Grid.md** | The base layout: the cell is decided and the counts derive, `cell · gap` per breakpoint; one radius, half the cell; boxes placed by coordinate; pages, the pager and the turn; the theme's sheet; the pointer; the intro the agents play. | **Live** · Open: which field a layout is authored on, and the packer |
| **Slots.md** | The layer between the grid and the components: a slot holds one component or sub-slots on its cells; its tokens are fill · inset · alignX · alignY, with no margin; the registry. | **Live** · Open: what a trigger's slot shows; slots as named organisms, the next document |
| **Spacing.md** | How much room goes between things and inside them: a base of nine steps, and on it every space named by its job (inset, inset-tight, inset-pill, stack, inline, gutter); a box's padding clears its round corner; between boxes, the gutter and no margin. | **Live** · Open: the components still off the base, and a lint |
| **Type.md** | The eight typography roles — hero · display · title · heading · label · body · caption · mono — with tone and alignment the only other knobs; `Text` is the component. | **Live** · Open: line length; a second body size; a page-title role |
| **Motion.md** | How the system moves: motion as `--motion-*` tokens in families; the motion studio where it is designed, and its bench holding only what he names; the motions he decided — movement, loading, hyper focus, focus mode, the slider's grip; the agents' actions and the intro they play; liquid. | **Live** · Open: enter · exit, the slider's steps and liquid are on the bench, not decided; the grid's own motion is not on the layer; presets on the older families and the `/concepts` pages are his to decide |

### `apps/` — the applications

| Document | Decides | Status |
|---|---|---|
| **Portfolio.md** | `hiddenstack.no-origins.com`, the portfolio on the grid: its host and the redirect from `bhargav`, the profile, the work, the projects and the links, one agent's section a page turned by the agents (P24), the status pill (P25). | **Live** · Open: LinkedIn's URL |
| **portfolio/Brainstorming.md** | The portfolio's UX foundation: who visits, what each needs in the first thirty seconds, their journeys, and the questions those raise. Mapped on the canvas `Brainstorming.tldraw` beside it. | **Live** |
| **Orbit.md** | `orbit.no-origins.com`: Orbit, the agents together, and the app where each agent's look is made — the stage, the body, its shape, paint, texture and face, a character saved as a draft and published as versions, what a character holds, controls open to everyone and publishing his. | **Live** · Open: what stands round the stage; the appearance properties still to name; the `/hiddenstack` page is his to decide |
| **Home.md** | `home.no-origins.com`: the 3D model of the house he is building — three.js with the house written as code, behind the sign-in, the house kept out of the public repository (H4), an exact model with realism left to the image models, and the home tour (H9). | **Live** · Open: north, his to give; moving the Blob store beside the functions, his call |
| **Cinema.md** | The Cinema Studio: he directs, and a cast and crew of agents build 3D sets in three.js and shoot them, exported as video and stills, the worlds kept live to explore — Orbit's agents recreated in 3D as cast and brought to life by agents, the libraries (every entity with its own controls, each built from his description), presets, shots, scenes, workflows and the crew's departments (F8: how he directs through Claude). Brand.md does not bind it. | **Live** · signed off 2026-10-09, no code yet · kept out of git (F8) · agents keep tiered memory and every session is recorded, for training small models later (F9) · characters made in a factory from roles and departments (F10) · Open: the sound's source, the cast in 3D |
| **Status.md** | `status.no-origins.com`: where every app stands, one public page — a row an app, with its state and a cell of liquid as full as it is far along; no key and no database. | **Live** · Open: what "done" means and who moves it; states beyond "in progress" |
| **Admin.md** | `admin.no-origins.com`, the control surface: its home and Settings, and the pages where he manages people (Access.md A7); *the page is static, a component may be live* (§0.6); one sign-in for every app and its login host, `auth.no-origins.com` (§8.4). | **Live** · Open: the gates still send people to their own `/sign-in` until each points at the login host |
| **Access.md** | Who may do what across No Origins, people and agents alike: principals, the permissions the apps declare, the roles he makes and who holds them; where each is checked; the admin's People, Roles, Invitations and Audit pages; the audit log; the order it is built in (A11); the admin's second factor (A12). | **Live** · steps 1–4 of A11 built, step 5 being built · Open: how an agent's request names its delegation to the database (step 6) |

## Adding one

A new document belongs here if it **decides** something durable. Working notes, session summaries and run-this-here
instructions do not — those stay next to what they describe. Put it in the folder that matches its subject, add a row
to the map above, and open it the way every document here opens: its title, a line or two on what it decides, and
the date it is current as of.

## What stays put

- **`CLAUDE.md` and `AGENTS.md`** at the repo root and in each app — the harness loads these by directory, so they
  only work where they are.
- **`supabase/README.md`** and **`apps/portfolio/README.md`** — how to run that thing, read in that folder.
- **`packages/ui/CHANGELOG.md`** — owned by changesets.
