import { appOrigin, NO_ORIGINS_APPS } from "@no-origins/auth/apps";
import { supabaseEnv } from "@no-origins/auth/env";

import { AppsView, type ShownApp } from "@/components/apps";
import { here, signedIn } from "@/lib/account";

export const metadata = { title: "Your apps" };

/**
 * Signed in with nowhere to return to (Admin.md §8.4 step 5; Access.md A7): the apps this person may open — every public
 * one, and each gated one whose `<app>.open` their token carries; the admin only with `admin.open`, which asks for its
 * code when it is opened (A12). The gate lets nobody here who is not signed in, except on a development server with no
 * keys, where the public apps show and nobody is.
 */
export default async function Apps() {
  const origin = await here();
  const me = supabaseEnv() ? await signedIn() : null;
  // A token from before the access hook carries no list (none does since 2026-10-06): then the public apps only.
  const perms = me?.perms ?? [];
  const apps: ShownApp[] = NO_ORIGINS_APPS
    .filter((app) => !app.permission || perms.includes(app.permission))
    .map((app) => ({ id: app.id, name: app.name, line: app.line, href: appOrigin(app, origin) }));
  return <AppsView email={me?.email ?? null} apps={apps} />;
}
