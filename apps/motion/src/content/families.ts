import { FOCUS_FAMILY } from "./focus";
import { MODE_FAMILY } from "./mode";
import { AGENTS_FAMILY } from "./agent-actions";
import { STEP_FAMILY } from "./steps";

/**
 * The studio's content (Motion.md M6, M9): each motion on the bench, the tokens it is made of, and five presets to
 * start from. A family is a page of the studio. **The bench holds only what he names** (his, 2026-09-27: "Remove the
 * exisiting components that you put in the studio. Because I'll tell you what we will work on and then you can add
 * them") — the first is movement, the second loading (M10, the same night), the third enter and exit, movement's first
 * primitive (M11, the next morning).
 *
 * A family whose tokens are already in globals.css starts from what the page says ("Today", read off it, never copied
 * here). A family still being designed has no tokens there yet, so its preset A carries the values it starts from.
 * Movement's and loading's are in globals.css since his picks (2026-09-27), hyper focus's since 2026-09-28 (picked again
 * 2026-09-29) and focus mode's since 2026-09-29, so each A is "Today"; B–E are the other four of each one's last round.
 */

/**
 * A page of the studio, and each of the agents' actions (Motion.md M24), whose values are kept apart from every other's:
 * `action-<its id>`.
 */
export type FamilyId = "move" | "load" | "enter" | "focus" | "mode" | "grip" | "step" | "motions" | `action-${string}`;

/** How a token's value is written in CSS and moved on a jig. */
export type TokenKind = "ms" | "ease" | "scale" | "share" | "choice" | "px";

export type Token = {
  unit?: "cells" | "degrees" | "count" | "multiplier" | "px";
  /** A motion token, or a component's shape a family designs with its motion (the slider's height, M16). */
  name: `--motion-${string}` | `--slider-${string}`;
  /** What the control is called. */
  label: string;
  /** What moving it changes, in a line. */
  touches: string;
  kind: TokenKind;
  /** Half the jig's width, beside its pair, so a family's tokens fit a ten-row field. A half choice is a select. */
  half?: boolean;
  /** Optional jig group for a larger design bench. */
  group?: string;
  /** A slider's range, in the token's unit; an ease is chosen from EASES, a choice from `choices`. */
  min?: number;
  max?: number;
  step?: number;
  choices?: { value: string; label: string }[];
  /**
   * A choice whose options are colours: what each one looks like, as CSS, from the family's values (the agent's paint
   * makes its ink). Shown in the design system's colour picker, as every pick of a colour is (Orbit.md C17).
   */
  swatches?: (values: Values) => Record<string, string>;
};

/** A token's value on a jig: a number in the token's unit (ms, a scale, a share), or an ease or a choice as CSS. */
export type Value = number | string;
export type Values = Record<string, Value>;

export type PresetId = "A" | "B" | "C" | "D" | "E";
export const PRESET_IDS: readonly PresetId[] = ["A", "B", "C", "D", "E"];

export type Preset = {
  id: PresetId;
  name: string;
  /** The reason it is here: which mechanism it tests. */
  why: string;
  /** How it could fail (feedback-design-batches: say it out loud, so a preference becomes a judgement). */
  risk: string;
  /** Every token's value. A of a family already in globals.css has none: it is whatever the page says. */
  values?: Values;
};

export type Family = {
  id: FamilyId;
  label: string;
  title: string;
  /** What the family is for, and which components it will move. */
  touches: string;
  /** How to play it, in a line, on the specimen's jig. */
  hint: string;
  /**
   * The specimen's block, in the stage's cells: how many columns and rows it takes to start with, and the most either
   * can be (his, 2026-09-27: "Replace Across and Down options labels with Rows and Columns. Treat them as common").
   * Every specimen is a block of cells, so every family has one — movement's elements fill it, loading's page is laid in
   * it — and one that would not fit the stage is trimmed to it.
   */
  block: { columns: number; rows: number; max: number };
  tokens: Token[];
  presets: Preset[];
  /**
   * A family designed version by version, not from presets (his, 2026-09-30: "I don't want the jigs to give me presets
   * … you give me phase one, I will try on that … then you can create version two"): the version its one start is. It
   * offers nothing to pick — its preset A is that version's values — and the head names the version where the preset
   * select stands. Its block is not drawn: a versioned family says in its own tokens what it is made of.
   */
  version?: number;
  /**
   * Families whose motion this one plays a part of, at their decided values — loading borrows movement's hand-over. The
   * stage carries their tokens too, slowed by the tempo with the rest; they are tuned on their own page, never here.
   */
  borrows?: FamilyId[];
  /**
   * Played on the agents of Orbit (Motion.md M23): the head's select previews one of them, and its look stands under
   * every value the family's own do not set (`agent-preview.tsx`).
   */
  agents?: boolean;
  /**
   * The agents' page (Motion.md M24): it holds no motion of its own. Its head picks one of the agents' actions, and the
   * bench is that action's (`actionFamily`).
   */
  actions?: boolean;
  /** One of the agents' actions (M24), by its id in the package's `lib/agent-actions`: its bench, its stage and its draft. */
  action?: string;
};

