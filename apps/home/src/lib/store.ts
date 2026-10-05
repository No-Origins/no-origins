import { readFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { get } from "@vercel/blob";
import { supabaseEnv } from "@no-origins/auth/env";
import { supabaseServer } from "@no-origins/auth/server";

import { HOME, HOME_TOUR } from "@house";
import type { House } from "@/lib/house";
import type { Tour } from "@/lib/tour";

/**
 * Where the house comes from (Home.md H4, built 2026-10-06). The house is private and the repo public, so the app is
 * written against the description's type and never carries the house itself:
 *
 * - **On Vercel** it is read, at each request and behind the sign-in, from the private Blob store connected to the
 *   `home` project: `house.json` (the description and the tour) and `tour/<name>.webp` (the tour's pictures), as
 *   `pnpm --filter home publish:house` last put them there. A private store is never readable by URL; the SDK reads it
 *   with the project's own short-lived OIDC token.
 * - **Anywhere else** it is `@house`: `src/content` where that folder is — his machine, gitignored, the files every
 *   version is written in — and else the made-up sample in `src/sample`, which is what CI and the sweep see.
 *
 * `HOME_STORE=1` reads the store locally too, to check what was published (`vercel env pull` first, for the store's id).
 */
export type HomeData = { house: House; tour: Tour; source: "store" | "files" };

export const HOUSE_PATH = "house.json";
/** A picture's name: what `content/tour.ts` writes and nothing that could walk out of the folder. */
const PICTURE = /^[a-z0-9][a-z0-9-]*\.webp$/;

const fromStore = () => process.env.VERCEL === "1" || process.env.HOME_STORE === "1";

/**
 * Whether the request is signed in: the gate's own question, asked again where the house is read, so a matcher that
 * one day lets a path through still never lets the house out. Without keys the gate's rule stands — open only on a
 * development server.
 */
export async function signedIn(): Promise<boolean> {
  // A question about the request, so never answered at build time: the page is rendered at each visit, keys or none.
  await connection();
  if (!supabaseEnv()) return process.env.NODE_ENV !== "production";
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

/** The house and its tour, from the store on Vercel and from the files anywhere else. */
export async function loadHome(): Promise<HomeData> {
  // Read at request time, never baked into the build: a publish shows on the next visit, and the build has no house.
  await connection();
  if (fromStore()) {
    try {
      const result = await get(HOUSE_PATH, { access: "private" });
      if (result?.statusCode === 200) {
        const data = (await new Response(result.stream).json()) as { house: House; tour: Tour };
        return { house: data.house, tour: data.tour, source: "store" };
      }
      console.error(`Home: ${HOUSE_PATH} is not in the store, so the bundled house is shown. Publish it: pnpm --filter home publish:house`);
    } catch (error) {
      console.error("Home: the store could not be read, so the bundled house is shown.", error);
    }
  }
  return { house: HOME, tour: HOME_TOUR, source: "files" };
}

/** One of the tour's pictures, by its file name, or null where there is none. */
export async function readPicture(file: string): Promise<{ body: ReadableStream<Uint8Array> | Uint8Array<ArrayBuffer>; type: string } | null> {
  if (!PICTURE.test(file)) return null;
  if (fromStore()) {
    const result = await get(`tour/${file}`, { access: "private" });
    return result?.statusCode === 200 ? { body: result.stream, type: result.blob.contentType } : null;
  }
  try {
    const bytes = await readFile(path.join(/* turbopackIgnore: true */ process.cwd(), "src", "content", "pictures", file));
    return { body: new Uint8Array(bytes), type: "image/webp" };
  } catch {
    return null;
  }
}
