import type { NextRequest } from "next/server";
import { authGate } from "@no-origins/auth/proxy";

/**
 * The login's gate (Admin.md §8.4, step 5): the shared one of `@no-origins/auth`, refreshing the session every app
 * shares. Its doors are anyone's — signing in, making an account, a forgotten password, the callback — and the rest is
 * the signed-in person's own: the apps they may open (`/`), their account (`/account`) and a new password (`/reset`,
 * reached by the link in the mail, which signs in first). No permission opens it: an account is enough.
 *
 * Signed in already, its doors send you on to `next` — never while the page has a step for you: the code, the
 * no-access card, a link's last step.
 *
 * **Open only locally**, on a development server with no Supabase keys, so the review sweep sees its pages in CI. In
 * production it never opens without them.
 */
export function proxy(request: NextRequest) {
  return authGate(request, {
    publicPaths: ["/sign-in", "/sign-up", "/forgot", "/auth"],
    entries: ["/sign-in", "/sign-up", "/forgot"],
    openWithoutKeys: true,
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
