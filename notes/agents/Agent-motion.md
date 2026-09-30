# Agent motion — state machines and controls

2026-09-29 · Round 1: five options for him to pick from. **He picked A, the statechart, the same day** (Motion.md,
M12 amendment of 2026-09-29, records it and the defaults taken for §5). The rest stays as the record of the round.

Bhargav, 2026-09-29, on the Agent bench built the day before (Motion.md M12): *"I did not like what it did. I want
better controls and better state machines."*

Each option below tests a different mechanism, so a pick says something about how the character should work, not only
how it looks. Each says how it could fail. The options were drafted by five designers working separately, and a sixth
review checked them against the code: `lib/agent-motion.ts`, `stage.tsx`'s `useTrack`, the timeline and Motion.md M5, M6
and M12. The review's scores are in §3.

## 1. What the bench does today

- **One gesture, no states.** The only play is: a delay, the start pose moving to the end pose, a hold, then the move
  back. There are no states, no events and no interruption. The agent has no life of its own either: live, the stage
  just shows the end pose, frozen.
- **33 controls, one group at a time.** They are in eight groups behind a select.
  - A pose is three sliders. You cannot drag the pill, and you cannot see the path.
  - The eyes are twelve sliders with no link between them.
  - Shaping one gesture takes four switches between groups.
- **The blink rides the gesture's clock.** It happens once on the way out and once on the way back, and never in the
  hold or at rest. With an early, wide blink, the eyes sit 60% closed at rest. That is a bug.
- **Distances are in cells, not pitches** (a cell plus the gap). A pose "one over" lands off the grid, against the
  amendment's "resting placement follows cell boundaries".
- **Play snaps.** It jumps from the end pose to the start pose, and at the end it jumps back.
- **The eye geometry and its clamp are in the app, not the package.** The portfolio could not play what is tuned here
  without copying that code.
- **Saved presets break M6 and M7.**
  - A saved preset carries tempo, loop and hold. Loading one overwrites them on every page, against M6's "tempo never
    goes into the settings".
  - Copy produces JSON, not CSS lines.
- **The code doesn't match the rest of the studio.** The generic jigs have seven `family.id === "agent"` branches, and
  the code style is not the package's.

## 2. What every option keeps, and what every option fixes

**Kept, because they are his:**
- The body is 2 × 1 and never scales.
- The eyes are circles, and a blink shrinks the radius.
- The left and right eye sizes stay independent (the M12 amendment).
- He authors the motion. The only thing that ships is a blank rest pose: no suggested state names, personalities or
  moods.
- Controls are system components only.
- Controls sit where M6 puts them.
- Seeking paints the same pure frame as playback.
- The model lives in the package, with a hook that takes `always`.
- No glow, no glass, no gradients.

**Fixed whichever option he picks:**
- **Positions in pitches.**
  - The default eyes sit at the centres of the body's two cells.
  - The rest pose and a held pose snap to whole pitches at 0°, with a Badge when they drift.
  - Rotation is capped at about ±30–45°.
- **Eye geometry moves into the package.** That covers the capsule clamp, and the blink as an asymmetric close and open
  with the eye's centre held.
- **The system's eases.** Easing uses the system's `easing()`/`EASES` in place of the private smooth/in/out/back names.
- **Colour becomes a specimen option, and Opacity goes.** Opacity is out under the no-glass rule.
- **No snaps.** Play starts from the pose that live shows. A play's last frame is where live picks up. Loop gets a rest
  phase. A 0 ms delay draws no segment.
- **Presets become generic A–E slots, the same as every family.**
  - A = Blank.
  - A preset holds the definition only, never tempo, loop or hold.
  - Update works in place, and Delete asks for confirmation.
  - An "edited" Badge shows when the draft differs from its preset.
  - His saved presets carry over.
- **Determinism.**
  - Every frame is a pure function of (definition, event script, t, geometry).
  - Any randomness is seeded by stable keys, so editing one gap does not reshuffle every later blink.
  - Zero-length transitions have a step cap.
- **Fits the jig.** Every jig view fits a 10-row laptop field with no scrolling. That means about 348 × 420 px for the
  tokens jig.
