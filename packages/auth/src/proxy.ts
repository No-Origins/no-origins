import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { sessionCookieOptions } from "./cookies";
import { supabaseEnv } from "./env";

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
 */
export type GateOptions = {
  /** Paths anyone may reach: the sign-in page and the callback. */
  publicPaths?: readonly string[];
  /** Open, ungated, on a development server that has no Supabase keys. Never in production. */
  openWithoutKeys?: boolean;
  /** Every path is public: the gate refreshes the session and sends nobody to the sign-in. */
  open?: boolean;
};

export async function authGate(
  request: NextRequest,
  { publicPaths = ["/sign-in", "/auth"], openWithoutKeys = false, open = false }: GateOptions = {},
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

  if (!user && !reachable) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    // Where they were going, so the link lands there rather than at the home.
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/sign-in") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
