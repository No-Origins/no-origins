import {
  Heading,
  Label,
  Stack,
  Surface,
  Table,
  Text,
  durations,
  easings,
  motionNotes,
  motionPatterns,
  type Duration,
  type Easing,
  type MotionPattern,
} from "@no-origins/ui";
import { TokenScreen } from "@/components/token-screen";
import { MotionSamples, ReducedMotionChip } from "./samples";

export const metadata = { title: "Motion" };

/**
 * Motion (Design-System.md §7) — the one token screen where the value and the thing it does are not the same
 * sight, so it has to show both.
 *
 * **Every number on this page is read from `@no-origins/ui`** and nothing is typed here: `durations` and `easings`
 * are printed and drawn, `motionPatterns` is the list, and `motionNotes` supplies each pattern's duration, easing
 * and line — and, read the other way, which patterns a duration or an easing is *for*. That inversion is the
 * reason there is no table of uses in this file: a use written here would be a fifth place for the system to
 * disagree with itself, after the token, the custom property, the note and the class.
 *
 * The curves are drawn rather than imported. A cubic-bezier is four numbers, an SVG cubic is the same four
 * numbers with the y axis flipped, and a chart library to do that arithmetic would be a dependency the package
 * itself does not carry.
 */

/* ---- the bars -------------------------------------------------------------------------------------------- */

/* Ambient is 43× fast, so a linear bar would draw the other three as three indistinguishable stubs. A log scale
   from a 100ms floor keeps all four legible and is labelled as such under the table: a scale nobody is told about
   is a lie, and a chart that lies about a duration is worse than the number on its own. */
const FLOOR = 100;
const bar = (ms: number) => Math.log(ms / FLOOR) / Math.log(durations.ambient / FLOOR);

/* ---- the curves ------------------------------------------------------------------------------------------ */

/** The four control-point coordinates inside `cubic-bezier(…)`. Throws rather than drawing a wrong curve. */
function controlPoints(value: string): [number, number, number, number] {
  const inside = value.match(/^cubic-bezier\(([^)]*)\)$/);
  const parts = inside?.[1].split(",").map((n) => Number(n.trim())) ?? [];
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`Not a cubic-bezier: "${value}" — the motion screen draws easings, it cannot draw a keyword.`);
  }
  return parts as [number, number, number, number];
}

/* Time is drawn wider than progress is tall. A square would be the textbook picture, but spring reaches 1.56 and
   the box has to hold that, which makes a square plot half again as tall as it is wide — three of those side by
   side is a screen of blank paper above two of the curves. Stretching the x axis costs nothing: the shape of an
   easing is where it is steep, and that survives the stretch. */
const CURVE_X = 170;
const CURVE_Y = 120;
const PAD = 10;                         /* room for the stroke and for the overshoot's flat top */

/* One viewBox for all three, so the curves are comparable: spring rises above the box and the other two do not,
   and drawing each to its own bounds would hide exactly that difference. */
const ys = Object.values(easings).flatMap((e) => { const [, y1, , y2] = controlPoints(e); return [y1, y2]; });
const OVERSHOOT = Math.max(1, ...ys);
const UNDERSHOOT = Math.min(0, ...ys);
const VIEW = {
  x: -PAD,
  y: (1 - OVERSHOOT) * CURVE_Y - PAD,
  w: CURVE_X + PAD * 2,
  h: (OVERSHOOT - UNDERSHOOT) * CURVE_Y + PAD * 2,
};

