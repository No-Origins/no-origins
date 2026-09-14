import { defineConfig, devices } from "@playwright/test";

// Visual review loop for the workspace apps.
// `pnpm review` boots BOTH dev servers (or reuses ones already running) — the portfolio on :3000 and the design
// showcase on :3001 — sweeps every route in e2e/review.spec.ts on desktop + mobile viewports in both themes, and
// drops full-page screenshots into e2e/screenshots/<project>/<route>.png.
//
// The showcase joined the sweep the day it was built: a second app outside the loop is a second app whose
// screenshots nobody looks at, and CLAUDE.md's rule is that you look at the result before reporting done.
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",
  fullyParallel: true,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
    // the design system has two themes (Design-System.md §2.5); review both
    {
      name: "desktop-dark",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, colorScheme: "dark" },
    },
    {
      name: "mobile-dark",
      use: { ...devices["Pixel 7"], colorScheme: "dark" },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter portfolio dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter design dev",
      url: "http://localhost:3001",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
