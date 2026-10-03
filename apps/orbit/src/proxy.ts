import type { NextRequest } from "next/server";
import { authGate } from "@no-origins/auth/proxy";

/**
 * Orbit is open to everyone (his, 2026-10-03, Orbit.md C24: "make the controls in Orbit public, and only when I log
 * in as an admin should I be able to publish, so that users can experiment and play around"). The shared gate of
 * `@no-origins/auth` runs with `open`: it refreshes the one session the apps share and sends nobody to the sign-in.
 * A visitor sees each agent as it was published and plays with every control on the page; nothing they do is saved.
 * The owner signs in — `/sign-in` is still here, and a session made on the admin is this one too — and the draft, the
 * saves and the publishes are his (`app/actions.ts`, RLS deciding).
 *
 * Until C24 it was behind the sign-in as the motion studio is, open only on a development server with no keys.
 */
export function proxy(request: NextRequest) {
  return authGate(request, { open: true });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
