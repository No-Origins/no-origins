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
