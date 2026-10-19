// Turns the reconciled measure of his turnaround (consensus.json, made symmetric by symmetrize.mjs) into
// apps/orbit/src/world/clay-turnaround.ts (World.md W102). README.md beside it has the commands.
// node generate.mjs <symmetric.json> <out.ts> [tuning.json]
//
// What each part takes from which view: the front and the back (one symmetric outline) give every width; the side gives
// every depth; the views three quarters round give the head's cross-section, row by row (how square it is), and are
// otherwise what the figure is checked against. Rows are every 4 of the picture's pixels; numbers are fractions of the
// figure's height (the ground 0, the crown 1), across from its middle line, through from its middle (+ its front).
import { readFileSync, writeFileSync } from "node:fs";

const [, , consensusPath, outPath, tuningPath] = process.argv;
const c = JSON.parse(readFileSync(consensusPath, "utf8"));
const tune = tuningPath ? JSON.parse(readFileSync(tuningPath, "utf8")) : {};
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const median = (a) => { const s = a.filter((v) => v !== null).sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const mean = (a) => { const s = a.filter((v) => v !== null); return s.length ? s.reduce((t, v) => t + v, 0) / s.length : null; };
const round4 = (v) => Math.round(v * 10000) / 10000;
const VIEWS = ["front", "back", "side", "threeQuarterLeft", "threeQuarterRight"];
const views = c.views;

// The figure's height in the picture, and where things are on it.
const ground = tune.groundY ?? median(VIEWS.map((k) => num(views[k]?.groundY)));
const crown = tune.crownY ?? median(VIEWS.map((k) => num(views[k]?.crownY)));
const H = ground - crown;
const up = (y) => (ground - y) / H;
const L = { ...c.landmarks, ...(tune.landmarks ?? {}) };
const crotch = L.crotchY;
const armEnd = L.armEndY;

// The symmetric front: half-widths from the middle line, the front and the back together.
const sym = [...(c.symmetric?.front?.rows ?? [])].filter((r) => num(r.y) !== null).sort((a, b) => a.y - b.y);
const symAt = (y, key) => { const r = sym.find((q) => Math.abs(q.y - y) < 0.5); return r ? num(r[key]) : null; };
// The armpit: where the crease is first measured; the head's foot (the notch where it meets the neck) as tuned.
const armpit = tune.armpitY ?? sym.find((r) => num(r.torso) !== null && r.y > (L.headBottomY ?? 360) + 40).y - 2;
const headBottom = tune.headBottomY ?? L.headBottomY;

// The side: the legs' middle is the figure's middle line through; it faces the picture's left (z = −(x − axis)).
const side = [...views.side.rows].filter((r) => num(r.y) !== null).sort((a, b) => a.y - b.y);
const facing = views.side.facing === "right" ? -1 : 1;
const sideAxis = median(side.filter((r) => r.y > crotch + 12 && r.y < ground - 12 && num(r.front) !== null && num(r.back) !== null).map((r) => (r.front + r.back) / 2));
const zOf = (x) => (facing * -(x - sideAxis)) / H;
const sideAt = (y) => side.find((r) => Math.abs(r.y - y) < 2.5);
/** The side's outline at a row, back then front, as fractions; null where it was not measured. */
const depthAt = (y) => { const r = sideAt(y); return r && num(r.front) !== null && num(r.back) !== null ? [Math.min(zOf(r.back), zOf(r.front)), Math.max(zOf(r.back), zOf(r.front))] : [null, null]; };

// Smoothings of a row series, their ends kept: light (1-2-1), and for the long soft outlines a binomial twice, since
// the measured rows wobble a pixel or two and a loft through every row would show it as bands.
const smooth = (values) => values.map((v, i) => (i === 0 || i === values.length - 1 || values[i - 1] === null || values[i + 1] === null || v === null ? v : (values[i - 1] + 2 * v + values[i + 1]) / 4));
const smoother = (values) => {
  const pass = (vs) => vs.map((v, i) => {
    if (v === null || i < 2 || i > vs.length - 3 || vs.slice(i - 2, i + 3).some((w) => w === null)) return v;
    return (vs[i - 2] + 4 * vs[i - 1] + 6 * v + 4 * vs[i + 1] + vs[i + 2]) / 16;
  });
  let result = values;
  for (let i = 0; i < (tune.fairPasses ?? 2); i++) result = pass(result);
  return result;
};
/** Rows closing over a height as a superellipse does (exponent p: 2 round, more blunt), from a section to nothing. */
const closing = (from, to, section, p = 2, steps = 8) =>
  Array.from({ length: steps }, (_, k) => {
    const s = (k + 1) / steps;
    const scale = Math.pow(Math.max(0, 1 - Math.pow(s, p)), 1 / p);
    const [mid, half, zmid, zhalf] = section;
    return [from + (to - from) * s, mid - half * scale, mid + half * scale, zmid - zhalf * scale, zmid + zhalf * scale];
  });
const sectionOf = (row) => [(row[1] + row[2]) / 2, (row[2] - row[1]) / 2, (row[3] + row[4]) / 2, (row[4] - row[3]) / 2];
/**
 * A joint's skirt: the part that holds a limb (a shoulder, a hip) runs on down the limb's own rows a little way, drawing
 * in gently, then closes inside it, so at rest the two meet with no edge showing; it stays inside the limb's ball, so a
 * swing never shows it. `limb` its rows, `joint` the joint's height, all fractions.
 */
const skirtOf = (limb, joint) => {
  const length = (tune.skirtPx ?? 12) / H, drawIn = tune.skirtDrawIn ?? 0.05;
  const rows = limb.filter((r) => r[0] < joint && r[0] >= joint - length).sort((a, b) => b[0] - a[0]).map((r) => {
    const f = 1 - drawIn * ((joint - r[0]) / length) ** 2;
    const [mid, half, zmid, zhalf] = sectionOf(r);
    return [r[0], mid - half * f, mid + half * f, zmid - zhalf * f, zmid + zhalf * f, ...r.slice(5)];
  });
  const last = rows[rows.length - 1];
  return last ? [...rows, ...closing(last[0], last[0] - (tune.skirtClosePx ?? 4) / H, (([mid, half, zmid, zhalf]) => [mid, half * 0.95, zmid, zhalf * 0.95])(sectionOf(last)), 2, 4).map((r) => [...r, ...last.slice(5)])] : rows;
};

// ---- The head: a row a measured row, its half-width the front's, its back and front the side's.
const headRows = sym.filter((r) => r.y <= headBottom && num(r.outer) !== null && r.outer > 0.5).map((r) => {
  const [back, front] = depthAt(r.y);
  return back === null ? null : { y: r.y, half: r.outer / H, back, front };
}).filter(Boolean);
const hh = smooth(headRows.map((r) => r.half)), hb = smoother(headRows.map((r) => r.back)), hf = smoother(headRows.map((r) => r.front));
// How square each row's cross-section is: the exponent that makes it as wide three quarters round as the two
// three-quarter views (their mean), the same scale as the front.
const quarterWidth = (y) => mean(["threeQuarterLeft", "threeQuarterRight"].map((k) => { const r = views[k].rows.find((q) => Math.round(q.y) === y); return r && num(r.left) !== null && num(r.right) !== null ? r.right - r.left : null; }));
const diagonal = (a, b, n) => { let best = 0; for (let i = 0; i <= 200; i++) { const t = (i / 200) * (Math.PI / 2); best = Math.max(best, a * Math.pow(Math.cos(t), 2 / n) + b * Math.pow(Math.sin(t), 2 / n)); } return best / Math.SQRT2; };
const fitN = (a, b, half) => { if (!half) return null; let lo = 1.5, hi = 6; if (diagonal(a, b, lo) >= half) return lo; if (diagonal(a, b, hi) <= half) return hi; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (diagonal(a, b, mid) < half) lo = mid; else hi = mid; } return (lo + hi) / 2; };
const headN = smoother(headRows.map((r, i) => fitN(hh[i] * H, ((hf[i] - hb[i]) / 2) * H, (quarterWidth(Math.round(r.y)) ?? 0) / 2)));
const nHead = headN.map((n) => tune.headExponent ?? Math.min(tune.headNMost ?? 4, Math.max(tune.headNLeast ?? 1.7, n ?? 2.4)));
let head = headRows.map((r, i) => [up(r.y), hh[i], hb[i], hf[i], nHead[i]]).sort((a, b) => a[0] - b[0]);
const widestHead = head.reduce((a, b) => (b[3] - b[2] > a[3] - a[2] ? b : a));
const headCentre = (widestHead[2] + widestHead[3]) / 2;
// The crown: the picture's top is a round, a circle's arc meeting the last measured row (`radiusOf`: the circle through
// that row's edge and the crown), carried on up to the crown row by row, so the head closes round and never to a point.
{
  const top = head[head.length - 1];
  const depth = 1 - top[0];
  const radiusOf = (half) => (half * half + depth * depth) / (2 * depth);
  const zmid = (top[2] + top[3]) / 2;
  const [rx, rz] = [radiusOf(top[1]), radiusOf((top[3] - top[2]) / 2)];
  const arc = [0.75, 0.5, 0.3, 0.15, 0.05, 0].map((share) => {
    const d = depth * share;
    const across = (r) => Math.sqrt(Math.max(0, 2 * r * d - d * d));
    return [1 - d, across(rx), zmid - across(rz), zmid + across(rz), top[4]];
  });
  head = [...head, ...arc];
}

