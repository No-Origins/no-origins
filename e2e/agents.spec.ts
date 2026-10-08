import { test, expect, type Page } from "@playwright/test";

/**
 * The agents (Motion.md M17, M23, M24): the agents' actions, previewed on one. Bounce, the first, plays on the agent
 * the head's select previews — Bali where the studio has the database, the code's "Default" where it has none (CI):
 * its two eyes sit on its head; its timeline is its phases, as long as its controls make them; it rises straight up out
 * of its nest by its Height and comes back to it. **Where its draft is in the database — his, on his machine — nothing
 * here writes it**: there is one draft an action, and he may be tuning it as this runs. Where the values are the
 * browser's (no keys, CI), a higher leap goes higher, a longer air time makes it longer, a reload keeps them and Reset
 * puts the version's back. Nothing is published here: a version is frozen. Driven, not looked at; its screenshot beside
 * the sweep's.
 */
const STUDIO = "http://localhost:3004";

async function pick(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

/** The timeline's playhead at `ms`, from the keyboard: Home, then ten ms a Page Up. */
async function seek(page: Page, ms: number) {
  const thumb = page.getByRole("slider", { name: "Timeline", exact: true });
  await thumb.focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < Math.floor(ms / 10); i++) await page.keyboard.press("PageUp");
}

/** The head's box and centre, and each eye's centre and radius, on the page. */
const where = (page: Page) =>
  page.locator("[data-sphere-preview]").evaluate((svg) => {
    const b = svg.querySelector("[data-sphere-body] > path")!.getBoundingClientRect();
    return {
      head: { left: b.left, right: b.right, top: b.top, bottom: b.bottom, x: b.x + b.width / 2, y: b.y + b.height / 2 },
      eyes: [...svg.querySelectorAll("[data-sphere-eye] [data-agent-eyeball]")].map((c) => {
        const e = c.getBoundingClientRect();
        return { x: e.x + e.width / 2, y: e.y + e.height / 2, r: e.width / 2 };
      }),
    };
  });

/** The play's phases, as the timeline names them, and how long the play is. */
const play = async (page: Page) => ({
  phases: await page.locator("[data-phase]").evaluateAll((els) => els.map((e) => e.getAttribute("data-phase"))),
  total: Number(await page.getByRole("slider", { name: "Timeline", exact: true }).getAttribute("aria-valuemax")),
});

/** Set a control of a card, opening the card where its column has folded it. */
async function set(page: Page, card: string, label: string, value: string) {
  const fold = page.getByRole("button", { name: `Open ${card}`, exact: true });
  if (await fold.isVisible()) await fold.click();
  const field = page.locator(`input[aria-label="${label} value"]`).first();
  await field.fill(value);
  await field.press("Enter");
}

/** Let the saving settle, where there is saving: on the action's card, opened where its column has folded it. */
async function saved(page: Page) {
  const fold = page.getByRole("button", { name: "Open Bounce", exact: true });
  if (await fold.isVisible()) await fold.click();
  const status = page.locator("[data-save-status]");
  if (!(await status.count())) return;
  await expect.poll(() => status.first().getAttribute("data-save-status"), { timeout: 10_000 }).toMatch(/^(saved|offline|signed-out|trying)$/);
}

async function open(page: Page) {
  await page.goto(STUDIO, { waitUntil: "networkidle" });
  await page.waitForFunction(() => !document.querySelector('[data-slot="grid"][data-intro]'));
  await pick(page, "Motion family", "Agents");
  await expect(page.getByRole("combobox", { name: "Action", exact: true })).toHaveText("Bounce");
  // The agent previewed: Bali where there are agents to read, the code's look where there are none.
  const agent = page.getByRole("combobox", { name: "Agent", exact: true });
  await expect(agent).not.toHaveAttribute("data-agent-preview", "loading");
  await expect(agent).toHaveText((await agent.getAttribute("data-agent-preview")) === "ready" ? "Bali" : "Default");
  await saved(page);
}

