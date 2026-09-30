/**
 * **One sign-in for every app** (his, 2026-09-30: "let's use the same auth because it should be same across no
 * origins"). The session cookie is written for the parent domain, `.no-origins.com`, so signing in on the admin signs
 * you in on the motion studio and the other way round, and signing out of one signs out of both. Locally every app is
 * on `localhost`, where a cookie is shared across ports anyway, so there is nothing to set.
 *
 * The cookie is Supabase's own (`sb-<project>-auth-token`); only where it is written changes. Every subdomain's
 * requests carry it — the portfolio's and the showcase's too, which read nothing from it and hold no database key.
 */
export const SHARED_DOMAIN = "no-origins.com";

export function sessionCookieOptions(host: string | null | undefined): { domain?: string } {
  const name = (host ?? "").split(":")[0]!.toLowerCase();
  return name === SHARED_DOMAIN || name.endsWith(`.${SHARED_DOMAIN}`) ? { domain: `.${SHARED_DOMAIN}` } : {};
}
