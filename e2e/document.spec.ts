import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { expect, test, type Page } from "@playwright/test";

/**
 * Scene-Schema.md §4's claim, checked: a document renders "exactly what scene.tsx hand-writes".
 *
 * Two comparisons, both pixel for pixel through Playwright's own comparator, with the hand-written render written
 * as the baseline on every run so there is nothing to update by hand:
 *
 * 1. **The map at home** — `/` against `/fixtures/document`, the blob masked (it looks about and breathes on its
 *    own clock).
 * 2. **Each widget at 1:1** — the six bentos `/fixtures/bento` composes from `content/sections.tsx`, against the
 *    same six the document composes from nodes, as element screenshots. This is the fair widget comparison: a
 *    section route such as `/work` opens the hand-written FULL VIEW, and a document has no full views (they are
 *    pages, Design-System.md §8.4), so a viewport comparison there would compare two different things.
 *
 * The thresholds are what the proof achieved and not wishes — Scene-Schema.md §10 lists what each difference is.
 * `DOC_DIFF=0 pnpm review -g "like scene|like sections"` prints the real ratios. Re-measured 2026-09-14 after
 * Admin.md §6.5c F1–F5 were built: status and projects now match to the pixel, and the rest is residue with a
 * known cause. **The hand-written widgets keep their hue dots and the document's do not** — F1 removed the dot,
 * and `content/sections.tsx` is not re-poured until the editor's work lands — so Work keeps a dot's worth of
 * pixels. Interests and Philosophy carry the rest: the word wraps where the hand-written one has a `<br>`, and
 * the *sample copy* tag sits inline inside a one-paragraph `Text` where the hand-written cell puts it on its own
 * line above. Both are findings, not adapter bugs.
 */
const WIDGETS: Array<{ label: string; ratio: number }> = [
  { label: "Current status", ratio: 0.01 },
  { label: "Work experience", ratio: 0.01 },
  { label: "Case studies", ratio: 0.01 },
  { label: "Projects", ratio: 0.01 },
  { label: "Interests", ratio: 0.05 },
  { label: "Philosophy", ratio: 0.07 },
];
const HOME_RATIO = 0.01;

const max = (ratio: number) => (process.env.DOC_DIFF !== undefined ? Number(process.env.DOC_DIFF) : ratio);

/**
 * A desktop proof. Below `md` the canvas is in document mode (Design-System.md §8.6): the hand-written scene stacks
 * its nineteen full-view panels as content and the document has none, and a 640-wide widget is squeezed into a
 * 412 viewport by two different containers — neither difference says anything about the adapter.
 */
test.beforeEach(({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 900, "the scene-vs-document comparison is a desktop proof; below md the canvas is a stacked document");
});

async function settle(page: Page, url: string) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
}

function baseline(testInfo: { snapshotPath: (n: string) => string }, name: string, png: Buffer) {
  const file = testInfo.snapshotPath(name);
  if (!existsSync(dirname(file))) mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, png);
}

test("the document renders the map like scene.tsx", async ({ page }, testInfo) => {
  const shot = () => page.screenshot({ animations: "disabled", mask: [page.locator(".react-flow__node-blob")] });
  await settle(page, "/");
  const written = await shot();
  await settle(page, "/fixtures/document");
  const read = await shot();
  baseline(testInfo, "home-from-scene.png", written);
  expect(read).toMatchSnapshot("home-from-scene.png", { maxDiffPixelRatio: max(HOME_RATIO) });
});

test("the document composes each widget like sections.tsx", async ({ page }, testInfo) => {
  const written = new Map<string, Buffer>();
  await settle(page, "/fixtures/bento");
  for (const { label } of WIDGETS) written.set(label, await page.locator(`.noo-bento[aria-label="${label}"]`).first().screenshot({ animations: "disabled" }));
  await settle(page, "/fixtures/document");
  for (const { label, ratio } of WIDGETS) {
    const read = await page.locator(`[data-widgets] .noo-bento[aria-label="${label}"]`).screenshot({ animations: "disabled" });
    const name = `widget-${label.toLowerCase().replace(/\s+/g, "-")}-from-sections.png`;
    baseline(testInfo, name, written.get(label)!);
    expect.soft(read, label).toMatchSnapshot(name, { maxDiffPixelRatio: max(ratio) });
  }
});
