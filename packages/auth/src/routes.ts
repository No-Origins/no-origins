import { NextResponse } from "next/server";

import { sessionCookieOptions } from "./cookies";
import { supabaseEnv } from "./env";
import { safeReturn } from "./safe-next";
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
  const next = safeReturn(searchParams.get("next"), origin);

  const code = searchParams.get("code");
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(next, { status: 303 });
  }

  const tokenHash = searchParams.get("token_hash");
  const type = tokenType(searchParams.get("type"));
  if (tokenHash && type) {
    const confirm = new URL("/sign-in", origin);
    confirm.searchParams.set("token_hash", tokenHash);
    confirm.searchParams.set("type", type);
    if (next !== `${origin}/`) confirm.searchParams.set("next", next);
    return withoutHostOnlySession(request, NextResponse.redirect(confirm, { status: 303 }));
  }

  return NextResponse.redirect(failed(origin, next), { status: 303 });
}

/** POST only: the card's form, carrying the token hash the GET handed it. This is the request that signs in. */
export async function authConfirm(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeReturn(searchParams.get("next"), origin);
  const tokenHash = searchParams.get("token_hash");
  const type = tokenType(searchParams.get("type"));

  if (tokenHash && type) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    // 303, so a browser that arrived by POST leaves by GET.
    if (!error) return NextResponse.redirect(next, { status: 303 });
  }

  return NextResponse.redirect(failed(origin, next), { status: 303 });
}

/** The sign-in page saying the link did not work, still on its way to `next`. */
function failed(origin: string, next: string) {
  const url = new URL("/sign-in", origin);
  url.searchParams.set("error", "link");
  if (next !== `${origin}/`) url.searchParams.set("next", next);
  return url;
}

/** POST only: a sign-out on GET is a sign-out any prefetch or image tag can perform. It signs out of every app. */
export async function signOut(request: Request) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/sign-in", request.url), { status: 303 });
}

/**
 * The links a mail may carry (`supabase/templates`): a sign-in (`magiclink`, and `email` for the link that signs in or
 * signs up alike), an address confirmed at sign-up (`signup`), and a forgotten password (`recovery`, whose `next` is the
 * page that sets the new one).
 */
const TOKEN_TYPES = ["magiclink", "email", "signup", "recovery"] as const;

function tokenType(value: string | null): (typeof TOKEN_TYPES)[number] | null {
  return TOKEN_TYPES.find((type) => type === value) ?? null;
}

/**
 * Clears a session cookie the browser may still hold from before 2026-09-30, when the admin wrote it for its own host
 * rather than for `.no-origins.com`. Both are sent under one name, and a stale one read first is a signed-out user
 * bounced straight back to `/sign-in` with a fresh session in the other cookie. A `Set-Cookie` with no `domain` names
 * only the host-only cookie, so the shared one stays. Off the shared domain — localhost — the host-only cookie IS the
 * session, and nothing is cleared.
 *
 * **Never on the response that signs in** (2026-10-01, his: the link still took him back to the sign-in). A Next
 * response holds one cookie per name, whatever its domain: what the handler sets on the response replaces what
 * `cookies()` wrote under the same name. Sent beside the fresh session, this clear replaced it — the browser was
 * told to delete the cookie it should have stored, and the next page found nobody signed in. So it goes on the GET's
 * hop to the sign-in page, which writes no session.
 */
function withoutHostOnlySession(request: Request, response: NextResponse) {
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
