import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { BentoFigure, IllustrationCanvas, Section, SectionHeader, type Hue, type Line } from "@no-origins/ui";
import { rounds, type Round, type Option } from "./rounds";

export const metadata: Metadata = { title: "Illustration studio", robots: { index: false } };

/** Rules that are no longer up for debate. The batches start here; decided rounds add to the list. */
const settled: Array<{ rule: string; from: string }> = [
  { rule: "Fine lines, never fill", from: "Bhargav, 2026-09-10" },
  { rule: "No two lines touch, in any picture", from: "Bhargav, 2026-09-10 — measured by probe11" },
  { rule: "The card carries the colour, the gradient and the grain", from: "follows from “no fill”" },
  { rule: "One hue, lit from the top-left like the blob", from: "Illustrations.md principles 1 and 5" },
  { rule: "Honest counts, or say absence", from: "Illustrations.md principle 8" },
  ...rounds.flatMap((r) => (r.rules ?? []).map((rule) => ({ rule, from: `round ${r.n} · chose ${r.chosen}` }))),
];

const decided = rounds.filter((r) => r.chosen);

const tileStyle = (hue: Hue, px?: number): CSSProperties =>
  ({ aspectRatio: "1 / 1", width: px, padding: px && px < 200 ? 5 : undefined, "--bento-hue": `var(--${hue})`, "--bento-hue-ink": `var(--${hue}-ink)` }) as CSSProperties;

type Place = "alone" | "corner" | "field";
const placeClass: Record<Place, string> = {
  alone: "noo-bento__ill--alone w-full",
  corner: "noo-bento__ill",
  field: "noo-bento__ill noo-bento__ill--field",
};

/**
 * One candidate on one surface. `corner` and `field` are the two real placements — the diagonal, and the family
 * that crosses the whole cell; `alone` centres the drawing so it can be judged on its own.
 */
function Tile({
  hue, tone, px, place = "alone", id, cell, draw,
}: {
  hue: Hue; tone: "fill" | "quiet"; px?: number; place?: Place; id: string;
  cell?: { label: string; value: string; caption: string }; draw: (line: Line) => ReactNode;
}) {
  return (
    <div className={`noo-bento__cell noo-bento__cell--${tone} ${cell ? "" : "flex items-center justify-center"}`} style={tileStyle(hue, px)}>
      {/* data-ill names the candidate for probe11, which holds it to principle 3 like anything in the library */}
      <IllustrationCanvas hue={hue} data-ill={id} preserveAspectRatio={place === "field" ? "xMidYMid slice" : undefined} className={placeClass[place]}>
        {draw}
      </IllustrationCanvas>
      {cell ? (
        <>
          <p className="noo-label">{cell.label}</p>
          <BentoFigure value={cell.value} label={cell.caption} />
        </>
      ) : null}
    </div>
  );
}

function Small({ caption, ...rest }: { caption: string } & Parameters<typeof Tile>[0]) {
  return (
    <figure className="flex flex-col items-center gap-1.5">
      <Tile {...rest} />
      <figcaption className="noo-label text-muted">{caption}</figcaption>
    </figure>
  );
}

/** The tiles for one candidate: one cell, or one per section when the round is about telling sections apart. */
function Candidate({ r, o }: { r: Round; o: Option }) {
  if (o.variants) {
    return (
      <>
        <div className="flex flex-wrap gap-4">
          {o.variants.map((v) => (
            <Tile key={v.hue} hue={v.hue} tone="fill" px={304} place={r.place} id={`${o.id}-${v.hue}`} cell={v.cell} draw={v.draw} />
          ))}
        </div>
        <div className="flex items-start gap-4">
          {o.variants.map((v) => (
            <Small key={v.hue} hue={v.hue} tone="fill" px={82} place={r.place} id={`${o.id}-${v.hue}`} caption={`${v.cell.label} · 0.27`} draw={v.draw} />
          ))}
        </div>
      </>
    );
  }
  const draw = o.draw!;
  return (
    <>
      <Tile hue={r.hue} tone="fill" px={r.cell ? 304 : undefined} place={r.place} id={o.id} cell={r.cell} draw={draw} />
      <div className="flex items-start gap-4">
        <Small hue={r.hue} tone="quiet" px={76} place={r.place === "field" ? "field" : "alone"} id={o.id} caption="quiet" draw={draw} />
        <Small hue={r.hue} tone="fill" px={82} place={r.place} id={o.id} caption="at 0.27" draw={draw} />
      </div>
    </>
  );
}

