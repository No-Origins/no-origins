/**
 * What an access token says (Access.md A6, A12): who it is for (`sub`), the permissions the database wrote into it when
 * it was issued (`perms`, `noo_access_token_hook`), its assurance level (`aal`) and how the session was proved (`amr`,
 * the methods). Decoding only, never verifying — read a token here only after the auth server has verified it on the
 * same request (`getUser()`, which the gate does on every request). `perms` is null for a token from before the hook,
 * which has no such claim; then a permission is asked of the database, live (`noo_can`).
 */
export type TokenClaims = { sub: string | null; perms: string[] | null; aal: string | null; amr: string[] };

export function tokenClaims(token: string): TokenClaims | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "="));
    const { sub, perms, aal, amr } = JSON.parse(json) as { sub?: unknown; perms?: unknown; aal?: unknown; amr?: unknown };
    return {
      sub: typeof sub === "string" ? sub : null,
      perms: Array.isArray(perms) && perms.every((p) => typeof p === "string") ? perms : null,
      aal: typeof aal === "string" ? aal : null,
      // Supabase writes `[{ method, timestamp }]`; RFC 8176's plain list of names is read too.
      amr: Array.isArray(amr)
        ? amr.flatMap((m) => (typeof m === "string" ? [m] : m && typeof m === "object" && typeof (m as { method?: unknown }).method === "string" ? [(m as { method: string }).method] : []))
        : [],
    };
  } catch {
    return null;
  }
}

/**
 * Whether a session passed a second factor (Access.md A12): `aal2`, after an authenticator app's code, or a passkey
 * sign-in, which is the device and its unlock at once (his, 2026-10-08). The database asks the same
 * (`noo_second_factor()`).
 */
export function secondFactorPassed(claims: TokenClaims | null): boolean {
  return !!claims && (claims.aal === "aal2" || claims.amr.includes("passkey"));
}

/** The permissions that count only after a second factor: the admin's (Access.md A12). */
export function needsSecondFactor(permission: string): boolean {
  return permission.startsWith("admin.");
}
