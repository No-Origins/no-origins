import type { NextRequest } from "next/server";
import { authGate } from "@no-origins/auth/proxy";

/**
 * Orbit is open to everyone (Orbit.md C24): anyone may play with its controls, and only the owner publishes. The shared
 * gate of
 * `@no-origins/auth` runs with `open`: it refreshes the one session the apps share and sends nobody to the sign-in.
 * A visitor sees each agent as it was published and plays with every control on the page; nothing they do is saved.
 * The owner signs in — `/sign-in` is still here, and a session made on the admin is this one too — and the draft, the
 * saves and the publishes are his (`app/actions.ts`, RLS deciding).
 */
export function proxy(request: NextRequest) {
  return authGate(request, { open: true });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