function Curve({ value }: { value: string }) {
  const [x1, y1, x2, y2] = controlPoints(value);
  const px = (x: number) => x * CURVE_X;
  const py = (y: number) => (1 - y) * CURVE_Y;      /* SVG's y grows downward; progress grows upward */
  return (
    <svg
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      role="img"
      aria-label={`The ${value} curve: time across, progress up.`}
      style={{ display: "block", width: "100%", height: "auto", aspectRatio: `${VIEW.w} / ${VIEW.h}` }}
    >
      {/* the 0 → 1 box — without it "overshoot" is a word rather than a line crossed */}
      <rect x={0} y={0} width={CURVE_X} height={CURVE_Y} fill="none" stroke="var(--rule)" strokeWidth={1.5} />
      <line x1={px(x1)} y1={py(y1)} x2={0} y2={py(0)} stroke="var(--rule)" strokeWidth={1.5} />
      <line x1={px(x2)} y1={py(y2)} x2={CURVE_X} y2={py(1)} stroke="var(--rule)" strokeWidth={1.5} />
      <circle cx={px(x1)} cy={py(y1)} r={4} fill="var(--rule)" />
      <circle cx={px(x2)} cy={py(y2)} r={4} fill="var(--rule)" />
      <path
        d={`M 0 ${py(0)} C ${px(x1)} ${py(y1)}, ${px(x2)} ${py(y2)}, ${CURVE_X} ${py(1)}`}
        fill="none"
        stroke="var(--accent-deep)"
        strokeWidth={4}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---- reading the notes backwards ------------------------------------------------------------------------- */

const usesDuration = (d: Duration): MotionPattern[] => motionPatterns.filter((p) => motionNotes[p].duration === d);
const usesEasing = (e: Easing): MotionPattern[] => motionPatterns.filter((p) => motionNotes[p].easing === e);
const named = (list: MotionPattern[]) => (list.length ? list.join(", ") : "nothing yet");

/* A pattern may name a plain CSS keyword instead of one of the three; `breathe` does. Say so rather than letting
   the easings section quietly not add up to five. */
const KEYWORDS = [...new Set(motionPatterns.map((p) => motionNotes[p].easing).filter((e) => !(e in easings)))];

interface DurationRow extends Record<string, unknown> {
  name: Duration;
  ms: number;
  patterns: string;
}

const durationRows: DurationRow[] = (Object.keys(durations) as Duration[]).map((name) => ({
  name,
  ms: durations[name],
  patterns: named(usesDuration(name)),
}));

export default function Motion() {
  return (
    <TokenScreen slug="motion" meta={<ReducedMotionChip />}>
      <Stack gap={24}>
        <Heading level={3}>Four durations</Heading>
        <Table
          columns={[
            {
              key: "name",
              header: "Token",
              width: "170px",
              render: (r) => <code className="noo-code">--d-{r.name}</code>,
            },
            { key: "ms", header: "ms", align: "num", width: "80px", render: (r) => `${r.ms}` },
            {
              key: "bar",
              header: "Length",
              render: (r) => (
                <span
                  aria-hidden="true"
                  style={{ display: "block", height: 10, borderRadius: "var(--r-pill)", background: "var(--ground-2)" }}
                >
                  <span
                    style={{
                      display: "block",
                      width: `${(bar(r.ms) * 100).toFixed(1)}%`,
                      height: "100%",
                      borderRadius: "var(--r-pill)",
                      background: "var(--accent-deep)",
                    }}
                  />
                </span>
              ),
            },
            { key: "patterns", header: "Used by", width: "200px" },
          ]}
          rows={durationRows}
          rowKey={(r) => r.name}
          caption="Every duration in the system, and the patterns built on it"
          /* Four columns of which one is a bar do not fit a phone. The Table already scrolls sideways inside its
             own wrapper rather than letting the page do it — it just needs a floor to overflow against, or the
             100%-wide table squeezes the bar to a stub and wraps the token names instead. */
          className="[&_.noo-table]:min-w-[560px]"
        />
        <Text size="small" tone="muted" className="max-w-[68ch]">
          The bars are on a <strong>log scale from 100ms</strong>, not a linear one. Ambient is {durations.ambient}ms
          — {Math.round(durations.ambient / durations.fast)}× fast — and at true length the other three would be
          three identical stubs against one full-width bar.
        </Text>

        <Heading level={3}>Three easings</Heading>
        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(easings) as Easing[]).map((name) => {
            const [, y1, , y2] = controlPoints(easings[name]);
            const peak = Math.max(y1, y2);
            return (
              <Surface key={name} level={1} style={{ padding: "20px" }}>
                <Stack gap={8}>
                  <Curve value={easings[name]} />
                  <Label>{name}</Label>
                  <Text size="small" tone="muted">
                    Used by {named(usesEasing(name))}.{" "}
                    {peak > 1
                      ? `Overshoots to ${peak.toFixed(2)} and settles back.`
                      : "Arrives without overshooting."}
                  </Text>
                  <code className="noo-code">{easings[name]}</code>
                </Stack>
              </Surface>
            );
          })}
        </div>
        <Text size="small" tone="muted" className="max-w-[68ch]">
          Time runs across, progress up; the hairline box is 0 → 1 on both axes, and the two handles are the
          control points the string names. A curve above the box is a value that passes its target before settling
          back onto it.
          {KEYWORDS.length ? (
            <>
              {" "}
              {named(motionPatterns.filter((p) => KEYWORDS.includes(motionNotes[p].easing)))} names{" "}
              <code className="noo-code">{KEYWORDS.join(", ")}</code> instead — a loop has no arrival to ease, so
              it uses the plain keyword rather than one of the three.
            </>
          ) : null}
        </Text>

        <Heading level={3}>Five patterns</Heading>
        <Text tone="muted" className="max-w-[68ch]">
          A duration and an easing are four numbers until something moves, so these are live. Hover a card for{" "}
          <code className="noo-code">lift</code> — it is a transition, not an arrival, and has nothing to replay.
        </Text>
        <MotionSamples />

        <Text size="small" tone="muted" className="max-w-[68ch]">
          <strong>Every one of the five sits behind <code className="noo-code">prefers-reduced-motion</code>,
          with no opt-out.</strong> Rise, pop and breathe stop; lift stops transitioning; blink is the one that
          stays, slowed to 8–14 seconds, because a blob that has stopped blinking reads as dead rather than as
          calm. The block lives once in the package&apos;s <code className="noo-code">motion.css</code>, so an
          app cannot forget it and a component cannot override it.
        </Text>
      </Stack>
    </TokenScreen>
  );
}
