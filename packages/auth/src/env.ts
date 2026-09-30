/**
 * The two public values every no-origins app signs in with: the Supabase project's URL and its publishable (anon)
 * key. Both are `NEXT_PUBLIC_*`, read by their literal names so Next inlines them into the browser's bundle too.
 *
 * Never the service role. Every table is deny-by-default under RLS (Admin.md §8.3), so a client on this key sees
 * exactly what the signed-in person's profile allows.
 */
export function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

/** The values, or a message naming what is missing: an app that needs them says so and stops. */
export function requireSupabaseEnv(): { url: string; key: string } {
  const env = supabaseEnv();
  if (!env) throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set — see the app's .env.example");
  return env;
}
