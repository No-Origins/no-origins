import { test, expect, type Page } from "@playwright/test";

async function pick(page: Page, label: string, value: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
}

/** The approved layout, wired to the existing model: edit -> preview -> transport -> preset/reset -> export. */
test("motion studio workspace", async ({ page, context }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("http://localhost:3004");
  await page.waitForFunction(() => !document.querySelector('[data-slot="grid"][data-intro]'));
  const mobile = (page.viewportSize()?.width ?? 1440) < 700;
  if (mobile) await pick(page, "Workspace view", "Timing");
  else {
    // The compact desktop exposes Movement's complete bench without visiting hidden groups.
    await expect(page.getByRole("combobox", { name: "Wrap", exact: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Ring ease", exact: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Dot ease", exact: true })).toBeVisible();
    await expect(page.getByRole("spinbutton", { name: "Dot lag value", exact: true })).toBeVisible();
  }
  const number = page.getByRole("spinbutton", { name: "Duration value", exact: true });
  await number.fill("655");
  await number.press("Enter");
  await expect(number).toHaveValue("660");
  await expect(page.getByRole("slider", { name: "Duration", exact: true })).toHaveAttribute("aria-valuenow", "660");
  await page.getByRole("button", { name: "Copy settings", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("--motion-move-duration: 660ms;");
  await page.getByRole("button", { name: "Play from the start", exact: true }).click();
  const timeline = page.getByRole("slider", { name: "Timeline", exact: true });
  await expect.poll(async () => Number(await timeline.getAttribute("aria-valuenow"))).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Reset motion", exact: true }).click();
  await expect(number).toHaveValue("400");
  if (mobile) await pick(page, "Workspace view", "Preview");

  for (const family of ["Movement", "Loading", "Enter · exit", "Hyper focus", "Focus mode", "Grip", "Steps", "Agents"]) {
    await pick(page, "Motion family", family);
    await expect(page.locator('[data-studio-part="preview"]')).toBeVisible();
    await page.screenshot({ path: `e2e/screenshots/${info.project.name}/studio-${family.replaceAll(" ", "-")}.png` });
    if (mobile) await pick(page, "Workspace view", family === "Agents" ? "Bounce" : family === "Steps" ? "Marks" : "Scene");
    const overflow = await page.locator('[data-slot="card"]:visible').evaluateAll((cards) => cards.filter((card) => card.scrollHeight > card.clientHeight + 2).length);
    expect(overflow, `${family} cards must fit their slots`).toBe(0);
    if (mobile) await pick(page, "Workspace view", "Preview");
  }
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
});

test("studio keeps its stage and controls inside shorter fields", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  // Eight families at three sizes.
  test.setTimeout(90_000);
  for (const [width, height] of [[1280, 720], [1024, 768], [768, 1024]]) {
    await page.setViewportSize({ width: width!, height: height! });
    await page.goto("http://localhost:3004");
    await page.waitForFunction(() => !document.querySelector('[data-slot="grid"][data-intro]'));
    for (const family of ["Movement", "Loading", "Enter · exit", "Hyper focus", "Focus mode", "Grip", "Steps", "Agents"]) {
      await pick(page, "Motion family", family);
      const outside = await page.locator('[data-studio-part]:visible').evaluateAll((parts) => parts.filter((part) => {
        const rect = part.getBoundingClientRect();
        return rect.left < 0 || rect.top < 0 || rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1;
      }).map((part) => part.getAttribute("data-studio-part")));
      expect(outside, `${family} at ${width}×${height}`).toEqual([]);
      const chooser = page.getByRole("combobox", { name: "Workspace view", exact: true });
      if (await chooser.isVisible()) await pick(page, "Workspace view", family === "Agents" ? "Bounce" : family === "Steps" ? "Marks" : "Scene");
      const clipped = await page.locator('[data-slot="card"]:visible').evaluateAll((cards) => cards.filter((card) => card.scrollHeight > card.clientHeight + 2).map((card) => card.textContent?.slice(0, 80)));
      expect(clipped, `${family} cards at ${width}×${height}`).toEqual([]);
      await page.screenshot({ path: `e2e/screenshots/desktop/studio-${width}-${family.replaceAll(" ", "-")}.png` });
    }
  }
});

/**
 * His three rules for the layout (2026-10-01): the stage at the field's centre, every jig six cells wide at the most, the
 * timeline ten; and a jig moved to the other side of the stage stays there.
 */
test("studio keeps the stage centred and its jigs where they are put", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  test.setTimeout(60_000);
  for (const [width, height] of [[1440, 900], [1920, 1080], [1280, 800]]) {
    await page.setViewportSize({ width: width!, height: height! });
    await page.goto("http://localhost:3004");
    await page.waitForFunction(() => !document.querySelector('[data-slot="grid"][data-intro]'));
    for (const family of ["Movement", "Agents"]) {
      await pick(page, "Motion family", family);
      const m = await page.evaluate(() => {
        const box = (name: string) => document.querySelector(`[data-studio-part="${name}"]`)!.getBoundingClientRect();
        const cell = parseFloat(getComputedStyle(document.querySelector('[data-slot="grid"]')!).getPropertyValue("--grid-cell"));
        const field = document.querySelector('[data-slot="grid"]')!.getBoundingClientRect();
        const left = box("jigs-left");
        const right = box("jigs-right");
        return { cell, centre: (left.left + right.right) / 2, fieldCentre: field.left + field.width / 2, preview: box("preview"), transport: box("transport"), left, right };
      });
      const pitch = m.cell + 12;
      const at = `${family} at ${width}×${height}`;
      expect(Math.abs(m.preview.left + m.preview.width / 2 - m.centre), `${at}: the stage is centred`).toBeLessThan(1);
      expect(Math.abs(m.transport.left + m.transport.width / 2 - m.centre), `${at}: the timeline is centred`).toBeLessThan(1);
      expect(Math.abs(m.centre - m.fieldCentre), `${at}: on the field's centre`).toBeLessThan(pitch);
      expect(Math.round((m.transport.width + 12) / pitch), `${at}: the timeline`).toBeLessThanOrEqual(10);
      for (const side of [m.left, m.right]) expect(Math.round((side.width + 12) / pitch), `${at}: a jig column`).toBeLessThanOrEqual(6);
    }
  }
  // Timing moved by its grip's → to the right of the stage, and still there after a reload.
  await pick(page, "Motion family", "Movement");
  await page.evaluate(() => localStorage.removeItem("no-origins:motion"));
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('[data-slot="grid"][data-intro]'));
  const timing = page.locator('[data-jig-id="tokens:Timing"]');
  await expect(page.locator('[data-jig-column="left"]').locator(timing)).toHaveCount(1);
  await page.getByRole("button", { name: "Move Timing", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-jig-column="right"]').locator(timing)).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Move Timing", exact: true })).toBeFocused();
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('[data-slot="grid"][data-intro]'));
  await expect(page.locator('[data-jig-column="right"]').locator(timing)).toHaveCount(1);
  await page.evaluate(() => localStorage.removeItem("no-origins:motion"));
});
