# No Origins — Cinema Studio

**Where he directs, and a cast and crew of agents build 3D sets and shoot cinematic shots in them**: artistic,
animatic, cinematic. This document decides what the studio is for, what comes out of it, who is cast, the libraries a
shot is made from and how they combine, the crew, how he directs them, what an agent is made of, the factory that makes
them, and the library of assets that comes first.

**Signed off by him on 2026-10-09.** What is marked *his* he said in his own words; what is marked *mine* Claude
proposed and he agreed to, and it stays his to change.

Current as of 2026-10-09.

## F1. What it is for

- **3D sets, defined with him, from which shots are made** (his): artistic, animatic and cinematic.
- **Intense motion, music, design, colour and emotion over minimal three.js environments** (his). The environment is
  kept spare so that the motion, the music and the colour carry the shot.
- **He is the director; a cast and a crew of agents make the shot** (his, F8), each agent working through the controls
  of what is in the libraries (F4, F6).
- **He keeps what he likes as presets** (his): combinations taken across the libraries, which the crew then use, repeat
  and improve (F5).
- **What comes out is video and pictures** (his): he takes shots and exports them as video, or as stills. **The worlds
  stay live** (his), so that visitors can explore them later.
- **The frame is a control: wide or vertical** (his), and the crew set it as he and Claude instruct. *Mine:* the size,
  the frame rate and the length are controls too, and one shot can be exported in both frames.
- **The goal is to make films; the first step is a library of assets** (his, 2026-10-09: "first I will build the
  environments… I want to have a library of assets to be built first. We don't need camera motion and all of that",
  F11). Sets, shots and the camera come after. Where the studio is hosted, its name and who may explore a world come
  later (his, F7).
- *Mine:* so **a world is one description, played two ways**: live in the browser, and rendered frame by frame to a
  file. A video and a still are the same frames as the live world, never a second build of it (F5: every frame is a
  function of time).

## F2. Brand.md does not bind it

- **Brand.md does not apply in the studio** (his): not its material (flat, no gradients, no glass, no glow), not its
  restraint. A shot may use light, fog, bloom, depth of field and colour grading.
- **It may inherit from the design system** (his): completely where that serves, as with the colours and the sizes, or
  remade for the 3D world, as Orbit's agents are (F3).
- **The freedom is the frame's** (his). The studio's own screen, meaning the controls round the picture, follows the
  system: it is on the grid and built from `@no-origins/ui`, like the other studios.

## F3. The cast

- **Orbit's six are cast, recreated in 3D** (his). It is the largest piece of engineering here, and it is done anyway
  (his). They are cast and never crew (his, F6).
- **More cast are made, in the factory, from their roles** (his, F10): each an appearance with the same attributes a crew agent has (F6): a character, memory,
  learnings, controls, feedback and artifacts. A new cast member is not one of Orbit's agents: Agents.md's six stay
  six.
- **An agent brings each cast member to life** (his): it acts with the cast member, playing it or helping it play,
  taking direction and turning it into the cast member's states and actions.
- **The Hiddenstack rig is not used** (his).
- *Mine:* **Orbit's six bring their characters with them.** Each one's actor starts from its temperament and voice in
  Agents.md A2, so Bali acts calm, patient and attentive and Kino eager, bold and happy.
- *Mine:* **an agent in 3D is its published Orbit version** (Orbit.md C19, C22): shape, rotation, paint, material,
  surface and face are read from the same `CharacterLook`, so a change in Orbit reaches the cast. The shapes are already
  3D solids, rounded cores that a camera projects to a drawing (Orbit.md C12, `lib/agent-shape.ts`). In 3D the solid
  is drawn itself instead of its projection.
- *Mine:* **what carries over and what has to be decided again**:

  | Carries over | Decided again for 3D |
  |---|---|
  | The shape and its soft edges (Orbit.md C12, C18) | Shade and Depth (Orbit.md C4, C14): real light falls on it now |
  | The paint, the eyes' colour (Orbit.md C16, C20) | The face: drawn on a surface the camera goes round |
  | The face's parts and their settings (Motion.md M20) | The surface's hand-drawn texture (Orbit.md C15) on a solid |
  | Material, and how it scales the motion (Motion.md M17) | The nest: a set has a floor and no bowl |
  | The actions' names and controls (Motion.md M24) | The tail: a spring chain in space |
  | | Squash, stretch and wobble: the mesh deforms |

