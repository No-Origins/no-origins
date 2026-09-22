import { ill, type Hue, type Line } from "@no-origins/ui";

/**
 * The studio's batches (Patterns.md §8; the log of decided rounds is §9). One round asks ONE question about ONE subject and answers it five
 * ways, so that picking one teaches something that carries to every other illustration.
 *
 * A candidate may improvise its geometry — only a winner earns a place in the grammar (`primitives.ts`).
 * Everything else still holds: fine lines, no fill, no two lines touching, one hue, lit from the top-left.
 */
export interface Cell { label: string; value: string; caption: string }

/** A candidate drawn for one section: some rounds ask a question that only two sections side by side can answer. */
export interface Variant {
  hue: Hue;
  cell: Cell;
  draw: (line: Line) => React.ReactNode;
}

export interface Option {
  id: string;
  name: string;
  /** Two sections, when the round is about what tells sections apart. */
  variants?: Variant[];
  /** What this one is testing — the reason it is in the batch. */
  logic: string;
  /** How it could be wrong. Said out loud so the pick is a judgement, not a guess. */
  risk: string;
  draw?: (line: Line) => React.ReactNode;
}

export interface Round {
  n: number;
  subject: string;
  hue: Hue;
  /** Short enough to be a heading; the question itself opens the lead. */
  title: string;
  /** The question the batch asks. Every option is an answer to it. */
  question: string;
  why: string;
  options: Option[];
  /** My own pick, and why — so you have something to disagree with. */
  recommend: string;
  /** Where the drawing sits: in the top-right corner, or across the whole cell. */
  place: "corner" | "field";
  /** The real cell contents, when the candidate has to be judged with the text on top of it. */
  cell?: Cell;
  /** Filled in once the round is decided. `ranked` is in his order of preference; `chosen` is the first of them. */
  ranked?: string[];
  chosen?: string;
  note?: string;
  rules?: string[];
}

import { contours, bumps, sheaf, fan, rings, poly, from, plateau, sum, parting, warpField, waveField, offsetField, illo, type Illo, type Family } from "./field";

const { ring, pebbles, polar } = ill;

/** Round 2's fields. Built once at module scope: the same picture on the server and the client. */
// The origin sits just outside the bottom-left corner and the first level clears the figure, so the corner the
// text lives in holds no line at all; the bumps stay in the upper right for the same reason.
const CORNER = { x: -10, y: 252 };
const wobble = bumps(5, 21, 26, { x0: 96, y0: 10, x1: 250, y1: 190 });
const wobbledFan = contours((x, y) => Math.hypot(x - CORNER.x, y - CORNER.y) + wobble(x, y), [216, 263, 310, 357]);
const hills = bumps(3, 7, 96);
const landscape = contours((x, y) => hills(x, y) - (x + y) * 0.16, [-34, -12, 10, 32]);

/**
 * Round 3. Every field below is a terrain — round 2 said so — and the two that keep a corner quiet do it the
 * 2A way: the base is the distance from a point just outside the bottom-left corner, and the first level clears
 * the figure. 3C tries the other answer instead, and puts a plateau under each block of text.
 */
// The origin sits off the LEFT edge, half way down — because that is where the text is. Round 2's corner origin
// put the top-left label in the middle of the sweep, where no level could clear it; from here every word in the
// cell is inside the first level, and the contours are near-vertical arcs that leave through the top and bottom.
const WEST = from(-40, 128);
const OPEN = { x0: 124, y0: 12, x1: 250, y1: 228 };                // where a bump may sit without reaching the words
const LEVELS4 = [180, 216, 252, 288];

const tunedTerrain = contours(sum(WEST, bumps(7, 34, 24, OPEN)), LEVELS4);

// one feature per line, on the arc that line runs along: the four curves get four different characters
const characters = contours(
  sum(WEST, (x, y) => [
    { cx: 142, cy: 128, s: 42, w: 26 }, { cx: 172, cy: 62, s: 34, w: -22 },
    { cx: 206, cy: 186, s: 44, w: 28 }, { cx: 236, cy: 104, s: 38, w: -20 },
  ].reduce((a, b) => a + b.w * Math.exp(-((x - b.cx) ** 2 + (y - b.cy) ** 2) / (2 * b.s * b.s)), 0)),
  LEVELS4,
);

// a terrain over the whole cell, with high ground under the label and under the figure so the lines part
const parted = contours(
  sum(
    (x, y) => 300 - (x * 0.42 + (240 - y) * 0.58),
    bumps(6, 12, 52),
    plateau(40, 24, 62, 30, 150),                                  // under the label
    plateau(58, 148, 78, 74, 150),                                 // under the figure
  ),
  [176, 202, 228, 254],
);

// the same terrain, but the levels bunch as they go out: four lines and a gradient of density
const shore = contours(sum(WEST, bumps(5, 61, 22, OPEN)), [180, 232, 264, 284]);

// no count at all in the picture: six levels, and the figure says four
const fullTerrain = contours(sum(WEST, bumps(8, 5, 18, OPEN)), [178, 204, 230, 256, 282, 308]);

/**
 * Round 4. The parting, tuned, and then asked to do the job it will actually have: telling seven sections apart.
 * The level ground under each block of text is measured, not guessed — see below.
 */
// Measured off the rendered cell with e2e/.mcp/where.mjs rather than guessed — the caption is much the widest
// thing in the cell, and two rounds of guessing put lines through the figure. Each region is a glyph rect plus
// the 8px of clearance principle 7 asks for, in viewBox units.
const WORK_WORDS: Array<[number, number, number, number]> = [[16, 15, 42, 28], [16, 105, 69, 224]];
const CASE_WORDS: Array<[number, number, number, number]> = [[16, 15, 95, 28], [16, 105, 155, 224]];
// Measured, never guessed — `node e2e/.mcp/words.mjs 11` prints them off the rendered 304px cell. Guessing
// these twice in round 3 is how lines ended up running through the figure twice.
const PROJ_WORDS: Array<[number, number, number, number]> = [[16, 15, 69, 28], [16, 105, 134, 224]];
const W = { words: WORK_WORDS };
const WORK: Pick<Illo, "words"> = { words: WORK_WORDS };
const C = { words: CASE_WORDS };

// 4A direction — the same terrain flowing a different way
const dirWork = parting({ ...W, tilt: [0.35, 0.75], seed: 12, count: 5, strength: 20, lines: 4 });
const dirCase = parting({ ...C, tilt: [0.78, -0.34], seed: 12, count: 5, strength: 20, lines: 3 });
// 4B density — same field, more lines or fewer
const denWork = parting({ ...W, seed: 24, count: 5, strength: 18, lines: 8 });
const denCase = parting({ ...C, seed: 24, count: 5, strength: 18, lines: 3 });
// 4C character — long smooth swells against short broken ridges
const chrWork = parting({ ...W, seed: 31, count: 3, strength: 34, sigma: [70, 110], lines: 4 });
const chrCase = parting({ ...C, seed: 31, count: 12, strength: 16, sigma: [18, 34], lines: 3 });
// 4D openness — open lines against a field with islands in it
const opnWork = parting({ ...W, seed: 44, count: 4, strength: 18, sigma: [60, 90], lines: 4 });
const opnCase = parting({ ...C, seed: 3, count: 3, strength: 78, sigma: [44, 62], lines: 3 });
// 4E the count alone — one field, one direction, one character; only the number of lines differs
const cntWork = parting({ ...W, seed: 12, count: 5, strength: 20, lines: 4 });
const cntCase = parting({ ...C, seed: 12, count: 5, strength: 20, lines: 3 });

const lines = (sets: string[][]) => (line: Line) =>
  sets.flatMap((paths, i) => paths.map((d, j) => <path key={`${i}-${j}`} d={d} style={line()} />));

const WORK_CELL: Cell = { label: "work", value: "4", caption: "roles" };
const CASE_CELL: Cell = { label: "case studies", value: "3", caption: "worth telling" };
/**
 * Round 11's three sections. The question is whether seven fields can be told apart, and no single card can be
 * asked it — so a candidate here is a RULE for turning a section into parameters, drawn three times.
 */
const SECTIONS: Array<{ hue: Hue; cell: Cell; words: Array<[number, number, number, number]> }> = [
  { hue: "peach", cell: { label: "work", value: "4", caption: "roles" }, words: WORK_WORDS },
  { hue: "lavender", cell: { label: "case studies", value: "3", caption: "worth telling" }, words: CASE_WORDS },
  { hue: "green", cell: { label: "projects", value: "0", caption: "shipped yet" }, words: PROJ_WORDS },
];

const trio = (sets: Array<Omit<Family, "words">>): Variant[] =>
  SECTIONS.map((s, i) => ({ hue: s.hue, cell: s.cell, draw: lines(illo({ ...sets[i]!, words: s.words })) }));

const pair = (w: string[][], c: string[][]): Variant[] => [
  { hue: "peach", cell: WORK_CELL, draw: lines(w) },
  { hue: "lavender", cell: CASE_CELL, draw: lines(c) },
];