test("motion agents: Bounce, on the agent previewed", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one pass");
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await open(page);
  const cell = await page.locator('[data-slot="grid"]').first().evaluate((g) => parseFloat(getComputedStyle(g).getPropertyValue("--grid-cell")));
  // His draft, in the database: read, never written. Only the browser's values — no keys, or signed out — are edited.
  const his = !/^(offline|signed-out|trying)$/.test((await page.locator("[data-save-status]").first().getAttribute("data-save-status")) ?? "");

  // Its timeline is its phases, as long as its controls make them (his: "length should follow from the controls").
  await page.getByRole("button", { name: "Play from the start", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const before = await play(page);
  for (const phase of ["rise", "fall", "settle"]) expect(before.phases).toContain(phase);
  const lasts = (label: string) => page.locator(`[data-phase="${label}"]`).evaluateAll((els) => els.reduce((sum, e) => sum + Number(/(\d+)\s*ms/.exec(e.textContent ?? "")?.[1] ?? 0), 0));
  const peak = (await lasts("crouch")) + (await lasts("rise"));

  // Sitting at the start: two eyes, the same size, both on the head.
  await seek(page, 0);
  const rest = await where(page);
  expect(rest.eyes).toHaveLength(2);
  expect(Math.abs(rest.eyes[0]!.r - rest.eyes[1]!.r)).toBeLessThan(0.2);
  for (const e of rest.eyes) {
    expect(e.x).toBeGreaterThan(rest.head.left);
    expect(e.x).toBeLessThan(rest.head.right);
    expect(e.y).toBeGreaterThan(rest.head.top);
    expect(e.y).toBeLessThan(rest.head.bottom);
  }
  // At the top of its leap, straight up out of its nest by about its Height; and back in it at the end.
  const leap = page.getByRole("button", { name: "Open Leap", exact: true });
  if (await leap.isVisible()) await leap.click();
  const height = Number(await page.locator('input[aria-label="Height value"]').first().inputValue());
  await seek(page, peak);
  const top = await where(page);
  expect(rest.head.y - top.head.y).toBeGreaterThan(cell * Math.max(0.25, height) * 0.8);
  expect(Math.abs(top.head.x - rest.head.x)).toBeLessThan(2);
  await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/motion__agents.png` });
  await seek(page, before.total - 10);
  const end = await where(page);
  expect(Math.abs(end.head.y - rest.head.y)).toBeLessThan(2);
  if (his) {
    expect(errors).toEqual([]);
    return;
  }

  // In the browser: a higher leap goes higher in the same air time; a longer air time makes the whole of it longer.
  await set(page, "Leap", "Height", "2");
  await seek(page, peak);
  expect(rest.head.y - (await where(page)).head.y).toBeGreaterThan(cell * 1.6);
  await set(page, "Leap", "Air time", "800");
  await expect.poll(async () => (await play(page)).total).toBeGreaterThan(before.total + 200);

  // A reload keeps them; Reset puts the version's values back.
  await page.reload({ waitUntil: "networkidle" });
  await open(page);
  if (await leap.isVisible()) await leap.click();
  await expect(page.locator('input[aria-label="Height value"]').first()).toHaveValue("2");
  await expect(page.locator('input[aria-label="Air time value"]').first()).toHaveValue("800");
  await page.getByRole("button", { name: "Reset motion", exact: true }).click();
  await expect(page.locator('input[aria-label="Height value"]').first()).toHaveValue("1");
  await expect(page.locator('input[aria-label="Air time value"]').first()).toHaveValue("560");
  expect(errors).toEqual([]);
});

test("motion agents: Jump and Dive go from one nest to another", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one pass");
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await open(page);
  const pitch = await page.locator('[data-slot="grid"]').first().evaluate((g) => parseFloat(getComputedStyle(g).getPropertyValue("--grid-cell")) + 12);
  const hidden = () => page.locator("[data-sphere-behind]").evaluate((g) => getComputedStyle(g).display === "none");
  for (const name of ["Jump", "Dive"]) {
    await pick(page, "Action", name);
    await saved(page);
    // Read, never set: how far its Where says it goes.
    const fold = page.getByRole("button", { name: "Open Where", exact: true });
    if (await fold.isVisible()) await fold.click();
    const across = Number(await page.locator('input[aria-label="Columns value"]').first().inputValue());
    const down = Number(await page.locator('input[aria-label="Rows value"]').first().inputValue());
    await page.getByRole("button", { name: "Play from the start", exact: true }).click();
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    const { phases, total } = await play(page);
    await seek(page, 0);
    const start = await where(page);
    if (name === "Dive") {
      // Out of its nest behind the page and into the next; between the two, where he gives it any time, nothing drawn.
      for (const phase of ["dive", "come in"]) expect(phases).toContain(phase);
      const lasts = (label: string) => page.locator(`[data-phase="${label}"]`).evaluateAll((els) => els.reduce((sum, e) => sum + Number(/(\d+)\s*ms/.exec(e.textContent ?? "")?.[1] ?? 0), 0));
      const under = await lasts("under");
      if (under >= 20) {
        await seek(page, (await lasts("crouch")) + (await lasts("spring")) + (await lasts("dive")) + under / 2);
        expect(await hidden()).toBe(true);
      }
    }
    await seek(page, total - 10);
    expect(await hidden()).toBe(false);
    const end = await where(page);
    // It sits in the nest its Where reaches (the stage is wide enough for the defaults).
    expect(Math.abs(end.head.x - start.head.x - across * pitch)).toBeLessThan(pitch / 2);
    expect(Math.abs(end.head.y - start.head.y - down * pitch)).toBeLessThan(pitch / 2);
    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/motion__agents-${name.toLowerCase()}.png` });
  }
  await pick(page, "Action", "Bounce");
  expect(errors).toEqual([]);
});

test("motion agents: the select previews each agent", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one pass");
  // Six agents drawn in turn, some of them solids: longer than the default beside the sweep's workers.
  test.setTimeout(60_000);
  await open(page);
  const agent = page.getByRole("combobox", { name: "Agent", exact: true });
  test.skip((await agent.getAttribute("data-agent-preview")) !== "ready", "no agents to read without the database");
  // Each of the six, as Orbit has it: a different agent on the stage every time.
  const paints = new Set<string>();
  for (const one of ["Bali", "Kino", "Zaza", "Oru", "Mira", "Lola"]) {
    await pick(page, "Agent", one);
    await expect(agent).toHaveText(one);
    paints.add(await page.locator("[data-sphere-preview] [data-sphere-body] > path").first().evaluate((p) => getComputedStyle(p).fill));
  }
  expect(paints.size).toBeGreaterThan(3);
  await pick(page, "Agent", "Bali");
});