- *Mine:* **any cast member plays any action** (Motion.md M23). Bounce, Jump and Dive keep their names and controls;
  their frames come from a 3D model of the same physics, since `sphere-motion` is a side view.

## F4. The libraries

- **Every entity has controls of its own** (his): an environment, a cast member, a piece of music, an effect, an agent.
  The cast and the crew work by setting them (F6).
- **He describes each environment in his own words** (his), every time he wants a new one or wants to extend one. His
  description is the brief, as with Home's house (Home.md H2): it is built from his words, and he corrects it in words.
  The same goes for every other library (his).
- **Building an entry and using it are separate jobs** (his). This is Motion.md M20 as it stands: what an entry *can*
  be is code, and what is *chosen* is data.
  - **Building** an entry, meaning what it is and which controls it has, is code, written from his description by
    Claude or Codex in this repository, as a new action is (Motion.md M24).
  - **Using** an entry, meaning setting its controls, placing it and timing it, is data, kept as a draft and published
    versions. That is the cast's and the crew's work (F6).

  The cast and the crew never write code. A control they need and do not have is a request to the builders, which he
  approves.
- **Where the music and the sounds come from is not settled** (his): generated, taken from free libraries, or files he
  brings (his: "I'll try to get mp4"). *Mine:* each keeps where it came from and its licence, and a free one's
  attribution goes with every export that uses it.
- **A library is added when he names one** (his: "more if needed over time").

| Library | What an entry is | |
|---|---|---|
| **Cast** | A character's 3D look, with its attributes: an agent from Orbit, or a new cast member (F3) | his |
| **States** | How a cast member holds itself and feels: pose, face, breath. Emotions are states (Agents.md, Open: moods) | his |
| **Actions** | What a cast member does: Bounce, Jump, Dive and what he names next | his |
| **Environments** | The set: ground, horizon, sky, forms, atmosphere | his |
| **Effects** | What happens in or over the frame: particles, atmosphere, the lens and post | his |
| **Camera** | Moves, angles and lenses | his |
| **Lighting** | Lights and rigs of them, their colour and strength | his |
| **Sound effects** | A sound and where it plays from | his |
| **Music** | A track with its tempo and beats, so that cuts and actions can land on the beat | mine |
| **Grades** | A scene's colour: its palette and the grade over it | mine |
| **Props** | Objects in the set that are not cast | mine |
| **Titles** | Text in the frame | mine |

## F5. How they combine

From the smallest to the largest:

