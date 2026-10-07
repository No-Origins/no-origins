/**
 * What an access token says (Access.md A6): who it is for (`sub`) and the permissions the database wrote into it when it
 * was issued (`perms`, `noo_access_token_hook`). Decoding only, never verifying — read a token here only after the auth
 * server has verified it on the same request (`getUser()`, which the gate does on every request). `perms` is null for a
 * token from before the hook, which has no such claim; then a permission is asked of the database, live (`noo_can`).
 */
export type TokenClaims = { sub: string | null; perms: string[] | null };

export function tokenClaims(token: string): TokenClaims | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "="));
    const { sub, perms } = JSON.parse(json) as { sub?: unknown; perms?: unknown };
    return {
      sub: typeof sub === "string" ? sub : null,
      perms: Array.isArray(perms) && perms.every((p) => typeof p === "string") ? perms : null,
    };
  } catch {
    return null;
  }
}
