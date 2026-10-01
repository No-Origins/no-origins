import { AGENT_BODY } from "@no-origins/ui/lib/agent-body";
import { AGENT_PAINTS, agentColours, eyeColours } from "@no-origins/ui/lib/agent-colours";
import { AGENT_FACE } from "@no-origins/ui/lib/agent-face";
import type { ColourName, Property } from "@no-origins/ui/lib/properties";
import { SPHERE_START, type SpherePupils } from "@no-origins/ui/lib/sphere-motion";

import type { Family, Token, Values } from "./families";

/**
 * The sphere (Motion.md M17, his, 2026-09-30): *"a character … an energetic and calm, 3D sphere that travels by diving
 * from one cell to another. It should follow our design principles from motion and design system … so that I can design
 * its character and motion."* A motion he named, so it is on the bench (M9), the eighth.
 *
 * **Version 5, nest to nest** (his, on version 4: *"Instead of making the character float, I think we should see it
 * like jumping from nest to nest … jumping into that circle and then resting on that circle. So we can also control how
 * it bounces, rests."*). Still his fish — a head and a rubbery tail, one smooth body — but the cells are nests: it sits
 * in one, crouches, leaps on an arc, lands in the next, bounces and settles there. **Version 6** (his, on version 5:
 * *"the head is not properly resting on the circle … it should properly rest on the bottom of the circle. As if it's
 * sitting there and then it's spread a little … instead of showing the tail outside of the circle, it should be behind
 * the screen. So it's only visible when it's jumping."*): seen from the side, down the screen is down; it sits on the
 * bottom of its nest's circle, spread a little, its tail behind the page, and the tail comes out only as it jumps. The
 * view and the peak went: the arc is seen as it is, and falls under one gravity. **Version 7** (his, on version 6,
 * the spread all the way up: *"it became some random shape instead of a slime … I also need control on the type of the
 * body … it is not even resting inside the circle"*): sitting, it settles into its nest as into a bowl, its underside
 * on the ring's curve, keeping its size as it spreads, its edge smoothed; and what it is made of is a control, Body:
 * ball, jelly or slime. **Version 8** (his, on version 7: *"when it's landing … it feels like it just came there and
 * got stuck. Instead of … continuation of the motion … it might fall into the right circle and then slide over in the
 * clockwise direction which can be the control and also body could … squeeze a little and then come back like a jelly
 * action"*): landing is a ball in a bowl — it bounces off the curve, rides round the bowl the way it was going (or the
 * way it is told), rocks back and forth and comes to rest, its jelly swaying — with a Slide group for it. **Version 9**
 * (his, on version 8: *"it sticks to the place that it falls in and then only the body feels like it is trying to slide
 * … it's flying and it's softy and it is slippery it will fall and then it will slide and then slowly come back"*):
 * it touches down on the side of the bowl it comes from and keeps its speed along it, as slippery as it is, so its fall
 * becomes a slide; the Slide group says where it lands, how slippery, which way, how heavy, how it rocks and sways. Its
 * controls are in six groups. Since his note on version 9 (*"I don't see any difference between jelly ball and
 * slime"*), Body is a material: jelly moves by the numbers as they are set, a ball is firmer and slime softer, each a
 * share of them (the package's `MATERIAL`), and slime oozes back where jelly wobbles. **Version 10** (his: *"if the
 * slippery is maximum, it should be almost like fluid … the body should also not be so stiff that it hits the wall and
 * then bounces back … get squeezed … in the direction … I should define energy levels … defined by time"*): sliding,
 * it never leaves the bowl — far up its side it squishes into a soft wall and comes back — and Energy (how lively) and
 * Come back (how long until it rests) replace Weight and Rocking; Squeeze is how far it squishes along its way.
 * **Head**, what it is; **Tail**, its rubbery body; **Jump**, where it leaps and how; **Bounce**, how it lands; **Rest**,
 * how it sits.
 *
 * **It is designed version by version, not from presets**, like the agent (his, 2026-09-30: "you give me phase one, I
 * will try on that … then you can create version two"). Its one start is the version's values; Reset goes back to it
 * and Copy hands his tuning back as the settings block. None of its tokens is in globals.css, so the start is carried
 * here and in the package's `SPHERE_START` (`@no-origins/ui/lib/sphere-motion`), the same values. Change one, change
 * both.
 */

