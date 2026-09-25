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

const APPS = [
  { name: "", base: "", routes: ROUTES },
  { name: "design", base: DESIGN, routes: DESIGN_ROUTES },
  { name: "engineering", base: ENGINEERING, routes: ENGINEERING_ROUTES },
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
      // A grid with an intro (Grid.md D31) draws itself in and holds page 1 back until the page has loaded — at most
      // 3 s, then a pass and the reveal. The screenshot is of what it hands over to; a page stuck in it fails here.
      await page.waitForFunction(() => !document.querySelector('[data-slot="grid"][data-intro]'), null, { timeout: 10_000 });
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