1. **An entry** is one thing from one library, with its controls set.
2. **A preset** is his combination of entries across libraries, with their values (his: "permutations and
   combinations among all the libraries"): a light rig, a camera angle, a grade and a sound, for example. A preset is
   versioned like an entry.
3. **A shot** is a set (an environment, the cast placed in it, the lighting) and a timeline: a track for each thing that
   moves (the camera, each cast member's states and actions, the effects, the sound, the music), each a row of entries
   and presets at their lengths. This is the sequencer Motion.md M24 leaves open, grown.
4. **A scene** is shots in order, with their cuts.

Beside them:

- **A workflow** is the steps an agent follows to direct a shot or a scene: what to take from which library or preset,
  in what order, and what to check before going on (his). Agents follow one to repeat a shot, and write the next
  version of one to improve it (his). A workflow is versioned like everything else, and publishing one is his.
- *Mine:* **every frame is a function of time.** As with the agent's motion (Motion.md M17), any moment is the same
  frame however it is reached. So a shot can be scrubbed, played live, exported as video or as a still at any frame
  (F1), and an agent can look at any moment of what it made.

## F6. The crew

- **The crew are agents** (his). Orbit's six are the cast and never the crew.
- **A crew agent has** (his): a character, its memory, what it has learnt, its controls, the feedback it has been given
  and the artifacts it has made. Its controls are its own (F4).
- **A crew agent has a look, and is made in the factory from its department** (his, F10). *Mine:* its look shows on
  the studio's screen, beside its sessions and in the day's review, and never in a shot.
- **The crew work in departments** (his), with the agents of their own department and with other departments. **A
  department has its own libraries and its own tracks** (his): art (the assets: environments, props, F11), cast (states, actions),
  camera, light, sound (sound effects, music), effects, colour (grades), and direction, which puts the shot together. A
  department writes only its own tracks, so two departments never write the same thing; inside one, its agents pass
  work between them.
- **One description, and one set of commands that change it** (his). A shot is a description, as Home's house is
  (Home.md H2). It is changed only through typed commands: place a cast member, set a light, add a camera move, cue a
  sound, render a still. The cast and the crew use them as tools, and so does Claude.
- **An agent sees what it made by rendering it** (his): a still at a moment, a contact sheet of a shot, a clip. These
  are its artifacts, and a workflow's checks look at them.
- **Feedback becomes learning, and he can read it** (his). He gives feedback on an artifact. The agent keeps the
  feedback, and writes down what it learnt from it in words he can read and correct. Its next version of the work
  answers that feedback, as each version of a character or a motion answers his notes.

## F7. Where it lives

*Mine:* `apps/cinema`, on `cinema.no-origins.com`, port 3009: the tenth app. It holds the engine where a world plays
and is rendered, and his screen for watching it, one `Grid` with the picture in a box, like the other studios. The studio
is his, behind the sign-in (`cinema.open`, Access.md); a live world (F1) is opened to visitors when he publishes it.
**Later** (his): the host, the name, and who may explore a world. The goal now is films (F1).

## F8. How he directs

- **He is the director** (his). In any session he tells Claude an idea, a scene or a shot, and Claude makes the cast
  and the crew it needs and instructs each of them to do its job (his).
- *Mine:* **Claude stands between the director and the floor.** It breaks his idea into each department's work,
  instructs each agent, has direction put the shot together, renders it, and brings him the artifacts. His notes go
  back to the agent they are for, as feedback (F6).
- *Mine:* **sessions forget; the agents do not.** Each agent's character, controls, memory, learnings, feedback and
  artifacts are kept in files that the next session reads, so an agent made in one session is the same agent in the
  next, and a shot he left can be picked up again.
- *Mine:* **for now the agents are Claude Code agents**: Claude starts each one from its core and its recent sessions
  (F9) and instructs it, it works through the commands of F6, and its session is recorded as it goes.
- **A harness of its own comes later, if this works** (his): built for the Cinema Studio.
- **How it works, step by step**, is **Cinema-Agents.md**: how an agent is made, kept, started, instructed, recorded
  and reviewed.
- **It is kept out of git, for now** (his): his ideas, the worlds, the shots, the libraries' data and every agent are in
  a gitignored folder, as Home's house is (Home.md H4), since the repository is public. *Mine:* that folder is
  `apps/cinema/src/content/`, also in `.vercelignore`. The code is public and written against its types.

## F9. What an agent is made of, and how it grows

**Every agent, cast or crew, keeps what it needs to learn and grow** (his): its profile and meta, its character, its
controls, its memories, its learnings, the feedback it has been given, its artifacts and its history.

**Its memory is in three tiers** (his, 2026-10-09):

- **Core**: small and capped, loaded every time the agent starts: who it is, its character, its controls and the
  learnings that matter most. It changes only at the day's review.
- **Recent**: its latest sessions, loaded when it starts work.
- **Archive**: everything older, searched only when a job needs it.

| Part | What it is | Tier | Who changes it |
|---|---|---|---|
| **Profile and meta** | Its name, cast or crew, its department, when it was made, by whom, its version | Core | Claude, when it makes the agent |
| **Character** | Its temperament and voice, in words | Core | He does |
| **Controls** | Its own settings, typed (F4) | Core | He does, or Claude as he instructs |
| **Learnings** | What it has learnt, as rules it follows | Core, those that matter most; the rest the archive | The day's review; he reads and corrects them |
| **Memories** | What it knows: about him, the worlds and the shots it has worked on | Recent, then the archive | The agent, as it works |
| **Sessions** | Its history: each piece of work, as below | Recent, then the archive | Recorded as it works; never edited |
| **Feedback** | His notes, each on an artifact, kept in the session it belongs to | With its session | He does; never edited |
| **Artifacts** | What it made: stills, contact sheets, clips | Kept apart, named by their sessions | The agent |

**Every session is recorded** (his). A session is a piece of work the agent did, never its making: **the instructions
it was given and the controls it set** (his). *Mine:* each record also holds who instructed it, the core it started
from (by version), every command in order with its values, the artifacts it rendered, his feedback and his verdict on
each artifact (kept, changed or dropped), and the version of each control's declaration, since a control can change in
code (Motion.md M20). A record is appended to as the work goes and never edited.

**The sessions are for training small models** (his): further on, they become the data to fine-tune small models, each
specialised in the role it was trained on. *Mine:* that is why a record keeps the instruction and the controls that
answered it side by side, which is a training example, and his verdict, which makes it a good one or a bad one. The
sessions are kept whole and for good, in the private folder (F8).

**The day's review** (his): at the end of each day, the day's sessions are reviewed and each agent's core is updated,
so that it improves. *Mine:* Claude reads each agent's sessions and his feedback from the day, and proposes the changes
to its core: a learning added, sharpened or dropped, each citing the sessions it came from. **The review saves them**
(his), the core as its next version, and **he reads them whenever he can** (his). Then the day's sessions move along
from recent towards the archive. *Mine:* a core is versioned, so a change he disagrees with is undone by going back to
the core before it, as with any version (Motion.md M20).

**An agent's performance is understood in several dimensions** (his). How big a core may grow is not fixed: it is one
of the parameters by which an agent's performance is understood, so that agents can be improved in several dimensions
(his). *Mine:* an agent's parameters (its core's cap, the model it thinks with, how hard it thinks) are among its
controls (F4), and the day's review records how each agent did: how much of its work he kept, how many changes a shot
took before he kept it, which of its learnings its sessions used, and how long and how much its work took. Changing a
parameter is then a comparison of before and after. **The dimensions are defined over time, and the tracking is built
as it goes** (his).

## F10. The factory

- **Characters are made in a factory** (his): a cast member from its role, a crew agent from its department.
- *Mine:* **a role or a department is a template**: the look's starting parts (shape, paint, surface, face, the same
  parts for cast and crew, so there is one way of making a character), a starting character in words, the controls and
  libraries it works with, and an empty core. The factory makes an agent from a template, with everything F9 lists.
