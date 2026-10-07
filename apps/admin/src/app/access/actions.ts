"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS, type Permission } from "@no-origins/auth/permissions";
import { can, supabaseServer } from "@no-origins/auth/server";

/**
 * The admin's changes to who may do what (Access.md A7). Each asks for its permission first, since a server function can
 * be reached by a POST from anywhere; the database's rules and guards are the lock behind it — nobody grants, takes,
 * ends or removes more than they hold, and the Owner is never touched. A refusal comes back as a sentence for the page.
 */

export type Done = { ok: true } | { ok: false; message: string };

const refused = (message: string): Done => ({ ok: false, message });

/** The database's own sentence, without its table's prefix. */
function said(error: { message: string } | null): Done {
  if (!error) return { ok: true };
  const text = error.message.replace(/^[a-z_ ]+: /, "");
  return refused(text.charAt(0).toUpperCase() + text.slice(1));
}

async function asking(permission: Permission) {
  if (!(await can(permission))) return null;
  return supabaseServer();
}

const DAY = 24 * 60 * 60 * 1000;

// ── People ───────────────────────────────────────────────────────────────────
/**
 * A person's roles, saved in one go (Access.md A7, his, 2026-10-07): the whole set they should hold, as the dialog holds
 * it when Save is pressed. One transaction in the database (`noo_set_roles`), each role given or taken through
 * `noo_give_role` and `noo_take_role`; a role taken ends their sessions, and a refusal leaves them as they were.
 */
export async function setRoles(principal: string, roles: string[]): Promise<Done> {
  const db = await asking("admin.people.assign");
  if (!db) return refused("Giving and taking roles needs admin.people.assign.");
  const result = said((await db.rpc("noo_set_roles", { p_principal: principal, p_roles: roles })).error);
  revalidatePath("/people");
  return result;
}

export async function endSessions(principal: string): Promise<Done> {
  const db = await asking("admin.people.remove");
  if (!db) return refused("Ending sessions needs admin.people.remove.");
  return said((await db.rpc("noo_end_sessions", { p_principal: principal })).error);
}

export async function removeAccount(principal: string): Promise<Done> {
  const db = await asking("admin.people.remove");
  if (!db) return refused("Removing an account needs admin.people.remove.");
  const result = said((await db.rpc("noo_remove_account", { p_principal: principal })).error);
  revalidatePath("/people");
  return result;
}

// ── Roles ────────────────────────────────────────────────────────────────────
export async function createRole(name: string, sentence: string): Promise<Done & { id?: string }> {
  const db = await asking("admin.roles.manage");
  if (!db) return refused("Making roles needs admin.roles.manage.");
  if (!name.trim()) return refused("A role needs a name.");
  const { data, error } = await db.from("roles").insert({ name: name.trim(), sentence: sentence.trim() }).select("id").single();
  revalidatePath("/roles");
  return error ? said(error) : { ok: true, id: data.id as string };
}

/**
 * A role, saved in one go (Access.md A7, his, 2026-10-07): its name, its sentence and the whole set of its permissions,
 * as the page holds them when Save is pressed. One transaction in the database (`noo_save_role`): a refusal anywhere
 * leaves the role as it was.
 */
export async function saveRole(role: string, change: { name: string; sentence: string; permissions: string[] }): Promise<Done> {
  const db = await asking("admin.roles.manage");
  if (!db) return refused("Changing roles needs admin.roles.manage.");
  if (!change.name.trim()) return refused("A role needs a name.");
  const unknown = change.permissions.find((p) => !(p in PERMISSIONS));
  if (unknown) return refused(`There is no permission called ${unknown}.`);
  const { error } = await db.rpc("noo_save_role", {
    p_role: role,
    p_name: change.name,
    p_sentence: change.sentence,
    p_permissions: change.permissions,
  });
  revalidatePath("/roles");
  revalidatePath(`/roles/${role}`);
  return error?.code === "23505" ? refused("Another role has that name.") : said(error);
}

export async function deleteRole(role: string): Promise<Done> {
  const db = await asking("admin.roles.manage");
  if (!db) return refused("Deleting roles needs admin.roles.manage.");
  const { error } = await db.from("roles").delete().eq("id", role);
  revalidatePath("/roles");
  if (error?.code === "23503") return refused("Someone still holds this role. Take it from them first.");
  return said(error);
}

export async function makeDefault(role: string): Promise<Done> {
  const db = await asking("admin.roles.manage");
  if (!db) return refused("Moving the default needs admin.roles.manage.");
  const result = said((await db.rpc("noo_set_default_role", { p_role: role })).error);
  revalidatePath("/roles");
  revalidatePath(`/roles/${role}`);
  return result;
}

// ── Invitations ──────────────────────────────────────────────────────────────
export async function invite(email: string, roles: string[], days: number): Promise<Done> {
  const db = await asking("admin.invitations.manage");
  if (!db) return refused("Inviting needs admin.invitations.manage.");
  const address = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return refused("That is not an email address.");
  if (![7, 14, 30].includes(days)) return refused("An invitation lasts 7, 14 or 30 days.");
  const made = await db.from("invitations").insert({ email: address, expires_at: new Date(Date.now() + days * DAY).toISOString() });
  if (made.error) {
    revalidatePath("/invitations");
    return made.error.code === "23505" ? refused("That address already has an invitation. Revoke it to send another.") : said(made.error);
  }
  if (roles.length) {
    const named = await db.from("invitation_roles").insert(roles.map((role_id) => ({ email: address, role_id })));
    if (named.error) {
      await db.from("invitations").delete().eq("email", address);
      revalidatePath("/invitations");
      return said(named.error);
    }
  }
  revalidatePath("/invitations");
  return { ok: true };
}

export async function revoke(email: string): Promise<Done> {
  const db = await asking("admin.invitations.manage");
  if (!db) return refused("Revoking needs admin.invitations.manage.");
  const result = said((await db.from("invitations").delete().eq("email", email)).error);
  revalidatePath("/invitations");
  return result;
}