function Batch({ r }: { r: Round }) {
  const wide = Boolean(r.cell) || r.options.some((o) => o.variants);
  return (
    <Section aria-labelledby={`round-${r.n}`}>
      <SectionHeader
        level={2}
        label={`round ${r.n} · ${r.subject} · ${r.hue}${r.chosen ? ` · decided: ${r.chosen}` : ""}`}
        title={r.title}
        titleId={`round-${r.n}`}
        lead={`${r.question} ${r.why}`}
      />
      <div
        className={wide ? "grid gap-8" : "grid gap-6 sm:grid-cols-2 xl:grid-cols-5"}
        style={wide ? { gridTemplateColumns: `repeat(auto-fill, minmax(${r.options.some((o) => o.variants) ? 640 : 304}px, 1fr))` } : undefined}
      >
        {r.options.map((o) => {
          const rank = r.ranked?.indexOf(o.id) ?? (r.chosen === o.id ? 0 : -1);
          return (
            <article key={o.id} className="flex flex-col gap-3" style={{ opacity: r.chosen && rank < 0 ? 0.5 : 1 }}>
              <header className="flex items-baseline gap-2">
                <span className="noo-label text-muted">{o.id}</span>
                <h3 className="noo-h5 text-ink">{o.name}</h3>
                {rank >= 0 ? <span className="noo-label text-accent">· {["1st", "2nd", "3rd"][rank] ?? `${rank + 1}th`}</span> : null}
              </header>
              <Candidate r={r} o={o} />
              <p className="noo-body-sm text-ink-2">{o.logic}</p>
              <p className="noo-body-sm text-muted"><span className="noo-label">where it fails · </span>{o.risk}</p>
            </article>
          );
        })}
      </div>
      <div className="noo-card mt-8">
        <p className="noo-label text-muted">{r.chosen ? "what I'd picked, and what you picked" : "what I'd pick, and why"}</p>
        <p className="noo-body mt-2 text-ink-2">{r.recommend}</p>
        {r.note ? <p className="noo-body mt-3 text-ink">{r.note}</p> : null}
      </div>
    </Section>
  );
}

export default function Studio() {
  return (
    <>
      <Section aria-labelledby="studio-title">
        <SectionHeader
          level={1}
          label="studio · illustrations"
          title="The studio"
          titleId="studio-title"
          lead="Five candidates a round, drawn by the real component on the real tokens. Pick one by its number, say what you liked or didn't, and the next batch starts from what that pick implies. Every round and every rule it produced is written down in Illustrations.md §9, so the library keeps its reasons."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <div className="noo-card">
            <p className="noo-label text-muted">how a round works</p>
            <ol className="noo-body-sm mt-3 flex list-decimal flex-col gap-1.5 pl-4 text-ink-2">
              <li>A batch asks one question about one subject and answers it five ways.</li>
              <li>Each candidate says what it is testing and how it could be wrong.</li>
              <li>You pick a number and add notes; anything you say beats anything I recommend.</li>
              <li>I write the rule your pick implies into the log, and the next batch inherits it.</li>
              <li>A candidate may improvise its geometry — only a winner earns a place in the grammar.</li>
            </ol>
          </div>
          <div className="noo-card">
            <p className="noo-label text-muted">settled — every batch obeys these</p>
            <ul className="noo-body-sm mt-3 flex flex-col gap-1.5 text-ink-2">
              {settled.map((s) => (
                <li key={s.rule} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-ink">{s.rule}</span>
                  <span className="noo-label text-muted">{s.from}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {rounds.map((r) => <Batch key={r.n} r={r} />)}

      <Section aria-labelledby="log-title">
        <SectionHeader level={2} label="the log" title="What each round taught" titleId="log-title" lead="One entry per decided round: what you chose, what you said, and the rules the next batch inherited." />
        {decided.length === 0 ? (
          <p className="noo-body text-ink-2">Nothing decided yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {decided.map((r) => (
              <li key={r.n} className="noo-card">
                <p className="noo-label text-muted">round {r.n} · {r.subject} · chose {r.chosen}</p>
                <p className="noo-body-sm mt-2 text-ink-2">{r.note}</p>
                <ul className="noo-body-sm mt-3 flex list-disc flex-col gap-1.5 pl-4 text-ink">
                  {(r.rules ?? []).map((rule) => <li key={rule}>{rule}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
