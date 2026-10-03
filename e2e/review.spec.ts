import { existsSync } from "node:fs";

import { test, expect } from "@playwright/test";

/**
 * The review sweep. Every app a visitor reaches without signing in, every route, on desktop and mobile in both themes
 * (playwright.config.ts): a route must answer under 400 and throw nothing uncaught. Console errors are echoed but do
 * not fail. Full-page screenshots land in e2e/screenshots/<project>/ for a person to open and look at — CI uploads
 * them with every run.
 *
 * The admin is not here: every route is behind auth and needs a running Supabase (apps/admin/CLAUDE.md).
 *
 * `probe12` went with the Bento it policed, and `growForTool` with the Tool that owned its own scroll. Both were
 * rules about components that no longer exist; neither is re-added until there is something new to hold them to.
 */
export const ROUTES: string[] = ["/"];

/** The showcase is a second app on its own port — its own project, its own domain. */
export const DESIGN = "http://localhost:3001";
export const DESIGN_ROUTES = ["/", "/atoms", "/molecules"];

/** Engineering (Layer A), a third, on :3003. `/jido` is only a redirect to `/learn/jido`. */
export const ENGINEERING = "http://localhost:3003";
export const ENGINEERING_ROUTES = ["/", "/learn/jido"];

/** The motion studio (Motion.md), a fourth, on :3004 — one route, a page per family of motion. */
export const MOTION = "http://localhost:3004";
export const MOTION_ROUTES = ["/", "/concepts/split", "/concepts/dock", "/concepts/inspector"];

/** Orbit (Orbit.md), the agents' app, a fifth, on :3005 — the agent's cell on the grid, and Hiddenstack's figure. */
export const ORBIT = "http://localhost:3005";
export const ORBIT_ROUTES = ["/", "/hiddenstack"];

/**
 * Home (Home.md), the model of the house, a sixth, on :3006 — one route, the model and its views. Not in the repository
 * (H4: the house is private, the repo public), so it is swept only where the app is — his machine, not CI.
 */
export const HOME = "http://localhost:3006";
export const HOME_ROUTES = ["/"];
const HOME_PRESENT = existsSync("apps/home/package.json");

/** Status (Status.md), where every app stands, a seventh, on :3007 — one route, public. */
export const STATUS = "http://localhost:3007";
export const STATUS_ROUTES = ["/"];

const APPS = [
  { name: "", base: "", routes: ROUTES },
  { name: "design", base: DESIGN, routes: DESIGN_ROUTES },
  { name: "engineering", base: ENGINEERING, routes: ENGINEERING_ROUTES },
  { name: "motion", base: MOTION, routes: MOTION_ROUTES },
  { name: "orbit", base: ORBIT, routes: ORBIT_ROUTES },
  ...(HOME_PRESENT ? [{ name: "home", base: HOME, routes: HOME_ROUTES }] : []),
  { name: "status", base: STATUS, routes: STATUS_ROUTES },
];

const slug = (route: string) => (route === "/" ? "home" : route.slice(1).replace(/\//g, "__"));

for (const app of APPS) {
  for (const route of app.routes) {
    const title = app.name ? `${app.name} ${route}` : route;
    test(`review ${title}`, async ({ page }, testInfo) => {
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      page.on("pageerror", (err) => pageErrors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      const response = await page.goto(`${app.base}${route}`, { waitUntil: "networkidle" });
      expect(response, `no response for ${title}`).not.toBeNull();
      expect(response!.status(), `${title} returned ${response!.status()}`).toBeLessThan(400);
      // No page loads behind a loader (Grid.md D49), but a grid with an intro opens with its agents (D50, version 2): they
      // gather, leap to the boxes they open and open them, and it hands over in about 4.5 s. The screenshot is of the page it hands over to; a page stuck in it fails here. Then a
      // moment for the grid to lay its page out; the screenshot fast-forwards what is still moving, the portfolio's wake
      // (Portfolio.md P16) among it.
      await page.waitForFunction(() => !document.querySelector('[data-slot="grid"][data-intro]'), null, { timeout: 10_000 });
      // Home opens on its tour's long shot (Home.md H9); a model standing at a stop with a picture fades it in over
      // 0.6 s, and the screenshot is of the picture hung. Nothing to wait for on a page with no model.
      await page.waitForFunction(() => {
        const canvas = document.querySelector<HTMLElement>('[data-slot="model-view"] canvas');
        return !canvas || (canvas.dataset.ready === "true" && (!canvas.dataset.picture || canvas.dataset.picture === "100"));
      }, null, { timeout: 5_000 }).catch(() => undefined);
      await page.waitForTimeout(400);

      const file = `e2e/screenshots/${testInfo.project.name}/${app.name ? `${app.name}__` : ""}${slug(route)}.png`;
      await page.screenshot({ path: file, fullPage: true, animations: "disabled" });
      await testInfo.attach(`${testInfo.project.name} ${title}`, { path: file, contentType: "image/png" });

      if (consoleErrors.length) {
        testInfo.annotations.push({ type: "console.error", description: consoleErrors.join("\n") });
        console.log(`[${testInfo.project.name}] ${title} console errors:\n  ${consoleErrors.join("\n  ")}`);
      }
      expect(pageErrors, `uncaught errors on ${title}`).toEqual([]);
    });
  }
}
