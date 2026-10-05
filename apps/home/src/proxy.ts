import type { NextRequest } from "next/server";
import { authGate } from "@no-origins/auth/proxy";

/**
 * Home is behind the sign-in (Home.md H3): the shared gate of `@no-origins/auth`, one session with the admin, the
 * motion studio and Orbit, the same allowlist. A house is private.
 *
 * **Open only locally**: on a development server with no Supabase keys — CI's visual review, a laptop offline — it
 * opens without a login, so the sweep still sees it. In production it never opens without them.
 *
 * The tour's pictures (`/tour/*.webp`) are behind it too: the matcher exempts the icon and the fonts, as every app's
 * does, and no image format — the pictures are the house seen from inside, and the house is private.
 */
export function proxy(request: NextRequest) {
  return authGate(request, { openWithoutKeys: true });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.woff2?$).*)"],
};
