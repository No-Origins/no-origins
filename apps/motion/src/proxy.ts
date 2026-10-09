import type { NextRequest } from "next/server";
import { authGate } from "@no-origins/auth/proxy";

/**
 * The studio is behind the sign-in and opens with `motion.open` (Access.md A11): the shared gate of `@no-origins/auth`,
 * one session with the admin and every app after it, the same allowlist.
 *
 * **Open only locally**: on a development server with no Supabase keys — CI's visual review, a
 * laptop offline — it opens without a login, so the sweep and the specs still see it. In production it never opens
 * without them.
 */
export function proxy(request: NextRequest) {
  return authGate(request, { openWithoutKeys: true, permission: "motion.open" });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
