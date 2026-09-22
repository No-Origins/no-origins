import { BentoCell, Chip, patterns, type Family, type Hue } from "@no-origins/ui";
import { throughLine } from "./work";
import { sampled, site } from "./site";

/**
 * The six section widgets (Design-System.md §8.3). One definition each: the loud cell's contents, the parameters
 * its illustration is drawn from, and the cells that follow.
 *
 * **The parameter sets are round 11's four budgets, spent.** That round found that device, direction, distance and
 * temperament are four things a section may differ by — not four rival answers, four budgets — with two caveats it
 * also measured: direction is mostly spent for us by the words, and distance is the only difference that survives
 * the 0.27 overview. So each section below gets ONE clear signature and a distance, and no section spends more
 * than round 10's limit allows: one device carried alone, or two at about half.
 *
 * | section    | signature                       | flow | the words cost | breath |
 * |------------|---------------------------------|------|----------------|--------|
 * | status     | `curl` alone — a wide sweep     | 105° | 49%            | 24     |
 * | work       | `taper` — the family opens out  | 90°  | 28%            | 28     |
 * | cases      | `pinch` — a waist mid-travel    | 58°  | 61%            | 22     |
 * | projects   | no device at all                | 90°  | 55%            | 46     |
 * | interests  | `curl` + `tempo`, both at half  | 0°   | 56%            | 24     |
 * | philosophy | temperament: high drift/spread  | 68°  | 53%            | 26     |
 *
 * Six sections and five different angles — 0°, 58°, 68°, 90° and 105° — none of them chosen because it looked
 * good. Each is what that cell can afford, measured. The map does not read as all-vertical and did not have to be
 * argued into it: the words sit differently in every cell, so the cheapest direction is genuinely different in
 * each. `breath` then pays for what the words took, so the cells that lose most get the tightest spacing and every
 * widget still carries a comparable field.
 *
 * Status is the one deliberately off its cheapest angle: 90° would cost it 37% and 105° costs 49%, and the twelve
 * points buy a lean that no other widget on the ring has. That trade is only affordable because of a COPY change —
 * its caption was “ways to reach me”, which cost 65% at every angle; “ways in” costs 37% at the best one. Two
 * words bought more picture than any parameter in this file can. Caption length is composition (Patterns.md §10).
 *
 * `flow` is a MEASUREMENT, not a preference (`node e2e/.mcp/flow.mjs`) — it decides how much of the cell the words
 * cost, and for a long caption that is most of it. `words` is measured too (`node e2e/.mcp/words.mjs /fixtures/bento`)
 * off the rendered 304 × 304 loud cell. Neither number is ever estimated by eye; both have cost a round already.
 */

const W = (boxes: [number, number]) => boxes;
const Dot = ({ hue }: { hue: Hue }) => (
  <span aria-hidden className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: `var(--${hue}-deep)` }} />
);
const Sample = ({ of }: { of: string }) => (sampled(of) ? <span className="noo-placeholder__tag whitespace-nowrap">sample copy</span> : null);

export interface SectionDef {
  id: string;
  /** The section as a whole, for assistive tech. */
  title: string;
  hue: Hue;
  /** The mono word in the loud cell. */
  eyebrow: string;
  figure?: { value: string; label: string };
  word?: React.ReactNode;
  illustration: Family;
  /** What tells this one apart, in one line — for the fixture's notes, not for the widget. */
  signature: string;
  cells: React.ReactNode;
}

