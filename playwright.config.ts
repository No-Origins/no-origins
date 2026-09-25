import { defineConfig, devices } from "@playwright/test";

// Visual review loop for the workspace apps.
// `pnpm review` boots THREE dev servers (or reuses ones already running) — the portfolio on :3000, the design
// showcase on :3001 and engineering on :3003 — sweeps every route in e2e/review.spec.ts on desktop + mobile viewports
// in both themes, and drops full-page screenshots into e2e/screenshots/<project>/<route>.png. CI runs the same sweep
// (.github/workflows/ci.yml) and uploads the screenshots.
//
// An app outside the loop is an app whose screenshots nobody looks at, and CLAUDE.md's rule is that you look at the
// result before reporting done.
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
  // Three apps are booted (the admin is not: every route of it is behind auth and needs a running Supabase).
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
    {
      command: "pnpm --filter engineering dev",
      url: "http://localhost:3003",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
