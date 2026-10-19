// Adds symmetric.front.rows (half-widths from the middle line, from the front and back views together) to a result file.
// node symmetrize.mjs <in.json> <out.json>
import { readFileSync, writeFileSync } from "node:fs";
const [, , inPath, outPath] = process.argv;
const c = JSON.parse(readFileSync(inPath, "utf8"));
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const mean = (a) => { const b = a.filter((v) => v !== null); return b.length ? b.reduce((s, v) => s + v, 0) / b.length : null; };
// The middle line of each view: where its outer edges are symmetric, over the torso's and the legs' rows.
const middleOf = (view) => {
  const rows = view.rows.filter((r) => num(r.left) !== null && num(r.right) !== null && r.y > 380 && r.y < 760);
  return mean(rows.map((r) => (r.left + r.right) / 2));
};
const views = ["front", "back"].map((k) => ({ k, v: c.views[k], m: middleOf(c.views[k]) }));
const ys = [...new Set(views.flatMap(({ v }) => v.rows.map((r) => Math.round(r.y))))].sort((a, b) => a - b);
const at = (v, y) => v.rows.find((r) => Math.round(r.y) === y);
const rows = ys.map((y) => {
  const halves = (key) => views.flatMap(({ v, m }) => {
    const r = at(v, y);
    if (!r) return [];
    if (key === "outer") return [num(r.left) === null ? null : m - r.left, num(r.right) === null ? null : r.right - m];
    if (key === "armInner") return [num(r.armInnerLeft) === null ? null : m - r.armInnerLeft, num(r.armInnerRight) === null ? null : r.armInnerRight - m];
    if (key === "torso") return [num(r.torsoLeft) === null ? null : m - r.torsoLeft, num(r.torsoRight) === null ? null : r.torsoRight - m];
    return [num(r.slitLeft) === null ? null : m - r.slitLeft, num(r.slitRight) === null ? null : r.slitRight - m];
  });
  return { y, outer: mean(halves("outer")), armInner: mean(halves("armInner")), torso: mean(halves("torso")), slit: mean(halves("slit")) };
});
c.symmetric = { front: { rows, middles: Object.fromEntries(views.map(({ k, m }) => [k, m])) } };
writeFileSync(outPath, JSON.stringify(c, null, 1));
console.log("middles", JSON.stringify(c.symmetric.front.middles), "rows", rows.length, "row 500", JSON.stringify(rows.find((r) => r.y === 500)), "row 300", JSON.stringify(rows.find((r) => r.y === 300)), "row 700", JSON.stringify(rows.find((r) => r.y === 700)));