// ---- The neck: its narrowest front row under the head, its depth the side's narrowest there; the flare is where the
// outline first widens clear of it, the torso's top.
const neckCandidates = sym.filter((r) => r.y > headBottom + 1 && r.y < headBottom + 14 && num(r.outer) !== null);
const neckRow = neckCandidates.reduce((a, b) => (b.outer < a.outer ? b : a), neckCandidates[0]);
const flareRow = sym.find((r) => r.y > neckRow.y && num(r.outer) !== null && r.outer > neckRow.outer * (tune.flare ?? 1.15)) ?? neckRow;
const neckSide = side.filter((r) => r.y >= neckRow.y - 2 && r.y <= flareRow.y + 2 && num(r.front) !== null && num(r.back) !== null)
  .reduce((a, b) => (Math.abs(b.back - b.front) < Math.abs(a.back - a.front) ? b : a));
const neck = { half: (neckRow.outer * (tune.neckWidth ?? 1)) / H, back: Math.min(zOf(neckSide.back), zOf(neckSide.front)), front: Math.max(zOf(neckSide.back), zOf(neckSide.front)) };
// The chin: the head's foot rounds under onto the neck, its section closing from the notch's width over a few rows, a
// little wider than the neck where it meets it, so the head sits on the neck with a soft shadow line under its edge.
{
  const foot = head[0];
  const drop = (tune.chinPx ?? 4) / H;
  const zmid = (foot[2] + foot[3]) / 2, zhalf = (foot[3] - foot[2]) / 2;
  const chin = Array.from({ length: 5 }, (_, k) => {
    const s = (k + 1) / 5, scale = Math.sqrt(Math.max(0, 1 - s * s));
    const least = tune.chinLeast ?? 0.82;
    const shrink = least + (1 - least) * scale;
    return [foot[0] - drop * s, foot[1] * shrink, zmid - zhalf * shrink, zmid + zhalf * shrink, foot[4]];
  });
  head = [...chin.reverse(), ...head];
}

