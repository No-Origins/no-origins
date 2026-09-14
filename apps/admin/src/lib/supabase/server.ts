import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * The server client — a request-scoped Supabase reading the session out of cookies.
 *
 * **It uses the publishable (anon) key on purpose, never the service role.** Every table in Admin.md §8.3 is
 * deny-by-default with no anon policy, so this client sees exactly what the signed-in person's row in `profiles`
 * says they may see, and RLS is doing the work rather than the app remembering to. A service-role client bypasses
 * RLS entirely — it exists for the publish pipeline (§9), it is created somewhere else, and it never gets imported
 * into a page.
 */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        // In a Server Component this throws: cookies are read-only outside actions and route handlers. That is
        // fine and not worth a try/catch-and-log — the middleware refreshes the session on every request, so the
        // write this would have done has already happened.
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          /* refreshed in middleware instead */
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
  const { data } = await supabase
    .from("profiles")
    .select("id, email, name, role")
    .eq("id", user.id)
    .maybeSingle();
  return data ?? null;
}

function env(name: string): string {
  const value = process.env[name];
  // Failing here beats failing at the first query with a message about a malformed URL. The admin cannot do
  // anything useful without these, so it says which one is missing and stops.
  if (!value) throw new Error(`${name} is not set — see apps/admin/.env.example`);
  return value;
}