const COLOUR_LABELS: Record<ColourName, string> = {
  paint: "Its paint",
  shade: "Its shade",
  deep: "Deep",
  ink: "Ink",
  light: "Light",
  lime: "Lime",
  violet: "Violet",
};

/** The paints' swatches: each paint as the agent wears it. */
const PAINT_SWATCHES = Object.fromEntries(AGENT_PAINTS.map((p) => [p.value, p.fill]));

/**
 * The swatches of a colour by name: what each name is on the agent the values make — its paint and its shade, and for
 * the eyes the pupils they wear, under which Ink is Deep (`eyeColours`).
 */
const colourSwatches = (eyes: boolean) => (values: Values) => {
  const at = (id: string) => values[`--motion-sphere-${id}`];
  const shade = Number(at("shade"));
  const pupils = at("pupils");
  const look = {
    paint: String(at("paint") ?? SPHERE_START.paint),
    shade: Number.isFinite(shade) ? shade : SPHERE_START.shade,
    pupils: (pupils === "dot" || pupils === "shine" ? pupils : "none") as SpherePupils,
  };
  return eyes ? eyeColours(look) : agentColours(look);
};

/**
 * A setting as a jig (M20: the controls come from the declaration, `@no-origins/ui/lib/agent-body` and `agent-face`):
 * its label, range and step — a number as a share, cells or a count as a scale, heads past one as a multiplier, an angle
 * in degrees, a duration in ms, a style or a colour as a choice, a colour's and the paint's with their swatches. A face
 * slot's style is its group's first jig, Style.
 */
function settingToken(group: string, p: Property, style = false): Token {
  const base = { group, name: `--motion-sphere-${p.id}` as const, label: style ? "Style" : p.label, touches: p.touches };
  switch (p.type) {
    case "number":
      if (p.unit === "cell" || p.unit === "count")
        return { ...base, kind: "scale", unit: p.unit === "cell" ? "cells" : "count", min: p.min, max: p.max, step: p.step };
      return p.unit === "head" && p.max > 1
        ? { ...base, kind: "scale", unit: "multiplier", min: p.min, max: p.max, step: p.step }
        : { ...base, kind: "share", min: p.min, max: p.max, step: p.step };
    case "angle":
      return { ...base, kind: "scale", unit: "degrees", min: p.min, max: p.max, step: p.step };
    case "duration":
      return { ...base, kind: "ms", min: p.min, max: p.max, step: p.step };
    case "choice":
      // The paint is a colour: its jig is the colour picker, as every pick of a colour is (C17).
      return { ...base, kind: "choice", choices: p.options.map((o) => ({ value: o.value, label: o.label })), ...(p.id === "paint" ? { swatches: () => PAINT_SWATCHES } : {}) };
    case "colour":
      return { ...base, kind: "choice", choices: p.options.map((c) => ({ value: c, label: COLOUR_LABELS[c] })), swatches: colourSwatches(p.id === "eye-colour") };
    case "switch":
    case "drawing":
      throw new Error(`The agent's face has no ${p.type} jig yet: ${p.id}`);
  }
}

/** Every setting of the agent, body and face, as it is declared: its default is the version's (`SPHERE_START`). */
const SETTINGS: Property[] = [
  ...AGENT_BODY.flatMap((group) => group.settings),
  ...AGENT_FACE.flatMap((slot) => [...(slot.style ? [slot.style] : []), ...slot.settings]),
];

/** The version's values, as the jigs hold them: every setting's default. */
export const SPHERE_START_VALUES = Object.fromEntries(SETTINGS.map((p) => [`--motion-sphere-${p.id}`, p.default as number | string]));