// ---- The torso: its sides the creases where the arms press on it (measured), widening to the legs' tops at the crotch;
// above the armpit, the crease or the outline where that is narrower (the flare into the neck); its depth the side's,
// the neck's above the flare. Its top is just inside the neck at the neck's narrowest row; its foot closes just under the
// crotch, inside the legs' tops, the crotch's own top showing between them.
const creaseRows = sym.filter((r) => r.y > armpit + 8 && r.y < armEnd - 16 && num(r.torso) !== null);
const crease = median(creaseRows.map((r) => r.torso)) / H;
const creasePx = crease * H;
const legTopOuter = median(sym.filter((r) => r.y > crotch + 6 && r.y < crotch + 26 && num(r.outer) !== null).map((r) => r.outer));
const torsoYs = sym.filter((r) => r.y >= neckRow.y && r.y <= crotch).map((r) => r.y);
const torsoHalf = smoother(torsoYs.map((y) => {
  const outer = symAt(y, "outer"), torso = symAt(y, "torso");
  if (y > armpit + 6 && torso !== null) return torso;
  if (y > armpit + 6) return legTopOuter;
  return Math.min(creasePx, outer ?? creasePx);
}));
const INSIDE_NECK = tune.insideNeck ?? 0.97;
const torsoZ = torsoYs.map((y) => (y < flareRow.y ? [neck.back * INSIDE_NECK, neck.front * INSIDE_NECK] : depthAt(y)));
const tb = smoother(torsoZ.map((z) => z[0])), tf = smoother(torsoZ.map((z) => z[1]));
for (let i = 0; i < torsoYs.length; i++) if (torsoYs[i] < flareRow.y) torsoHalf[i] = Math.min(torsoHalf[i], neck.half * H * INSIDE_NECK);
// Its section squares up over the hips (`hipsSquare`), so its front and back run flat across the legs' tops as the
// picture's belly does, rather than falling behind them either side of the middle.
const squareAt = (y) => {
  const f = Math.min(1, Math.max(0, (y - (crotch - (tune.hipsSquareOverPx ?? 40))) / (tune.hipsSquareOverPx ?? 40)));
  return (tune.torsoN ?? 2.4) + ((tune.hipsSquare ?? 6) - (tune.torsoN ?? 2.4)) * f * f * (3 - 2 * f);
};
let torso = torsoYs.map((y, i) => [up(y), torsoHalf[i] / H, tb[i], tf[i], squareAt(y)]).filter((r) => r.every((v) => v !== null && Number.isFinite(v))).sort((a, b) => a[0] - b[0]);
{
  // At the crotch its sides are the outline there (the legs' outer edges: one line from the hips down the legs, as
  // the picture's is); under it, it closes a little way down inside the legs, whose tops run up inside it (below), the
  // two meeting on one surface. Between the legs its underside is the crotch.
  const foot = torso[0];
  const at = sym.find((r) => r.y > crotch && num(r.outer) !== null);
  const [cb, cf] = depthAt(at.y);
  const crotchRow = [up(crotch), at.outer / H, cb ?? foot[2], cf ?? foot[3], squareAt(crotch)];
  const zmid = (crotchRow[2] + crotchRow[3]) / 2, zhalf = (crotchRow[3] - crotchRow[2]) / 2;
  const close = closing(crotchRow[0], crotchRow[0] - (tune.footClosePx ?? 6) / H, [0, crotchRow[1], zmid, zhalf], 2, 5).map(([y, , x1, z0, z1]) => [y, x1, z0, z1, crotchRow[4]]);
  torso = [...close.reverse(), crotchRow, ...torso].sort((a, b) => a[0] - b[0]);
}

