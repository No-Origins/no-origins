# Agent character — working design brief

2026-09-28 · Working brief. Explicit user decisions are marked confirmed; other design ideas remain proposals.

## 1. What we are designing

An individual No Origins agent that can inhabit the portfolio. It needs a recognisable body, consistent personality, readable expressions, purposeful movement and a coherent repertoire of actions. Ontology-source.md preserves the starting material.

**Confirmed by Bhargav, 2026-09-28:** “The portfolio agent will be my personal agent who will become a guide for the visitors.”

Its relationship to Bhargav is his personal agent; its role for visitors is their guide through the portfolio. Its name and visual identity remain open.

**Confirmed temperament, 2026-09-28:** Bhargav chose **“energetic and expressive.”** This replaces the earlier proposal of a quietly playful or mostly calm character.

**Design implications proposed for exploration:** welcome visitors, learn what they want to explore, point them toward relevant work, explain what they are seeing, and give them space to browse. Its gaze and gestures can connect the conversation to the work on the page. These are candidate guide behaviours, not a confirmed capability list.

My reading of the inspected boards: the agent has a visible social presence and an underlying identity with capabilities and limits. Its character design should connect those two. Visitors should be able to tell what it is attending to, when it is occupied, and when it needs their input.

The wider ontology describes front-desk agents, request-review agents, case groups drawn from institutional leaders, and teams of subagents. That suggests a character language that can eventually support several roles without losing a shared family resemblance. For the portfolio, we can begin with one individual; its greeting, listening, explaining and waiting behaviours are useful first scenes. This is a design inference, not a decision to make the portfolio agent a front-desk agent.

## 2. Starting points and open choices

| Area | Source-backed starting point | Still to decide |
|---|---|---|
| Body | Horizontal pill and two circular eyes | Exact proportions at portfolio sizes; allowable deformation; whether any additional features are needed |
| Identity | Confirmed: Bhargav's personal agent, a guide for portfolio visitors | Name, individual identity and whether the older clear-host treatment applies |
| Personality | Confirmed: energetic and expressive. Brand.md contributes warmth, curiosity and approachability | Humour, initiative, emotional range and boundaries |
| Communication | Nearby speech bubbles and a shared input in Figma | How much it speaks, how visitors summon it, and how it yields attention |
| Capabilities | Model, tools, context, skills, workflows, memory and status are distinguished | Which aspects should become visible character behaviour in the portfolio |
| Visual material | The source sketches use pastel colour and translucency | How the character belongs to today's lime/violet system; glass is not automatically reinstated |
| Motion | Static poses and curved relationships are visible | Locomotion, weight, anticipation, settling, interruption and timing are not yet specified |

## 3. Personality direction

**Confirmed:** energetic and expressive. **Proposed interpretation:** an eager guide whose interest is visible in its whole body. Warmth and curiosity from Brand.md give that energy a purpose: it enjoys welcoming people and showing them Bhargav's work.

Candidate expression language: quick shifts of attention, clear eye shapes, pronounced tilts, anticipation before a gesture and a lively settling motion afterward. Energy can vary with the encounter: an animated welcome, focused listening, excitement at a discovery, and a held questioning pose when unsure. These performances remain proposals; hopping, elasticity and additional facial features have not been chosen.

Still to explore: its humour, how readily it initiates contact, and the physical qualities of its body. Brand.md's quietness can govern density and pacing while the character's individual gestures remain energetic.

## 4. Separate personality, emotion and action

Proposed design distinction:

- **Personality** persists across encounters: how it tends to behave.
- **Emotion/expression** is a temporary performance: curious, pleased, uncertain, concerned, surprised or calm.
- **Attention** names its focus: visitor, an object, its own task, or resting.
- **Action/state** describes what is happening: greeting, listening, working, explaining, waiting for input, finishing, recovering or resting.

“Working” should not force a happy or anxious expression. “Needs input” should be legible without pretending that something has failed. Colour alone should not carry these distinctions.

## 5. Proposed first repertoire

These are sketches to test, not behaviours discovered in Figma.