const TOKENS: Token[] = [
  // The body (M20): its jigs are its declaration's, one group a group of it — the head (with its shape), the tail, the
  // jump, the bounce, the slide, the rest and its surface.
  ...AGENT_BODY.flatMap((group) => group.settings.map((p) => settingToken(group.label, p))),
  // The face (version 11's eyes; version 13's parts): one group a slot.
  ...AGENT_FACE.flatMap((slot) =>
    [...(slot.style ? [slot.style] : []), ...slot.settings].map((p) => settingToken(slot.label, p, p === slot.style)),
  ),
];

/**
 * **The agent since version 11** (his, 2026-09-30: *"we'll remove agent and the sphere will become the agent. And agent
 * can have eyes"*). The pill agent (M12, M19) was deleted; this is his personal guide now. It is shown as Agent and
 * keeps its id, `sphere`, and its `--motion-sphere-*` tokens, as hyper focus and focus mode kept `focus` and `mode` when
 * they were renamed. Its eyes are new, version 1 of them (his, asked: new eyes rather than the pill's): two circles on
 * its face in the ink of its paint, riding the head as it squashes, spreads and leans, looking where it goes, with lids
 * that blink and squint shut as it lands. **Version 13** (2026-09-30, Motion.md M20's face version 1, his "yes for both")
 * gives the face its parts — pupils, upper and lower lids, brows, and a symbol a mood pops up by its head — each a jig
 * group built from the package's declaration (`agent-face`), every part left as version 12 drew it.
 */
export const SPHERE_FAMILY: Family = {
  id: "sphere",
  label: "Agent",
  title: "Your personal guide",
  touches:
    "A head with eyes and a rubbery tail: it sits on the bottom of its nest, calm, its tail behind the page, and jumps to the next — its eyes on where it is going, crouching, leaping on an arc with its tail out behind it, landing, sliding, then sitting there.",
  hint: "Set its jump in Jump and press Play, or click a cell to send it there.",
  // Not a block of cells: the character is one, and its jump is its Columns and Rows. The specimen's are not drawn.
  block: { columns: 1, rows: 1, max: 1 },
  version: 15,
  tokens: TOKENS,
  presets: [
    {
      id: "A",
      name: "Version 15",
      why: "Version 14 as it looks, with slime spreading at 1.2 where it spread at 2.6, so the whole of Spread settles it (his \"Yes\"); Spread 0.11 is version 14's 0.05. Version 14 was his settings (2026-09-30, sent back as \"Agent — Version 13, tuned, tuned\"): version 13's, tuned, but coming back to rest in half a second where it took 1s, and settling a little into its nest (Spread 0.05) where it sat round. Version 13, tuned (\"This becomes the rest state of the motion\"), was version 12's with Come back 1s. Version 12's, fixed upon from version 11: a violet slime head three fifths of a cell across, deeply shaded, with a short limp tail and no squash, spread or sway; jumping one column and six rows on a 60ms crouch, 550ms in the air, touching down 30° up its near side and keeping all its speed along the bowl, squeezing 40%, at rest 1s after it lands; breathing every 4s, a tenth deep; its eyes a quarter of the head across, 0.45 apart and 0.3 up, looking 0.8 of its radius where it goes, blinking every 3.6s and squinting 60% as it lands.",
      risk: "Version 13 adds the face's parts (Motion.md M20, the face version 1: pupils, upper and lower lids, brows, and a symbol by the head), every one left as version 12 draws it, so nothing changes until a Style is picked. They are drawn in code from their settings and flat. A pair is mirrored: its right side set apart comes with the states. Look lead is 1000ms, but a look turns no earlier than the crouch starts, and his crouch is 60ms, so it acts as 60ms.",
      // His, every one: the declaration's defaults are `SPHERE_START`, version 15, his version 14 as it looks.
      values: SPHERE_START_VALUES,
    },
  ],
};