// ---- The arm: its end up to the armpit, where it turns. Its inner edge presses a little into the torso (the picture's
// dark crease is the two meeting, not air); its outer edge the outline; through, the side's arm edges, held near the
// armpit where they fade into the shoulder. Its end is blunt, the picture's mitt, and as low as the picture's.
const armYs = sym.filter((r) => r.y >= armpit && r.y <= armEnd && num(r.outer) !== null).map((r) => r.y);
const OVERLAP = tune.armOverlapPx ?? 1.5;
const armIn = smoother(armYs.map((y) => { const inner = symAt(y, "armInner"), torsoSide = symAt(y, "torso"); return inner === null ? null : Math.min(inner, (torsoSide ?? creasePx) - OVERLAP); }));
const armOut = smoother(armYs.map((y) => symAt(y, "outer")));
const armSide = armYs.map((y) => { const r = sideAt(y); return r && num(r.armFront) !== null && num(r.armBack) !== null ? [Math.min(zOf(r.armBack), zOf(r.armFront)), Math.max(zOf(r.armBack), zOf(r.armFront))] : [null, null]; });
const ab = smoother(armSide.map((z) => z[0])), af = smoother(armSide.map((z) => z[1]));
const HOLD = tune.armDepthHoldPx ?? 28;
const steady = armYs.map((y, i) => (y > armpit + HOLD && y < armpit + HOLD + 40 ? [ab[i], af[i]] : null)).filter((z) => z && z[0] !== null);
const heldBack = median(steady.map((z) => z[0])), heldFront = median(steady.map((z) => z[1]));
let arm = armYs.map((y, i) => {
  // Held whole over the top half of the hold, fading over the rest: the side's arm edges near the armpit are the
  // shoulder's, not the arm's, and would swell its top.
  const hold = y < armpit + HOLD ? 1 - Math.min(1, Math.max(0, (y - armpit - HOLD / 2) / (HOLD / 2))) : 0;
  const back = ab[i] ?? heldBack, front = af[i] ?? heldFront;
  return [up(y), armIn[i] / H, armOut[i] / H, back + (heldBack - back) * hold, front + (heldFront - front) * hold];
}).filter((r) => r.every((v) => v !== null && Number.isFinite(v))).sort((a, b) => a[0] - b[0]);
{
  const endUp = up(armEnd + (tune.armEndLowerPx ?? 1.5));
  const radius = tune.armEndRadius ?? 0.075;
  const from = arm.find((r) => r[0] >= endUp + radius) ?? arm[arm.length - 1];
  arm = [...closing(from[0], endUp, sectionOf(from), tune.armEndBlunt ?? 2.8, 10).reverse(), ...arm.filter((r) => r[0] >= from[0])];
}
const armTop = arm[arm.length - 1];
// Over the armpit the arm runs on a little way inside the shoulder (along the dome's rows, drawing in from them), then
// closes: it has no flat top whose edge could show at the joint, and it leaves the joint with the dome's own slope.
let armAbove = [];

