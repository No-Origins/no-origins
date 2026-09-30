import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Signs the test browser in when the studios need it (the shared sign-in, Admin.md §8.4). The motion and character
 * studios open without a login on a development server with no Supabase keys, which is CI and a fresh clone; with the
 * local stack's keys in their `.env.local` they ask for one, like the admin. So before the specs and the review sweep
 * run, this signs in once, by magic link through the local mail catcher, as he would, and leaves the session in
 * `STATE` for every project (`use.storageState`). A session still good from the last run is kept.
 *
 * Who signs in: `E2E_EMAIL`, or the first line of `.private/e2e-email` (gitignored; the repo is public). The address
 * has to be on the local allowlist. With no keys, no address or no local stack, it writes an empty session and the
 * studios are seen as they are.
 */
export const STATE = "e2e/.auth/state.json";
const STUDIO = "http://localhost:3004";
const MAILPIT = "http://127.0.0.1:54324";

export default async function globalSetup() {
  mkdirSync(dirname(STATE), { recursive: true });
  if (!existsSync(STATE)) writeFileSync(STATE, JSON.stringify({ cookies: [], origins: [] }));
  if (process.env.CI) return;

  const browser = await chromium.launch();
  try {
    // The last run's session, if the studio still lets it in.
    const kept = await browser.newContext({ storageState: STATE });
    const page = await kept.newPage();
    const answer = await page.goto(STUDIO + "/", { waitUntil: "domcontentloaded" }).catch(() => null);
    if (!answer || new URL(page.url()).pathname !== "/sign-in") return;

    const email = process.env.E2E_EMAIL ?? (existsSync(".private/e2e-email") ? readFileSync(".private/e2e-email", "utf8").trim() : "");
    if (!email) {
      console.warn(`[e2e] The studios ask for a sign-in, but no E2E_EMAIL or .private/e2e-email says who: the specs will see the sign-in.`);
      return;
    }
    const fresh = await browser.newContext();
    const signIn = await fresh.newPage();
    await signIn.goto(STUDIO + "/sign-in", { waitUntil: "networkidle" });
    const sent = Date.now();
    await signIn.getByLabel("Email").first().fill(email);
    await signIn.getByRole("button", { name: "Send the link" }).click();
    let link: string | null = null;
    for (let i = 0; i < 40 && !link; i++) {
      await signIn.waitForTimeout(250);
      const list = (await (await fetch(`${MAILPIT}/api/v1/messages`)).json()) as {
        messages: { ID: string; Created: string; To?: { Address: string }[] }[];
      };
      const message = list.messages.find((m) => m.To?.some((t) => t.Address === email) && new Date(m.Created).getTime() > sent - 3000);
      if (!message) continue;
      const full = (await (await fetch(`${MAILPIT}/api/v1/message/${message.ID}`)).json()) as { Text: string };
      link = /\( (http[^ )]+) \)/.exec(full.Text)?.[1] ?? null;
    }
    if (!link) throw new Error(`[e2e] No sign-in link reached ${MAILPIT} for ${email}: is the local stack running, and is the address on its allowlist?`);
    await signIn.goto(link, { waitUntil: "networkidle" });
    if (new URL(signIn.url()).pathname === "/sign-in") throw new Error(`[e2e] The sign-in link did not sign in: ${signIn.url()}`);
    await fresh.storageState({ path: STATE });
  } finally {
    await browser.close();
  }
}
