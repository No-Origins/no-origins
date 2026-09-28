import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * The agent bench in the motion studio (Motion.md M12), driven rather than looked at: the specimen plays and scrubs, a
 * design is saved as a named preset and renamed, every design group's slider moves, and the preset brings the design
 * back after a reload. It runs with the sweep on every project and writes its screenshots beside the sweep's.
 */
const STUDIO = "http://localhost:3004";
const STORE = "no-origins:motion";

/** The page the pager marks as the one on the field, 1-based. */
async function currentPage(page: Page) {
  const label = await page.locator('[data-slot="grid"] [aria-current="page"]').getAttribute("aria-label");
  return Number(label?.match(/^Page (\d+)/)?.[1] ?? Number.NaN);
}

/**
 * On to the next page, and wait until it is on the field: the pager marks it and nothing turns or loads. A turn asked
 * for while the page before is still arriving waits for the field and plays after it (grid-pages.tsx), so a fixed pause
 * let a turn land late, a page past where the test stood (mobile-dark, 2026-09-28).
 */
async function nextPage(page: Page) {
  const from = await currentPage(page);
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect.poll(() => currentPage(page)).toBe(from + 1);
  await page.waitForFunction(() => !document.querySelector('[data-turn], [data-slot="grid"][data-loading]'));
}

/** Turn on until `target` is on the field: a phone's narrow field spreads the bench over more pages than a desktop's. */
async function turnTo(page: Page, target: Locator) {
  for (let i = 0; i < 16 && !(await target.isVisible()); i++) await nextPage(page);
  await expect(target).toBeVisible();
}

test("motion agent authoring", async ({ page }, testInfo) => {
  test.setTimeout(110_000);
  page.setDefaultTimeout(10_000);
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));
  const shot = (name: string) => page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/motion__agent${name}.png` });
  const stored = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORE);
  const waitForIntro = () => page.waitForFunction(() => !document.querySelector('[data-slot="grid"][data-intro]'));

  // A first visit starts from a design with its end pose half a cell over, so a preset holds something of its own.
  await page.addInitScript((key) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ values: { agent: { "--motion-agent-end-x": 0.5 } } }));
  }, STORE);
  await page.goto(STUDIO, { waitUntil: "networkidle" });
  await waitForIntro();

  // The specimen: a body two cells and a gutter wide and a cell high, with two eyes. Play moves it; the timeline scrubs.
  const preview = page.locator("[data-agent-preview]");
  await turnTo(page, preview);
  const size = await preview.evaluate((svg) => {
    const cell = parseFloat(getComputedStyle(svg.closest('[data-slot="grid"]')!).getPropertyValue("--grid-cell"));
    const body = svg.querySelector("rect")!;
    return { cell, w: Number(body.getAttribute("width")), h: Number(body.getAttribute("height")), eyes: svg.querySelectorAll("circle").length };
  });
  expect(size.h).toBeCloseTo(size.cell);
  expect(size.w).toBeCloseTo(2 * size.cell + 12);
  expect(size.eyes).toBe(2);
  const body = preview.locator(":scope > g");
  const first = await body.getAttribute("transform");
  await page.getByRole("button", { name: "Play from the start", exact: true }).click();
  await expect(body).not.toHaveAttribute("transform", first!);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const timeline = page.getByRole("slider", { name: "Timeline", exact: true });
  await timeline.focus();
  await page.keyboard.press("Home");
  const start = await body.getAttribute("transform");
  await page.keyboard.press("End");
  await expect(body).toHaveAttribute("transform", start!);
  await shot("");

  // The design saved under a name, then renamed in place.
  const presetName = page.getByRole("textbox", { name: "Preset name" });
  await turnTo(page, presetName);
  await presetName.fill("My welcome");
  await page.getByRole("button", { name: "Save new", exact: true }).click();
  await expect(page.getByRole("button", { name: "Update", exact: true })).toBeEnabled();
  await presetName.fill("My greeting");
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await shot("-presets");

  // Every design group's last slider a step on, so the design is no longer the preset's.
  const group = page.getByRole("combobox", { name: "Design group" });
  await turnTo(page, group);
  const design = page.locator('[data-slot="card"]').filter({ has: group });
  for (const name of ["Start pose", "End pose", "Path", "Left eye", "Right eye", "Blink", "Timing"]) {
    await group.click();
    await page.getByRole("option", { name, exact: true }).click();
    await design.getByRole("slider").last().focus();
    await page.keyboard.press("ArrowRight");
    await shot(`-${name.replaceAll(" ", "-")}`);
  }
  await expect.poll(async () => (await stored()).agentPresets[0].name).toBe("My greeting");
  const preset = (await stored()).agentPresets[0].values;
  expect((await stored()).values.agent).not.toEqual(preset);

  // After a reload the preset puts the design back as it was saved, and Delete takes it away.
  await page.reload({ waitUntil: "networkidle" });
  await waitForIntro();
  await turnTo(page, presetName);
  await page.getByRole("combobox", { name: "Your presets", exact: true }).click();
  await page.getByRole("option", { name: "My greeting", exact: true }).click();
  await expect.poll(async () => (await stored()).values.agent).toEqual(preset);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect.poll(async () => (await stored()).agentPresets.length).toBe(0);
  expect(pageErrors, "uncaught errors in the agent bench").toEqual([]);
});