// ---- The shoulder: a dome over each arm's top, from the armpit (its foot the arm's top row exactly: the joint's
// equator) up to where the outline meets the torso's crease. Its outer edge is the outline, its inner edge reaches into
// the torso; through, it keeps the arm's depth at the armpit, so the arm's rounded top turns inside it whichever way it
// swings, inside the side's outline. Its top closes inside the torso.
const domeTop = sym.find((r) => r.y > flareRow.y && num(r.outer) !== null && r.outer >= creasePx).y;
const [armZmid, armZhalf] = [(armTop[3] + armTop[4]) / 2, (armTop[4] - armTop[3]) / 2];
const shoulderYs = sym.filter((r) => r.y >= domeTop && r.y < armpit).map((r) => r.y);
const reach = tune.shoulderReach ?? 0.06;
const RISE = tune.domeRisePx ?? 28;
let shoulder = [armTop, ...shoulderYs.map((y) => {
  const f = Math.min(1, Math.max(0, (armpit - y) / RISE));
  const ease = f * f * (3 - 2 * f);
  const inner = armTop[1] + (Math.max(0.02, crease - reach) - armTop[1]) * ease;
  const [back, front] = depthAt(y);
  const inside = tune.domeInside ?? 0.006;
  return [up(y), inner, symAt(y, "outer") / H, Math.max(armZmid - armZhalf, back === null ? -Infinity : back + inside), Math.min(armZmid + armZhalf, front === null ? Infinity : front - inside)];
})].sort((a, b) => a[0] - b[0]);
{
  const top = shoulder[shoulder.length - 1];
  const [mid, half, zmid, zhalf] = sectionOf(top);
  shoulder = [...shoulder, ...closing(top[0], top[0] + (tune.domeCapPx ?? 6) / H, [mid, half * 0.92, zmid, zhalf * 0.92], 2, 5)];
}
// Under the armpit it dives inside the arm: along the arm's own rows, drawing in from them, so at the joint the two
// surfaces meet on one row with one slope, the dome above and the arm below, and no edge of either shows.
shoulder = [...skirtOf(arm, armTop[0]), ...shoulder].sort((a, b) => a[0] - b[0]);
{
  const length = (tune.armOverPx ?? 8) / H, drawIn = tune.armOverIn ?? 0.08;
  const over = shoulder.filter((r) => r[0] > armTop[0] && r[0] <= armTop[0] + length);
  armAbove = over.map((r) => {
    const f = 1 - drawIn * ((r[0] - armTop[0]) / length) ** 2;
    const outer = armTop[1] + (r[2] - armTop[1]) * f;
    const [, , zmid, zhalf] = sectionOf(r);
    return [r[0], armTop[1], outer, zmid - zhalf * f, zmid + zhalf * f];
  });
  const last = armAbove[armAbove.length - 1] ?? armTop;
  armAbove = [...armAbove, ...closing(last[0], last[0] + (tune.armOverClosePx ?? 4) / H, (([mid, half, zmid, zhalf]) => [mid, half * 0.95, zmid, zhalf * 0.95])(sectionOf(last)), 2, 4)];
}