| Situation | Character intent | Candidate visual performance |
|---|---|---|
| Resting | Present and available | Stable body, infrequent blink; long stretches of stillness |
| Notices the visitor | Acknowledge attention | Quick eye orientation followed by an eager body turn or tilt |
| Greeting | Show delight at meeting someone | A pronounced lift or tilt with anticipation and a lively settle |
| Listening | Make attention visible | Gaze toward the interaction; reduce other motion |
| Curious | Invite exploration | Eyes widen or shift, followed by an inquisitive lean toward an object |
| Working | Show an ongoing task | Restrained repeatable gesture, clearly different from listening |
| Waiting for input | Yield the next move | Settle into a held attentive pose with an explicit prompt |
| Explaining or guiding | Share enthusiasm and direct attention to content | Look between visitor and object with an expressive tilt; move only if travel is chosen |
| Completed | Celebrate an outcome | A brief delighted body gesture and bright eye expression, then settle |
| Uncertain | Invite clarification | A clear questioning tilt and held gaze, paired with plain language |
| Failed or unavailable | Make recovery understandable | Calm interruption of the working motion; explain the next step |
| Dismissed | Respect the visitor's choice | Withdraw or return to a chosen resting place |

For each selected action, eventually record: trigger, entry pose, eye behaviour, body behaviour, travel, speech, duration, loop rule, exit, interruption and reduced-motion equivalent. No timing values are chosen yet.

## 6. Motion questions

1. Does it glide, hop, roll, float, or stay in place? Test a few short alternatives against the same greeting and pointing scene.
2. What does its body feel like: firm, elastic, soft, light or weighted? Choose a consistent response to starting and stopping.
3. How much can the pill deform before identity is lost? Keep the eyes readable through every pose.
4. Do the eyes lead travel, follow the pointer, or attend to meaningful objects? Avoid assuming perpetual pointer tracking.
5. Where does it live on the current grid? A slot, the pager or another approved placement needs an explicit decision. Do not assume free travel outside clipped slots.
6. What happens when a page turns or the theme changes? The agent should have a deliberate relationship to the existing grid motion.
7. Can every important state be understood when motion is reduced or stopped?

## 7. Proposed design sequence

1. Translate the confirmed energetic, expressive temperament into a few contrasting body and movement studies.
2. Draw one neutral character sheet: silhouette, proportions, eyes, colour/material, both themes and small-size readability.
3. Create an expression sheet using the smallest useful set of controls. First test what two eyes and posture can communicate.
4. Compare short movement studies for attention, greeting, travel and settling.
5. Design action sequences with transitions and interruption rules.
6. Storyboard portfolio encounters: arrival, a visitor asking about work, guiding to a project, an unanswered question, and dismissal.
7. Record selected decisions in the knowledge base once Bhargav chooses them. Implementation follows the design direction.

The next useful choice is physical character: **what does its body feel like when it moves?** A soft, springy body; a light, floating body; or a firm body with snappy poses would each express the chosen energy differently. These are discussion options, not selected directions.

## 8. Design bench — requested and implemented

Bhargav: “I want that in motions library with jigs to design and control these properties of the agent.”

The Agent page in the motion studio now provides body, eye and movement controls, independent action and emotion choices, five exploratory presets, saved browser settings and the shared playback timeline. Motion.md M12 records the bench. Soft/springy, floaty and snappy remain alternatives to compare there, not choices made on Bhargav's behalf. The portfolio implementation remains future work.

### Confirmed proportions — 2026-09-28

The agent is always two cells wide and one cell high. Its eyes are circular, with eye size controlled in the Eyes jig. The motion bench uses measured grid cells, includes the gutter in the two-cell span, and preserves these dimensions during playback.

### User-authored presets — 2026-09-28

Bhargav rejected the proposed presets and asked to define his own. The motion bench now starts blank and provides named save, update/rename, load and delete. Controls cover start/end poses, path, independent eyes, circular blinks, timing/easing, colour and opacity, with hold/loop/speed on the timeline. The body remains two cells by one. Earlier suggested personalities and action/emotion mappings are superseded by direct authoring.
