import type { NextRequest } from "next/server";
import { authGate } from "@no-origins/auth/proxy";

/**
 * Orbit is behind the sign-in, as the motion studio is (his, 2026-09-30: "the same setup like … motion studio"):
 * the shared gate of `@no-origins/auth`, one session with the admin and every app after it, the same allowlist.
 *
 * **Open only locally**: on a development server with no Supabase keys — CI's visual review, a laptop offline — it
 * opens without a login, so the sweep still sees it. In production it never opens without them.
 */
export function proxy(request: NextRequest) {
  return authGate(request, { openWithoutKeys: true });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
