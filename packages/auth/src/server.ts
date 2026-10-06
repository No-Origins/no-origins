import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { sessionCookieOptions } from "./cookies";
import { requireSupabaseEnv } from "./env";
import type { Permission } from "./permissions";

/**
 * The server client — a request-scoped Supabase reading the session out of cookies (Admin.md §8.4).
 *
 * **It uses the publishable (anon) key on purpose, never the service role.** Every table is deny-by-default with no
 * anon policy, so this client sees exactly what the signed-in person's row in `profiles` says they may see, and RLS
 * is doing the work rather than the app remembering to.
 */
export async function supabaseServer() {
  const store = await cookies();
  const host = (await headers()).get("host");
  const { url, key } = requireSupabaseEnv();
  return createServerClient(url, key, {
    cookieOptions: sessionCookieOptions(host),
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        // In a Server Component this throws: cookies are read-only outside actions and route handlers. That is
        // fine — the proxy refreshes the session on every request, so the write this would have done has happened.
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          /* refreshed in the proxy instead */
        }
      },
    },
  });
}

/**
 * Who is signed in, and what they may do. Null when nobody is.
 *
 * The profile is read rather than trusted from the JWT: the role lives in `public.profiles` because that is what
 * every RLS policy reads (§8.3), and a copy of it in a token is a copy that can be stale.
 */
export async function currentProfile() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("id, email, name, role").eq("id", user.id).maybeSingle();
  return data ?? null;
}

/**
 * Whether the signed-in principal may do `permission` (Access.md A6) — asked of the database, live, through the same
 * `noo_can()` every rule asks, so a server action and the table it writes agree. `item` is A9's room for single items,
 * ignored until then. False for nobody signed in; throws without keys, as every database call here does.
 */
export async function can(permission: Permission, item?: string): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("noo_can", { p_permission: permission, p_item: item ?? null });
  return !error && data === true;
}
