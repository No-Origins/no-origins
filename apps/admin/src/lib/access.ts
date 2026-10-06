import { can, supabaseServer } from "@no-origins/auth/server";
import type { Permission } from "@no-origins/auth/permissions";

/**
 * What the admin's People, Roles, Invitations and Audit pages read (Access.md A7). Server only: every read goes through
 * the signed-in person's session, so the database's rules decide what each page may show — a page that is shown
 * without its permission shows nothing rather than someone else's data.
 */

export type RoleRef = { id: string; name: string; builtIn: "owner" | "member" | null };

export type Person = {
  id: string;
  email: string;
  name: string | null;
  kind: "person" | "agent";
  joinedAt: string;
  lastSignInAt: string | null;
  roles: RoleRef[];
};

export type Role = {
  id: string;
  name: string;
  sentence: string;
  builtIn: "owner" | "member" | null;
  isDefault: boolean;
  permissions: Permission[];
  holders: number;
};

export type Invitation = {
  email: string;
  invitedAt: string;
  expiresAt: string;
  usedAt: string | null;
  /** Open, used, or past its time: read when it was loaded. */
  state: "open" | "used" | "expired";
  roles: RoleRef[];
};

export type AuditEvent = {
  id: number;
  at: string;
  actorName: string | null;
  actorKind: "person" | "agent" | null;
  onBehalfOf: string | null;
  action: string;
  app: string | null;
  item: string | null;
};

/** Which of `permissions` the signed-in person holds, asked of the database in one go. */
export async function mayAll<P extends Permission>(permissions: readonly P[]): Promise<Record<P, boolean>> {
  const answers = await Promise.all(permissions.map((p) => can(p)));
  return Object.fromEntries(permissions.map((p, i) => [p, answers[i]])) as Record<P, boolean>;
}

/** Who is asking: the signed-in person's id, or null. */
export async function myId(): Promise<string | null> {
  const db = await supabaseServer();
  const { data } = await db.auth.getUser();
  return data.user?.id ?? null;
}

export async function loadPeople(): Promise<Person[]> {
  const db = await supabaseServer();
  const { data, error } = await db.rpc("noo_people");
  if (error || !Array.isArray(data)) return [];
  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    email: String(row.email),
    name: (row.name as string | null) ?? null,
    kind: row.kind === "agent" ? "agent" : "person",
    joinedAt: String(row.joined_at),
    lastSignInAt: (row.last_sign_in_at as string | null) ?? null,
    roles: (row.roles as RoleRef[] | null) ?? [],
  }));
}

export async function loadRoles(): Promise<Role[]> {
  const db = await supabaseServer();
  const [roles, grants, held] = await Promise.all([
    db.from("roles").select("id, name, sentence, built_in, is_default").order("built_in", { nullsFirst: false }).order("name"),
    db.from("role_permissions").select("role_id, permission"),
    db.from("role_assignments").select("role_id"),
  ]);
  if (roles.error || !roles.data) return [];
  return roles.data.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    sentence: (r.sentence as string) ?? "",
    builtIn: (r.built_in as Role["builtIn"]) ?? null,
    isDefault: r.is_default as boolean,
    permissions: (grants.data ?? []).filter((g) => g.role_id === r.id).map((g) => g.permission as Permission),
    holders: (held.data ?? []).filter((h) => h.role_id === r.id).length,
  }));
}

export async function loadInvitations(): Promise<Invitation[]> {
  const db = await supabaseServer();
  const [invitations, named, roles] = await Promise.all([
    db.from("invitations").select("email, invited_at, expires_at, used_at").order("invited_at", { ascending: false }),
    db.from("invitation_roles").select("email, role_id"),
    db.from("roles").select("id, name, built_in"),
  ]);
  if (invitations.error || !invitations.data) return [];
  const byId = new Map((roles.data ?? []).map((r) => [r.id as string, { id: r.id as string, name: r.name as string, builtIn: (r.built_in as RoleRef["builtIn"]) ?? null }]));
  const now = Date.now();
  return invitations.data.map((i) => ({
    state: i.used_at ? "used" : new Date(i.expires_at as string).getTime() < now ? "expired" : "open",
    email: i.email as string,
    invitedAt: i.invited_at as string,
    expiresAt: i.expires_at as string,
    usedAt: (i.used_at as string | null) ?? null,
    roles: (named.data ?? []).filter((n) => n.email === i.email).flatMap((n) => byId.get(n.role_id as string) ?? []),
  }));
}

export const AUDIT_PAGE = 50;
/** The kinds of event the audit page filters by: an action's first word. */
export const AUDIT_KINDS = ["role", "invitation", "account", "delegation"] as const;

export async function loadAudit(page: number, kind?: string): Promise<{ events: AuditEvent[]; total: number }> {
  const db = await supabaseServer();
  let query = db
    .from("audit_events")
    .select("id, at, actor_name, actor_kind, on_behalf_of, action, app, item", { count: "exact" })
    .order("at", { ascending: false })
    .order("id", { ascending: false })
    .range(page * AUDIT_PAGE, page * AUDIT_PAGE + AUDIT_PAGE - 1);
  if (kind && (AUDIT_KINDS as readonly string[]).includes(kind)) query = query.like("action", `${kind}.%`);
  const { data, count, error } = await query;
  if (error || !data) return { events: [], total: 0 };
  return {
    total: count ?? data.length,
    events: data.map((e) => ({
      id: e.id as number,
      at: e.at as string,
      actorName: (e.actor_name as string | null) ?? null,
      actorKind: (e.actor_kind as AuditEvent["actorKind"]) ?? null,
      onBehalfOf: (e.on_behalf_of as string | null) ?? null,
      action: e.action as string,
      app: (e.app as string | null) ?? null,
      item: (e.item as string | null) ?? null,
    })),
  };
}
