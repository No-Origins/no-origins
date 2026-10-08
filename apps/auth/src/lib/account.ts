import { headers } from "next/headers";
import { tokenClaims } from "@no-origins/auth/claims";
import { supabaseServer } from "@no-origins/auth/server";

/**
 * The signed-in person, as the login's pages show them: their address, their roles' names, whether they are the
 * Owner, and the permissions their token carries. Read from the session the gate's `getUser()` verified on this same
 * request (as `shown()` reads it), for what a page shows — never for what it may change, which the database decides.
 */
export async function signedIn() {
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const claims = tokenClaims(session.access_token);
  // Your roles (Access.md A2): read through your own rows' rules, which show a principal what it holds.
  const held = await supabase.from("role_assignments").select("roles(name, built_in)").eq("principal_id", session.user.id);
  const roles = (held.data ?? []).flatMap((row) => {
    const role = (row as { roles: Role | Role[] | null }).roles;
    return Array.isArray(role) ? role : role ? [role] : [];
  });
  return {
    email: session.user.email ?? "Unknown account",
    roles: roles.map((r) => r.name),
    owner: roles.some((r) => r.built_in === "owner"),
    perms: claims?.perms ?? null,
  };
}

type Role = { name: string; built_in: string | null };

/** This page's own origin, from the request: the apps' addresses are read beside it (`appOrigin`). */
export async function here(): Promise<string> {
  const host = (await headers()).get("host") ?? "localhost:3008";
  const name = host.split(":")[0];
  return `${name === "localhost" || name === "127.0.0.1" ? "http" : "https"}://${host}`;
}
