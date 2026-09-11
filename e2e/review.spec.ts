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
  "/fixtures/canvas",
  "/fixtures/layout",
  "/fixtures/primitives",
  "/fixtures/compose",
  "/fixtures/catalogue",
  "/fixtures/blob",
];

const slug = (route: string) =>
  route === "/" ? "home" : route.slice(1).replace(/\//g, "__");

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