- **Stage interaction.** A drag on the stage never reaches the page turn, and shortcuts never take `d`, Escape or the
  arrows.
- **Tests and code.**
  - A test that a seeked frame equals the played frame.
  - A test that the body stays two cells plus the gap wide and one cell high.
  - `e2e/agent.spec.ts` rewritten.
  - The package's code style.
  - The seven special cases replaced by per-family records.

## 3. The five

The review scored each option out of 10 on six axes: controls, state machine, fit with the studio, his rules,
readiness for the portfolio, and build risk (10 means low risk).

| | Mechanism | In one line | Review (mean) |
|---|---|---|---|
| **A** | Statechart | Parallel regions (Body, Gaze, Lids), each on its own clock; events and timers move it between states | **7.1** |
| **B** | Inputs and layers | Rive's way: the page speaks only through typed inputs; layers of clips with crossfades and exit times | 5.9 |
| **C** | Clips on a dope sheet | Each situation a clip of keys, set by dragging the pill at the playhead; a list of wires between clips | 5.6 |
| **D** | Springs | A state sets targets; every channel springs to them; blinks, glances and float run on seeded schedules underneath | 6.1 |
| **E** | Layered axes | A mood loop on an energy × valence field, plus a gaze target, plus his actions laid on top; the machine is only arbitration | 4.6 |

### A · Statechart

**The machine.**
- **Three parallel regions run at once:**
  - **Body**: what the pill does.
  - **Gaze**: where the eyes look.
  - **Lids**: how open the eyes are, and the blink cadence.
- **Each region keeps its own clock**, so a blink can happen during any gesture and a glance never restarts the body.
- **One level of hierarchy.** A parent state can hold children, and a transition on the parent covers all of them.
- **History.** A transition can return to whichever child of a parent was last active.
- **Events come from a fixed catalogue: what the page and the harness can actually emit.**
  - From the page: load done, the wake reaching the agent's box, a card focused or blurred, a mode changed, the theme
    flip, the page hidden or shown.
  - From the harness: idle, working, waiting, success, failure, unreachable.
  - He only chooses which events to wire.
- **Timers.** `after N ms` is a transition of its own: "after 8 s with nothing, rest".
- **Guards** are a short typed list, never code:
  - in or not in a state;
  - an event's value;
  - held for at least N ms.
- **Each transition says how it interrupts:**
  - `cut`;
  - `blend` over N ms;
  - `finish`, which waits for the current gesture to end.
- **Lag.** A transition can carry a lag, so the eyes go first and the body follows.

```
┌─ agent (parallel) ───────────────────────────────────────────────────────┐
│ BODY   rest ──wake.reached──▶ greeting ──done──▶ rest                    │
│          ▲                                        │                      │
│          └──── after 8s ◀── attentive ◀─card.focus┘   run.working ▶ working │
│╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌│
│ GAZE   ahead ──card.focus(cell)──▶ atCard ──card.blur / after 3s──▶ ahead │
│╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌│
│ LIDS   open (its blink cadence) ──entered body.working──▶ narrowed        │
└──────────────────────────────────────────────────────────────────────────┘
  Only rest, ahead and open ship, all blank. Everything else here is an example he might build.
```

**His hands: one greeting from nothing.**
1. In Body, type `greeting`.
2. Press + for a key and drag the pill on the stage up half a pitch and one over. A ghost stays on the rest cell and the
   arc is drawn. Set the key's duration and ease.
3. Press + again and drag the pill back. It snaps onto its cells.
4. Add a row: when `done`, go to `rest`, blend 160 ms.
5. On `rest`, add a row: when `wake.reached`, go to `greeting`, lag 90 ms. Put a gaze row on the same event, so the eyes
   lead.
6. Press `1` to fire it live.
7. Or record a take: press Record, fire it twice, and stop. The take is on the timeline as its states' phases. Drag the
   gap between the two greetings and scrub.

That is about nine drags and presses and three rows in place of roughly 25 slider moves and 8 group switches.

**On the timeline.** A recorded take of events is compiled into a trace. Each state it passes through is a phase, and
only the gaps between events are dragged. That is M6's split exactly: how the play runs is on the timeline, and the
motion is in the jigs.

