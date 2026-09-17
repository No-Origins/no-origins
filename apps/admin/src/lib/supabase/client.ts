"use client";
import { createBrowserClient } from "@supabase/ssr";

/**
 * The browser client. Sign-in is the only thing that needs one — everything else reads on the server.
 *
 * `experimental.passkey` opts into the passkey API (`auth.signInWithPasskey`, `auth.registerPasskey`,
 * `auth.passkey.*`). It is off by default and every passkey call throws without it. The server side also has to
 * have passkeys enabled — `[auth.passkey]` in `supabase/config.toml` locally, the dashboard on the hosted
 * project (Admin.md §8.4).
 */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { experimental: { passkey: true } } },
  );
}
