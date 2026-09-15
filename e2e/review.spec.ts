import { test, expect } from "@playwright/test";

// Every route the review sweep looks at. Add new pages here as they land.
export const ROUTES = [
  "/",
  "/status",
  "/work",
  "/case-studies",
  "/projects",
  "/interests",
  "/philosophy",
  "/fixtures",
  "/fixtures/bento", "/fixtures/studio", "/fixtures/controls",
  "/fixtures/layout",
  "/fixtures/primitives",
  "/fixtures/compose",
  "/fixtures/catalogue",
  "/fixtures/patterns",
  "/fixtures/blob",
  "/fixtures/tool",
  "/fixtures/inspector",
];

/** The showcase is a second app on its own port (Design-System.md §11.4) — its own project, its own domain. */
export const DESIGN = "http://localhost:3001";
export const DESIGN_ROUTES = [
  "/",
  "/tokens",
  "/tokens/colour", "/tokens/contrast", "/tokens/type", "/tokens/space",
  "/tokens/radius", "/tokens/elevation", "/tokens/motion",
  "/components",
  "/components/atoms", "/components/molecules", "/components/organisms",
];

const slug = (route: string) =>
  route === "/" ? "home" : route.slice(1).replace(/\//g, "__");

/**
 * A Tool owns its own scroll (`.noo-tool__column`, Design-System.md §8 / Atomic.md D6), so `fullPage: true` sees only
 * the fold. Where a route renders one, the viewport is grown to the column's height before the capture, so the
 * screenshot shows the whole screen the way it does for a page. Capped, so a runaway layout cannot ask for a
 * hundred-thousand-pixel PNG.
 */
async function growForTool(page: import("@playwright/test").Page) {
  const tall = await page.evaluate(() => {
    const col = document.querySelector<HTMLElement>(".noo-tool__column");
    return col ? Math.min(col.scrollHeight, 8000) : 0;
  });
  if (!tall) return;
  const vp = page.viewportSize();
  if (vp && tall > vp.height) {
    await page.setViewportSize({ width: vp.width, height: tall });
    await page.waitForTimeout(150);
  }
}

for (const route of ROUTES) {
  test(`review ${route}`, async ({ page }, testInfo) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response, `no response for ${route}`).not.toBeNull();
    expect(response!.status(), `${route} returned ${response!.status()}`).toBeLessThan(400);

    // Let fonts, the blob, and entrance motion settle before the capture.
    await page.waitForTimeout(400);
    await growForTool(page);

    const file = `e2e/screenshots/${testInfo.project.name}/${slug(route)}.png`;
    await page.screenshot({ path: file, fullPage: true, animations: "disabled" });
    await testInfo.attach(`${testInfo.project.name} ${route}`, {
      path: file,
      contentType: "image/png",
    });

    // probe12 (Design-System.md §9) — exactly one loud cell per widget.
    //
    // This rule used to be a prop: `SectionWidget` placed the 2 × 2 fill cell itself, so a second one was
    // unreachable. That component was retired 2026-09-11 for total freedom over composition, and the rule had to
    // land somewhere or quietly stop being true — the ring only reads as one family because its six widgets are
    // built alike. A check can be overridden deliberately; a prop that no longer exists cannot.
    //
    // Widgets only. A page (§8.4) is read alone and at reading size, never compared against five others across an
    // overview, so it carries no such constraint.
    //
    // KNOWN EDGE, 2026-09-11: this treats every non-page bento as a widget, and it caught a registry example that
    // used `Bento` as a plain grid with no loud cell at all. That was a lazy example and was fixed — but the rule
    // it tripped is genuinely about the SIX ON THE RING, which must read as a family, not about every grid anyone
    // ever builds. The day `Bento` is legitimately used as a bare layout, this needs a marker to tell the two
    // apart rather than a looser count. Left strict on purpose: a check that has to guess is worse than one that
    // occasionally makes you say what you meant.
    const bentos = await page.$$eval(".noo-bento:not(.noo-bento--page)", (nodes) =>
      nodes
        .filter((n) => n.getBoundingClientRect().width > 0)
        .map((n) => ({
          label: n.getAttribute("aria-label") ?? "(unlabelled)",
          fill: n.querySelectorAll(":scope > .noo-bento__cell--fill").length,
        })),
    );
    for (const b of bentos) {
      expect(b.fill, `probe12 on ${route}: widget "${b.label}" has ${b.fill} loud cells, expected exactly 1`).toBe(1);
    }

    if (consoleErrors.length) {
      testInfo.annotations.push({
        type: "console.error",
        description: consoleErrors.join("\n"),
      });
      console.log(
        `[${testInfo.project.name}] ${route} console errors:\n  ${consoleErrors.join("\n  ")}`,
      );
    }
    expect(pageErrors, `uncaught errors on ${route}`).toEqual([]);
  });
}

// ── the design showcase, on :3001 ────────────────────────────────────────────────────────────────────────────
for (const route of DESIGN_ROUTES) {
  test(`review design ${route}`, async ({ page }, testInfo) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const response = await page.goto(`${DESIGN}${route}`, { waitUntil: "networkidle" });
    expect(response, `no response for ${route}`).not.toBeNull();
    expect(response!.status(), `${route} returned ${response!.status()}`).toBeLessThan(400);
    await page.waitForTimeout(400);
    await growForTool(page);

    const file = `e2e/screenshots/${testInfo.project.name}/design__${slug(route)}.png`;
    await page.screenshot({ path: file, fullPage: true, animations: "disabled" });
    await testInfo.attach(`${testInfo.project.name} design ${route}`, { path: file, contentType: "image/png" });

    expect(pageErrors, `uncaught errors on ${route}`).toEqual([]);
  });
}