**Could fail.**
- **No arrows.** The chart is region rows and a table of transitions, not a picture with arrows. He sees one state's
  exits at a time, and a loop or a dead end is easy to miss. A drawn diagram would be a new component, and needs his
  approval.
- **It is a small language.** Hierarchy, history, guards, lag, and cut, blend or finish are each simple. Together, he
  may find himself debugging why an event did nothing when he meant to be animating.
- **A blend can kink.** A blend mixes from where the pill froze. It does not carry speed, so interrupting a hop mid-air
  can bend the path (see the graft from D in §4).
- **A blank chart looks dead.** Nothing moves until he keys a rest loop. That is correct under his rule, but the first
  look may feel like a step back.
- **Settings are no longer only CSS lines.** The chart's structure travels as a data file beside the lines.

### B · Inputs and layers

**The machine.**
- **The page and the harness speak to the agent only through inputs he declares.** An input is a switch, a number or a
  one-shot trigger.
- **Three layers, one state machine each.**
  - The layers are Body, Eyes and Lids.
  - Each layer is a small state machine of clips.
  - Transitions have a condition on the inputs, a crossfade and an exit time.
- **A number input can blend two clips**, for example energy 0 to 1.
- **A recorded take of input changes** makes any run seekable.

**His hands.**
1. Declare an input `greet`.
2. Add a state `greet` with a new clip, and key the clip by dragging the pill.
3. Add a transition rest → greet on "greet fired", with a fade.
4. Add a transition greet → rest at exit 100%.
5. Repeat on the Eyes layer for a glance.
6. Record a take.

**Could fail.**
- **Crossfades kink.** They are linear mixes, so the interruptions of an energetic character are exactly where it looks
  worst.
- **One gesture is a lot of machinery.** It needs an input, a state, a clip, two transitions and their exit and fade
  settings. That is slower than today for a lone gesture.
- **Blinks repeat visibly.** They are an authored loop, so a 7 s loop reads as periodic.
- **The timeline changes meaning.** It shows a take, a clip or a transition, depending on what is open. That bends M6.
- **The review flagged a gap.** A threshold crossed during a glide fires late or never.

### C · Clips on a dope sheet

**The machine.**
- **Each situation is a clip of keys.**
  - There is one lane per channel: body x, y and rotation; each eye's x, y and size.
  - Blinks are marks on their own lane.
- **Keys are set by dragging.** He drags the pill or an eye on the stage at the playhead to set a key.
- **An onion skin** shows the neighbouring poses as dashed outlines.
- **The machine is a short list of wires between clips**: loop, next, on an event, after a time.

**His hands.**
1. Put the playhead at 120 ms and drag the eyes: that sets the eye keys.
2. At 240 ms, drag the pill down a little for anticipation.
3. At 520 ms, drag it up and rotate it.
4. At 820 ms, drag it back onto its cells.
5. Right-click the Blinks lane: Blink here.
6. Add a wire: on `wake`, go to `greet`.

That is eleven gestures, with no switching between groups.

**Could fail.**
- **No concurrency.** A glance or a blink during a body clip must be keyed into that clip.
- **Energy is hand-keyed.** An energetic greeting is 15–25 keys.
- **Loops repeat exactly.** They come back at the same ms every pass, which is the Clippy-like presence to avoid.
- **The timeline grows to three rows and holds the motion itself.** That breaks M6's split, and it takes room from the
  stage.
- **It needs a change to the system `Slider`, which needs his approval.** The change is keys that do not fill between
  them, and a label per key.

### D · Springs

**The machine.**
- **A state sets targets, in a few beats.** The targets are the pose, the gaze and an energy.
- **Every channel reaches its target on a spring.** The simulation runs at a fixed step from t = 0, so seeking re-runs
  it exactly.
- **Interruption is free.** The springs retarget and carry their speed, so a hop curves on instead of kinking.
- **Secondary motion comes from lags.** The eyes lead, the body follows, and rotation follows travel.
- **Life runs underneath on seeded schedules.** Blinks have a rate, jitter and double blinks, and there are glances and
  float.