/**
 * The curves a jig offers for an ease, by name — short, so two fit side by side on a four-cell jig. `standard` is
 * Tailwind's, `cubic out` GSAP's power3, `iOS sheet` vaul's, `overshoot` a back-out. A value outside the list is shown
 * as it is.
 */
export const EASES: { value: string; label: string }[] = [
  { value: "ease", label: "ease" },
  { value: "ease-out", label: "ease-out" },
  { value: "ease-in", label: "ease-in" },
  { value: "ease-in-out", label: "ease-in-out" },
  { value: "linear", label: "linear" },
  { value: "cubic-bezier(0.4, 0, 0.2, 1)", label: "standard" },
  { value: "cubic-bezier(0.215, 0.61, 0.355, 1)", label: "cubic out" },
  { value: "cubic-bezier(0.16, 1, 0.3, 1)", label: "expo out" },
  { value: "cubic-bezier(0.7, 0, 0.84, 0)", label: "expo in" },
  { value: "cubic-bezier(0.65, 0, 0.35, 1)", label: "cubic in-out" },
  { value: "cubic-bezier(0.32, 0.72, 0, 1)", label: "iOS sheet" },
  { value: "cubic-bezier(0.34, 1.56, 0.64, 1)", label: "overshoot" },
];

const IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";
const EXPO_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const SHEET = "cubic-bezier(0.32, 0.72, 0, 1)";
const OVERSHOOT = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export const FAMILIES: Family[] = [
  {
    id: "move",
    label: "Movement",
    title: "One-cell elements move",
    touches: "Hover a cell: it grows to two, and the ones after it move a cell on, overflowing to the next line. For the work menu and the tech verticals.",
    hint: "Hover a cell, or press Play.",
    block: { columns: 3, rows: 1, max: 6 },
    tokens: [
      { name: "--motion-move-duration", label: "Duration", touches: "One element's move", kind: "ms", half: true, min: 0, max: 2000, step: 10 },
      { name: "--motion-move-stagger", label: "Stagger", touches: "+ outward, − inward", kind: "ms", half: true, min: -200, max: 200, step: 10 },
      {
        name: "--motion-move-wrap",
        label: "Wrap",
        touches: "A dot that changes lines",
        kind: "choice",
        choices: [
          { value: "overflow", label: "Overflow" },
          { value: "travel", label: "Travel" },
          { value: "fade", label: "Fade" },
        ],
      },
      { name: "--motion-move-ring-ease", label: "Ring ease", touches: "Growing, lighting", kind: "ease", half: true },
      { name: "--motion-move-dot-ease", label: "Dot ease", touches: "The dot's travel", kind: "ease", half: true },
      { name: "--motion-move-dot-min", label: "Dot min", touches: "Its size at the border", kind: "scale", half: true, min: 0, max: 1, step: 0.05 },
      { name: "--motion-move-dot-from", label: "Shrinks from", touches: "Way to the border", kind: "share", half: true, min: 0, max: 0.95, step: 0.05 },
      { name: "--motion-move-dot-lag", label: "Dot lag", touches: "+ leaves after the cells change, − before", kind: "share", min: -0.6, max: 0.6, step: 0.05 },
    ],
    presets: [
      {
        id: "A",
        name: "Today",
        why: "His pick, 2026-09-27, from As described: 400ms, a 40ms stagger (20ms since the tech column), cubic out on both, the dot gone at the border and setting off a tenth before the cells change, overflowing at a line's end. Read off globals.css.",
        risk: "The dot vanishes at every border, so a move of two cells blinks it twice.",
      },
      {
        id: "B",
        name: "Relay",
        why: "A long stagger: each dot sets off as the one before it arrives, a baton passed down the line.",
        risk: "The last dot lands well after the hover, and on five cells it trails.",
        values: {
          "--motion-move-duration": 420,
          "--motion-move-stagger": 120,
          "--motion-move-wrap": "overflow",
          "--motion-move-ring-ease": "ease-out",
          "--motion-move-dot-ease": IN_OUT,
          "--motion-move-dot-min": 0.3,
          "--motion-move-dot-from": 0.1,
          "--motion-move-dot-lag": 0,
        },
      },
      {
        id: "C",
        name: "Teleport",
        why: "The dot keeps its size until half way, vanishes at the border and reappears in the next cell, after the cells have changed; one that changes lines fades out and in: transport rather than travel.",
        risk: "Vanishing can read as a glitch: for a frame at the border the dot is gone.",
        values: {
          "--motion-move-duration": 440,
          "--motion-move-stagger": 30,
          "--motion-move-wrap": "fade",
          "--motion-move-ring-ease": SHEET,
          "--motion-move-dot-ease": IN_OUT,
          "--motion-move-dot-min": 0,
          "--motion-move-dot-from": 0.5,
          "--motion-move-dot-lag": 0.2,
        },
      },
      {
        id: "D",
        name: "Glide",
        why: "The dot sets off before the cells change and settles on a long tail, barely dipping; one that changes lines glides straight across the block: the fluid half of the brief.",
        risk: "With so little dip, the border hardly registers, and it reads as a plain slide.",
        values: {
          "--motion-move-duration": 560,
          "--motion-move-stagger": 40,
          "--motion-move-wrap": "travel",
          "--motion-move-ring-ease": IN_OUT,
          "--motion-move-dot-ease": EXPO_OUT,
          "--motion-move-dot-min": 0.6,
          "--motion-move-dot-from": 0.3,
          "--motion-move-dot-lag": -0.1,
        },
      },
      {
        id: "E",
        name: "Spring",
        why: "The dot overshoots the next cell's centre and comes back, so it lands with a bounce — the brand's \"springy\".",
        risk: "Overshooting carries the dot back towards the border, so it dips a second time as it settles.",
        values: {
          "--motion-move-duration": 520,
          "--motion-move-stagger": 50,
          "--motion-move-wrap": "overflow",
          "--motion-move-ring-ease": IN_OUT,
          "--motion-move-dot-ease": OVERSHOOT,
          "--motion-move-dot-min": 0.25,
          "--motion-move-dot-from": 0,
          "--motion-move-dot-lag": 0.05,
        },
      },
    ],
  },

  {
    id: "load",
    label: "Loading",
    title: "The page loads",
    touches:
      "While the page loads, a square of dashed lime cells stands at the centre, one a section, never wider than tall, and its rings turn. When it is ready, every ring is pressed at once, its dashes closing into a full circle as it shrinks, and goes straight to its section in one move of movement's dot, all in movement's duration, drowning as it leaves, unseen over the cells between, floating up as it arrives, every ring landing at once, then all are released into plain borders that fade as the sections open. No page loads this way since 2026-09-30: it lives on this bench alone.",
    hint: "Press Play to load the page.",
    // Eight columns hold the sample's hero pair, row of three, two columns and footer; seven rows hold all eight.
    block: { columns: 8, rows: 7, max: 12 },
    borrows: ["move"],
    tokens: [
      {
        name: "--motion-load-turn",
        label: "Turn",
        touches: "How the rings turn",
        kind: "choice",
        half: true,
        choices: [
          { value: "spin", label: "Spin" },
          { value: "gears", label: "Gears" },
          { value: "chase", label: "Chase" },
          { value: "relay", label: "Relay" },
        ],
      },
      { name: "--motion-load-lap", label: "Lap", touches: "How fast it turns", kind: "ms", half: true, min: 200, max: 6000, step: 50 },
      { name: "--motion-load-press", label: "Press", touches: "Press, and release", kind: "ms", half: true, min: 0, max: 400, step: 10 },
      {
        name: "--motion-load-open",
        label: "Opening",
        touches: "From its cell to its section",
        kind: "choice",
        half: true,
        choices: [
          { value: "smooth", label: "Smooth" },
          { value: "cells", label: "By whole cells" },
        ],
      },
      { name: "--motion-load-duration", label: "Duration", touches: "The opening", kind: "ms", half: true, min: 0, max: 2000, step: 10 },
      { name: "--motion-load-reveal", label: "Reveal", touches: "The end of the opening", kind: "share", half: true, min: 0, max: 1, step: 0.05 },
    ],
    presets: [
      {
        id: "A",
        name: "Today",
        why: "His pick, 2026-09-27, from As described, and then chase for the turn: a closed ring round the square, once round every 6s, a 200ms press, and a long, smooth opening of 1200ms with the section coming in over the whole of it. A square of rings at the centre, every ring pressed to 0.5 at once, all going straight to their sections' top-left cells in one move of movement's dot and landing at once, then released together into plain borders that open from those corners, rightward and down. Read off globals.css.",
        risk: "Once round in 6s, a chase round ten rings hands on every 0.6s: in the page's first 2s it goes about a third of the way round.",
      },
      {
        id: "B",
        name: "Gears",
        why: "Neighbouring rings turn opposite ways, meshed like gears, so the square reads as one machine. All pressed at once, they go to their sections, and open as plain borders.",
        risk: "On a page this small, rings turning against each other can read as a shimmer rather than gears.",
        values: {
          "--motion-load-press": 100,
          "--motion-load-turn": "gears",
          "--motion-load-lap": 2000,
          "--motion-load-open": "smooth",
          "--motion-load-duration": 560,
          "--motion-load-reveal": 0.5,
        },
      },
      {
        id: "C",
        name: "Chase",
        why: "No ring turns on its own. A closed ring goes round the square, handing over like a marquee; then all are pressed at once, go to their sections, and each section opens a whole cell at a time.",
        risk: "Opening by whole cells can read as a stutter rather than counting.",
        values: {
          "--motion-load-press": 140,
          "--motion-load-turn": "chase",
          "--motion-load-lap": 1200,
          "--motion-load-open": "cells",
          "--motion-load-duration": 640,
          "--motion-load-reveal": 0.4,
        },
      },
      {
        id: "D",
        name: "Relay",
        why: "One ring at a time turns once round, then hands on to the next round the page, a baton. The press is longer and the opening easy: the calm one.",
        risk: "With one ring moving at a time, the others can look stalled.",
        values: {
          "--motion-load-press": 160,
          "--motion-load-turn": "relay",
          "--motion-load-lap": 2400,
          "--motion-load-open": "smooth",
          "--motion-load-duration": 520,
          "--motion-load-reveal": 0.6,
        },
      },
      {
        id: "E",
        name: "Burst",
        why: "Quick. A fast spin, a short press and a short opening: the page arrives almost at once.",
        risk: "With the press this short, the rings seem to set off before they have been pressed, and the press is lost.",
        values: {
          "--motion-load-press": 80,
          "--motion-load-turn": "spin",
          "--motion-load-lap": 900,
          "--motion-load-open": "smooth",
          "--motion-load-duration": 360,
          "--motion-load-reveal": 0.3,
        },
      },
    ],
  },

  {
    id: "enter",
    label: "Enter · exit",
    title: "Movement's first primitive: one cell enters and exits",
    touches:
      "One cell's element comes in and goes out: its ring lights on the cell and its dot floats up into it, then the dot drowns out of it and the ring goes out. A move of one cell is an exit from one cell and an enter into the next. More cells enter one after another, by movement's stagger.",
    hint: "Hover the block: it enters. Leave: it exits. Or press Play.",
    // His "only one cell". A bigger block enters and exits in flow order, movement's stagger apart.
    block: { columns: 1, rows: 1, max: 6 },
    // Movement's stagger, between one element and the next. Tuned on movement's page.
    borrows: ["move"],
    tokens: [
      { name: "--motion-move-enter", label: "Enter", touches: "Coming in", kind: "ms", half: true, min: 0, max: 1000, step: 10 },
      { name: "--motion-move-exit", label: "Exit", touches: "Going out", kind: "ms", half: true, min: 0, max: 1000, step: 10 },
      { name: "--motion-move-enter-ease", label: "Enter ease", touches: "Its curve in", kind: "ease", half: true },
      { name: "--motion-move-exit-ease", label: "Exit ease", touches: "Its curve out", kind: "ease", half: true },
      {
        name: "--motion-move-enter-way",
        label: "Way",
        touches: "Where the dot comes in and goes out",
        kind: "choice",
        choices: [
          { value: "place", label: "In place" },
          { value: "through", label: "Through" },
          { value: "rise", label: "Rise" },
        ],
      },
      { name: "--motion-move-enter-scale", label: "Size", touches: "Arriving and leaving", kind: "scale", half: true, min: 0, max: 1, step: 0.05 },
      { name: "--motion-move-enter-opacity", label: "Opacity", touches: "Arriving and leaving", kind: "scale", half: true, min: 0, max: 1, step: 0.05 },
      { name: "--motion-move-enter-ring", label: "Ring lead", touches: "+ the ring lights first and goes out last, − the dot", kind: "share", min: -0.6, max: 0.6, step: 0.05 },
    ],
    presets: [
      {
        id: "A",
        name: "From the move",
        why: "Movement's dot at his settings, taken apart. It comes in through the flow's start border from nothing and settles at the centre on cubic out, and goes out through the far border in a blink: inside his 400ms move, leaving takes the first fifth of the curve (about 75ms) and arriving the rest (about 290ms), and the second half of cubic out is cubic out again. The ring lights a little before the dot comes. Not in globals.css yet: these are the values it starts from.",
        risk: "The exit is 80ms. On its own, with no arrival in the next cell to watch, it can read as the dot vanishing rather than leaving. And in the move the old ring goes out well after the dot has gone, which one lead cannot say.",
        values: {
          "--motion-move-enter": 320,
          "--motion-move-exit": 80,
          "--motion-move-enter-ease": "cubic-bezier(0.215, 0.61, 0.355, 1)",
          "--motion-move-exit-ease": "linear",
          "--motion-move-enter-way": "through",
          "--motion-move-enter-scale": 0,
          "--motion-move-enter-opacity": 1,
          "--motion-move-enter-ring": 0.1,
        },
      },
      {
        id: "B",
        name: "Float",
        why: "In place: the dot grows from nothing at the cell's centre and shrinks back into it. His \"floating\" and \"drowning\" as size alone, with no travel. The ring and the dot come and go together.",
        risk: "With no direction, nothing says where it came from or where it went, and a block of them growing at once can read as popping.",
        values: {
          "--motion-move-enter": 360,
          "--motion-move-exit": 240,
          "--motion-move-enter-ease": EXPO_OUT,
          "--motion-move-exit-ease": "ease-in",
          "--motion-move-enter-way": "place",
          "--motion-move-enter-scale": 0,
          "--motion-move-enter-opacity": 1,
          "--motion-move-enter-ring": 0,
        },
      },
      {
        id: "C",
        name: "Surface",
        why: "Up from the cell's lower border, growing from 40% and fading in, then back down it, sinking: \"drowning\" taken literally, as water. The dot comes first and its ring lights once it has surfaced, and going out the ring goes first.",
        risk: "Rising has nothing to do with the flow, so in a row it can read as coming from the row below.",
        values: {
          "--motion-move-enter": 440,
          "--motion-move-exit": 300,
          "--motion-move-enter-ease": SHEET,
          "--motion-move-exit-ease": "ease-in",
          "--motion-move-enter-way": "rise",
          "--motion-move-enter-scale": 0.4,
          "--motion-move-enter-opacity": 0,
          "--motion-move-enter-ring": -0.3,
        },
      },
      {
        id: "D",
        name: "Fade",
        why: "Opacity only: no size and no travel, the reduced-motion baseline. The ring lights well before the dot and goes out well after it, a door opening and closing. This tests whether the size change matters at all.",
        risk: "It is flat. Nothing drowns or floats, and movement was built on both.",
        values: {
          "--motion-move-enter": 240,
          "--motion-move-exit": 180,
          "--motion-move-enter-ease": "ease-out",
          "--motion-move-exit-ease": "ease-in",
          "--motion-move-enter-way": "place",
          "--motion-move-enter-scale": 1,
          "--motion-move-enter-opacity": 0,
          "--motion-move-enter-ring": 0.3,
        },
      },
      {
        id: "E",
        name: "Pop",
        why: "The brand's \"springy\": in place, the dot grows past whole and settles back, and it leaves at once, gathering speed.",
        risk: "An overshoot on every enter of a list is noise, and past whole the dot comes near its ring for a moment.",
        values: {
          "--motion-move-enter": 420,
          "--motion-move-exit": 160,
          "--motion-move-enter-ease": OVERSHOOT,
          "--motion-move-exit-ease": "cubic-bezier(0.7, 0, 0.84, 0)",
          "--motion-move-enter-way": "place",
          "--motion-move-enter-scale": 0,
          "--motion-move-enter-opacity": 1,
          "--motion-move-enter-ring": 0,
        },
      },
    ],
  },
  // The fifth, his, 2026-09-28 (Motion.md M13): a card in focus, the page blurring round it.
  FOCUS_FAMILY,
  // The sixth, his, the same evening (Motion.md M14): focus mode, one vertical at a time under a panel, a cloth round it.
  MODE_FAMILY,
  // The seventh, his, 2026-09-30 (Motion.md M16): the slider — its head detaching into the cursor, its body fluid.
  // Decided the same night (A As described, tuned), and tuned again (A Today, tuned): its tokens are in globals.css, so
  // A is "Today", read off the page.
  {
    id: "grip",
    label: "Grip",
    title: "The slider: the head goes into the cursor, the body flows after it",
    touches:
      "The slider is a round bar with its head merged into it: the lime ends in the head. Take hold of the head — press it, or press the bar and drag — and the bar opens round the cursor, its sides 2px clear of the ring, while the head goes into the ring; the cursor stays a ring. The body is fluid: where its sides meet, or part round the head, follows the head on a spring, so the lime flows after a quick move and a moving end stretches. Let go and the head goes back into the bar. For every Slider.",
    hint: "Press and drag a head, or press Play.",
    // Columns: the sliders' length in cells. Rows: how many, one a row, every second one a range.
    block: { columns: 6, rows: 2, max: 8 },
    tokens: [
      { group: "Head", name: "--motion-grip-in", label: "Detach", touches: "Into the cursor", kind: "ms", half: true, min: 0, max: 1000, step: 10 },
      { group: "Head", name: "--motion-grip-out", label: "Merge", touches: "Back into the bar", kind: "ms", half: true, min: 0, max: 1000, step: 10 },
      { group: "Head", name: "--motion-grip-in-ease", label: "Detach ease", touches: "Its curve in", kind: "ease", half: true },
      { group: "Head", name: "--motion-grip-out-ease", label: "Merge ease", touches: "Its curve back", kind: "ease", half: true },
      { group: "Head", name: "--motion-grip-size", label: "Size", touches: "The head in the cursor; clear inside 20", kind: "scale", unit: "px", min: 4, max: 20, step: 1 },
      { group: "Body", name: "--slider-height", label: "Height", touches: "The bar; the cursor's ring is 24", kind: "px", unit: "px", half: true, min: 8, max: 24, step: 2 },
      { group: "Body", name: "--motion-grip-lead", label: "Bar lead", touches: "+ it opens first, − the head goes first", kind: "share", half: true, min: -0.6, max: 0.6, step: 0.05 },
      { group: "Body", name: "--motion-grip-follow", label: "Follow", touches: "One swing after the head, 0 with it", kind: "ms", half: true, min: 0, max: 1500, step: 10 },
      { group: "Body", name: "--motion-grip-follow-bounce", label: "Follow bounce", touches: "0 settles, more overshoots", kind: "share", half: true, min: 0, max: 0.9, step: 0.05 },
      { group: "Body", name: "--motion-grip-stretch", label: "Stretch", touches: "A moving end's cap, with its speed", kind: "share", min: 0, max: 1.5, step: 0.05 },
    ],
    presets: [
      {
        id: "A",
        name: "Today",
        why: "His, A Today, tuned (2026-09-30), his second tuning of his pick the same night: the bar 8px, a third of the cursor's ring. Held, the head is in the cursor at once, 0ms, an 8px dot, the bar's own size; let go, the bar closes and the head comes back after it over 240ms, each for half the time (a lead of −0.5), on cubic out. The body follows the head on a quick spring, 180ms with a bounce of 0.2, a moving end stretching by 0.6.",
        risk: "With no time to take hold the grip is only seen letting go; at 8px the head at rest is a small dot the bar's height, and held the 24px ring stands 8px proud of the bar on each side, so the ring reads as bigger than the slider."
      },
      {
        id: "B",
        name: "Thin",
        why: "The height he asked for with the segments: the bar half the cursor's height, 12px, the head growing out of it into the ring as a 16px dot, and the same fluid body. It tests the thin bar without the segments.",
        risk: "At 12px the merged head is a small circle and hardly reads as a head at rest, and the ring stands well above and below the bar.",
        values: {
          "--motion-grip-in": 200,
          "--motion-grip-out": 200,
          "--motion-grip-in-ease": "cubic-bezier(0.215, 0.61, 0.355, 1)",
          "--motion-grip-out-ease": "cubic-bezier(0.215, 0.61, 0.355, 1)",
          "--motion-grip-size": 16,
          "--slider-height": 12,
          "--motion-grip-lead": 0,
          "--motion-grip-follow": 320,
          "--motion-grip-follow-bounce": 0.2,
          "--motion-grip-stretch": 0.4,
        },
      },
      {
        id: "C",
        name: "Liquid",
        why: "The body at its most fluid: a slow follow, 700ms, with real bounce, 0.45, and a long stretch, so the lime pours after the head, overshoots it and settles back, its end drawn out while it runs.",
        risk: "The body overshooting the head puts lime past the value for a moment, and on a long drag it is always behind.",
        values: {
          "--motion-grip-in": 240,
          "--motion-grip-out": 260,
          "--motion-grip-in-ease": EXPO_OUT,
          "--motion-grip-out-ease": EXPO_OUT,
          "--motion-grip-size": 16,
          "--slider-height": 24,
          "--motion-grip-lead": 0.2,
          "--motion-grip-follow": 700,
          "--motion-grip-follow-bounce": 0.45,
          "--motion-grip-stretch": 1,
        },
      },
      {
        id: "D",
        name: "Tight",
        why: "The body barely behind: a quick follow with no bounce, 140ms, and no stretch, so it is almost rigid. The baseline, to see what the fluid body adds.",
        risk: "It is the slider before the body was fluid, and the grip is all that moves.",
        values: {
          "--motion-grip-in": 160,
          "--motion-grip-out": 180,
          "--motion-grip-in-ease": "cubic-bezier(0.215, 0.61, 0.355, 1)",
          "--motion-grip-out-ease": "cubic-bezier(0.215, 0.61, 0.355, 1)",
          "--motion-grip-size": 16,
          "--slider-height": 24,
          "--motion-grip-lead": 0,
          "--motion-grip-follow": 140,
          "--motion-grip-follow-bounce": 0,
          "--motion-grip-stretch": 0,
        },
      },
      {
        id: "E",
        name: "Elastic",
        why: "Spring everywhere: the head goes into the cursor on an overshoot, filling the ring, 20px, the bar opening first, and the body follows on a bouncy spring, 420ms at 0.6, its ends stretching — the brand's \"springy\" all through.",
        risk: "Three things overshooting at once is busy, and a 20px head in the ring leaves it no air.",
        values: {
          "--motion-grip-in": 300,
          "--motion-grip-out": 280,
          "--motion-grip-in-ease": OVERSHOOT,
          "--motion-grip-out-ease": OVERSHOOT,
          "--motion-grip-size": 20,
          "--slider-height": 24,
          "--motion-grip-lead": 0.3,
          "--motion-grip-follow": 420,
          "--motion-grip-follow-bounce": 0.6,
          "--motion-grip-stretch": 0.7,
        },
      },
    ],
  },
  // His, the same night (Motion.md M21): the slider's steps — a dot over each, a tick as the value lands on one.
  STEP_FAMILY,
  // The eighth, his, the same night (Motion.md M17): a character, a 3D sphere that travels by diving from cell to cell,
  // whose page went when its motions became every agent's (M23, 2026-10-01): Agents, a page of actions since M24.
  AGENTS_FAMILY,
];

export const familyById = (id: string) => FAMILIES.find((f) => f.id === id);
