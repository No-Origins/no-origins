import { test, expect } from "@playwright/test";

/**
 * The review sweep, 2026-09-16.
 *
 * The design system was rebuilt on shadcn/ui and every component of the old one was deleted. The portfolio and the
 * admin still import that old system, so neither serves a page — they are out of the sweep until their pages are
 * rebuilt, and `ROUTES` is empty rather than deleted so that putting them back is one list.
 *
 * `probe12` went with the Bento it policed, and `growForTool` with the Tool that owned its own scroll. Both were
 * rules about components that no longer exist; neither is re-added until there is something new to hold them to.
 */
export const ROUTES: string[] = [];

/** The showcase is a second app on its own port — its own project, its own domain. */
export const DESIGN = "http://localhost:3001";
export const DESIGN_ROUTES = ["/", "/atoms", "/molecules", "/grid"];

const slug = (route: string) => (route === "/" ? "home" : route.slice(1).replace(/\//g, "__"));

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
    await page.waitForTimeout(400);

    const file = `e2e/screenshots/${testInfo.project.name}/${slug(route)}.png`;
    await page.screenshot({ path: file, fullPage: true, animations: "disabled" });
    await testInfo.attach(`${testInfo.project.name} ${route}`, { path: file, contentType: "image/png" });

    if (consoleErrors.length) {
      testInfo.annotations.push({ type: "console.error", description: consoleErrors.join("\n") });
      console.log(`[${testInfo.project.name}] ${route} console errors:\n  ${consoleErrors.join("\n  ")}`);
    }
    expect(pageErrors, `uncaught errors on ${route}`).toEqual([]);
  });
}

// ── the design showcase, on :3001 ────────────────────────────────────────────────────────────────────────────
for (const route of DESIGN_ROUTES) {
  test(`review design ${route}`, async ({ page }, testInfo) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const response = await page.goto(`${DESIGN}${route}`, { waitUntil: "networkidle" });
    expect(response, `no response for ${route}`).not.toBeNull();
    expect(response!.status(), `${route} returned ${response!.status()}`).toBeLessThan(400);
    await page.waitForTimeout(400);

    const file = `e2e/screenshots/${testInfo.project.name}/design__${slug(route)}.png`;
    await page.screenshot({ path: file, fullPage: true, animations: "disabled" });
    await testInfo.attach(`${testInfo.project.name} design ${route}`, { path: file, contentType: "image/png" });

    if (consoleErrors.length) {
      testInfo.annotations.push({ type: "console.error", description: consoleErrors.join("\n") });
      console.log(`[${testInfo.project.name}] design ${route} console errors:\n  ${consoleErrors.join("\n  ")}`);
    }
    expect(pageErrors, `uncaught errors on ${route}`).toEqual([]);
  });
}