**His hands.**
1. Name a state.
2. Drag a ghost pill, and the real one springs after it: that is the step response on the real specimen.
3. Drag a reticle for the gaze.
4. Add a second beat back on the rest cell.
5. Tune the bounce while watching a response curve.
6. Wire `hey` → the state.

**Could fail.**
- **Everything reads springy.** There is no hard cut or linear move. A snappy, ballistic beat has to be faked.
- **Timing is indirect.** A beat says when the target changes, not when the body lands, so "land at exactly 300 ms" is
  out of reach.
- **It breaks his decided independent eye sizes.** There is one shared eye.
- **The rest pose drifts off the cell lines.** The float and the overshoot move it, against the amendment.
- **One feel for the whole character.** The springs and lags are character-wide.

### E · Layered axes

**The machine.**
- **The agent is never in one state.** Its motion is the sum of four layers:
  - a base loop blended from where a mood point sits on an energy × valence field;
  - a gaze that springs toward a target cell;
  - one-shot actions he authors, laid on top;
  - seeded blinks.
- **The machine is only arbitration.** It says which action may cut into which, and what each layer returns to.

**His hands.**
1. Author `greet` as keys on a ghost.
2. Set the mood point.
3. Tie the situation `woken` to greet, a mood and "look at the visitor".

**Could fail.**
- **The mood field is not his.** Energy × valence and its five anchors come from Agent-design.md §4, which he never
  approved. The whole base layer is structure he did not ask for.
- **No discrete states.** Working and waiting become held moods, which is a state machine by the back door.
- **The sum can be motion nobody authored.** A hop on a sway, plus a lean, reads as wobble.
- **Over a hundred tokens.** They are named after his actions, so renaming one orphans its tokens.
- **The review scored it the riskiest build.**

## 4. Recommendation

**A, the statechart.**
- **It is the only option that is really a state machine.** It has parallel clocks, events, timers, interruption rules
  and a return path, and that is exactly what today's bench lacks.
- **Authoring stays on the stage and in one state's inspector.**
- **It is the strictest reading of M6.** Only the gaps between events are dragged on the timeline.

Worth grafting on from the others:
- **From D and E: a fourth kind of interruption, `spring`.** An interrupted gesture carries its speed and curves on
  instead of kinking. `blend` stays the default, and it is his choice per transition.
- **From D: a Step scene (rest → one state → rest) as the default play.** He can then see a state he has just made
  without performing a take. It is labelled as bypassing his wiring.
- **From B: the harness's status as a level he can test against.** It is not only an event, so a page that opens while
  the agent is already working shows it working.
- **From B: checks shown as Badges** for a state with no way out, a state nothing reaches, and a zero-length loop. An
  event that did nothing is drawn hollow on its phase.
- **From C:**
  - Transitions as rows, each edited in a Popover, which fits a 348 px jig where a five-column table does not.
  - "Unkeyed means as it was", so an eyes-only state leaves the body where it stands.
  - Onion skin as dashed outlines.
  - Undo.

## 5. Questions that are his

1. **Drag on the stage?** May he drag the pill, its eyes and its rest cell directly on the stage? That is pointer
   handling on the drawn specimen: an in-app exception, like the phase grip. Without it, every option falls back to
   sliders for poses and gaze, and most of the speed-up is lost.
2. **Interruption.** When one gesture cuts into another mid-move, should the body:
   - keep its momentum and curve on (a spring);
   - cross-fade from where it froze (predictable, but it can kink);
   - or should that be his choice per transition?
3. **Idle life.** Should blinks and small glances run on their own seeded, jittered schedule, so they vary but cannot be
   keyed exactly? Or should the agent do only what he keys, so it repeats exactly?
4. **Where the structure lives.** States and transitions do not fit in CSS custom properties. Should the structure be
   sent and committed as a data file in the package (for example `agent-chart.ts`), next to the numeric
   `--motion-agent-*` lines? That would be a new kind of M7 pick.

## 6. Rounds

| Round | Date | Options | Pick | His notes |
|---|---|---|---|---|
| 1 | 2026-09-29 | A Statechart · B Inputs and layers · C Clips on a dope sheet · D Springs · E Layered axes | **A** | "Let's go with A." The four questions in §5 went unanswered; the defaults taken are in Motion.md's M12 amendment of 2026-09-29. |
