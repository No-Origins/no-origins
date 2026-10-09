# No Origins — The Cinema Studio's agents

How an agent of the Cinema Studio, cast or crew, is made, kept, started, instructed, recorded and reviewed, while the
agents are Claude Code agents (Cinema.md F8). **Cinema.md** decides what they are: the crew in departments (F6), how
he directs (F8), what an agent is made of and how it grows (F9), and the factory (F10). This document decides how that
works, file by file and step by step.

**Signed off by him on 2026-10-09.** What is marked *his* he said in his own words; what is marked *mine* Claude
proposed and he agreed to, and it stays his to change.

Current as of 2026-10-09.

## R1. Two halves: the procedure is public, the agents are private

- *Mine:* **the procedure is a skill**, `.claude/skills/cinema/`, in the repository: how Claude makes an agent, starts
  it, instructs it, records it and runs the day's review. It holds no idea, shot or agent, so it can be public, and
  every session, Claude's or Codex's, follows the same steps.
- **The agents are private** (his, Cinema.md F8): every one of them, and everything it keeps, is in
  `apps/cinema/src/content/`, gitignored and kept out of every upload.
- *Mine:* **not `.claude/agents/`.** Claude Code's own agent definitions live in a folder the repository commits, so an
  agent is not one of them. Claude starts a plain agent and gives it everything it is, read from its folder (R4).

## R2. An agent is a folder

*Mine:* each agent is `agents/<id>/`, its parts in the tiers of Cinema.md F9:

| File | What it holds | Tier | Written by |
|---|---|---|---|
| `profile.md` | Its meta (name, cast or crew, role or department, the template and version it was made from, when, by whom), then its character in words | Core | The factory; its character by him |
| `look.json` | Its look, part by part (Cinema.md F10) | Core | The factory; then him |
| `controls.json` | Its own settings, typed, with its parameters: the model it thinks with, how hard it thinks, its core's cap | Core | The factory; then him, or Claude as he says |
| `core.md` | The learnings that matter most and what it must always remember, under its cap | Core | The day's review only |
| `core/<n>.md` | Every earlier core, kept, so a change can be gone back on | | The day's review |
| `learnings.md` | Every learning, each citing the sessions it came from | Archive, the core copying the top ones | The day's review |
| `memories/` | One memory a file, with an index: about him, the worlds and the shots it has worked on | Recent, then the archive | The agent, as it works |
| `sessions/<date>-<n>.jsonl` | One file a session (R6) | Recent, then the archive | As below; never edited |
| `reviews/<date>.md` | What each day's review changed, and why, and the day's measures (R7) | | The day's review |
| `artifacts/<session>/` | Its stills, contact sheets and clips | | The commands, as it renders |

- *Mine:* **tiers by age, nothing moved.** A session is recent while it is among the agent's last ten or is from the
  last seven days, and archive after; the files stay where they are, so nothing is lost moving them.
- *Mine:* **the factory's templates** are `factory/roles/<role>.md` and `factory/departments/<department>.md`, each
  with its version, its earlier versions kept beside it.

## R3. The factory makes an agent

*Mine:* when an idea needs someone who is not there yet, or he asks for one by role or department (Cinema.md F10):

1. Claude picks the template, or writes one from what he says if none fits, and he approves it.
2. The factory makes the folder: the profile with the template's version, the look's starting parts, a starting
   character, the template's controls, an empty core, and no sessions.
3. Claude shows him the agent, look and character, and he changes what he wants. Making an agent is not a session.
4. **He names it** (his).

## R4. Starting an agent

*Mine:* Claude starts an agent with one brief, built from its folder and the job, in this order:

1. its profile and character, its look, its controls;
2. its core;
3. its recent sessions, each in a few lines (what it was asked, what it did, his verdicts);
4. the commands its department may use (Cinema.md F6), and how to search its archive;
5. the job: the instruction, the world and the shot, and its session's file.

Its model and how hard it thinks come from its controls. It reads further into its archive only when the job needs it
(Cinema.md F9).

## R5. Instructing the cast and the crew

