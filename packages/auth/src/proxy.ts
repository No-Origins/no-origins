import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { needsSecondFactor, secondFactorPassed, tokenClaims } from "./claims";
import { sessionCookieOptions } from "./cookies";
import { supabaseEnv } from "./env";
import type { Permission } from "./permissions";

/**
 * The gate, and the session refresh, in one pass (Admin.md §8.4) — every app's `proxy.ts` calls it.
 *
 * Two jobs that have to happen together. A Server Component cannot write cookies, so the refreshed access token has
 * nowhere to go unless something upstream of the render writes it — that is this. And because it is already reading
 * the user to do that, it is also the cheapest place to answer "is anyone signed in", before a page has rendered.
 *
 * **`getUser()`, never `getSession()`.** `getSession` reads the cookie and believes it; `getUser` asks the auth server
 * whether the token is real. On a page that decides what you may see, believing the cookie is believing whoever wrote
 * it. This is not the only defence and is not meant to be — RLS is (§8.3).
 *
 * **With no keys** (his, 2026-09-30: open only locally): in production the gate refuses, never opens — a deploy that
 * lost its keys is a closed door, not an open one. On a development server an app may ask to open without them
 * (`openWithoutKeys`, the motion studio), so CI's visual review and a laptop offline still see it.
 *
 * **An open app** (`open`; Orbit since 2026-10-03, Orbit.md C24, his: "make the controls in Orbit public, and only
 * when I log in as an admin should I be able to publish"): every path is everyone's, and the gate only refreshes the
 * session, so the page can ask who is signed in and RLS can decide what they may write. Nobody is sent to the sign-in;
 * the sign-in is still there for the one who publishes. Without keys it opens everywhere, production included: there is
 * nothing to sign in to, and nothing a visitor could reach that a sign-in guards.
 *
 * **An app's permission** (`permission`, Access.md A6, 2026-10-06): a session is not enough — the account must hold the
 * app's `<app>.open`. Without it the gate sends the person to the sign-in page, which says the account cannot open the
 * app and offers a sign-out; it never sends them to the app.
 *
 * **The admin's second factor** (Access.md A12, step 3): an `admin.*` permission counts only after an authenticator
 * app's code (`aal2`) or a passkey sign-in, read from the same token. A session that holds the permission on one factor
 * is sent to the sign-in page's code step (`?second=1`) — or, with no authenticator yet, to adding one — and then on to
 * where it was going; never to the no-access card, which is for an account that does not hold the permission at all.
 */
export type GateOptions = {
  /** Paths anyone may reach: the sign-in page and the callback. */
  publicPaths?: readonly string[];
  /** Open, ungated, on a development server that has no Supabase keys. Never in production. */
  openWithoutKeys?: boolean;
  /** Every path is public: the gate refreshes the session and sends nobody to the sign-in. */
  open?: boolean;
  /**
   * The permission that opens this app (Access.md A6): `admin.open`, `motion.open`, `home.open`. A signed-in principal
   * without it is sent to the sign-in page, which says the account cannot open the app; with none named, any session
   * opens it.
   */
  permission?: Permission;
};

/**
 * Whether the signed-in principal holds `permission` (Access.md A6): `held`, `no`, or `second` — held, but only after a
 * second factor this session has not passed (A12). The token shows: its `perms` claim, written by the database when the
 * token was issued (`noo_access_token_hook`), and its `aal` and `amr`, read from the token `getUser()` has just had the
 * auth server verify — so never a claim the browser wrote. A token from before the hook has no `perms`, and then the
 * database is asked, live (`noo_can`, which asks for the second factor itself). Either way a change reaches the gate
 * within the token's ten minutes, and at once when the person's sessions are ended.
 */
async function holds(supabase: SupabaseClient, permission: Permission): Promise<"held" | "second" | "no"> {
  const { data: { session } } = await supabase.auth.getSession();
  const claims = session ? tokenClaims(session.access_token) : null;
  if (claims?.perms) {
    if (!claims.perms.includes(permission)) return "no";
    return needsSecondFactor(permission) && !secondFactorPassed(claims) ? "second" : "held";
  }
  const { data, error } = await supabase.rpc("noo_can", { p_permission: permission });
  return !error && data === true ? "held" : "no";
}

export async function authGate(
  request: NextRequest,
  { publicPaths = ["/sign-in", "/auth"], openWithoutKeys = false, open = false, permission }: GateOptions = {},
) {
  const env = supabaseEnv();
  if (!env) {
    if (open || (openWithoutKeys && process.env.NODE_ENV !== "production")) return NextResponse.next({ request });
    return new NextResponse("Sign-in is not configured: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.key, {
    cookieOptions: sessionCookieOptions(request.nextUrl.hostname),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const reachable = open || publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  // Signed in, and whether this account may open the app (Access.md A6, A12). Asked once a request, only where it matters.
  const access = !user || !permission ? "held" : await holds(supabase, permission);
  const allowed = access === "held";

  if (!user && !reachable) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    // Where they were going, so the link lands there rather than at the home.
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Signed in without the app's permission: the sign-in page, saying so — and only it and the auth routes (sign-out).
  // Holding it on one factor (A12): the code step, and then where they were going.
  if (user && !allowed && !reachable) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = access === "second" ? `?second=1${pathname === "/" ? "" : `&next=${encodeURIComponent(pathname)}`}` : "?denied=1";
    return NextResponse.redirect(url);
  }

  if (user && allowed && pathname === "/sign-in") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