- *Mine:* **Claude uses the factory whenever an idea needs someone who is not there yet** (F8), and he can ask for one
  by its role or department.
- *Mine:* **a template is versioned**, and an agent keeps the version it was made from, so the sessions of everyone made
  from one template can later train that role's model together (F9).
- **The palette grows with the scenes** (his): the colours a made character may wear are defined as the scenes that
  need them are built, not in advance. Orbit.md C20 keeps its paints to Orbit's agents; the studio's palette is its
  own.

## F11. Assets first

- **An asset is a thing a set is built from, made with its controls** (his, 2026-10-09): world-building elements such
  as mountains, clouds, roads and houses, "any sort of assets that we need to create our set". **The art department
  handles them** (his).
- **He asks for an asset, then plays with it** (his): once it is built he looks at it in 3D, on its own, and tries its
  controls; he asks for more controls, drops the ones not needed, or changes it. No camera, no shot.
- **When he has decided on an asset, its schema is fixed** (his): the controls, or configurations, the art department
  works with. Each version of an asset answers his notes, one at a time, as a character or a motion does.
- **For a set, the art department's agents bring the assets it needs together and configure each for it** (his: "when
  I describe a set, relevant or necessary assets can be brought together by the agents").
- **The studio opens on a home page, its sections there; the first is Assets** (his, 2026-10-09). *Mine:* an asset
  opens on its **bench**: the asset alone in the middle, looked round freely, its controls either side, what he sets
  kept until he changes it. The shots' screen stays, off the home page until he names it a section.
- **His first asset is Illusion Mountain** (his, 2026-10-09), made from the mountain he had tuned before.

## Open

1. **Where the music and the sounds come from** (F4).
2. **The cast in 3D** (F3), the next document's to decide, version by version, as he looks at them: whether light
   shades them smoothly or in flat steps as Orbit draws them, how the face stays on a body the camera can go round, how
   they stand and land on a floor instead of in a nest, and how the tail moves in space.
3. **What his saved configurations are called** (F11). The code still calls a configuration he saved under a name
   ("Suckers Mountain") an asset, from before F11; an asset is now the thing itself, and the word for those is his.