- *Mine:* **Claude stands between him and the floor** (Cinema.md F8). For a shot, Claude gives his words to direction,
  which answers with a plan: who does what, in what order, and what can go at once. Claude then starts each department
  on its part, the ones that can go at once together, and direction puts the shot together from what they made.
- **Everything goes through Claude, for now** (his): he speaks to Claude, never to an agent directly, until the
  studio's own harness is built (Cinema.md F8). *Mine:* so only Claude starts an agent, and every instruction passes
  through one place and is recorded. An agent
  that needs another department asks for it in its answer, and Claude passes it on.
- *Mine:* **a department writes only its own tracks, and the commands enforce it**: a command refuses a track outside
  the department of the agent calling it, so two departments cannot write the same thing even by mistake.
- *Mine:* **a cast member acts through its actor.** Direction tells the cast member what is wanted in words ("it
  hesitates, then runs"); the cast member's own agent turns that into its states and actions (Cinema.md F3).

## R6. The session record

**Every session is recorded: the instructions it was given and the controls it set** (his, Cinema.md F9). *Mine:* a
session is one JSON line an event, appended, never edited:

| Event | What it holds | Written by |
|---|---|---|
| `open` | The record's version, the agent, its template's version, its core's version, who instructed it, the film and the shot | Claude |
| `instruction` | Who from, and the words | Claude |
| `command` | The command, its values, the version of each control's declaration (Motion.md M20) | The commands |
| `render` | The artifact, its kind, its frame or its stretch of time | The commands |
| `say` | What the agent reported, in its own words, short | The agent |
| `ask` | Work it needs from another department | The agent |
| `close` | What it did, in a few lines | The agent |
| `feedback` | His words, on an artifact | Claude, whenever he gives them |
| `verdict` | Kept, changed or dropped, on an artifact | Claude, from what he says |

- *Mine:* **the commands write their own lines**, so the record of what was set can never be missing a control or
  misreport one: an agent cannot forget to record what it did.
- *Mine:* **feedback and verdicts come late**, often after the session has closed; they are appended to the session
  they are about, so an instruction, the controls that answered it and what he thought of them stay together. That is
  the training example (Cinema.md F9).
- *Mine:* **training is later, and nothing is built for it now.** The record's shape is what makes it possible: the
  sessions of everyone made from one template, read as instruction, controls and verdict, are that role's data.

## R7. The day's review

**At the end of each day the day's sessions are reviewed and each agent's core is updated; the review saves it, and he
reads it whenever he can** (his, Cinema.md F9).

- *Mine:* **when it runs**: when he asks ("review the day"), and otherwise at the start of the first session of a new
  day, for every day not yet reviewed. Nothing has to be scheduled, and no day is missed.
- *Mine:* **what it does**, for each agent that worked that day: reads its sessions, his feedback and verdicts; adds,
  sharpens or drops learnings, each citing its sessions; rewrites the core under its cap and saves it as the next
  version; writes `reviews/<date>.md` with what changed and why.
- *Mine:* **the day's measures**, in the same file, starting with what the sessions can count: sessions, commands,
  renders, kept · changed · dropped, rounds a shot took before he kept it, which learnings were used, time. More are
  added as they are wanted (his: "build ways to track as we go").
- *Mine:* Claude tells him, in a line at the start of his next session, which agents changed and where to read it.

## R8. What has to exist first

*Mine:* an agent can only do its job through the commands (Cinema.md F6), and the commands need a world to change and a
engine to render it (Cinema-Engine.md). So the order to build in:

1. **The engine**: a world as a description, played live and rendered to a still or a clip at any moment (Cinema.md F1,
   F5), and the commands that change it, each writing its line in the session.
2. **The agents**: this document's folders, the factory, the brief, the record and the review.
3. **A first world**: one environment he describes, a camera and a light, with plain stand-ins where the cast will
   stand, so shots can be made while the cast is built. **Until the studio's app exists, it plays on a page on his
   machine** (his).
4. **The cast in 3D**, version by version (Cinema.md F3).

## Open

Nothing is open. The numbers marked *mine*, such as ten sessions or seven days for what is recent, are his to tune.
