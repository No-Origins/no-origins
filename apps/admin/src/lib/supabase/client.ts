"use client";
import { createBrowserClient } from "@supabase/ssr";

/** The browser client. Sign-in is the only thing that needs one — everything else reads on the server. */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
