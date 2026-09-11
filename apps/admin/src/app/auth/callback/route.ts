import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Where the magic link lands (Admin.md §8.4).
 *
 * Two shapes, because Supabase sends whichever the client asked for: `?code=` under PKCE, which is what
 * `@supabase/ssr` uses, and `?token_hash=&type=` from a template that verifies server-side. Both are handled —
 * a sign-in that works only under one flow breaks silently the day an email template changes.
 *
 * A rejected address never reaches here. The allowlist trigger refuses the `auth.users` insert, so there is no
 * account for a link to be issued against in the first place.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));
  const supabase = await supabaseServer();

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (tokenHash && (type === "magiclink" || type === "email")) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/sign-in?error=link`);
}

/**
 * `next` comes off a URL, so it is attacker-controlled. Only a same-site path is allowed through — anything with
 * a scheme or a `//` prefix is an open redirect wearing a helpful name.
 */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
