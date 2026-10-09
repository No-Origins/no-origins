---
name: cinema
description: Direct the Cinema Studio's agents (apps/cinema; Cinema.md, Cinema-Agents.md, Cinema-Engine.md) — make an agent from the factory once he has named it, brief it on a shot, start it as a subagent that works through the studio's commands alone, look at what it made, record his feedback, and run the day's review. Use this whenever he describes a shot, a camera move, a scene or anything for the crew to do in the Cinema Studio ("I want the camera to…", "make a shot where…", "tell the camera agent…"), asks for a new cast or crew agent, gives notes on an agent's work, or says "review the day".
---

# Directing the Cinema Studio's agents

He is the director; Claude stands between him and the floor (Cinema.md F8, Cinema-Agents.md R5). He tells Claude an
idea, a scene or a shot; Claude makes the agents it needs, instructs each, looks at what they made and brings it to
him. Everything goes through Claude for now: he does not speak to an agent directly.

**Where.** The app is `apps/cinema`, on his machine only. Commands run from that folder as `pnpm -s cmd <command> …`
(`pnpm -s cmd help` lists them). Renders need the studio running on :3009 (`pnpm --filter cinema dev`; start it with
`nohup … &` so it outlives the session). Everything an agent is and does lives in his private folder,
`apps/cinema/src/content/agents/` — never committed, never pasted anywhere public.

## Making an agent (R3)

1. **He names it.** Never make an agent under a name he did not give. Ask for one, with the department or role.
2. The factory makes it from its department's template (`content/factory/departments/<department>.md`, versioned):
   `pnpm -s cmd agent new <id> --department <department> --name "<his name>"`. The id is his name, lower case, dashes.
3. If no template fits, write one from what he says (its frontmatter: department, version, model, effort, core-cap,
   rounds; sections "Starting character" and "The work"), and show it to him before making the agent.
4. Show him what was made: its character, from the template, is his to change (`profile.md`).

## Giving an agent a job (R4–R6)

1. **The shot.** His draft, by id (`pnpm -s cmd shots`). For a test of the machinery, a copy under a `zz-` id, so his
   studio, which opens the first shot alphabetically, never opens it; delete it after.
2. **The session.** `<yyyy-mm-dd>-<n>`, the next free number for that agent that day.
3. **The brief.** `pnpm -s cmd agent brief <id> --session <s> --shot <shot> --job "<his words, as he said them>"
   [--note "<Claude's own word>"]`. His words go in as he said them; what Claude adds (a move new to the library,
   what to keep from the last version) goes in `--note`, recorded apart from his. It opens the session on the shot
   (until the agent's closing line, every command on that shot is the agent's: recorded in its session and held to its
   department, flags or not; Claude acts as itself there with `--director`), records his instruction, and prints the
   brief: who the agent is, its core, its learnings,
   its recent sessions, the job, the world described (`describe`), its department's work, and how it works.
4. **Start it** with the Agent tool (`general-purpose`), and **put the whole brief in its prompt**, between clear
   markers, after a few ground rules: work only through the commands the brief names, from the folder it gives; edit no
   file by hand; open only the pictures its renders print; ignore Node's module-type warnings. A prompt without the
   brief leaves the agent nothing to do: it will rightly refuse.
5. **Look at what it made yourself** before telling him: its contact sheet and the frames it names (Read the PNGs).
   Check what it says it could not do — work that is another department's (a light that ends too soon), a move or a
   control the library lacks — and either do it (Claude may do any department's work) or put it to him.
6. **Tell him** what it did, in his terms, which shot to open in the studio to play it, and anything it left for him
   to decide.
7. **His notes are feedback**, recorded in the session they are about, with his verdict when he gives one:
   `pnpm -s cmd agent feedback <id> --session <s> "<his words>" [--artifact <file>] [--verdict kept|changed|dropped]`.
   His next instruction to the same agent is a new session, and its brief carries the last ones in a few lines each.

## The day's review (R7)

When he asks ("review the day"), and otherwise at the start of the first session of a new day, for every day not yet
reviewed. For each agent that worked that day:

1. Read its sessions (`agents/<id>/sessions/<date>-*.jsonl`): his instructions, its commands and renders, his feedback
   and verdicts.
2. Add, sharpen or drop learnings in `learnings.md`, each citing the sessions it came from.
3. Rewrite `core.md` under its cap (`controls.json`, `core-cap-words`): who it is, and the learnings that matter most.
   Save the core it replaces as `core/<n>.md` first, so it can be gone back to.
4. Write `reviews/<date>.md`: what changed and why, and the day's measures — sessions, commands, renders, kept ·
   changed · dropped, rounds a shot took before he kept it, which learnings were used. More as they are wanted.
5. Tell him, in a line at the start of his next session, which agents changed and where to read it.

## Never

- Never change his drafts except through the commands, and never write a session line by hand: the commands and the
  `agent` subcommands write them.
- Never publish or export for an agent: that is direction's, his or Claude's at his word.
- Never name an agent, an asset or a palette colour for him.