// ---- The leg: the sole up to the crotch, where it turns. Its inner edge the slit's, opening from the crotch as the
// picture's does; its outer edge the outline; through, the side's. Its sole is flat, its edge rounded by the picture's
// foot corner.
const SHADE = tune.slitShade ?? 0;
const CLOSE = tune.slitClosePx ?? 6;
const legYs = sym.filter((r) => r.y >= crotch && r.y <= ground && num(r.outer) !== null).map((r) => r.y);
const legIn = smoother(legYs.map((y) => { const ramp = Math.min(1, Math.max(0, (y - crotch) / CLOSE)); return Math.max(0, (symAt(y, "slit") ?? 0) - SHADE) * ramp * ramp * (3 - 2 * ramp); }));
const legOut = smoother(legYs.map((y) => symAt(y, "outer") ?? legTopOuter));
const legSide = legYs.map(depthAt);
const lb = smoother(legSide.map((z) => z[0])), lf = smoother(legSide.map((z) => z[1]));
// Its section is square at its top, as the hips are, easing to the leg's own a little way down.
const legSquareAt = (y) => {
  const f = Math.min(1, Math.max(0, 1 - (y - crotch) / (tune.legSquareOverPx ?? 40)));
  return (tune.legN ?? 2.3) + ((tune.legTopSquare ?? 4.5) - (tune.legN ?? 2.3)) * f * f * (3 - 2 * f);
};
let leg = legYs.map((y, i) => [up(y), Math.max(0, legIn[i]) / H, legOut[i] / H, lb[i], lf[i], legSquareAt(y)]).filter((r) => r.every((v) => v !== null && Number.isFinite(v))).sort((a, b) => a[0] - b[0]);
// The sole: the leg's section a round up, carried flat down to the ground; the loft rounds the edge (\`footRound\`).
const footRound = Math.min(tune.footRadius ?? (num(L.footCornerRadius) ?? 14), 30) / H;
{
  const above = leg.find((r) => r[0] >= footRound * 1.15) ?? leg[0];
  leg = [[0, ...above.slice(1)], ...leg.filter((r) => r[0] >= above[0])];
}

arm = [...arm, ...armAbove];

// The leg's top: what it runs on up from, inside the torso.
const legTop = leg[leg.length - 1];

// The leg runs on up from the crotch inside the torso (its sides the torso's, a half pixel in), then closes: one skin
// with the torso, their surfaces one at the crotch, so nothing shows where one gives way to the other.
{
  const into = (tune.legIntoPx ?? 12) / H, inside = (tune.legInsidePx ?? 0.5) / H;
  const halfAt = (u) => { const r = torso.reduce((a, b) => (Math.abs(b[0] - u) < Math.abs(a[0] - u) ? b : a)); return r; };
  const rise = [0.34, 0.67, 1].map((share) => {
    const u = legTop[0] + into * share;
    const t = halfAt(u);
    return [u, legTop[1], Math.min(legTop[2], t[1] - inside), Math.max(legTop[3], t[2] + inside), Math.min(legTop[4], t[3] - inside), legTop[5]];
  });
  const last = rise[rise.length - 1];
  leg = [...leg, ...rise, ...closing(last[0], last[0] + (tune.legClosePx ?? 4) / H, sectionOf(last), 2, 4).map((r) => [...r, legTop[5]])];
}

