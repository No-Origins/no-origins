# Ontology — source notes

Observed 2026-09-28 in the Figma desktop application. These notes describe the board as found, not a new specification.

Source: [No Origins → 04. Ontology](https://www.figma.com/design/ii0qtui7UOuEnX7mLVVcDc/No-Origins?node-id=362-876).

## 1. Page inventory

The page overview shows five small boards across the top: **Front Desk**, **Front Desk Team**, two named **Teams**, and **Institutions**. Below are five larger boards named **Agent Anatomy**. One of those contains child frames named Frame 61, Frame 62 and Frame 63; those are not three additional top-level boards.

All five anatomy boards were read at 115% zoom. The five boards in the top row were read individually at 132–175% zoom.

## 2. Agent, institution, and an unnamed form

[Agent Anatomy — forms](https://www.figma.com/design/ii0qtui7UOuEnX7mLVVcDc/No-Origins?node-id=747-5279)

Three lavender forms sit beside one another:

- **Agent:** a horizontal pill with two dark circular eyes. No mouth, limbs or accessories are visible in this specimen.
- **Institution:** a square with a softly shaded edge.
- **…:** a hexagonal form, with no further identity specified by its caption.

Observation: shape distinguishes kinds of entity even when their colour is shared. The hexagon's meaning is unresolved in the visible board; do not name it from inference.

## 3. A social scene

[Agent Anatomy — conversational scene](https://www.figma.com/design/ii0qtui7UOuEnX7mLVVcDc/No-Origins?node-id=747-1026)

Seven pill characters occupy a loose cluster over a dot grid. Their bodies are pink, light green, clear/white, lavender, peach, yellow and blue. Each has two dark circular eyes. The treatment is soft and translucent, with the grid visible through several bodies.

Visible copy:

- Light-green character: “Hey there!!”
- Clear/white character: “What are we doing today?”
- Bottom input: “Hey! What’s on your mind today?”

A user/profile icon sits at the lower left; the No Origins mark sits at the lower right. Speech appears adjacent to a character, making the speaker spatially identifiable.

This is a static scene. It establishes appearance and conversational posture, but it does not establish movement timing, emotional poses or a behavioural state machine.

## 4. Anatomy and operational identity

[Agent Anatomy — institutions and attributes](https://www.figma.com/design/ii0qtui7UOuEnX7mLVVcDc/No-Origins?node-id=747-930)

The left side shows six coloured squares on a grid, captioned **Institutions**. The right side has a lavender square with an ID tag, connected by curved lavender lines to **UI** and **Monitoring** panels.

The attribute labels are:

| Label | Visible representation / annotation |
|---|---|
| Model | A capsule containing several model-provider marks |
| ID | A vertical tag beside the square, reading AG-03 |
| Tools | Circular tokens; annotations “Runtime/Sandbox”, “Permissions”, “Memory” |
| Context | A partially filled bar; “system + skill metadata + tool schemas + paged memory + working set.” |
| Skills | Small peach rectangular tokens |
| Workflows | Small green diamond tokens |
| Memory | Small pale-purple polygon tokens |
| Status | Grey, red, green and blue circular indicators |

The board does not supply a legend mapping those status colours to named states. Do not treat the colours as an approved emotion system. Its title says Agent Anatomy while its left caption says Institutions; preserve that ambiguity rather than rewriting its ontology.

[Agent Anatomy — agents and attributes](https://www.figma.com/design/ii0qtui7UOuEnX7mLVVcDc/No-Origins?node-id=362-877) repeats this arrangement and attribute vocabulary, with the left caption **Agents** instead of **Institutions**. Both versions use squares here, whereas the explicit forms board uses a pill for Agent. These are exploratory representations; the drawings alone do not settle whether every shape is a literal body.

## 5. Roles and permissions

[Agent Anatomy — permissions](https://www.figma.com/design/ii0qtui7UOuEnX7mLVVcDc/No-Origins?node-id=454-325)

A lavender square sits on the left. Four role cards connect through curved lavender lines to a permissions panel:

- Junior Developer
- Senior Developer
- Review Developer
- Safeguard Agent

Visible permission groups include **Containers** (CLI, Run Container, Container 01, Container 02, Container 03) and **Sub Agents** (Developer Agents, with DAG entries beneath). The lower entries fade or clip at the panel edge, so the full list is not captured.

Observation: the concept distinguishes role and access. The drawing does not prove that all displayed permissions belong to every role, or that any capability is implemented.

## 6. Relationship to existing documents

- **Brand.md §4–§6:** warm, curious, playful, expressive, approachable; quiet governs density and pacing. No arrogance, mischief, irresponsibility or snark.
- **Brand.md §8 and §11:** records Bhargav's pill-and-two-eyes sketch as the mark/agent form, with a clear host among coloured characters. This supports the provenance of the Figma scene.
- **Brand.md §8–§9:** includes historical canvas, glass, palette and portfolio ideas. These are not current implementation instructions. The root AGENTS.md describes the current lime/violet, shadcn-based grid system; it also records deletion of the old blob implementation.
- **Character.md:** is a separate brief for Bhargav's illustrated human avatar. Do not silently make that avatar the agent or overwrite its brief.

## 7. Front desk and request review

[Front Desk](https://www.figma.com/design/ii0qtui7UOuEnX7mLVVcDc/No-Origins?node-id=454-146) shows five pale-green squares captioned **Front Desk Agents**, with a pink circle captioned **User** beneath them.

[Front Desk Team](https://www.figma.com/design/ii0qtui7UOuEnX7mLVVcDc/No-Origins?node-id=362-1075) shows a row of five cream squares captioned **Front Desk Request Review Agents** above a row of five pale-green squares captioned **Front Desk Agents**.

Reading: the concept separates meeting the user from reviewing their request. No detailed routing protocol or individual responsibilities are specified in the visible copy.

## 8. Teams

[Teams — cross-institution case group](https://www.figma.com/design/ii0qtui7UOuEnX7mLVVcDc/No-Origins?node-id=362-1133) shows five differently coloured squares in a row. Its exact caption is: “Group created for a case with leaders from each institute.”

[Teams — leader and subagents](https://www.figma.com/design/ii0qtui7UOuEnX7mLVVcDc/No-Origins?node-id=362-1162) shows one blue square above four blue squares. Its exact caption is: “Each leader can create a team of multiple sub agents to achieve their goals.”

Together, these describe a case-specific group of institutional leaders, each able to organise a team beneath them. Colour visually groups the second team; the text establishes the leader/subagent relationship.

## 9. Institutions

[Institutions](https://www.figma.com/design/ii0qtui7UOuEnX7mLVVcDc/No-Origins?node-id=454-257) shows five large pastel discs containing fine line illustrations: a dragonfly-like insect, an elephant, eyes and a nose, flowers, and an abstract organic form. The caption is **Institutions**. No individual institution names or disciplines are visible. The fifth emblem's intended subject is unclear; do not assign it a function from its appearance.

Reading: institutional identity has an emblem as well as a colour. This offers a possible future affiliation vocabulary, but the board does not specify badges or costumes on individual agents.

## 10. Coverage and limits

All ten top-level boards were visually inspected. These notes capture their visible text and meaningful relationships, not every hidden layer or exact styling value. The permissions panel's lower list remains clipped/faded. No motion or prototype behaviour was played or verified; none of the still drawings establishes timing.

Access note: Figma MCP returned its Starter-plan call-limit error. Desktop navigation briefly returned `noWindowsAvailable`; after Bhargav kept Figma in the foreground, inspection of the remaining boards succeeded.
