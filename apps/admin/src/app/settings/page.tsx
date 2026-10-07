import { currentProfile, supabaseServer } from "@no-origins/auth/server";

import { SettingsView } from "@/components/settings";

export const metadata = { title: "Settings" };

/**
 * Settings (Admin.md §0.5) — the account controls that used to be the whole signed-in landing: who you are, your
 * passkeys, your password, and the way out. The home is the grid of feature cards; this is the Settings card.
 */
export default async function SettingsPage() {
  const profile = await currentProfile();
  // Your roles (Access.md A2): read through your own row's rules, which show a principal what it holds.
  const held = profile
    ? await (await supabaseServer()).from("role_assignments").select("roles(name)").eq("principal_id", profile.id)
    : { data: [] };
  const roles = (held.data ?? []).flatMap((row) => {
    const role = (row as { roles: { name: string } | { name: string }[] | null }).roles;
    return Array.isArray(role) ? role.map((r) => r.name) : role ? [role.name] : [];
  });
  return <SettingsView email={profile?.email ?? "Unknown account"} roles={roles} />;
}
