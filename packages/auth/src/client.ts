"use client";
import { createBrowserClient } from "@supabase/ssr";

import { sessionCookieOptions } from "./cookies";
import { requireSupabaseEnv } from "./env";

/**
 * The browser client: signing in and the account's own settings (a passkey, a password). Everything else reads on
 * the server. It writes the session cookie where the server does, for every no-origins app at once.
 *
 * `experimental.passkey` opts into the passkey API (`auth.signInWithPasskey`, `auth.registerPasskey`,
 * `auth.passkey.*`). It is off by default and every passkey call throws without it. The server side also has to have
 * passkeys enabled — `[auth.passkey]` in `supabase/config.toml` locally, the dashboard on the hosted project.
 */
export function supabaseBrowser() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient(url, key, {
    cookieOptions: sessionCookieOptions(window.location.hostname),
    auth: { experimental: { passkey: true } },
  });
}