// ---- Written out.
const fmt = (rows) => rows.map((r) => `    [${r.map(round4).join(", ")}],`).join("\n");
const square = { torso: tune.torsoN ?? 2.4, shoulder: tune.shoulderN ?? 2.7, arm: tune.armN ?? 2.2, leg: tune.legN ?? 2.3 };
const ts = `/**
 * His turnaround, measured (World.md W102; his, 2026-10-16: "Create another human in the orbit that looks exactly like
 * the character created in the image. It should match exactly."): the Clay's outlines read off the picture he gave, a
 * soft matte figure shown from the front, three quarters round, the side and the back. Three readings of the picture
 * (by its edges, by a model of its background, and by eye against a ruler) were reconciled row by row, every 4 of its
 * ${Math.round(H)} pixels from sole to crown. Every number is a fraction of the figure's height, the ground 0 and the crown 1:
 * across from its middle line (+ its left), through from its middle (+ its front), up from the ground. The front and
 * the back were measured together and made symmetric, and the side is as seen; the views three quarters round give the
 * head's cross-section, row by row, and are otherwise what the figure is checked against. Nothing here is three.js;
 * \`lookOf\` (\`human.ts\`) scales these by the Clay's controls.
 * Written by \`apps/orbit/scripts/clay/generate.mjs\` from the reconciled measure beside it (\`consensus.json\`);
 * regenerate rather than edit by hand (its README says how).
 */
export const TURNAROUND = {
  /**
   * The head's rows, its chin up to the crown: [up, half its width, its back, its front, how square its section is (a
   * superellipse's exponent, 2 an ellipse), the last from the views three quarters round]; its middle through the figure.
   */
  head: [
${fmt(head)}
  ],
  headCentre: ${round4(headCentre)},
  /** The neck: half its width, its back and its front. */
  neck: { half: ${round4(neck.half)}, back: ${round4(neck.back)}, front: ${round4(neck.front)} },
  /**
   * The torso's rows, its foot just under the crotch up to just inside the neck: [up, half its width, its back, its
   * front, how square its section is]. Its sides are the creases where the arms press on it, the legs' tops at the
   * crotch, the neck's flare above; its section squares up over the hips, flat across the legs' tops.
   */
  torso: [
${fmt(torso)}
  ],
  /**
   * The left shoulder's rows, a dome over the arm's top: a skirt down the arm, then from the armpit (the arm's top row:
   * the joint) up to where the outline meets the torso, closing inside it: [up, inner, outer, back, front].
   */
  shoulder: [
${fmt(shoulder)}
  ],
  /** Where the torso's sides are at the creases, below the armpit: the arm's inner edge presses on them. */
  crease: ${round4(crease)},
  /**
   * The left arm's rows, its blunt end up to the armpit, where it turns, and on a little way inside the shoulder,
   * closing: [up, its inner edge, its outer edge, its back, its front].
   */
  arm: [
${fmt(arm)}
  ],
  /**
   * The left leg's rows, the rounded sole up to the crotch, where it turns, and on a little way up inside the torso:
   * [up, its inner edge, its outer edge, its back, its front, how square its section is (square at its top, as the
   * hips are)].
   */
  leg: [
${fmt(leg)}
  ],
  /** How round the edge of a sole is, as a fraction of the height (the picture's foot corners). */
  footRound: ${round4(footRound)},
  /** How square each part's section is, a superellipse's exponent (2 an ellipse, more a rounded rectangle); the head's is by row. */
  square: { torso: ${square.torso}, shoulder: ${square.shoulder}, arm: ${square.arm}, leg: ${square.leg} },
  /** The heights that place things: the crotch, the armpit, the shoulders' top (the neck's flare), the head's foot (the notch at the neck). */
  crotch: ${round4(up(crotch))},
  armpit: ${round4(up(armpit))},
  shoulderTop: ${round4(up(flareRow.y))},
  headFoot: ${round4(up(headBottom))},
} as const;
`;
writeFileSync(outPath, ts);
console.log(JSON.stringify({ ground, crown, H: +H.toFixed(2), sideAxis, armpit, headBottom, neckRow: neckRow.y, flare: flareRow.y, domeTop, crease: round4(crease), headN: [Math.min(...nHead).toFixed(2), Math.max(...nHead).toFixed(2)], rows: { head: head.length, torso: torso.length, shoulder: shoulder.length, arm: arm.length, leg: leg.length } }));