export const sections: SectionDef[] = [
  {
    id: "status",
    title: "Current status",
    hue: "blue",
    eyebrow: "status",
    figure: { value: "4", label: "ways in" },
    signature: "curl alone — one wide sweep, the most open of the six",
    illustration: patterns.status,
    cells: (
      <>
        <BentoCell><p className="noo-label">hiring</p><p className="noo-bento__title">Recognise the work</p></BentoCell>
        <BentoCell><p className="noo-label">collaborating</p><p className="noo-bento__title">Bring an idea</p></BentoCell>
        <BentoCell><p className="noo-label">following</p><p className="noo-bento__title">Watch it land</p></BentoCell>
        <BentoCell><p className="noo-label">saying hi</p><p className="noo-bento__title">No agenda</p></BentoCell>
        <BentoCell span={W([4, 1]) as [number, number]}>
          <p className="noo-bento__text">Pick the path that fits; none of them needs an agenda.</p>
        </BentoCell>
      </>
    ),
  },
  {
    id: "work",
    title: "Work experience",
    hue: "peach",
    eyebrow: "work",
    figure: { value: "4", label: "roles" },
    signature: "taper — the family opens out along its travel, four roles going somewhere",
    illustration: patterns.work,
    cells: (
      <>
        <BentoCell><p className="noo-label">now</p><p className="noo-bento__title"><Dot hue="peach" /> Radise</p></BentoCell>
        <BentoCell><p className="noo-label">before</p><p className="noo-bento__title"><Dot hue="green" /> Dataflix</p></BentoCell>
        <BentoCell><p className="noo-label">one year</p><p className="noo-bento__title"><Dot hue="blue" /> Hashnode</p></BentoCell>
        <BentoCell><p className="noo-label">two years</p><p className="noo-bento__title"><Dot hue="pink" /> Terrible Tiny Tales</p></BentoCell>
        <BentoCell span={W([4, 1]) as [number, number]}>
          <p className="noo-label">the through-line</p>
          <div className="noo-bento__chips">
            {Object.values(throughLine).map((c) => <Chip key={c.label} hue={c.hue}>{c.label}</Chip>)}
          </div>
        </BentoCell>
      </>
    ),
  },
  {
    id: "cases",
    title: "Case studies",
    hue: "lavender",
    eyebrow: "case studies",
    figure: { value: "3", label: "worth telling" },
    signature: "pinch — a waist mid-travel, and the nearest, densest field of the six",
    illustration: patterns.cases,
    cells: (
      <>
        <BentoCell span={W([2, 1]) as [number, number]}><p className="noo-label">hashnode</p><p className="noo-bento__title">Neptune</p></BentoCell>
        <BentoCell span={W([2, 1]) as [number, number]}><p className="noo-label">radise</p><p className="noo-bento__title">Project Vault</p></BentoCell>
        <BentoCell span={W([2, 1]) as [number, number]}><p className="noo-label">dataflix</p><p className="noo-bento__title">GenIQ</p></BentoCell>
        <BentoCell span={W([2, 1]) as [number, number]}>
          <p className="noo-bento__text">Each one: the problem, what I did, what changed.</p>
        </BentoCell>
      </>
    ),
  },
  {
    id: "projects",
    title: "Projects",
    hue: "green",
    eyebrow: "projects",
    figure: { value: "0", label: "shipped yet" },
    signature: "no device at all, and the widest breath — absence said with room, which is the only vocabulary v1 has for it",
    illustration: patterns.projects,
    cells: (
      <>
        <BentoCell span={W([2, 1]) as [number, number]}><p className="noo-label">why</p><p className="noo-bento__text">Deleted for a clean slate.</p></BentoCell>
        <BentoCell span={W([2, 1]) as [number, number]}><p className="noo-label">first block</p><p className="noo-bento__title">This portfolio.</p></BentoCell>
        <BentoCell span={W([4, 1]) as [number, number]}><p className="noo-bento__text">Fills as things ship, starting with what No Origins is made of.</p></BentoCell>
      </>
    ),
  },
  {
    id: "interests",
    title: "Interests",
    hue: "yellow",
    eyebrow: "interests",
    word: <>outside<br />the work</>,
    signature: "curl and tempo, both at half — the family turns and quickens across itself",
    illustration: patterns.interests,
    cells: (
      <>
        <BentoCell span={W([2, 2]) as [number, number]}>
          <Sample of="interests" />
          <ul className="noo-bento__text flex flex-col gap-1">
            {(site.interests ?? []).slice(0, 4).map((line) => <li key={line}>{line}</li>)}
          </ul>
        </BentoCell>
        <BentoCell span={W([4, 1]) as [number, number]}>
          <p className="noo-label">and the rest</p>
          <p className="noo-bento__text">A handful more, each one a line.</p>
        </BentoCell>
      </>
    ),
  },
  {
    id: "philosophy",
    title: "Philosophy",
    hue: "pink",
    eyebrow: "philosophy",
    word: <>how I<br />build</>,
    signature: "temperament — no device, but the lines differ from one another more than anywhere else",
    illustration: patterns.philosophy,
    cells: (
      <>
        <BentoCell span={W([2, 2]) as [number, number]}>
          <Sample of="philosophy" />
          <p className="noo-bento__text">{(site.philosophy ?? [])[0]?.replace(/^Sample copy\. /, "")}</p>
        </BentoCell>
        <BentoCell span={W([4, 1]) as [number, number]}>
          <p className="noo-label">two more like it</p>
          <p className="noo-bento__text">Each one a paragraph, in the full view.</p>
        </BentoCell>
      </>
    ),
  },
];
