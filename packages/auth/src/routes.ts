import { NextResponse } from "next/server";

import { sessionCookieOptions } from "./cookies";
import { supabaseEnv } from "./env";
import { safeNext } from "./safe-next";
import { supabaseServer } from "./server";

/**
 * Where the magic link lands (Admin.md §8.4): `app/auth/callback/route.ts` in every app is
 * `export { authCallback as GET, authConfirm as POST }`.
 *
 * Two shapes, because Supabase sends whichever the client asked for: `?code=` under PKCE, which is what
 * `@supabase/ssr` uses, and `?token_hash=&type=` from a template that verifies server-side (`supabase/templates/
 * magic-link.html`, ours since 2026-09-30, so a link opened on another device works). Both are handled — a sign-in
 * that works only under one flow breaks silently the day an email template changes.
 *
 * **A GET never spends a token hash** (2026-10-01, his: the link "takes me to login"). A token hash is good once, and
 * whatever fetches the link first has it: a mail client's preview, a link scanner between Resend and the inbox.
 * When the person then taps it, it is gone, and the card says the link did not work. So the GET only carries the
 * hash to the sign-in page, where the card posts it straight back here (`authConfirm`) — a form a scanner does not
 * submit — and the POST is the one request that verifies. A `?code=` is spent on the GET as before: it is bound to
 * the browser that asked, so nothing else can use it.
 *
 * A rejected address never reaches here. The allowlist trigger refuses the `auth.users` insert, so there is no
 * account for a link to be issued against in the first place.
 */
export async function authCallback(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));

  const code = searchParams.get("code");
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return signedIn(request, `${origin}${next}`);
  }

  const tokenHash = searchParams.get("token_hash");
  const type = tokenType(searchParams.get("type"));
  if (tokenHash && type) {
    const confirm = new URL("/sign-in", origin);
    confirm.searchParams.set("token_hash", tokenHash);
    confirm.searchParams.set("type", type);
    if (next !== "/") confirm.searchParams.set("next", next);
    return NextResponse.redirect(confirm, { status: 303 });
  }

  return NextResponse.redirect(`${origin}/sign-in?error=link`, { status: 303 });
}

/** POST only: the card's form, carrying the token hash the GET handed it. This is the request that signs in. */
export async function authConfirm(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));
  const tokenHash = searchParams.get("token_hash");
  const type = tokenType(searchParams.get("type"));

  if (tokenHash && type) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return signedIn(request, `${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/sign-in?error=link`, { status: 303 });
}

/** POST only: a sign-out on GET is a sign-out any prefetch or image tag can perform. It signs out of every app. */
export async function signOut(request: Request) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/sign-in", request.url), { status: 303 });
}

function tokenType(value: string | null): "magiclink" | "email" | null {
  return value === "magiclink" || value === "email" ? value : null;
}

/**
 * The redirect after a sign-in — 303, so a browser that arrived by POST leaves by GET — which also clears a session
 * cookie the browser may still hold from before 2026-09-30, when the admin wrote it for its own host rather than for
 * `.no-origins.com`. Both are sent under one name, and a stale one read first is a signed-out user bounced straight
 * back to `/sign-in` with a fresh session in the other cookie. A `Set-Cookie` with no `domain` names only the
 * host-only cookie, so the one just written for the shared domain stays. Off the shared domain — localhost — the
 * host-only cookie IS the session, and nothing is cleared.
 */
function signedIn(request: Request, to: string) {
  const response = NextResponse.redirect(to, { status: 303 });
  const host = request.headers.get("host");
  const env = supabaseEnv();
  if (env && sessionCookieOptions(host).domain) {
    const name = `sb-${new URL(env.url).hostname.split(".")[0]}-auth-token`;
    for (const suffix of ["", ".0", ".1", ".2", ".3", ".4"]) {
      response.cookies.set(`${name}${suffix}`, "", { path: "/", maxAge: 0 });
    }
  }
  return response;
}