export const rounds: Round[] = [
  {
    n: 1,
    subject: "Current Status — “what I'm looking for”",
    hue: "blue",
    title: "Five ways a drawing can mean something",
    question: "What makes a line drawing mean something: a symbol, a repetition, a journey, a count, or an emphasis?",
    why: "Status is the hardest of the seven, because it stands for an intention rather than a thing — so it is the right subject to settle the deeper question with. Each option below carries meaning by a different mechanism, and whichever one reads fastest tells us how to draw the other six.",
    options: [
      {
        id: "1A",
        name: "The opening",
        logic:
          "Meaning as a SYMBOL: one closed form deliberately left open, with a mark that has already gone through it. A second, shorter arc inside echoes the first so the gap reads as intended rather than as a mistake. This is what ships today.",
        risk: "A broken circle is a common icon — it may read as “loading” before it reads as “open”. The inner arc has to sit up the left, because underneath it the pair reads as a smiling face.",
        draw: (line) => {
          const [outer] = ring([0.72], { radius: 86, rotate: 0, gap: 0.06 });
          const [inner] = ring([0.42], { radius: 58, rotate: 150, gap: 0.05 });
          const [dx, dy] = polar(120, 120, 86, -61);
          return (
            <>
              <path d={outer!} style={line()} />
              <path d={inner!} style={line()} />
              <circle cx={dx} cy={dy} r={10} style={line()} />
            </>
          );
        },
      },
      {
        id: "1B",
        name: "The threshold",
        logic:
          "Meaning as REPETITION at two scales: the same gesture twice, openings aligned, so the eye reads a way through rather than a broken shape. Nothing else in the frame — the most restrained option in the batch.",
        risk: "Restraint may tip into emptiness at the 0.27 overview, where two thin arcs could vanish into the tile.",
        draw: (line) => {
          const [outer] = ring([0.68], { radius: 96, rotate: 28, gap: 0.05 });
          const [inner] = ring([0.68], { radius: 62, rotate: 28, gap: 0.05 });
          return (
            <>
              <path d={outer!} style={line()} />
              <path d={inner!} style={line()} />
            </>
          );
        },
      },
      {
        id: "1C",
        name: "The approach",
        logic:
          "Meaning as a JOURNEY: one long travelling line from the bottom-left that slows and arrives at something not yet touched. It is the only option with a direction, and direction is the one thing the light already gives us — the line brightens as it climbs toward the top-left.",
        risk: "A single sweeping line is closer to handwriting than to geometry; it may not sit in the same family as the other six. And a destination circle can read as a full stop.",
        draw: (line) => (
          <>
            <path d="M 6 220 C 62 216, 92 168, 104 118 C 114 74, 136 44, 172 30" style={line()} />
            <circle cx={204} cy={26} r={13} style={line()} />
          </>
        ),
      },
      {
        id: "1D",
        name: "Four paths",
        logic:
          "Meaning as an HONEST COUNT (principle 8): the Status widget really does offer four ways in — hiring, collaborating, following, saying hi — so the picture is four arcs opening out of one corner. The only option in the batch whose number is true.",
        risk: "Concentric arcs from a corner are also the wifi/signal glyph, and a fan of four can read as a rainbow. Honest is not the same as legible.",
        draw: (line) =>
          [52, 88, 124, 160].map((r, i) => {
            const [arc] = ring([0.25], { cx: 24, cy: 216, radius: r, rotate: -90, gap: 0 });
            return <path key={r} d={arc!} style={line()} />;
          }),
      },
      {
        id: "1E",
        name: "One of many",
        logic:
          "Meaning as EMPHASIS: a scattered field where one circle is far larger than the rest — looking is choosing. It reuses the `pebbles` grammar that Projects already uses, so a win here would mean one primitive carries two different ideas by weight alone.",
        risk: "It is the same primitive as Projects. If two of the seven sections share a shape, the map stops being scannable — which is an argument the batch should settle rather than avoid.",
        draw: (line) => {
          const discs = pebbles(8, { rMin: 9, rMax: 40, seed: 4, clearance: 15 });
          const big = discs.reduce((a, b) => (b.r > a.r ? b : a), discs[0]!);
          return discs.map((d, i) => (
            <circle key={i} cx={d.cx} cy={d.cy} r={d.r} style={line()} />
          ));
        },
      },
    ],
    place: "corner",
    chosen: "1D",
    note: "“Instead of parallel lines and just looking like some icon on the card, I'd prefer lines reaching the edges of the cards and not literally parallel. I just don't want lines to cross each other. They can be similar in the type of curve but not really parallel.”",
    rules: [
      "An illustration is a FIELD, not an object: the lines cross the whole cell and run off its edges. A drawing that sits inside the frame reads as an icon placed on a card.",
      "Non-parallel is required. Lines may share a kind of curve, but equal spacing makes the picture mechanical.",
      "Non-crossing stays absolute — which, with the two rules above, is now the hard part.",
      "The honest count survives the change: four paths are still four lines.",
    ],
    recommend:
      "1B, then 1A. The threshold says “a way through” with two lines and no borrowed icon, and it is the only one that would still read if we halved the stroke. 1D is the one I most want to be wrong about — an honest count is worth a lot, and if you pick it I will spend the next round making a fan of four not look like wifi.",
  },
  {
    n: 2,
    subject: "Current Status — four paths, as a field",
    hue: "blue",
    title: "Four lines that never meet and are never parallel",
    place: "field",
    cell: { label: "status", value: "4", caption: "paths" },
    question: "If the lines have to cross the whole cell, vary, and still never meet — what kind of family are they?",
    why:
      "There are only two honest ways to guarantee that a family of varying lines never crosses. ORDERED: every curve sits strictly clear of the next at every point along a shared parameter, so they can bend differently and still keep their order. LEVEL SETS: the lines are the contours of one smooth field, and two contours cannot cross because a point cannot hold two values — a proof rather than a construction, which lets the field be as irregular as it likes. 2A and 2D are level sets; 2B, 2C and 2E are ordered. Each is shown in a real cell with the real text on top, because a field runs under the words now and legibility is part of the pick — and `probe10` now measures that as a distance rather than an overlap. As drawn, only 2A keeps every line clear of the figure: its origin sits behind the corner the text lives in and its first level clears it, so the quiet region falls out of the structure. The other four run straight through the “4” and would each need composing the same way.",
    options: [
      {
        id: "2A",
        name: "The wobbled fan",
        logic:
          "Your 1D, rebuilt as a field: the four arcs are contour lines of the distance from a point off the bottom-left corner, perturbed by five soft bumps. Same reading — four paths out of one place — but the spacing breathes, no two lines are parallel, they run off all four edges, and crossing is mathematically impossible rather than carefully avoided. The corner the origin sits behind stays empty, which is exactly where the figure goes.",
        risk: "It is still a fan. If the wifi reading survives the wobble, the mechanism is not the problem and the subject needs a different idea altogether.",
        draw: (line) => wobbledFan.flatMap((paths, i) => paths.map((d, j) => <path key={`${i}-${j}`} d={d} style={line()} />)),
      },
      {
        id: "2B",
        name: "The sheaf",
        logic:
          "Four waves crossing the cell side to side, each with its own amplitude, frequency and phase, so they converge in one place and open in another. Ordered: each is placed a full amplitude clear of the one above, which is what lets them differ so much and still hold their order. The most horizontal, calmest option — closest to the reference's stacked waves, but no longer parallel.",
        risk: "Horizontal bands read as data. It may say “chart” where the section means “ways in”, and it is the option that shares most with the Case Studies drawing.",
        draw: (line) => sheaf(4, { seed: 3, top: 34, clearance: 26 }).map((d, i) => <path key={i} d={d} style={line()} />),
      },
      {
        id: "2C",
        name: "The drift",
        logic:
          "Four rings around a centre that is off to one side, each wobbling on its own frequency, all cropped hard by the cell. Nesting instead of radiating: the picture is about widening rather than leaving. Ordered by radius at every angle, with each wobble kept under half the gap.",
        risk: "Cropped rings are close to the Interests rosette and to a ripple. And the innermost ring is a closed shape, which pulls the eye to a centre the section does not have.",
        draw: (line) => rings(4, { cx: 150, cy: 96, r0: 44, gap: 36, seed: 5 }).map((d, i) => <path key={i} d={d} style={line()} />),
      },
      {
        id: "2D",
        name: "The landscape",
        logic:
          "Contours of an actual terrain — three hills on a tilted plane — so the family is whatever the ground does: closed loops in one corner, long open lines running off two edges, spacing that tightens where the slope is steep. The most literal reading of “similar curves, never parallel”, and the only one where the variation comes from a thing rather than from a rule.",
        risk: "Four levels of a real terrain do not read as four of anything. This one probably breaks the honest count, and it is here to show what that costs.",
        draw: (line) => landscape.flatMap((paths, i) => paths.map((d, j) => <path key={`${i}-${j}`} d={d} style={line()} />)),
      },
      {
        id: "2E",
        name: "The spread",
        logic:
          "Four curves leaving one origin off the bottom-left, each bending by a different amount, so they fan out and the gaps between them widen unevenly. Constructed rather than derived: the same silhouette as 2A but every line is drawn on purpose. Worth testing against 2A to learn whether a field earns its complexity or whether four deliberate curves say it better.",
        risk: "Deliberate means hand-tuned: four numbers that look right at this size and may not survive a hero at three times the scale — where a field would just re-render.",
        draw: (line) => fan(4, { cx: -34, cy: 286, from: -78, spread: 64, reach: 430, seed: 8 }).map((d, i) => <path key={i} d={d} style={line()} />),
      },
    ],
    ranked: ["2D", "2A", "2B"],
    chosen: "2D",
    note: "Ranked 2D, 2A, 2B — in that order.",
    rules: [
      "The field is a TERRAIN. The three he ranked read, in his order, as most-irregular to most-regular; a field that sweeps evenly reads as a mechanism, and the variation is what makes it a picture.",
      "Level sets over constructions: both of the top two are contours of a field, and the two with a visible origin to radiate from — the rings and the drawn fan — came last. Read as: the field should not have a centre the eye can find. Tested by 3C, which puts one back.",
      "Irregularity was preferred even at the cost of the honest count — so the count has to be FOUND in a good field, not imposed on a poor one. That is round 3.",
    ],
    recommend:
      "2A. It keeps the count you picked for, answers all three parts of your note by construction rather than by care, and it is the only option in the batch whose guarantee holds no matter how far the field is pushed — which matters when the same grammar has to draw the other six sections. If the fan still reads as wifi after the wobble, 2B is the fallback and I would move the subject away from radiating altogether. 2D is in the batch to be rejected: watch what happens to the count.",
  },
  {
    n: 3,
    subject: "Current Status — the terrain, and the count",
    hue: "blue",
    title: "Where four lives in a terrain",
    place: "field",
    cell: { label: "status", value: "4", caption: "paths" },
    question: "You ranked the most irregular field first, and irregularity is exactly what costs the count — so where should four live: in the lines, in their characters, in the density, or nowhere but the number?",
    why:
      "Three things carry over. The field is a terrain (round 2). It should not have a centre the eye can find — an inference from your order, so 3C puts one back to test it. And every line now has the same weight and the same colour, which quietly removes what the old drawings leaned on: nothing can be pushed back by fading it, so depth, emphasis and absence all have to come from where a line goes and how much room it has. One thing also moved: the field's low ground is now off the LEFT edge rather than the bottom-left corner, because the label at the top and the figure at the bottom both live on the left — so the contours are near-vertical arcs leaving through the top and the bottom, and every word sits inside the first level. 3C refuses that arrangement and puts high ground under each block of text instead, so the lines part around the words.",
    options: [
      {
        id: "3A",
        name: "The tuned terrain",
        logic:
          "2D's irregularity on 2A's base: the distance from a point behind the bottom-left corner, roughed up by seven strong bumps, cut at four levels. The terrain is free to do what it likes in the open right of the cell, and the count is simply the number of lines. The straight synthesis of your first and second choice.",
        risk: "Strong bumps can pinch a contour into a hairpin or break one into two pieces, and a line that arrives in two parts is no longer countable.",
        draw: (line) => tunedTerrain.flatMap((paths, i) => paths.map((d, j) => <path key={`${i}-${j}`} d={d} style={line()} />)),
      },
      {
        id: "3B",
        name: "Four characters",
        logic:
          "One feature per line, placed on the arc that line runs along: a swell on the first, a dent on the second, a big shoulder on the third, a pull on the fourth. Four curves of the same kind that are unmistakably four different curves — your note about “similar in the type of curve but not really parallel” taken as far as it goes.",
        risk: "Composed rather than grown. Every feature is a number someone chose, which is the thing a field was supposed to save us from.",
        draw: (line) => characters.flatMap((paths, i) => paths.map((d, j) => <path key={`${i}-${j}`} d={d} style={line()} />)),
      },
      {
        id: "3C",
        name: "The parting",
        logic:
          "A terrain over the WHOLE cell — no quiet corner — with high ground under the label and under the figure, so the lines run right up to the words and part around them. It is the only option where the field genuinely crosses everything, and the text is a feature of the landscape rather than a hole cut in it. It also puts a centre back, which round 2 suggested you did not want: worth knowing.",
        risk: "Two plateaus in a small cell is a lot of shaping, and lines wrapping a word can look like a diagram of the word.",
        draw: (line) => parted.flatMap((paths, i) => paths.map((d, j) => <path key={`${i}-${j}`} d={d} style={line()} />)),
      },
      {
        id: "3D",
        name: "The shore",
        logic:
          "The same terrain, but the four levels are not evenly spaced: they bunch as they go out, so the lines crowd at one end of the cell and open at the other. The count is still four, and the picture gains a direction without anything having to get thinner or fainter — which is now the only way depth can be had.",
        risk: "Bunched lines at one weight can moiré at the 0.27 overview, where the whole widget is a thumbnail.",
        draw: (line) => shore.flatMap((paths, i) => paths.map((d, j) => <path key={`${i}-${j}`} d={d} style={line()} />)),
      },
      {
        id: "3E",
        name: "The full terrain",
        logic:
          "Six levels and no attempt at four. The argument: the cell already says “4” in ninety-six point type, so the drawing does not have to count anything — it can be the ground the number sits on. If this is right, principle 8 applies to a picture that stands alone, not to one that shares a cell with its own figure.",
        risk: "It gives up the one thing you kept through both rounds. And a dense terrain is the hardest to keep clear of the words.",
        draw: (line) => fullTerrain.flatMap((paths, i) => paths.map((d, j) => <path key={`${i}-${j}`} d={d} style={line()} />)),
      },
    ],
    ranked: ["3C", "3A", "3B"],
    chosen: "3C",
    note: "Ranked 3C, 3A, 3B — in that order.",
    rules: [
      "No quiet corner. The field goes EVERYWHERE and the words are given high ground to part around — 3C was the only candidate that actually crossed the whole cell, which is what round 1 asked for, and the four that kept a corner empty all ranked below it.",
      "Derived beats composed, again: the grown terrain (3A) over the four hand-placed features (3B).",
      "The round-2 inference was WRONG and is withdrawn. 3C has an obvious focus where its lines converge, and it won. What lost in round 2 was a shape radiating from a point inside the frame, not convergence itself.",
      "Chosen against the count for the second round running — 3C reads as six lines, not four. Round 4 puts that question directly.",
    ],
    recommend:
      "3A, with 3E close behind and 3C the one I would like you to look at hardest. 3A is the honest synthesis of your two picks and it needs no hand-placed numbers. But 3E asks the better question — whether a drawing beside a 96-point “4” owes anyone a count — and if you agree it does not, the other six sections get much freer. 3C is the only candidate that actually does what round 1 asked, which was lines reaching the edges: the other four keep a corner empty, which is a compromise with the text that you never asked for.",
  },
  {
    n: 4,
    subject: "Work and Case Studies, side by side",
    hue: "peach",
    title: "What tells one section's field from another's",
    place: "field",
    question: "Seven sections will be drawn by one mechanism. What is allowed to differ between them — and is the count one of those things, or is it finally gone?",
    why:
      "This is the risk the direction has been carrying since round 1: if every section is a contour field, the map at 0.27 becomes seven of the same picture in seven colours. So each candidate below takes the parting you chose, tuned, and varies ONE thing between Work and Case Studies — the two sections whose numbers are real and different, four roles and three worth telling. Judge them at the small size as much as the large one; that is where sections have to be told apart. 4E is the direct question: you have now twice preferred a picture that breaks the honest count, so it is fair to ask whether the count is the thing that should distinguish sections, or whether it is over.",
    options: [
      {
        id: "4A",
        name: "Direction",
        variants: pair(dirWork, dirCase),
        logic:
          "One terrain, flowing a different way per section: Work's lines run down and to the right, Case Studies' run across and up. Direction is the cheapest difference to read at thumbnail size — you see it before you see anything else — and it costs the drawing nothing.",
        risk: "Seven sections need seven directions, and there are really only about four that read as distinct. It runs out.",
      },
      {
        id: "4B",
        name: "Density",
        variants: pair(denWork, denCase),
        logic:
          "Same terrain, same direction, different spacing: Work is close-packed, Case Studies is open. Density says something true — a section with more in it looks busier — and it survives being shrunk better than shape does.",
        risk: "Dense and sparse are the same picture at two settings. Two sections next to each other on the ring may read as one section at two zoom levels.",
      },
      {
        id: "4C",
        name: "Character",
        variants: pair(chrWork, chrCase),
        logic:
          "The terrain itself differs: Work is three long smooth swells, Case Studies a dozen small sharp ridges. This is the most expressive option — the ground under each section is a different KIND of ground, which is the closest a field gets to having a personality.",
        risk: "Character is the hardest thing to keep honest. Nothing stops the two from drifting into the same middle ground once there are seven of them, and there is no rule to check it against.",
      },
      {
        id: "4D",
        name: "Openness",
        variants: pair(opnWork, opnCase),
        logic:
          "Some sections are open lines crossing the cell; others have islands — closed loops where the ground rises above the top level. A section with something finished in it gets a summit; one still in progress is all slope. The difference is structural rather than decorative.",
        risk: "Closed loops re-introduce a centre, and 2C lost partly on that. It may also read as a map legend rather than as one of a set.",
      },
      {
        id: "4E",
        name: "The count alone",
        variants: pair(cntWork, cntCase),
        logic:
          "Identical field, identical direction, identical character. The ONLY difference is four lines against three. If this reads — if you can tell the two apart at 0.27 — then the honest count is not decoration after all, it is the thing that distinguishes sections, and principle 8 earns its place for a new reason.",
        risk: "Four against three is a one-line difference at thumbnail size. If it does not read, the count is over as a visual device, and it should be retired rather than defended.",
      },
    ],
    ranked: [],
    chosen: "none",
    note: "None of them. “1. Far away in all of them. 2. Too less lines are visible on the card. 3. Too less angles in the curve or sometimes very less smoothness.” — and the direction: a formula or function taking parameters, so that consistency comes from the generator rather than from care.",
    rules: [
      "CLOSER. A gentle terrain seen from a distance is the wrong picture; the card should hold a detail of something larger, not a whole small thing.",
      "MORE LINES. Three or four lines is not a field. Whatever the count argument was, it lost to density.",
      "MORE ANGLES, AND SMOOTHER. The curves must turn — double back, gather, pinch — and be smooth where they turn. A tilted plane with mild noise gives neither.",
      "ONE GENERATOR. Every illustration is the same function with different parameters, so consistency is a property of the code rather than of the person using it. That is round 5.",
    ],
    recommend:
      "4C, with 4A as the thing it should be combined with rather than chosen against — character to tell sections apart when you are looking at one, direction to tell them apart when you are not looking at any of them. I would like 4E to work and I do not think it does: three lines against four is not a difference you can see across a canvas, and if that is right the count stops being a design rule and goes back to being what the figure in the cell says. 4D is the interesting outsider — it is the only one that makes the difference MEAN something rather than just look different.",
  },
  {
    n: 5,
    subject: "Work — the generator",
    hue: "peach",
    title: "One function, five settings",
    place: "field",
    cell: { label: "work", value: "4", caption: "roles" },
    question: "If every illustration is the same function with different numbers, what are the numbers — and what do they have to be set to before the picture stops looking far away?",
    why:
      "You rejected round 4 for three things: everything was too far away, too few lines reached the card, and the curves had too few angles in them and too little smoothness. All three are the same complaint about the mechanism — a gentle terrain seen from a distance — so this round replaces it. The lines are still the contours of one field, but the field is now WARPED: the plane is tilted along `flow` and then the space itself is bent by smooth noise, which is what makes a line turn, double back and pinch instead of drifting. Everything below is one function, `illo({ seed, flow, scale, turn, lines })`, and each candidate is nothing but a different set of numbers — which is the consistency you asked for, arrived at by construction rather than by discipline. `scale` is the answer to “far away”: it is literally how close you are standing. Each card prints its own settings.",
    options: [
      {
        id: "5A",
        name: "Close",
        logic: "seed 7 · flow 24° · scale 1.8 · turn 0.5 · lines 9 — stepping right up to the field: every feature roughly twice the size it was in round 4, at nine lines instead of four.",
        risk: "Big features and many lines start to fight: the card can read as busy rather than close.",
        draw: (line) => lines(warpField({ ...WORK, seed: 7, flow: 24, scale: 1.8, turn: 0.5, lines: 9 }))(line),
      },
      {
        id: "5B",
        name: "Woven",
        logic: "seed 3 · flow 8° · scale 1.5 · turn 0.95 · lines 10 — the warp turned nearly all the way up, so the lines meander, gather and part. The most angles per line of anything in the batch.",
        risk: "At this much turn the lines stop reading as a landscape and start reading as a fingerprint, which may be a different thing from the brand.",
        draw: (line) => lines(warpField({ ...WORK, seed: 3, flow: 8, scale: 1.5, turn: 0.95, lines: 10 }))(line),
      },
      {
        id: "5C",
        name: "Grain",
        logic: "seed 11 · flow 68° · scale 1.1 · turn 0.6 · lines 18 — twice the line count of anything you have seen, at a middle distance. Density as the substance of the picture rather than a property of it.",
        risk: "Eighteen lines at one weight is where moiré starts at the 0.27 overview, and where the widget stops being a glance.",
        draw: (line) => lines(warpField({ ...WORK, seed: 11, flow: 68, scale: 1.1, turn: 0.6, lines: 18 }))(line),
      },
      {
        id: "5D",
        name: "Crest",
        logic: "seed 19 · flow 128° · scale 2.6 · turn 0.4 · lines 12 — the closest of the five: two or three features fill the whole card, so the picture is a detail of something much larger rather than a whole small thing.",
        risk: "At this scale the seed matters more than the settings — a different seed is a different picture, not a variation, which makes the parameters less useful for telling sections apart.",
        draw: (line) => lines(warpField({ ...WORK, seed: 19, flow: 128, scale: 2.6, turn: 0.4, lines: 12 }))(line),
      },
      {
        id: "5E",
        name: "Undertow",
        logic: "seed 5 · flow 200° · scale 1.9 · turn 0.75 · lines 14 — close, dense and turning, all three raised together. If the three complaints have one answer, this is it.",
        risk: "It is the most of everything, which means it is the hardest to make six more of that are recognisably different from it.",
        draw: (line) => lines(warpField({ ...WORK, seed: 5, flow: 200, scale: 1.9, turn: 0.75, lines: 14 }))(line),
      },
    ],
    ranked: [],
    chosen: "none",
    note: "None of them. “Too many lines. Too close to each other. Too chaotic. Too congested.” — and what to aim for instead: more smoothness, consistency, a little randomness, and breathing space.",
    rules: [
      "BREATHING SPACE is a parameter, not a consequence. Set the gap between lines in the picture's own units and let the count be whatever fits.",
      "SMOOTHNESS means one slow shape per line, not a smooth rendering of a fast one. Round 5's second noise octave was the chaos.",
      "CONSISTENCY means the lines are one family — offsets of a single curve — rather than independent wanderers that happen to share a field.",
      "A LITTLE randomness: the variation belongs in the curve's two components and the seed, not in every line separately.",
      "A warped plane cannot give even spacing — its contours crowd wherever it steepens. Density and calm were fighting the mechanism, so the mechanism changed: the field is now the distance from one smooth curve, whose gradient is one almost everywhere.",
    ],
    recommend:
      "5E, then 5A. 5E answers all three of your notes at once and it is the one I would build the other six from — the parameters are far enough from their limits that six more settings can differ without any of them looking broken. 5C is the interesting risk: if eighteen lines still reads at the 0.27 overview then density is free, and that changes what the other six can do. 5D is the one to reject deliberately — at that distance the seed does the work rather than the settings, and a generator whose output is governed by its seed is not a generator, it is a lottery.",
  },
  {
    n: 6,
    subject: "Work — the generator, rebuilt around spacing",
    hue: "peach",
    title: "Breathing space as the parameter",
    place: "field",
    cell: { label: "work", value: "4", caption: "roles" },
    question: "If the gap between the lines is the thing you set, and the number of lines is only what fits — is that the calm you were after?",
    why:
      "Round 5 warped the space to make the lines turn, and turning is all it gave: too many, too close, too chaotic, too congested. The fault was the mechanism. A warped plane has no reason to space its contours evenly — wherever the field steepens they crowd — so density and calm were fighting each other and the settings could not fix it. This generator is built the other way round, from the spacing outwards: the field is the DISTANCE from one smooth curve, so its gradient is one almost everywhere and its contours are that curve offset again and again at a spacing chosen in the picture's own units. `breath` is that spacing, in the same units as everything else on the card; the line count is whatever fits between the words. Smoothness is no longer something to hope for either — the curve has two slow components and nothing faster, and the generator eases them until no offset can reach far enough out to form a cusp. The randomness is in those two components: the same family every time, never the same curve twice.",
    options: [
      {
        id: "6A",
        name: "Breath",
        logic: "seed 4 · flow 18° · scale 1.3 · wander 0.35 · breath 34 — the calmest reading of your note: a handful of long curves, a third of a box of air between each, one slow bend across the card.",
        risk: "Calm can become empty. At this spacing a small cell may hold only two lines, which is a texture rather than a picture.",
        draw: (line) => lines(waveField({ ...WORK, seed: 4, flow: 18, scale: 1.3, wander: 0.35, breath: 34 }))(line),
      },
      {
        id: "6B",
        name: "Long",
        logic: "seed 9 · flow 200° · scale 2.4 · wander 0.3 · breath 30 — one very long wavelength, so each line has a single unhurried bend and the family reads as a detail of something much bigger.",
        risk: "One bend per line is close to no bend per line; at this wavelength the card can look like it is showing the straight part of something curved.",
        draw: (line) => lines(waveField({ ...WORK, seed: 9, flow: 200, scale: 2.4, wander: 0.3, breath: 30 }))(line),
      },
      {
        id: "6C",
        name: "Drift",
        logic: "seed 2 · flow 72° · scale 1.5 · wander 0.4 · breath 26 · taper 0.45 — even spacing given up on purpose: the gaps widen steadily along the flow, so the picture has a near side and a far side without anything getting congested.",
        risk: "A taper is a gradient by another name, and gradients were what made round 5 crowd. This one is gentle and one-directional, but it is the same idea handled carefully rather than avoided.",
        draw: (line) => lines(waveField({ ...WORK, seed: 2, flow: 72, scale: 1.5, wander: 0.4, breath: 26, taper: 0.45 }))(line),
      },
      {
        id: "6D",
        name: "Across",
        logic: "seed 6 · flow 112° · scale 1.6 · wander 0.45 · breath 28 — the flow set across the text rather than along it, which is what decides how much of the card carries lines: the words forbid a band of the field, and a band across them costs less of the picture.",
        risk: "More coverage means less empty ground, and empty ground is half of what you asked for.",
        draw: (line) => lines(waveField({ ...WORK, seed: 6, flow: 112, scale: 1.6, wander: 0.45, breath: 28 }))(line),
      },
      {
        id: "6E",
        name: "Two bends",
        logic: "seed 13 · flow 150° · scale 1.1 · wander 0.55 · breath 32 — the shortest wavelength of the five, so each line carries two turns instead of one, at the widest spacing that allows. The most shape per line without any crowding.",
        risk: "Two bends at 0.27 is one wobble. This may be the option that stops working at the size the map actually shows.",
        draw: (line) => lines(waveField({ ...WORK, seed: 13, flow: 150, scale: 1.1, wander: 0.55, breath: 32 }))(line),
      },
    ],
    ranked: ["6A", "6B", "6C", "6D", "6E"],
    chosen: "all five",
    note: "“Now I like all of them.” — and: let's try more waves or curves on them.",
    rules: [
      "THE MECHANISM IS SETTLED. Contours of the distance from one smooth curve: consistent by construction, evenly spaced by construction, smooth by construction. Five settings of it were all acceptable, which is the first time any batch has been.",
      "`breath` as an input and the line count as an outcome was the move that fixed it. Ask for air, not for a number.",
      "Next: more waves per line. The curve gets a `waves` parameter — how many sine components make it — so “more curves” is a setting rather than a redraw.",
    ],
    recommend:
      "6A, and I would treat 6C as the variation of it rather than a rival — even spacing everywhere is the safest calm, and a gentle taper is what stops seven of these looking like one thing seven times. 6E is the one I would like your eye on: it has the most character per line, and if it survives the thumbnail then wavelength is the parameter that should differ between sections, which would settle round 4's question as a side effect.",
  },
  {
    n: 7,
    subject: "Work — more waves",
    hue: "peach",
    title: "How much curve a line can carry",
    place: "field",
    cell: { label: "work", value: "4", caption: "roles" },
    question: "More waves per line — but how many before the calm you just approved goes back to being chaos?",
    why:
      "The source curve is now a sum of `waves` sine components, each about twice the frequency and under half the amplitude of the one before, so “more curves” is a number rather than a redraw. One thing to know before you choose, because it decides what these look like: the generator holds the curve's total bend under what the offsets can take, so **asking for more waves gives you shallower ones, not sharper ones**. Depth and count trade against each other exactly the way turn and density did — which is the same trade in a new place, and this time it is the one you can see. Everything else is round 6's, unchanged: same spacing, same smoothness, same family.",
    options: [
      {
        id: "7A",
        name: "Three",
        logic: "seed 4 · flow 18° · scale 1.3 · wander 0.4 · breath 32 · waves 3 — 6A, the one you saw first, with a third component added. The smallest step from what you approved.",
        risk: "A third component at half the amplitude may read as the same picture slightly less clean.",
        draw: (line) => lines(waveField({ ...WORK, seed: 4, flow: 18, scale: 1.3, wander: 0.4, breath: 32, waves: 3 }))(line),
      },
      {
        id: "7B",
        name: "Four",
        logic: "seed 9 · flow 200° · scale 1.9 · wander 0.5 · breath 30 · waves 4 — a longer base wavelength so the extra components have room to show as separate events rather than as texture on one bend.",
        risk: "Four components is where a curve stops having a shape you could describe and becomes a coastline.",
        draw: (line) => lines(waveField({ ...WORK, seed: 9, flow: 200, scale: 1.9, wander: 0.5, breath: 30, waves: 4 }))(line),
      },
      {
        id: "7C",
        name: "Short",
        logic: "seed 2 · flow 72° · scale 0.75 · wander 0.55 · breath 30 · waves 3 — the shortest base wavelength of the five, so each line crosses the card with three or four full undulations. The most waves you can actually count.",
        risk: "Short wavelengths are the first thing to disappear at the 0.27 overview, where the whole widget is a thumbnail.",
        draw: (line) => lines(waveField({ ...WORK, seed: 2, flow: 72, scale: 0.75, wander: 0.55, breath: 30, waves: 3 }))(line),
      },
      {
        id: "7D",
        name: "Deep",
        logic: "seed 13 · flow 150° · scale 1.6 · wander 0.85 · breath 34 · waves 2 — the other direction: two components but wandering far, so the lines swing rather than ripple. Fewer curves, much more of each.",
        risk: "Wander this high runs into the bend limit, so what comes out may be less than what was asked for — worth seeing exactly how the generator answers an unreasonable request.",
        draw: (line) => lines(waveField({ ...WORK, seed: 13, flow: 150, scale: 1.6, wander: 0.85, breath: 34, waves: 2 }))(line),
      },
      {
        id: "7E",
        name: "Three, drifting",
        logic: "seed 6 · flow 112° · scale 1.2 · wander 0.5 · breath 28 · waves 3 · taper 0.4 — three components with the spacing widening along the flow: the two things you liked in 6C and 6E at once.",
        risk: "Two kinds of variation at once — in the line and in the gaps — is where a family starts to look like five unrelated drawings.",
        draw: (line) => lines(waveField({ ...WORK, seed: 6, flow: 112, scale: 1.2, wander: 0.5, breath: 28, waves: 3, taper: 0.4 }))(line),
      },
    ],
    ranked: ["7D"],
    chosen: "7D, and only just",
    note: "“7D feels just okay. Not great. Remaining all have very sharp curves rather than smooth curves. We can also try increasing the angles at bends.”",
    rules: [
      "The sharpness and the small bend angles had ONE cause: holding the lines exactly equidistant. An offset family cannot bend tighter than the reach of its outermost line without cusping, so the generator kept easing the curve — and what survived was a shallow wave whose only visible feature was its tightest part.",
      "So evenness becomes a dial (`even`), not a law. At 0 the lines are the curve translated: no curvature limit at all, and the gaps close by cos(slope) where the line is steepest — variation, not congestion.",
      "The bend angle is now set directly (`swing`, in degrees) instead of being an amplitude guessed at through a wavelength. At a given swing, a longer wavelength is the same angle taken more gently — which is what smoothness actually is.",
    ],
    recommend:
      "7C — and the batch taught me something I had wrong when I wrote the other four. `waves` is NOT the parameter that gives you more curve. Adding components at a long base wavelength runs straight into the bend limit, so the generator answers by making all of them shallower: 7A and 7B have three and four components each and read barely differently from round 6. What actually puts waves on a line is a SHORTER BASE WAVELENGTH — `scale`. 7C is scale 0.75 with three components and it is the only one of the five where you can count the undulations, including at 0.27, where its thumbnail still reads as waves rather than as a lean. So: `scale` is how many waves, `waves` is how varied each one is. 7E is the one to keep beside it — three components and a drifting spacing, the two things you liked in round 6, at a wavelength short enough to show.",
  },
  {
    n: 8,
    subject: "Work — open bends",
    hue: "peach",
    title: "Wider angles, longer radius",
    place: "field",
    cell: { label: "work", value: "4", caption: "roles" },
    question: "How open can a bend be, and how many of them fit, once the lines are allowed to stop being exactly equidistant?",
    why:
      "Your two notes were one problem. Exact equal spacing comes from an offset family, and an offset family cannot bend tighter than the reach of its outermost line — past that the offsets cusp. So the generator kept easing the curve until it fitted, and what was left was a shallow wave whose only visible feature was its tightest part: sharp bends, small angles, no smoothness. The calm and the sharpness had one cause. Two changes. **The bend angle is now set directly** — `swing`, in degrees, the greatest angle a line departs from its flow; at a given swing a longer wavelength is the same angle taken more gently, which is what smoothness is. And **evenness is a dial**: at `even` 1 the spacing is exactly equal as before, at 0 the lines are the curve translated, which has no curvature limit at all — nothing can cusp, so bends can be as open and as many as you like, and the price is that the gaps close by cos(slope) where a line is steepest. At a 45° swing that is a seventh of the breathing space.",
    options: [
      {
        id: "8A",
        name: "Open",
        logic: "swing 34° · scale 2.4 · even 1 · waves 2 · breath 32 — still exactly equidistant, but the angle asked for directly and the wavelength long enough to give it gently. How far the old rule can be pushed.",
        risk: "Equal spacing still limits the bend, so this is the most conservative of the five — it may be 7D again with better manners.",
        draw: (line) => lines(offsetField({ ...WORK, seed: 4, flow: 18, scale: 2.4, swing: 34, breath: 32 }))(line),
      },
      {
        id: "8B",
        name: "Wide",
        logic: "swing 46° · scale 3.0 · even 1 · waves 2 · breath 32 — the widest angle equal spacing will carry, on the longest wave of the batch. One enormous unhurried bend.",
        risk: "At this wavelength a card holds less than one full wave, so the picture depends entirely on which part of the wave it happens to show.",
        draw: (line) => lines(offsetField({ ...WORK, seed: 9, flow: 200, scale: 3.0, swing: 46, breath: 32 }))(line),
      },
      {
        id: "8C",
        name: "Two, open",
        logic: "swing 42° · scale 1.2 · even 0.35 · waves 2 · breath 30 — two bends per line at an angle equal spacing could never allow, because the spacing is now free to close a little where the line leans.",
        risk: "The first candidate where the gaps are deliberately unequal. If that reads as carelessness rather than as breathing, the dial goes back to 1.",
        draw: (line) => lines(offsetField({ ...WORK, seed: 2, flow: 72, scale: 1.2, swing: 42, even: 0.35, breath: 30 }))(line),
      },
      {
        id: "8D",
        name: "Three, open",
        logic: "swing 44° · scale 0.85 · even 0.2 · waves 2 · breath 30 — three open bends across the card. This is the setting that was impossible last round: 7C had three bends only by making each one tight.",
        risk: "Three bends is where a line starts to read as a pattern rather than as a path, and patterns are what the map has to tell apart.",
        draw: (line) => lines(offsetField({ ...WORK, seed: 2, flow: 66, scale: 0.85, swing: 44, even: 0.2, breath: 30 }))(line),
      },
      {
        id: "8E",
        name: "Deep, drifting",
        logic: "swing 54° · scale 1.7 · even 0.4 · waves 3 · breath 34 · taper 0.35 — 7D, which you half liked, opened out: a much wider swing, a third component for variety, and the drifting spacing from 6C.",
        risk: "The most of everything again, and the one most likely to be hard to make six more of.",
        draw: (line) => lines(offsetField({ ...WORK, seed: 13, flow: 150, scale: 1.7, swing: 54, even: 0.4, waves: 3, breath: 34, taper: 0.35 }))(line),
      },
    ],
    ranked: ["8C", "8D", "8E", "8A", "8B"],
    chosen: "all five, with two reservations",
    note: "\u201cI like them. Things I did not like: 1. All curves are parallel. 2. Equal space all the time makes it look mechanical and cheap.\u201d",
    rules: [
      "The two notes are one fact about the mechanism. A contour family is the level sets of ONE field, so every line in the picture is the same curve \u2014 offset at `even` 1, shifted at `even` 0. Copies. And copies at one spacing are a ruled grid, which is what \u201cmechanical and cheap\u201d names. No setting could have fixed it: being a copy was the mechanism.",
      "So a picture is a FAMILY, not a curve repeated: each line has its own amplitude, its own phase and its own distance from the last. The guarantee moves from level sets to ORDERED \u2014 the weaker promise, and therefore the freer one.",
      "Ordered is also the promise that can be MEASURED. \u2202\u03a6/\u2202s > 0 at every point is a local condition, and the same sampling that checks it returns the true gap between each neighbouring pair \u2014 so the generator settles its own clearance instead of asserting it.",
      "Unequal spacing is now a thing we ask for (`spread`), not a price paid for something else. It has to be a rhythm rather than noise: a slow swell along the family, never two tight gaps together.",
    ],
    recommend:
      "8C, then 8E. 8C is the one that proves the point — two genuinely open bends at a 42° swing, which no amount of tuning could get last round — and it gives up only a little of the exact spacing to do it. 8E is where I would look if you want the swing itself to be the thing you notice. 8A and 8B are in the batch as the control: they keep the old rule, and if one of them still reads best then the equidistance was worth the sharpness and I have drawn the wrong conclusion from your note.",
  },
  {
    n: 9,
    subject: "Work \u2014 a family, not a copy",
    hue: "peach",
    title: "Different curves, unequal gaps",
    place: "field",
    cell: { label: "work", value: "4", caption: "roles" },
    question: "If every line is its own curve at its own distance from the last, which of the three ways out of \u201cparallel\u201d actually reads?",
    why:
      "Your two notes turned out to be one fact about how all eight rounds were built. Contours are the level sets of **one** field, so every line in a picture is the **same curve** \u2014 offset at `even` 1, shifted at `even` 0. Copies. And copies laid at one spacing are a ruled grid, which is what \u201cmechanical and cheap\u201d names exactly. There was no setting that could have fixed it, because being a copy *was* the mechanism. So the mechanism is gone. A picture is now a **family**: each line is its own member, with its own amplitude, its own phase and its own distance from the one before. What keeps them apart is no longer that they are copies but that they are **ordered** \u2014 if line *s* sits below line *s\u2032* at every point along the flow, no two can ever meet however differently they bend. That is the weaker promise and therefore the freer one, and unlike the level-set argument it can be *measured*: the same sampling that checks it hands back the true gap between every neighbouring pair, so the generator settles its own clearance rather than asserting it. Three dials, because the three look different: **`drift`** gives each line its own curve, **`spread`** makes the gaps unequal, **`taper`** fans the whole family open along the flow. At all three set to zero this is round 8 at `even` 0 \u2014 so the batch below is what you already liked, with each way out of it turned up in turn. One thing the rebuild forced into the open, worth saying before you look: **the flow is not a free choice**. The words take away a *band* of the family, not a line, and how wide that band is depends entirely on whether the lines cross the text or run along it. This cell's caption is a tall block down the left, so a near-horizontal flow loses about two thirds of the card and a near-vertical one about a quarter. All five below therefore run within about 30\u00b0 of vertical \u2014 not a stylistic decision, a consequence of where the type is. Each section will have its own answer.",
    options: [
      {
        id: "9A",
        name: "Fanned",
        logic: "drift 0.3 · spread 0.4 · taper 0.7 \u2014 the fan does the work: the gaps widen along the flow, so the spacing is unequal *across each line* rather than from line to line. Shapes stay close.",
        risk: "A fan has a direction, and a direction implies an origin off the frame \u2014 which is close to the radiating shape round 2 ranked last.",
        draw: (line) => lines(illo({ ...WORK, seed: 4, flow: 104, scale: 1.6, swing: 40, breath: 30, drift: 0.3, spread: 0.4, taper: 0.7 }))(line),
      },
      {
        id: "9B",
        name: "Drifting crests",
        logic: "drift 0.85 \u00b7 spread 0.35 \u00b7 taper 0 \u2014 the phase advances hard from line to line, so each crest sits later than the one above it and the family shears. The most direct answer to \u201call curves are parallel\u201d.",
        risk: "A steady phase advance is itself a rule, and a rule the eye can follow is another way of being mechanical \u2014 just diagonally this time.",
        draw: (line) => lines(illo({ ...WORK, seed: 2, flow: 72, scale: 1.2, swing: 44, breath: 30, drift: 0.85, spread: 0.35 }))(line),
      },
      {
        id: "9C",
        name: "A family",
        logic: "drift 0.6 \u00b7 spread 0.7 \u00b7 taper 0.35 \u2014 all three at once and none of them at the top: shapes differ, gaps differ, and the whole thing leans open. Nothing in it is the loudest thing in it.",
        risk: "Three kinds of variation at once is where a family stops reading as one family \u2014 round 7 called this out and it is still the real risk.",
        draw: (line) => lines(illo({ ...WORK, seed: 13, flow: 118, scale: 1.3, swing: 44, breath: 30, drift: 0.6, spread: 0.7, taper: 0.35 }))(line),
      },
      {
        id: "9D",
        name: "Loose rhythm",
        logic: "drift 0.25 \u00b7 spread 1 \u00b7 taper 0 \u2014 the spacing alone, taken as far as it goes: gaps from about half the breath to about one and a half, in a slow swell that never puts two tight ones together. The curves stay nearly alike.",
        risk: "This is the test of whether your second note was the whole of it. If unequal gaps alone kill the mechanical read, the shapes never needed to differ and `drift` can stay low everywhere.",
        draw: (line) => lines(illo({ ...WORK, seed: 9, flow: 86, scale: 1.5, swing: 42, breath: 28, drift: 0.25, spread: 1 }))(line),
      },
      {
        id: "9E",
        name: "Every dial",
        logic: "drift 1 \u00b7 spread 0.85 \u00b7 taper 0.5 \u00b7 swing 52\u00b0 \u00b7 waves 3 \u2014 the far end, where the generator has to ease itself back to keep the lines clear. Worth seeing so we know where the edge is.",
        risk: "At drift 1 the outermost line swings half again as wide as the middle one, which is a lot of difference to hold inside one picture.",
        draw: (line) => lines(illo({ ...WORK, seed: 6, flow: 112, scale: 1.0, swing: 52, breath: 32, waves: 3, drift: 1, spread: 0.85, taper: 0.5 }))(line),
      },
    ],
    ranked: ["9A", "9B", "9C", "9D", "9E"],
    chosen: "all five",
    note: "\u201cI like all of them. Can we try more variations on the same principles but more creative?\u201d",
    rules: [
      "The family construction is settled. Ordered over a shared parameter, each line its own curve, gaps a rhythm rather than a measure \u2014 nothing in the batch was rejected, including 9E at the far end of every dial.",
      "So the next question is not how much of each dial, it is WHAT ELSE a family can be. The three dials all vary the same picture; the ones round 10 adds vary the KIND of picture, and every one of them has to earn its place by an ordering argument, not by looking good.",
    ],
    recommend:
      "9C, then 9D. 9C is the one I would build the library on: every dial is on and none is at the top, so no single device is what you notice \u2014 you notice that the lines are different from one another, which is the point. 9D is the one I most want your read on, because it isolates the question underneath your two notes. If unequal spacing alone is enough to kill the mechanical feeling, then \u201call curves are parallel\u201d was really a complaint about the grid and not about the curves, and `drift` stays quiet in every illustration we make. 9A and 9B are each one device alone so we can tell which is doing the work in 9C, and 9E is the edge \u2014 I do not expect to ship it, but I want to know what it costs before we settle.",
  },
  {
    n: 10,
    subject: "Work \u2014 what else a family can be",
    hue: "peach",
    title: "Sweep, tempo, waist",
    place: "field",
    cell: { label: "work", value: "4", caption: "roles" },
    question: "Three new things a family can do that are not settings of the old one \u2014 which of them is worth keeping?",
    why:
      "Nothing was rejected last round, including 9E with every dial at the top, so turning the same three dials further is not the useful move. `drift`, `spread` and `taper` all vary the same picture: a bundle of lines travelling in a straight line across the card. What changes below is the **kind** of family. Each of the three is a device rather than a degree, each one had to be argued into correctness before it was drawn, and each is a single new parameter on the same function \u2014 nothing here is a second mechanism. **`curl`** bends the family\u2019s travel into an arc about a centre far off the frame, so the lines sweep rather than cross; it is the safest of the three, because two circles of different radius about one centre cannot meet whatever else they are doing, which is a stronger guarantee than the one we already rely on. **`tempo`** makes the *wavelength* differ from line to line, so one edge of the family runs long and calm while the other runs short and quick \u2014 the family changes character across itself, not just shape. That is the dangerous one: a wavelength that drifts turns the ordering condition into something that grows with distance from the middle, so the generator has to measure it and ease back, and at high tempo it will. **`pinch`** bows the spacing so the family squeezes through a narrow in the middle of its travel and flares at both ends, or the reverse; it only ever multiplies the gaps, so the order is untouched by construction. Curl 0, tempo 0 and pinch 0 reproduce round 9 exactly, not nearly \u2014 the arc straightens back into the line as its radius grows.",
    options: [
      {
        id: "10A",
        name: "Sweep",
        logic: "curl 0.85 \u00b7 drift 0.4 \u00b7 spread 0.5 \u2014 the family travels around a centre about 400 units off the frame, so every line is an arc and the card holds a piece of a much larger turn. No dial from round 9 above a half.",
        risk: "A sweep points at where its centre is. Round 2 ranked a shape radiating from a point last, and although round 3 withdrew that as a rule, an origin the eye can locate is still something to watch.",
        draw: (line) => lines(illo({ ...WORK, seed: 4, flow: 96, scale: 1.5, swing: 42, breath: 30, drift: 0.4, spread: 0.5, curl: 0.85 }))(line),
      },
      {
        id: "10B",
        name: "Calm to quick",
        logic: "tempo 0.75 \u00b7 drift 0.35 \u00b7 spread 0.45 \u2014 the wavelength runs about a third longer on one side of the family than the other, so the lines agree in the middle of their travel and disagree more the further out they go.",
        risk: "Two lines with different wavelengths are the classic way to make a moir\u00e9, and a moir\u00e9 is a pattern nobody chose.",
        draw: (line) => lines(illo({ ...WORK, seed: 11, flow: 82, scale: 1.4, swing: 42, breath: 30, drift: 0.35, spread: 0.45, tempo: 0.75 }))(line),
      },
      {
        id: "10C",
        name: "Waist",
        logic: "pinch \u22120.8 \u00b7 breath 38 \u00b7 drift 0.5 \u00b7 spread 0.5 \u2014 the gaps close to about two thirds through the middle of the travel and open past it, so the family threads a narrow and flares at both edges of the card. The breath is set wide on purpose: a waist has to have room to be a waist.",
        risk: "A waist is a focus without an object in it, which is either the most interesting thing here or an accident that looks like a mistake.",
        draw: (line) => lines(illo({ ...WORK, seed: 2, flow: 104, scale: 1.4, swing: 44, breath: 38, drift: 0.5, spread: 0.5, pinch: -0.8 }))(line),
      },
      {
        id: "10D",
        name: "Swept and quickening",
        logic: "curl 0.55 \u00b7 tempo 0.5 \u00b7 drift 0.5 \u00b7 spread 0.65 \u2014 two of the three at once, both at about half: the family turns as it travels and quickens across itself at the same time.",
        risk: "Two devices at once is where I lose the ability to tell you which one you are responding to.",
        draw: (line) => lines(illo({ ...WORK, seed: 13, flow: 88, scale: 1.3, swing: 44, breath: 30, drift: 0.5, spread: 0.65, curl: 0.55, tempo: 0.5 }))(line),
      },
      {
        id: "10E",
        name: "All of it",
        logic: "curl 0.7 \u00b7 tempo 0.8 \u00b7 pinch 0.6 \u00b7 drift 0.9 \u00b7 spread 0.8 \u00b7 waves 3 \u00b7 swing 48\u00b0 \u2014 every device and every dial near the top, which is where the generator has to ease itself back to keep the lines readable. The edge, drawn so we know where it is.",
        risk: "You liked 9E, which was the same idea one round ago. This is further, and further is where a family stops being one family.",
        draw: (line) => lines(illo({ ...WORK, seed: 6, flow: 112, scale: 1.1, swing: 48, breath: 32, waves: 3, drift: 0.9, spread: 0.8, curl: 0.7, tempo: 0.8, pinch: 0.6 }))(line),
      },
    ],
    ranked: ["10A", "10C", "10D"],
    chosen: "10A, 10C and 10D",
    note: "\u201cI love A, C and D.\u201d",
    rules: [
      "A DEVICE IS NOT A DIAL. 9E had every dial at the top and won; 10E had every device near the top and lost. Dials stack \u2014 they are degrees of the same picture, and more of each is just more. Devices do not \u2014 each one changes what the picture IS, and two of them arguing is not a third thing.",
      "The working limit: ONE device carried alone, or TWO at about half. 10A and 10C are one device alone, 10D is two at half, and those are the three that landed.",
      "`tempo` is a SUPPORTING device, not a leading one. It is in 10D, which won, and in 10B, which did not \u2014 the difference is that 10D gave it a sweep to sit under. Alone at 0.75 it reads as the moir\u00e9 the batch was warned about.",
      "`curl` and `pinch` can each lead a picture on their own. Both were single-device candidates and both landed.",
    ],
    recommend:
      "10D, then 10C. 10D is the one I would build on: curl and tempo are the two devices that change what the picture *is* rather than how much it varies, and at half each they combine without either one announcing itself. 10C is the one I find most interesting and least safe \u2014 a waist gives the composition a place to look without putting an object there, which is something no round so far has managed. 10A is curl alone so we can see what it costs. 10B is tempo alone, and it is the one to be suspicious of: differing wavelengths are how a moir\u00e9 starts. 10E is the edge again \u2014 you liked the edge last time, so I want to know whether that holds when there is more of it to hold.",
  },
  {
    n: 11,
    subject: "Seven sections, one mechanism",
    hue: "peach",
    title: "What tells one section from another",
    place: "field",
    question: "Every section is now the same kind of picture. What is allowed to differ between them \u2014 and what do we do about the cell that can barely carry a picture at all?",
    why:
      "This is round 4's question coming back, and it is the last one before the generator leaves the studio. **A candidate here is not three pictures, it is a RULE for turning a section into parameters**, drawn three times so you can see what the rule does to a row of the map. Work, Case studies and Projects \u2014 the three with the most different things to say and, it turns out, the thing that matters more. Building this round measured something I had been treating as a preference. **`flow` is not a differentiator, it is a constraint**, and it is a tighter one than I thought. Work loses 28% of its family to its own caption at the best angle and 67% at the worst; Case studies loses **61% at every angle there is**, because \u201ccase studies\u201d and \u201cworth telling\u201d together cover most of the cell, and what survives is one contiguous strip in a corner. So every candidate below uses the measured best angle for each cell rather than one I liked \u2014 and for two of these three that is the same angle, which is the first answer this round gives: direction is not available as a difference. Look down the lavender column. In A, B, C and D the field is jammed into the top-right and two thirds of the card is empty, which is exactly the quiet corner round 3 rejected. That is not a tuning failure, it is what the geometry allows: **a line is a graph across the whole card, so a height that would put it under the type is not drawn at all.** E is the alternative \u2014 the same rule as B, with the lines BROKEN where they meet a word instead of missing. It is what a contour map does with its labels. It puts line ends inside the frame, which is the one thing principle 7 says a field does not have, and it is the only thing here that makes all seven cells able to hold the same picture.",
    options: [
      {
        id: "11A",
        name: "One device each",
        logic: "Work sweeps (curl 0.85), Case studies has a waist (pinch \u22120.8), Projects travels straight. Same breath, same swing, same spread \u2014 the device is the only thing that changes, and it is the loudest difference we have.",
        risk: "The three devices are the three you just picked, so each card is strong alone. Whether they are strong TOGETHER is what a row is for \u2014 three strong and unrelated cards is a set of posters, not a map.",
        variants: trio([
          { seed: 4, flow: 90, scale: 1.5, swing: 42, breath: 30, drift: 0.4, spread: 0.5, curl: 0.85 },
          { seed: 2, flow: 58, scale: 1.4, swing: 44, breath: 30, drift: 0.5, spread: 0.5, pinch: -0.8 },
          { seed: 17, flow: 90, scale: 1.5, swing: 42, breath: 30, drift: 0.45, spread: 0.55 },
        ]),
      },
      {
        id: "11B",
        name: "One device, measured directions",
        logic: "curl 0.6 everywhere, every dial identical, and only `flow` and `seed` change \u2014 with `flow` set to the angle that costs each cell the least picture rather than the one I preferred. The most conservative answer possible.",
        risk: "Work and Projects both measure best at 90\u00b0, so two of the three cards differ only by their seed. If that is enough, everything else in the batch is over-thinking; if it is not, the map has no direction budget to spend.",
        variants: trio([
          { seed: 4, flow: 90, scale: 1.4, swing: 43, breath: 30, drift: 0.45, spread: 0.5, curl: 0.6 },
          { seed: 21, flow: 58, scale: 1.4, swing: 43, breath: 30, drift: 0.45, spread: 0.5, curl: 0.6 },
          { seed: 33, flow: 90, scale: 1.4, swing: 43, breath: 30, drift: 0.45, spread: 0.5, curl: 0.6 },
        ]),
      },
      {
        id: "11C",
        name: "By distance",
        logic: "One device (curl 0.5) and one temperament everywhere; what changes is how CLOSE the card stands. Work at a middle distance, Case studies stepped back to a small quick wave at breath 18, Projects right up against one enormous bend at breath 40.",
        risk: "This is the only candidate that pays the type back \u2014 the cell with the most words gets the tightest breath so it still carries lines. That may read as a considered difference, or as the one card that is trying too hard.",
        variants: trio([
          { seed: 4, flow: 90, scale: 1.6, swing: 42, breath: 34, drift: 0.45, spread: 0.5, curl: 0.5 },
          { seed: 2, flow: 58, scale: 0.9, swing: 44, breath: 18, drift: 0.45, spread: 0.5, curl: 0.5 },
          { seed: 17, flow: 90, scale: 2.4, swing: 40, breath: 40, drift: 0.45, spread: 0.5, curl: 0.5 },
        ]),
      },
      {
        id: "11D",
        name: "By temperament",
        logic: "Same device, same distance, same breath \u2014 what changes is how much the lines differ from one another. Work calm and nearly alike (drift 0.2), Case studies strongly varied (drift 0.85), Projects quickening across itself (tempo 0.55).",
        risk: "Temperament is the quietest difference in the batch, and the map is read at 0.27 where it may be no difference at all. The row of thumbnails under each card is the real test.",
        variants: trio([
          { seed: 4, flow: 90, scale: 1.4, swing: 43, breath: 30, drift: 0.2, spread: 0.25, curl: 0.5 },
          { seed: 2, flow: 58, scale: 1.4, swing: 43, breath: 30, drift: 0.85, spread: 0.7, curl: 0.5 },
          { seed: 17, flow: 90, scale: 1.4, swing: 43, breath: 30, drift: 0.4, spread: 0.4, curl: 0.5, tempo: 0.55 },
        ]),
      },
      {
        id: "11E",
        name: "Lines that break at the words",
        logic: "Exactly B \u2014 same device, same dials, same measured angles, same seeds \u2014 with one thing changed: a line that meets a word is BROKEN there instead of not being drawn. Two rules keep that from turning into dashes. The break runs 13 units along the line, so it reads as a label gap rather than a nick (stopping at the box edge left two halves of one line 1.6px apart, which probe11 caught). And a height still has to survive mostly intact \u2014 at least 55% of its length on the card \u2014 or it is dropped as before, because a line that is mostly gap is a handful of stubs. The first attempt drew every height and the cards came out as diagonal scratches.",
        risk: "It breaks principle 7. A field is supposed to leave through the edges of the frame, and these lines also stop in the middle of it. It is a real change to what an illustration is here, which is why it is in a batch instead of in the code.",
        variants: trio([
          { seed: 4, flow: 90, scale: 1.4, swing: 43, breath: 30, drift: 0.45, spread: 0.5, curl: 0.6, interrupt: true },
          { seed: 21, flow: 58, scale: 1.4, swing: 43, breath: 30, drift: 0.45, spread: 0.5, curl: 0.6, interrupt: true },
          { seed: 33, flow: 90, scale: 1.4, swing: 43, breath: 30, drift: 0.45, spread: 0.5, curl: 0.6, interrupt: true },
        ]),
      },
    ],
    ranked: ["11A", "11B", "11C", "11D"],
    chosen: "A, B, C and D \u2014 not E",
    note: "\u201cI liked A, B, C, D only.\u201d \u2014 and, alongside it: everything reads vertical and wants angles; the lines grab too much attention; the card wants texture and noise; and try blurring the lines with a single-colour ramp between every two of them.",
    rules: [
      "**A line leaves through the edges of the frame.** Principle 7 stands unchanged \u2014 interrupting was built, measured and shown, and it lost. Line ends inside the cell are not acceptable even when they buy back a third of the picture, which is the clearest thing the studio has been told about what an illustration IS here rather than how it looks.",
      "So the cost of the words is a cost we pay. A cell whose caption is long carries fewer lines, and that is now a fact about the cell rather than a fault in the drawing \u2014 which makes CAPTION LENGTH a design variable: shortening \u201cworth telling\u201d would buy back more picture than any parameter can.",
      "All four differentiation strategies are legitimate and they can be mixed. Device, direction, distance and temperament are four budgets to spend per section, not four rival answers \u2014 with the caveat that direction is mostly spent for us, and distance is the only one that survives the 0.27 overview.",
      "The drawing is GROUND, not a figure: thinner (1.7), lower contrast (46%), more grain on the card (0.13). The illustration is what the words sit on.",
      "Blur and a filled ramp between lines are worth trying, and the ramp is a FILL \u2014 the first thing principle 2 forbids. It stays off by default and lives behind a control until it is chosen or dropped.",
    ],
    recommend:
      "Now that I have looked: **11E for the mechanism, then 11C or 11A for the strategy** \u2014 and I should say plainly that the batch conflates two questions, which is my fault. A, B, C and D are four answers to \u201cwhat differs between sections\u201d. E is not a fifth answer; it is B with the mechanism changed underneath it. Compare only those two and the case is hard to argue with: in B the lavender card is empty down its whole left half and the green card holds one narrow band on the right, and in E the field crosses all three. The lavender card in E is the best lavender in the batch. The cost is visible and you should look for it \u2014 in the peach and green cards there are lines that simply stop in the middle of the frame, and whether those read as a field passing behind the type or as broken lines is exactly the judgement I cannot make for you. On the strategy itself, with the four compared honestly: **C** is the only one where the difference survives the 0.27 thumbnail, because distance is the one thing that is still legible at that size. **A** is the strongest card by card and the weakest row \u2014 three devices at full strength read as three posters. **D** is almost invisible at 0.27, which is the size the map is actually read at. **B** is the control and it shows what the constraint costs: Work and Projects both measure best at 90\u00b0, so direction cannot be a difference between them. If you take E, the honest next step is to re-run A, C and D with interrupting on, because all three were drawn on a mechanism that was hiding a third of two of the cards.",
  },
];

/** Nothing in the batch may be drawn with a weight or colour of its own; `poly` is here so a candidate can improvise. */
export { poly };
