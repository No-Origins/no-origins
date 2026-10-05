import { defineConfig, devices } from "@playwright/test";

// Visual review loop for the workspace apps.
// `pnpm review` boots SEVEN dev servers (or reuses ones already running) — the portfolio on :3000, the design
// showcase on :3001, engineering on :3003, the motion studio on :3004, Orbit on :3005, Home on :3006 and Status on
// :3007 — sweeps
// every route in e2e/review.spec.ts on desktop + mobile viewports in both themes, and drops full-page screenshots into
// e2e/screenshots/<project>/<route>.png. CI runs the same sweep (.github/workflows/ci.yml) and uploads the screenshots.
//
// An app outside the loop is an app whose screenshots nobody looks at, and CLAUDE.md's rule is that you look at the
// result before reporting done.
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",
  // The studios ask for a sign-in when they have the local stack's keys: sign the browser in once (e2e/global-setup.ts).
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    storageState: "e2e/.auth/state.json",
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
  // Seven apps are booted (the admin is not: every route of it is behind auth and needs a running Supabase).
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
    {
      command: "pnpm --filter motion dev",
      url: "http://localhost:3004",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter orbit dev",
      url: "http://localhost:3005",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter home dev",
      url: "http://localhost:3006",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter status dev",
      url: "http://localhost:3007",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
